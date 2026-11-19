import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireRole } from '../auth.js';
import { HttpError } from '../errors.js';
import { optionalString, requireString } from '../validate.js';

const COLUMNS = 'id, title, description, created_at';

export function subjectsRouter(db) {
  const router = Router();
  const teacherOnly = requireRole('teacher');

  const listAll = db.prepare(`SELECT ${COLUMNS} FROM subjects ORDER BY created_at DESC, rowid DESC`);
  const listOwn = db.prepare(
    `SELECT ${COLUMNS} FROM subjects WHERE teacher_id = ? ORDER BY created_at DESC, rowid DESC`,
  );
  const findOwn = db.prepare(`SELECT ${COLUMNS} FROM subjects WHERE id = ? AND teacher_id = ?`);
  const insert = db.prepare(
    'INSERT INTO subjects (id, title, description, teacher_id, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const update = db.prepare('UPDATE subjects SET title = ?, description = ? WHERE id = ?');
  const remove = db.prepare('DELETE FROM subjects WHERE id = ?');

  /** Loads a subject that belongs to the current teacher, or answers 404. */
  function getOwnSubject(req) {
    const subject = findOwn.get(req.params.id, req.user.id);
    if (!subject) throw new HttpError(404, 'Subject not found');
    return subject;
  }

  // Teachers see only their own subjects, students see all of them.
  router.get('/', (req, res) => {
    const subjects = req.user.role === 'teacher' ? listOwn.all(req.user.id) : listAll.all();
    res.json({ subjects });
  });

  router.post('/', teacherOnly, (req, res) => {
    const body = req.body ?? {};
    const subject = {
      id: randomUUID(),
      title: requireString(body.title, 'Subject name'),
      description: optionalString(body.description, 'Description'),
      created_at: new Date().toISOString(),
    };
    insert.run(subject.id, subject.title, subject.description, req.user.id, subject.created_at);
    res.status(201).json({ subject });
  });

  router.patch('/:id', teacherOnly, (req, res) => {
    const subject = getOwnSubject(req);
    const body = req.body ?? {};
    if (body.title !== undefined) subject.title = requireString(body.title, 'Subject name');
    if (body.description !== undefined) {
      subject.description = optionalString(body.description, 'Description');
    }
    update.run(subject.title, subject.description, subject.id);
    res.json({ subject });
  });

  // Deleting a subject also deletes its tasks (ON DELETE CASCADE).
  router.delete('/:id', teacherOnly, (req, res) => {
    const subject = getOwnSubject(req);
    remove.run(subject.id);
    res.status(204).end();
  });

  return router;
}
