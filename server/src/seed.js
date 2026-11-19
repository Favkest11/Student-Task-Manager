// Creates the demo accounts from the README and some sample data.
// Safe to run more than once: it does nothing if the demo teacher already exists.
import { randomUUID } from 'node:crypto';
import { hashPassword } from './auth.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';

const DEMO_PASSWORD = 'demo123456';
const HOUR = 60 * 60 * 1000;

/** Formats a date the same way <input type="datetime-local"> does: 2026-11-20T10:00 */
function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

const db = openDatabase(loadConfig().databasePath);

if (db.prepare('SELECT id FROM users WHERE email = ?').get('teacher@demo.com')) {
  console.log('Demo data already exists, nothing to do.');
  process.exit(0);
}

const now = Date.now();
const passwordHash = await hashPassword(DEMO_PASSWORD);
const insertUser = db.prepare(
  'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
);
const insertSubject = db.prepare(
  'INSERT INTO subjects (id, title, description, teacher_id, created_at) VALUES (?, ?, ?, ?, ?)',
);
const insertTask = db.prepare(
  'INSERT INTO tasks (id, title, description, deadline, subject_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
);

const teacherId = randomUUID();
insertUser.run(teacherId, 'teacher@demo.com', passwordHash, 'teacher', new Date(now).toISOString());
insertUser.run(randomUUID(), 'student@demo.com', passwordHash, 'student', new Date(now).toISOString());

const subjects = [
  {
    title: 'Calculus',
    description: 'Limits, derivatives and integrals',
    tasks: [
      { title: 'Complete Calculus Assignment', description: 'Solve problems 1-20', inHours: 24 },
      { title: 'Prepare for the midterm', description: 'Chapters 1-4', inHours: 5 * 24 },
    ],
  },
  {
    title: 'Web Development',
    description: 'HTML, CSS, JavaScript and React',
    tasks: [
      { title: 'Build a landing page', description: 'Responsive layout with Flexbox and Grid', inHours: 3 * 24 },
      { title: 'Read about React hooks', description: 'useState and useEffect', inHours: -24 },
    ],
  },
];

let order = 0;
for (const subject of subjects) {
  const subjectId = randomUUID();
  insertSubject.run(subjectId, subject.title, subject.description, teacherId, new Date(now + order++).toISOString());
  for (const task of subject.tasks) {
    insertTask.run(
      randomUUID(),
      task.title,
      task.description,
      toLocalInputValue(new Date(now + task.inHours * HOUR)),
      subjectId,
      new Date(now + order++).toISOString(),
    );
  }
}

console.log('Demo data created:');
console.log(`  teacher@demo.com / ${DEMO_PASSWORD}`);
console.log(`  student@demo.com / ${DEMO_PASSWORD}`);
