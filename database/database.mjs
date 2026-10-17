import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { readFileSync } from "node:fs";
import { DB_FILE, DB_SCHEMA } from "../config.mjs";

// Connexion unique (singleton), ouverte au premier appel et gardée
// ouverte pendant toute la durée de vie du process. Elle est fermée
// explicitement par closeDatabase(), appelée depuis server.mjs sur
// réception de SIGINT/SIGTERM.
let db;

export async function getDatabase() {
  if (db) return db;

  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  const schema = readFileSync(DB_SCHEMA, "utf-8");
  await db.exec(schema);

  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = undefined;
  }
}

export async function countLinks() {
  const database = await getDatabase();
  const row = await database.get("SELECT COUNT(*) AS count FROM links");
  return row.count;
}

export async function createLink(url, origin, secret = null) {
  const database = await getDatabase();
  const created = new Date().toISOString();

  await database.run(
    "INSERT INTO links (url, origin, created, visit, secret) VALUES (?, ?, ?, 0, ?)",
    url,
    origin,
    created,
    secret,
  );

  return { url, origin, created, visit: 0, secret };
}

export async function getLink(url) {
  const database = await getDatabase();
  return database.get(
    "SELECT url, origin, created, visit, secret FROM links WHERE url = ?",
    url,
  );
}

export async function incrementVisit(url) {
  const database = await getDatabase();
  await database.run("UPDATE links SET visit = visit + 1 WHERE url = ?", url);
}

export async function deleteLink(url) {
  const database = await getDatabase();
  const result = await database.run("DELETE FROM links WHERE url = ?", url);
  return result.changes > 0;
}
