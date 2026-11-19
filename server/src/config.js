import { fileURLToPath } from 'node:url';
import { isAbsolute, resolve } from 'node:path';

const serverDir = fileURLToPath(new URL('..', import.meta.url));

/** Reads settings from environment variables (see .env.example). */
export function loadConfig(env = process.env) {
  const databasePath = env.DATABASE_PATH || './data/app.db';
  return {
    port: Number(env.PORT) || 3001,
    // Relative paths are resolved from the server folder, not from where the command was run.
    databasePath: isAbsolute(databasePath) ? databasePath : resolve(serverDir, databasePath),
    corsOrigins: (env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
    trustProxy: Boolean(env.TRUST_PROXY),
  };
}
