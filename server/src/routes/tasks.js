import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireRole } from '../auth.js';
import { HttpError } from '../errors.js';
import { optionalString, requireDeadline, requireString } from '../validate.js';

const STATUS_TODO = 'To Do';
const STATUS_DONE = 'Done';

export function tasksRouter(db) {
  const router = Router();
  const teacherOnly = requireRole('teacher');
  const studentOnly = requireRole('student');

  // For students: every task plus this student's own status.
  // The (? IS NULL OR ...) pair makes the subject filter optional.
  const listForStudent = db.prepare(`
    SELECT t.id, t.title, t.description, t.deadline, t.subject_id, t.created_at,
           s.title AS subject_title,
           c.task_id IS NOT NULL AS done
    FROM tasks t
    JOIN subjects s ON s.id = t.subject_id
    LEFT JOIN task_completions c ON c.task_id = t.id AND c.student_id = ?
    WHERE (? IS NULL OR t.subject_id = ?)
    ORDER BY t.created_at DESC, t.rowid DESC
  `);
  // For teachers: only tasks of their own subjects.
  const listForTeacher = db.prepare(`
    SELECT t.id, t.title, t.description, t.deadline, t.subject_id, t.created_at,
           s.title AS subject_title
    FROM tasks t
    JOIN subjects s ON s.id = t.subject_id
    WHERE s.teacher_id = ? AND (? IS NULL OR t.subject_id = ?)
    ORDER BY t.created_at DESC, t.rowid DESC
  `);
  const findOwnSubject = db.prepare('SELECT id, title FROM subjects WHERE id = ? AND teacher_id = ?');
  const findOwnTask = db.prepare(`
    SELECT t.id, t.title, t.description, t.deadline, t.subject_id, t.created_at,
           s.title AS subject_title
    FROM tasks t
    JOIN subjects s ON s.id = t.subject_id
    WHERE t.id = ? AND s.teacher_id = ?
  `);
  const taskExists = db.prepare('SELECT id FROM tasks WHERE id = ?');
  const insert = db.prepare(
    'INSERT INTO tasks (id, title, description, deadline, subject_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const update = db.prepare('UPDATE tasks SET title = ?, description = ?, deadline = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM tasks WHERE id = ?');
  const markDone = db.prepare(
    'INSERT OR IGNORE INTO task_completions (task_id, student_id, completed_at) VALUES (?, ?, ?)',
  );
  const markTodo = db.prepare('DELETE FROM task_completions WHERE task_id = ? AND student_id = ?');

  /** Converts a database row into the JSON shape the frontend expects. */
  function toJson(row, { withStatus }) {
    const task = {
      id: row.id,
      title: row.title,
      description: row.description,
      deadline: row.deadline,
      subject_id: row.subject_id,
      created_at: row.created_at,
      subjects: { title: row.subject_title },
    };
    if (withStatus) task.status = row.done ? STATUS_DONE : STATUS_TODO;
    return task;
  }

  /** Loads a task from one of the current teacher's subjects, or answers 404. */
  function getOwnTask(req) {
    const task = findOwnTask.get(req.params.id, req.user.id);
    if (!task) throw new HttpError(404, 'Task not found');
    return task;
  }

  // GET /api/tasks            - all tasks visible to the user
  // GET /api/tasks?subjectId= - tasks of one subject
  router.get('/', (req, res) => {
    const subjectId = typeof req.query.subjectId === 'string' ? req.query.subjectId : null;
    const isStudent = req.user.role === 'student';
    const rows = (isStudent ? listForStudent : listForTeacher).all(req.user.id, subjectId, subjectId);
    res.json({ tasks: rows.map((row) => toJson(row, { withStatus: isStudent })) });
  });

  router.post('/', teacherOnly, (req, res) => {
    const body = req.body ?? {};
    const title = requireString(body.title, 'Task title');
    const description = optionalString(body.description, 'Description');
    const deadline = requireDeadline(body.deadline);
    const subject = findOwnSubject.get(String(body.subjectId ?? ''), req.user.id);
    if (!subject) throw new HttpError(404, 'Subject not found');

    const row = {
      id: randomUUID(),
      title,
      description,
      deadline,
      subject_id: subject.id,
      created_at: new Date().toISOString(),
      subject_title: subject.title,
    };
    insert.run(row.id, row.title, row.description, row.deadline, row.subject_id, row.created_at);
    res.status(201).json({ task: toJson(row, { withStatus: false }) });
  });

  router.patch('/:id', teacherOnly, (req, res) => {
    const task = getOwnTask(req);
    const body = req.body ?? {};
    if (body.title !== undefined) task.title = requireString(body.title, 'Task title');
    if (body.description !== undefined) {
      task.description = optionalString(body.description, 'Description');
    }
    if (body.deadline !== undefined) task.deadline = requireDeadline(body.deadline);
    update.run(task.title, task.description, task.deadline, task.id);
    res.json({ task: toJson(task, { withStatus: false }) });
  });

  router.delete('/:id', teacherOnly, (req, res) => {
    const task = getOwnTask(req);
    remove.run(task.id);
    res.status(204).end();
  });

  // A student marks a task as done / not done. Stored per student.
  router.put('/:id/status', studentOnly, (req, res) => {
    const status = (req.body ?? {}).status;
    if (status !== STATUS_DONE && status !== STATUS_TODO) {
      throw new HttpError(400, `Status must be "${STATUS_TODO}" or "${STATUS_DONE}"`);
    }
    if (!taskExists.get(req.params.id)) throw new HttpError(404, 'Task not found');

    if (status === STATUS_DONE) {
      markDone.run(req.params.id, req.user.id, new Date().toISOString());
    } else {
      markTodo.run(req.params.id, req.user.id);
    }
    res.json({ id: req.params.id, status });
  });

  return router;
}
