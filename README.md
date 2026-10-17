# Réducteur d'URL — TP devweb

Service de réduction d'URL en Node.js/Express (API REST + client web),
réalisé selon le sujet du TP6.

## Installation

```bash
npm install
cp .env.example .env   # à adapter si besoin
```

Le fichier `.env` définit :

```ini
PORT=8080
LINK_LEN=6
DB_FILE=database/database.sqlite
DB_SCHEMA=database/database.sql
```

## Lancement

```bash
npm run dev    # développement (nodemon, rechargement auto)
npm run prod   # production
```

La base `database/database.sqlite` est créée automatiquement si besoin, à
partir du schéma `database/database.sql`.

Documentation interactive (Swagger UI) : <http://localhost:8080/api-docs>

Client AJAX (Partie 4) : <http://localhost:8080/index.html>

## Formatage du code

```bash
npm run format
```

## Structure du projet

```
server.mjs              point d'entrée Express
config.mjs               variables d'environnement et logging centralisés
database/
  database.sql           schéma SQL
  database.mjs            accès à la base (sqlite/sqlite3)
router/
  api-v1.mjs               API v1 — JSON uniquement
  api-v2.mjs               API v2 — négociation de contenu + suppression
views/
  root.ejs                  gabarit HTML (API v2)
static/
  index.html, app.js         client AJAX (SPA, Partie 4)
  open-api.yaml               spécification OpenAPI / Swagger
REPONSES.md                réponses aux questions de la Partie 1
```

## État d'avancement

| Partie | Contenu                                             | Tag              | État |
| ------ | ---------------------------------------------------- | ---------------- | ---- |
| 1      | Prise en main / questions                           | `reponses`       | ✅   |
| 2      | API v1 (routes manquantes, comptage des visites, `config.mjs`) | `api-v1`  | ✅   |
| 3      | API v2 : négociation de contenu, rendu HTML (EJS)   | `api-v2`         | ✅   |
| 4      | Client AJAX (SPA, `fetch`, copie presse-papier)     | `client-ajax`    | ✅   |
| 5      | Suppression sécurisée par clef API (`X-API-Key`)    | `api-v2-delete`  | ✅   |

## Routes principales

### API v1 (`/api-v1`, JSON uniquement)

- `GET /api-v1/` — nombre de liens créés
- `POST /api-v1/` — crée un lien réduit (`{ "url": "..." }`)
- `GET /api-v1/status/:url` — état d'un lien
- `GET /api-v1/error` — génère volontairement une erreur 500 (tests)
- `GET /api-v1/:url` — redirige vers l'URL d'origine, compte la visite

### API v2 (`/api-v2`, négociation `Accept: application/json` / `text/html`)

- `GET /api-v2/` — nombre de liens (JSON) ou formulaire de création (HTML)
- `POST /api-v2/` — crée un lien (JSON avec `secret`, ou page HTML)
- `GET /api-v2/:url` — état du lien (JSON) ou redirection + comptage (HTML)
- `DELETE /api-v2/:url` — supprime un lien, protégé par l'en-tête
  `X-API-Key` (doit correspondre au `secret` renvoyé à la création) :
  - `404` si le lien n'existe pas
  - `401` si l'en-tête est absente
  - `403` si la clef ne correspond pas
  - `200` en cas de succès

Le `secret` n'est **jamais** renvoyé par `GET /api-v2/:url`.

## Notes techniques

- Génération des codes courts : [`nanoid`](https://www.npmjs.com/package/nanoid)
  sur `LINK_LEN` caractères.
- Génération du secret de suppression : `crypto.randomBytes` (Node.js),
  encodé en base64url.
- La connexion SQLite est ouverte une seule fois (singleton) et fermée
  proprement à l'arrêt du serveur (voir `REPONSES.md`).
