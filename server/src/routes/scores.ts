import { Router, type Request, type Response } from 'express';
import { ZodError } from 'zod';
import { getDb, type ScoreRow } from '../db.js';
import { scoreQuerySchema, scoreSubmitSchema } from '../validation.js';

export const scoresRouter = Router();

scoresRouter.post('/', (req: Request, res: Response) => {
  let payload;
  try {
    payload = scoreSubmitSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        reason: 'invalid_payload',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      });
    }
    return res.status(400).json({ ok: false, reason: 'invalid_payload' });
  }

  if (payload.result === 'abandoned') {
    return res.json({ ok: false, reason: 'abandoned_runs_are_not_scored' });
  }
  if (payload.score <= 0) {
    return res.json({ ok: false, reason: 'score_must_be_positive' });
  }

  const db = getDb();
  const createdAt = new Date().toISOString();
  const stats = payload.stats ?? {};

  const insert = db.prepare(`
    INSERT INTO scores (
      player_name, score, wave, map_id, map_name, mode, result,
      seed, towers_used, upgrades_purchased, kills_total, boss_kills,
      top_damage_emotion, created_at, client_version
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    payload.playerName,
    payload.score,
    payload.wave,
    payload.mapId,
    payload.mapName,
    payload.mode,
    payload.result ?? 'defeat',
    payload.seed ?? null,
    stats.towersUsed ?? null,
    stats.upgradesPurchased ?? null,
    stats.killsTotal ?? null,
    stats.bossKills ?? null,
    stats.topDamageEmotion ?? null,
    createdAt,
    payload.clientVersion ?? null
  );

  const id = Number(result.lastInsertRowid);

  const rankRow = db
    .prepare(
      `SELECT COUNT(*) AS better FROM scores
       WHERE map_id = ?
         AND (
           score > ?
           OR (score = ? AND wave > ?)
           OR (score = ? AND wave = ? AND created_at < ?)
         )`
    )
    .get(
      payload.mapId,
      payload.score,
      payload.score,
      payload.wave,
      payload.score,
      payload.wave,
      createdAt
    ) as { better: number };

  const rank = rankRow.better + 1;

  return res.json({ ok: true, id, rank });
});

scoresRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         map_id     AS mapId,
         map_name   AS mapName,
         COUNT(*)   AS entries,
         MAX(score) AS bestScore,
         MAX(wave)  AS bestWave
       FROM scores
       GROUP BY map_id, map_name
       ORDER BY bestScore DESC`
    )
    .all() as Array<{ mapId: string; mapName: string; entries: number; bestScore: number; bestWave: number }>;

  return res.json({ ok: true, maps: rows });
});

scoresRouter.get('/:mapId', (req: Request, res: Response) => {
  const mapId = req.params.mapId;
  if (!mapId || mapId.length > 64) {
    return res.status(400).json({ ok: false, reason: 'invalid_map_id' });
  }

  let query;
  try {
    query = scoreQuerySchema.parse(req.query);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({
        ok: false,
        reason: 'invalid_query',
        issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
      });
    }
    return res.status(400).json({ ok: false, reason: 'invalid_query' });
  }

  const db = getDb();
  const params: unknown[] = [mapId];
  let where = 'WHERE map_id = ?';
  if (query.mode) {
    where += ' AND mode = ?';
    params.push(query.mode);
  }
  params.push(query.limit);

  const rows = db
    .prepare(
      `SELECT * FROM scores
       ${where}
       ORDER BY score DESC, wave DESC, created_at ASC
       LIMIT ?`
    )
    .all(...params) as ScoreRow[];

  const scores = rows.map((row, index) => ({
    rank: index + 1,
    playerName: row.player_name,
    score: row.score,
    wave: row.wave,
    mode: row.mode,
    result: row.result,
    towersUsed: row.towers_used,
    upgradesPurchased: row.upgrades_purchased,
    killsTotal: row.kills_total,
    bossKills: row.boss_kills,
    topDamageEmotion: row.top_damage_emotion,
    createdAt: row.created_at
  }));

  return res.json({
    ok: true,
    mapId,
    mode: query.mode ?? null,
    scores
  });
});
