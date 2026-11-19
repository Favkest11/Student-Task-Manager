import express from 'express';
import { requireAuth } from './auth.js';
import { HttpError } from './errors.js';
import { authRouter } from './routes/auth.js';
import { subjectsRouter } from './routes/subjects.js';
import { tasksRouter } from './routes/tasks.js';

const DEFAULT_AUTH_RATE_LIMIT = { windowMs: 15 * 60 * 1000, max: 30 };

/** Lets the listed frontend origins call the API from the browser. */
function cors(allowedOrigins) {
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.set('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  };
}

/**
 * Builds the Express app.
 * @param {object} options
 * @param {import('node:sqlite').DatabaseSync} options.db
 * @param {string[]} [options.corsOrigins] frontend origins allowed to call the API
 * @param {{windowMs: number, max: number}} [options.authRateLimit]
 * @param {boolean} [options.trustProxy] set when running behind a reverse proxy
 */
export function createApp({ db, corsOrigins = [], authRateLimit = DEFAULT_AUTH_RATE_LIMIT, trustProxy = false }) {
  const app = express();
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1);

  app.use(cors(corsOrigins));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRouter(db, { authRateLimit }));
  app.use('/api/subjects', requireAuth(db), subjectsRouter(db));
  app.use('/api/tasks', requireAuth(db), tasksRouter(db));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Every error ends up here and is returned as { "error": "message" }.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ error: err.message });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body is not valid JSON' });
    }
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong, try again' });
  });

  return app;
}
