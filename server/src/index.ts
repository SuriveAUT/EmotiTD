import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { getDb } from './db.js';
import { scoresRouter } from './routes/scores.js';

const PORT = Number(process.env.PORT ?? 3001);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '50kb' }));

const isDev = NODE_ENV !== 'production';
const devOrigins = [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/];
const allowedOrigins = ALLOWED_ORIGIN
  ? ALLOWED_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : [];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isDev && devOrigins.some((rx) => rx.test(origin))) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS: origin not allowed'));
    }
  })
);

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, reason: 'rate_limited' }
});

const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, reason: 'rate_limited' }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'emoticore-scoreboard' });
});

app.use('/api/scores', (req, res, next) => {
  if (req.method === 'POST') return submitLimiter(req, res, next);
  return readLimiter(req, res, next);
}, scoresRouter);

app.use((_req, res) => {
  res.status(404).json({ ok: false, reason: 'not_found' });
});

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'internal_error';
  if (message.startsWith('CORS:')) {
    return res.status(403).json({ ok: false, reason: 'cors_blocked' });
  }
  if (message === 'request entity too large') {
    return res.status(413).json({ ok: false, reason: 'payload_too_large' });
  }
  return res.status(500).json({ ok: false, reason: 'internal_error' });
});

getDb();

app.listen(PORT, () => {
  console.log(`[emoticore-scoreboard] listening on :${PORT} (${NODE_ENV})`);
});
