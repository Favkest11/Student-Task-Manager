// End-to-end tests of the HTTP API. Run with: npm test
// Each test starts the real app on a random port with an empty in-memory database.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createApp } from '../src/app.js';
import { openDatabase } from '../src/db.js';

let server;
let baseUrl;
let db;

function start(options = {}) {
  db = openDatabase(':memory:');
  const app = createApp({ db, authRateLimit: { windowMs: 60_000, max: 1000 }, ...options });
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
}

beforeEach(() => start());
afterEach(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

/** Sends a request and returns { status, body }. */
async function api(method, path, { token, body, headers = {} } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
}

let counter = 0;
async function register(role) {
  const email = `${role}${++counter}@example.com`;
  const { status, body } = await api('POST', '/api/auth/register', {
    body: { email, password: 'password123', role },
  });
  assert.equal(status, 201);
  return { ...body.user, token: body.token };
}

async function createSubject(teacher, title = 'Math') {
  const { status, body } = await api('POST', '/api/subjects', {
    token: teacher.token,
    body: { title, description: 'About ' + title },
  });
  assert.equal(status, 201);
  return body.subject;
}

async function createTask(teacher, subject, title = 'Homework') {
  const { status, body } = await api('POST', '/api/tasks', {
    token: teacher.token,
    body: { title, description: 'Do it', deadline: '2030-01-15T10:00', subjectId: subject.id },
  });
  assert.equal(status, 201);
  return body.task;
}

// ---------- auth ----------

test('register, me, logout, login', async () => {
  const registered = await api('POST', '/api/auth/register', {
    body: { email: '  Anna@Example.com ', password: 'password123', role: 'teacher' },
  });
  assert.equal(registered.status, 201);
  assert.equal(registered.body.user.email, 'anna@example.com');
  assert.equal(registered.body.user.role, 'teacher');
  assert.equal(registered.body.user.password_hash, undefined);
  const { token } = registered.body;

  const me = await api('GET', '/api/auth/me', { token });
  assert.equal(me.status, 200);
  assert.deepEqual(me.body.user, registered.body.user);

  assert.equal((await api('POST', '/api/auth/logout', { token })).status, 204);
  assert.equal((await api('GET', '/api/auth/me', { token })).status, 401);

  const login = await api('POST', '/api/auth/login', {
    body: { email: 'ANNA@example.com', password: 'password123' },
  });
  assert.equal(login.status, 200);
  assert.equal(login.body.user.id, registered.body.user.id);
  assert.equal((await api('GET', '/api/auth/me', { token: login.body.token })).status, 200);
});

test('register rejects bad input and duplicate emails', async () => {
  const bad = [
    { email: 'not-an-email', password: 'password123', role: 'student' },
    { email: 'a@example.com', password: 'short', role: 'student' },
    { email: 'a@example.com', password: 'password123', role: 'admin' },
    { email: 'a@example.com', password: 'password123' },
    {},
  ];
  for (const body of bad) {
    const result = await api('POST', '/api/auth/register', { body });
    assert.equal(result.status, 400, JSON.stringify(body));
    assert.equal(typeof result.body.error, 'string');
  }

  const ok = { email: 'a@example.com', password: 'password123', role: 'student' };
  assert.equal((await api('POST', '/api/auth/register', { body: ok })).status, 201);
  assert.equal((await api('POST', '/api/auth/register', { body: ok })).status, 409);
});

test('login fails with a wrong password or unknown email', async () => {
  const user = await register('student');
  const wrong = await api('POST', '/api/auth/login', { body: { email: user.email, password: 'wrong-password' } });
  assert.equal(wrong.status, 401);
  const unknown = await api('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: 'password123' } });
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.error, unknown.body.error);
  assert.equal((await api('POST', '/api/auth/login', { body: {} })).status, 401);
});

test('passwords are stored hashed', async () => {
  await register('student');
  const row = db.prepare('SELECT password_hash FROM users').get();
  assert.match(row.password_hash, /^scrypt\$/);
  assert.ok(!row.password_hash.includes('password123'));
});

test('requests without a valid token get 401', async () => {
  assert.equal((await api('GET', '/api/subjects')).status, 401);
  assert.equal((await api('GET', '/api/tasks')).status, 401);
  assert.equal((await api('GET', '/api/subjects', { token: 'made-up-token' })).status, 401);
  assert.equal((await api('POST', '/api/subjects', { body: { title: 'x' } })).status, 401);
});

test('expired sessions are rejected', async () => {
  const user = await register('student');
  db.prepare('UPDATE sessions SET expires_at = ?').run(Date.now() - 1000);
  assert.equal((await api('GET', '/api/auth/me', { token: user.token })).status, 401);
});

test('login is rate limited', async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  await start({ authRateLimit: { windowMs: 60_000, max: 3 } });

  const body = { email: 'nobody@example.com', password: 'password123' };
  for (let i = 0; i < 3; i++) {
    assert.equal((await api('POST', '/api/auth/login', { body })).status, 401);
  }
  const limited = await api('POST', '/api/auth/login', { body });
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) > 0);
});

// ---------- subjects ----------

test('teacher can create, edit and delete own subjects', async () => {
  const teacher = await register('teacher');
  const subject = await createSubject(teacher, '  Physics  ');
  assert.equal(subject.title, 'Physics');
  assert.ok(subject.id && subject.created_at);

  const edited = await api('PATCH', `/api/subjects/${subject.id}`, {
    token: teacher.token,
    body: { title: 'Physics II', description: '' },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.subject.title, 'Physics II');
  assert.equal(edited.body.subject.description, '');

  const list = await api('GET', '/api/subjects', { token: teacher.token });
  assert.deepEqual(list.body.subjects.map((s) => s.title), ['Physics II']);

  assert.equal((await api('DELETE', `/api/subjects/${subject.id}`, { token: teacher.token })).status, 204);
  assert.deepEqual((await api('GET', '/api/subjects', { token: teacher.token })).body.subjects, []);
});

test('subject title is required', async () => {
  const teacher = await register('teacher');
  for (const body of [{}, { title: '' }, { title: '   ' }, { title: 42 }, { title: 'x'.repeat(201) }]) {
    assert.equal((await api('POST', '/api/subjects', { token: teacher.token, body })).status, 400);
  }
});

test('students cannot manage subjects or tasks', async () => {
  const teacher = await register('teacher');
  const student = await register('student');
  const subject = await createSubject(teacher);
  const task = await createTask(teacher, subject);
  const token = student.token;

  assert.equal((await api('POST', '/api/subjects', { token, body: { title: 'Hack' } })).status, 403);
  assert.equal((await api('PATCH', `/api/subjects/${subject.id}`, { token, body: { title: 'Hack' } })).status, 403);
  assert.equal((await api('DELETE', `/api/subjects/${subject.id}`, { token })).status, 403);
  assert.equal(
    (await api('POST', '/api/tasks', { token, body: { title: 'Hack', deadline: '2030-01-01T00:00', subjectId: subject.id } })).status,
    403,
  );
  assert.equal((await api('PATCH', `/api/tasks/${task.id}`, { token, body: { title: 'Hack' } })).status, 403);
  assert.equal((await api('DELETE', `/api/tasks/${task.id}`, { token })).status, 403);

  // Nothing changed.
  const tasks = (await api('GET', '/api/tasks', { token })).body.tasks;
  assert.deepEqual(tasks.map((t) => t.title), ['Homework']);
});

test('the role sent by the client after registration is ignored', async () => {
  const student = await register('student');
  // A student cannot become a teacher by sending extra fields.
  const result = await api('POST', '/api/subjects', {
    token: student.token,
    body: { title: 'Hack', role: 'teacher', teacher_id: 'someone' },
  });
  assert.equal(result.status, 403);
});

test('teachers cannot see or change each other\'s subjects and tasks', async () => {
  const anna = await register('teacher');
  const boris = await register('teacher');
  const subject = await createSubject(anna);
  const task = await createTask(anna, subject);
  const token = boris.token;

  assert.deepEqual((await api('GET', '/api/subjects', { token })).body.subjects, []);
  assert.deepEqual((await api('GET', '/api/tasks', { token })).body.tasks, []);
  assert.deepEqual((await api('GET', `/api/tasks?subjectId=${subject.id}`, { token })).body.tasks, []);
  assert.equal((await api('PATCH', `/api/subjects/${subject.id}`, { token, body: { title: 'Mine' } })).status, 404);
  assert.equal((await api('DELETE', `/api/subjects/${subject.id}`, { token })).status, 404);
  assert.equal(
    (await api('POST', '/api/tasks', { token, body: { title: 'Mine', deadline: '2030-01-01T00:00', subjectId: subject.id } })).status,
    404,
  );
  assert.equal((await api('PATCH', `/api/tasks/${task.id}`, { token, body: { title: 'Mine' } })).status, 404);
  assert.equal((await api('DELETE', `/api/tasks/${task.id}`, { token })).status, 404);

  const annaTasks = (await api('GET', '/api/tasks', { token: anna.token })).body.tasks;
  assert.deepEqual(annaTasks.map((t) => t.title), ['Homework']);
});

// ---------- tasks ----------

test('teacher can create, edit and delete tasks', async () => {
  const teacher = await register('teacher');
  const math = await createSubject(teacher, 'Math');
  const art = await createSubject(teacher, 'Art');
  const first = await createTask(teacher, math, 'First');
  await createTask(teacher, math, 'Second');
  await createTask(teacher, art, 'Draw');

  assert.equal(first.deadline, '2030-01-15T10:00');
  assert.deepEqual(first.subjects, { title: 'Math' });
  assert.equal(first.status, undefined);

  const mathTasks = await api('GET', `/api/tasks?subjectId=${math.id}`, { token: teacher.token });
  assert.deepEqual(mathTasks.body.tasks.map((t) => t.title), ['Second', 'First']); // newest first

  const edited = await api('PATCH', `/api/tasks/${first.id}`, {
    token: teacher.token,
    body: { title: 'First (edited)', deadline: '2031-02-03T04:05' },
  });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.task.title, 'First (edited)');
  assert.equal(edited.body.task.description, 'Do it'); // untouched
  assert.equal(edited.body.task.deadline, '2031-02-03T04:05');

  assert.equal((await api('DELETE', `/api/tasks/${first.id}`, { token: teacher.token })).status, 204);
  const all = await api('GET', '/api/tasks', { token: teacher.token });
  assert.deepEqual(all.body.tasks.map((t) => t.title), ['Draw', 'Second']);
});

test('task input is validated', async () => {
  const teacher = await register('teacher');
  const subject = await createSubject(teacher);
  const valid = { title: 'T', deadline: '2030-01-01T00:00', subjectId: subject.id };
  const bad = [
    { ...valid, title: '' },
    { ...valid, deadline: undefined },
    { ...valid, deadline: 'tomorrow-ish' },
    { ...valid, description: 123 },
  ];
  for (const body of bad) {
    assert.equal((await api('POST', '/api/tasks', { token: teacher.token, body })).status, 400, JSON.stringify(body));
  }
  assert.equal((await api('POST', '/api/tasks', { token: teacher.token, body: { ...valid, subjectId: 'nope' } })).status, 404);
  assert.equal((await api('POST', '/api/tasks', { token: teacher.token, body: { ...valid, subjectId: undefined } })).status, 404);
});

test('each student has their own task status', async () => {
  const teacher = await register('teacher');
  const subject = await createSubject(teacher, 'Math');
  const task = await createTask(teacher, subject);
  const anna = await register('student');
  const boris = await register('student');

  const before = (await api('GET', '/api/tasks', { token: anna.token })).body.tasks;
  assert.equal(before.length, 1);
  assert.equal(before[0].status, 'To Do');
  assert.deepEqual(before[0].subjects, { title: 'Math' });

  const done = await api('PUT', `/api/tasks/${task.id}/status`, { token: anna.token, body: { status: 'Done' } });
  assert.equal(done.status, 200);
  // Marking twice is fine.
  assert.equal((await api('PUT', `/api/tasks/${task.id}/status`, { token: anna.token, body: { status: 'Done' } })).status, 200);

  assert.equal((await api('GET', '/api/tasks', { token: anna.token })).body.tasks[0].status, 'Done');
  assert.equal((await api('GET', '/api/tasks', { token: boris.token })).body.tasks[0].status, 'To Do');

  await api('PUT', `/api/tasks/${task.id}/status`, { token: anna.token, body: { status: 'To Do' } });
  assert.equal((await api('GET', '/api/tasks', { token: anna.token })).body.tasks[0].status, 'To Do');
});

test('status endpoint validates input and is for students only', async () => {
  const teacher = await register('teacher');
  const student = await register('student');
  const subject = await createSubject(teacher);
  const task = await createTask(teacher, subject);

  assert.equal((await api('PUT', `/api/tasks/${task.id}/status`, { token: student.token, body: { status: 'Maybe' } })).status, 400);
  assert.equal((await api('PUT', `/api/tasks/${task.id}/status`, { token: student.token })).status, 400);
  assert.equal((await api('PUT', '/api/tasks/nope/status', { token: student.token, body: { status: 'Done' } })).status, 404);
  assert.equal((await api('PUT', `/api/tasks/${task.id}/status`, { token: teacher.token, body: { status: 'Done' } })).status, 403);
});

test('students see subjects and tasks of all teachers', async () => {
  const anna = await register('teacher');
  const boris = await register('teacher');
  const math = await createSubject(anna, 'Math');
  const art = await createSubject(boris, 'Art');
  await createTask(anna, math, 'Count');
  await createTask(boris, art, 'Draw');
  const student = await register('student');

  const subjects = (await api('GET', '/api/subjects', { token: student.token })).body.subjects;
  assert.deepEqual(subjects.map((s) => s.title).sort(), ['Art', 'Math']);
  assert.equal(subjects[0].teacher_id, undefined);
  const tasks = (await api('GET', '/api/tasks', { token: student.token })).body.tasks;
  assert.deepEqual(tasks.map((t) => t.title), ['Draw', 'Count']);
});

test('deleting a subject deletes its tasks and their statuses', async () => {
  const teacher = await register('teacher');
  const student = await register('student');
  const subject = await createSubject(teacher);
  const task = await createTask(teacher, subject);
  await api('PUT', `/api/tasks/${task.id}/status`, { token: student.token, body: { status: 'Done' } });

  assert.equal((await api('DELETE', `/api/subjects/${subject.id}`, { token: teacher.token })).status, 204);
  assert.deepEqual((await api('GET', '/api/tasks', { token: student.token })).body.tasks, []);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM tasks').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM task_completions').get().n, 0);
});

// ---------- general ----------

test('SQL injection attempts are treated as plain text', async () => {
  const teacher = await register('teacher');
  const title = `Robert'); DROP TABLE subjects;--`;
  const subject = await createSubject(teacher, title);
  assert.equal(subject.title, title);
  const list = await api('GET', `/api/tasks?subjectId=${encodeURIComponent("' OR 1=1 --")}`, { token: teacher.token });
  assert.deepEqual(list.body.tasks, []);
  assert.equal((await api('GET', '/api/subjects', { token: teacher.token })).body.subjects.length, 1);
});

test('invalid JSON and unknown routes return JSON errors', async () => {
  const broken = await api('POST', '/api/auth/login', { body: '{"email": ' });
  assert.equal(broken.status, 400);
  assert.equal(typeof broken.body.error, 'string');

  const missing = await api('GET', '/api/nothing-here');
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, { error: 'Not found' });

  assert.deepEqual((await api('GET', '/api/health')).body, { ok: true });
});

test('CORS headers are sent only to allowed origins', async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  await start({ corsOrigins: ['https://app.example.com'] });

  const allowed = await api('GET', '/api/health', { headers: { Origin: 'https://app.example.com' } });
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://app.example.com');
  const other = await api('GET', '/api/health', { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(other.headers.get('access-control-allow-origin'), null);

  const preflight = await fetch(baseUrl + '/api/subjects', {
    method: 'OPTIONS',
    headers: { Origin: 'https://app.example.com', 'Access-Control-Request-Method': 'POST' },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-headers'), /Authorization/);
});
