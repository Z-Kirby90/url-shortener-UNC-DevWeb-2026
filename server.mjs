import express from "express";
import morgan from "morgan";
import favicon from "serve-favicon";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";

import { PORT, LOG_LEVEL, NODE_ENV } from "./config.mjs";
import apiV1 from "./router/api-v1.mjs";
import apiV2 from "./router/api-v2.mjs";
import { closeDatabase } from "./database/database.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, "package.json"), "utf-8"));

const app = express();

// Question Partie 1 : supprimer l'en-tête X-Powered-By
app.disable("x-powered-by");

app.use(morgan(LOG_LEVEL));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(favicon(path.join(__dirname, "static", "logo_univ_16.png")));

// Middleware applicatif : ajoute la version courante de l'application
app.use((req, res, next) => {
  res.set("X-API-version", pkg.version);
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "static")));

const openApiDoc = YAML.load(path.join(__dirname, "static", "open-api.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));

app.use("/api-v1", apiV1);
app.use("/api-v2", apiV2);

// Middleware de gestion d'erreurs (doit être déclaré en dernier)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

const server = app.listen(PORT, () => {
  console.log(`Serveur démarré en mode ${NODE_ENV} sur http://localhost:${PORT}`);
  console.log(`Documentation Swagger : http://localhost:${PORT}/api-docs`);
});

async function shutdown() {
  await closeDatabase();
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
