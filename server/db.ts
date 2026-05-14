import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH = process.env.DB_PATH || "data.db";
mkdirSync(dirname(DB_PATH) === "." ? "." : dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS palettes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL DEFAULT 'Untitled',
    colors TEXT NOT NULL,
    created_at INTEGER
  );
`);

export const db = drizzle(sqlite, { schema });
