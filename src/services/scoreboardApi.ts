import { APP_VERSION } from '../core/version';

export interface ScoreSubmitPayload {
  playerName: string;
  score: number;
  wave: number;
  mapId: string;
  mapName: string;
  mode: string;
  result: 'victory' | 'defeat' | 'abandoned';
  seed?: string;
  stats?: {
    towersUsed?: number;
    upgradesPurchased?: number;
    killsTotal?: number;
    bossKills?: number;
    topDamageEmotion?: string;
  };
  clientVersion?: string;
}

export interface ScoreSubmitResult {
  ok: boolean;
  id?: number;
  rank?: number;
  reason?: string;
}

export interface ScoreboardEntry {
  rank: number;
  playerName: string;
  score: number;
  wave: number;
  mode: string;
  result: string;
  towersUsed: number | null;
  upgradesPurchased: number | null;
  killsTotal: number | null;
  bossKills: number | null;
  topDamageEmotion: string | null;
  createdAt: string;
}

export interface ScoreboardResponse {
  ok: boolean;
  mapId: string;
  mode: string | null;
  scores: ScoreboardEntry[];
}

export interface ScoreboardMap {
  mapId: string;
  mapName: string;
  entries: number;
  bestScore: number;
  bestWave: number;
}

export interface ScoreMapsResponse {
  ok: boolean;
  maps: ScoreboardMap[];
}

const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const API_BASE = RAW_BASE.replace(/\/+$/, '');
const TIMEOUT_MS = 5000;

function withTimeout(init: RequestInit = {}): { init: RequestInit; cancel: () => void } {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  return {
    init: { ...init, signal: ctl.signal },
    cancel: () => clearTimeout(timer)
  };
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const { init: wrapped, cancel } = withTimeout(init);
  try {
    const response = await fetch(`${API_BASE}${path}`, wrapped);
    const data = (await response.json()) as T;
    if (!response.ok) throw new Error((data as { reason?: string }).reason ?? `http_${response.status}`);
    return data;
  } finally {
    cancel();
  }
}

export async function submitScore(payload: ScoreSubmitPayload): Promise<ScoreSubmitResult> {
  const body: ScoreSubmitPayload = { clientVersion: APP_VERSION, ...payload };
  return fetchJson<ScoreSubmitResult>('/scores', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function getScores(
  mapId: string,
  mode?: string,
  limit = 10
): Promise<ScoreboardResponse> {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (mode) params.set('mode', mode);
  return fetchJson<ScoreboardResponse>(`/scores/${encodeURIComponent(mapId)}?${params.toString()}`);
}

export async function getScoreMaps(): Promise<ScoreMapsResponse> {
  return fetchJson<ScoreMapsResponse>('/scores');
}
