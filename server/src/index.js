import { createApp } from './app.js';
import { deleteExpiredSessions } from './auth.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';

const config = loadConfig();
const db = openDatabase(config.databasePath);
const app = createApp({ db, corsOrigins: config.corsOrigins, trustProxy: config.trustProxy });

// Remove old sessions at startup and then once a day.
deleteExpiredSessions(db);
setInterval(() => deleteExpiredSessions(db), 24 * 60 * 60 * 1000).unref();

app.listen(config.port, () => {
  console.log(`API is running on http://localhost:${config.port}`);
  console.log(`Database: ${config.databasePath}`);
});
