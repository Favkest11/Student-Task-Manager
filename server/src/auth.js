import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { HttpError } from './errors.js';

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SESSION_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Hashes a password with scrypt and a random salt. */
export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Checks a password against a stored hash. */
export async function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Creates a login session and returns the token for the client.
 * Only a hash of the token is stored, so a leaked database does not leak sessions.
 */
export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(
    hashToken(token),
    userId,
    Date.now() + SESSION_LIFETIME_MS,
  );
  return token;
}

export function deleteSession(db, tokenHash) {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function deleteExpiredSessions(db) {
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
}

/** Middleware: requires a valid "Authorization: Bearer <token>" header and sets req.user. */
export function requireAuth(db) {
  const findSession = db.prepare(`
    SELECT u.id, u.email, u.role
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
  `);

  return (req, res, next) => {
    const header = req.headers.authorization ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new HttpError(401, 'You are not logged in'));
    }
    const tokenHash = hashToken(token);
    const user = findSession.get(tokenHash, Date.now());
    if (!user) {
      return next(new HttpError(401, 'Your session has expired, please sign in again'));
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    req.tokenHash = tokenHash;
    next();
  };
}

/** Middleware: allows the request only for users with the given role. */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return next(new HttpError(403, `Only ${role}s can do this`));
    }
    next();
  };
}
