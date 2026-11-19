import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createSession, deleteSession, hashPassword, requireAuth, verifyPassword } from '../auth.js';
import { HttpError } from '../errors.js';
import { rateLimit } from '../rateLimit.js';
import { requireEmail, requirePassword } from '../validate.js';

const ROLES = ['student', 'teacher'];

export function authRouter(db, { authRateLimit }) {
  const router = Router();
  const limiter = rateLimit(authRateLimit);

  const findByEmail = db.prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?');
  const insertUser = db.prepare(
    'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
  );

  // Hash of a random password. Used to spend the same time on unknown emails
  // as on wrong passwords, so the response time does not reveal who is registered.
  const dummyHash = hashPassword(randomUUID());

  router.post('/register', limiter, async (req, res) => {
    const body = req.body ?? {};
    const email = requireEmail(body.email);
    const password = requirePassword(body.password);
    if (!ROLES.includes(body.role)) {
      throw new HttpError(400, 'Role must be "student" or "teacher"');
    }
    if (findByEmail.get(email)) {
      throw new HttpError(409, 'An account with this email already exists');
    }

    const user = { id: randomUUID(), email, role: body.role };
    const passwordHash = await hashPassword(password);
    try {
      insertUser.run(user.id, user.email, passwordHash, user.role, new Date().toISOString());
    } catch (error) {
      // Two registrations with the same email at the same moment.
      if (String(error.message).includes('UNIQUE')) {
        throw new HttpError(409, 'An account with this email already exists');
      }
      throw error;
    }

    res.status(201).json({ user, token: createSession(db, user.id) });
  });

  router.post('/login', limiter, async (req, res) => {
    const body = req.body ?? {};
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    const row = findByEmail.get(email);
    const passwordOk = await verifyPassword(password, row ? row.password_hash : await dummyHash);
    if (!row || !passwordOk) {
      throw new HttpError(401, 'Wrong email or password');
    }

    const user = { id: row.id, email: row.email, role: row.role };
    res.json({ user, token: createSession(db, user.id) });
  });

  router.get('/me', requireAuth(db), (req, res) => {
    res.json({ user: req.user });
  });

  router.post('/logout', requireAuth(db), (req, res) => {
    deleteSession(db, req.tokenHash);
    res.status(204).end();
  });

  return router;
}
