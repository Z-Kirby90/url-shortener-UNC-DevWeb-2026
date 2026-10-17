import dotenv from "dotenv";

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV || "development";
export const PORT = process.env.PORT || 8080;
export const LINK_LEN = Number(process.env.LINK_LEN) || 6;
export const DB_FILE = process.env.DB_FILE || "database/database.sqlite";
export const DB_SCHEMA = process.env.DB_SCHEMA || "database/database.sql";

// format de log morgan : concis en dev, complet ("Apache style") en prod
export const LOG_LEVEL = NODE_ENV === "production" ? "combined" : "dev";
