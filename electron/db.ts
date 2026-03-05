import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let dbPath;

if (app) {
  dbPath = join(app.getPath('userData'), 'warehouse.db');
} else {
  dbPath = join(__dirname, '../warehouse.db');
}

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Provide type safety and migrations
export const db = drizzle(sqlite);
