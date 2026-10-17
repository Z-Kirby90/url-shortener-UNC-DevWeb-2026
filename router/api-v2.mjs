import { Router } from "express";
import crypto from "node:crypto";
import { nanoid } from "nanoid";
import { LINK_LEN } from "../config.mjs";
import {
  countLinks,
  createLink,
  getLink,
  incrementVisit,
  deleteLink,
} from "../database/database.mjs";

const router = Router();

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function notAcceptable(res) {
  res.status(406).json({ error: "Formats acceptés : application/json, text/html" });
}

// GET /api-v2/ : json -> nombre de liens | html -> formulaire de création
router.get("/", async (req, res, next) => {
  try {
    const count = await countLinks();

    res.format({
      json: () => res.json({ count }),
      html: () => res.render("root", { count, link: null, error: null }),
      default: () => notAcceptable(res),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api-v2/ : json -> infos du lien créé | html -> page avec le lien créé
router.post("/", async (req, res, next) => {
  try {
    const { url } = req.body ?? {};

    if (!url || !isValidUrl(url)) {
      const count = await countLinks();
      return res.status(400).format({
        json: () => res.json({ error: "URL invalide ou manquante" }),
        html: () => res.render("root", { count, link: null, error: "URL invalide ou manquante" }),
        default: () => notAcceptable(res),
      });
    }

    const shortUrl = nanoid(LINK_LEN);
    const secret = crypto.randomBytes(9).toString("base64url");
    const link = await createLink(shortUrl, url, secret);
    const count = await countLinks();

    res.status(201).format({
      json: () => res.json({ url: link.url, origin: link.origin, created: link.created, secret }),
      html: () => res.render("root", { count, link, error: null }),
      default: () => notAcceptable(res),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api-v2/:url : json -> état du lien | html -> compte la visite + redirige
router.get("/:url", async (req, res, next) => {
  try {
    const link = await getLink(req.params.url);

    if (!link) {
      return res.status(404).format({
        json: () => res.json({ error: "Lien inconnu" }),
        html: () => res.render("root", { count: null, link: null, error: "Lien inconnu" }),
        default: () => notAcceptable(res),
      });
    }

    res.format({
      // NOTA BENE : le secret ne doit jamais être exposé sur cette route
      json: () => res.json({ origin: link.origin, created: link.created, visit: link.visit }),
      html: async () => {
        await incrementVisit(req.params.url);
        res.redirect(link.origin);
      },
      default: () => notAcceptable(res),
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api-v2/:url : suppression protégée par le secret (en-tête X-API-Key)
router.delete("/:url", async (req, res, next) => {
  try {
    const link = await getLink(req.params.url);

    if (!link) {
      return res.status(404).json({ error: "Lien inconnu" });
    }

    const apiKey = req.get("X-API-Key");

    if (!apiKey) {
      return res.status(401).json({ error: "En-tête X-API-Key manquante" });
    }

    if (apiKey !== link.secret) {
      return res.status(403).json({ error: "Clef API invalide" });
    }

    await deleteLink(req.params.url);
    res.sendStatus(200);
  } catch (err) {
    next(err);
  }
});

export default router;
