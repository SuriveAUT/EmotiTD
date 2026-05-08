import Database, { type Database as Db } from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = resolve(__dirname, '..', 'data', 'scores.sqlite');

export interface ScoreRow {
  id: number;
  player_name: string;
  score: number;
  wave: number;
  map_id: string;
  map_name: string;
  mode: string;
  result: string;
  seed: string | null;
  towers_used: number | null;
  upgrades_purchased: number | null;
  kills_total: number | null;
  boss_kills: number | null;
  top_damage_emotion: string | null;
  created_at: string;
  client_version: string | null;
}

let dbInstance: Db | null = null;

export function getDb(path: string = DEFAULT_DB_PATH): Db {
  if (dbInstance) return dbInstance;

  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      score INTEGER NOT NULL,
      wave INTEGER NOT NULL,
      map_id TEXT NOT NULL,
      map_name TEXT NOT NULL,
      mode TEXT NOT NULL,
      result TEXT NOT NULL,
      seed TEXT,
      towers_used INTEGER,
      upgrades_purchased INTEGER,
      kills_total INTEGER,
      boss_kills INTEGER,
      top_damage_emotion TEXT,
      created_at TEXT NOT NULL,
      client_version TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_scores_map_score ON scores(map_id, score DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_map_wave  ON scores(map_id, wave DESC);
    CREATE INDEX IF NOT EXISTS idx_scores_created   ON scores(created_at DESC);
  `);

  dbInstance = db;
  return db;
}
