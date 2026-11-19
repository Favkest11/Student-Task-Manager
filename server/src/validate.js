import { HttpError } from './errors.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns a trimmed string or throws 400. */
export function requireString(value, field, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} is required`);
  }
  const text = value.trim();
  if (text.length < min) {
    throw new HttpError(400, min === 1 ? `${field} is required` : `${field} must be at least ${min} characters`);
  }
  if (text.length > max) {
    throw new HttpError(400, `${field} must be at most ${max} characters`);
  }
  return text;
}

/** Like requireString, but missing/null values become an empty string. */
export function optionalString(value, field, { max = 2000 } = {}) {
  if (value === undefined || value === null) return '';
  return requireString(value, field, { min: 0, max });
}

export function requireEmail(value) {
  const email = requireString(value, 'Email', { max: 254 }).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new HttpError(400, 'Email is not valid');
  }
  return email;
}

/** Passwords are not trimmed: spaces are allowed characters. */
export function requirePassword(value, { min = 9, max = 200 } = {}) {
  if (typeof value !== 'string' || value.length < min) {
    throw new HttpError(400, `Password must be at least ${min} characters`);
  }
  if (value.length > max) {
    throw new HttpError(400, `Password must be at most ${max} characters`);
  }
  return value;
}

/** Accepts any date string JavaScript can parse (e.g. "2026-11-20T10:00" from <input type="datetime-local">). */
export function requireDeadline(value) {
  const deadline = requireString(value, 'Deadline', { max: 40 });
  if (Number.isNaN(new Date(deadline).getTime())) {
    throw new HttpError(400, 'Deadline is not a valid date');
  }
  return deadline;
}
