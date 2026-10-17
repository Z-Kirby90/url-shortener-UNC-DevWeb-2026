import { Router } from "express";
import { nanoid } from "nanoid";
import { LINK_LEN } from "../config.mjs";
import { countLinks, createLink, getLink, incrementVisit } from "../database/database.mjs";

const router = Router();

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// GET /api-v1/ : nombre de liens déjà créés
router.get("/", async (req, res, next) => {
  try {
    const count = await countLinks();
    res.json({ count });
  } catch (err) {
    next(err);
  }
});

// POST /api-v1/ : crée un lien réduit à partir d'une URL longue
router.post("/", async (req, res, next) => {
  try {
    const { url } = req.body ?? {};

    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: "URL invalide ou manquante" });
    }

    const shortUrl = nanoid(LINK_LEN);
    const link = await createLink(shortUrl, url);

    res.status(201).json({ url: link.url, origin: link.origin, created: link.created });
  } catch (err) {
    next(err);
  }
});

// GET /api-v1/status/:url : état du lien
router.get("/status/:url", async (req, res, next) => {
  try {
    const link = await getLink(req.params.url);

    if (!link) {
      return res.status(404).json({ error: "Lien inconnu" });
    }

    res.json({ origin: link.origin, created: link.created, visit: link.visit });
  } catch (err) {
    next(err);
  }
});

// GET /api-v1/error : génère volontairement une erreur 500 (pour les tests)
router.get("/error", (req, res, next) => {
  next(new Error("Erreur générée volontairement pour les tests"));
});

// GET /api-v1/:url : redirige vers l'URL d'origine et compte la visite
router.get("/:url", async (req, res, next) => {
  try {
    const link = await getLink(req.params.url);

    if (!link) {
      return res.status(404).json({ error: "Lien inconnu" });
    }

    await incrementVisit(req.params.url);
    res.redirect(link.origin);
  } catch (err) {
    next(err);
  }
});

export default router;
