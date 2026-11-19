# 📚 Student Task Manager

🔗 **[Live Demo](https://crudstudenttaskmanager.netlify.app/)**

A full-stack web application for academic task management with role-based access control. Teachers create subjects and assign tasks; students track their progress on a personal dashboard with filtering by subject, status and deadline.

The project has its own REST API built with Node.js, Express and SQLite. Roles and permissions are checked on the server for every request.

---

## 📸 Screenshots
<img width="1920" height="825" alt="Teacher dashboard" src="https://github.com/user-attachments/assets/f3f17246-89ca-4872-a76f-ff30c4b233ee" />
<img width="1918" height="808" alt="Managing tasks of a subject" src="https://github.com/user-attachments/assets/3b8452bd-efcf-4f20-8ffb-a085c0498659" />
<img width="1916" height="773" alt="Student dashboard with filters" src="https://github.com/user-attachments/assets/ba359f9b-1da0-4aed-a61f-ce325a7af8fc" />

---

## 🔑 Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| 👨‍🏫 Teacher (manage subjects & tasks) | `teacher@demo.com` | `demo123456` |
| 👨‍🎓 Student (view & track tasks) | `student@demo.com` | `demo123456` |

When running locally, create these accounts and some sample data with `npm run seed` in the `server` folder.

---

## ✨ Features

* **Role-based access control:** separate interfaces for teachers and students. The server checks the role on every request, so the UI cannot be bypassed.
* **Teacher dashboard:** create, edit and delete subjects and tasks in modal dialogs. A teacher sees and changes only their own subjects.
* **Student dashboard:** all tasks in one list with search and filters by subject, status and deadline (overdue, today, tomorrow, this week).
* **Personal task status:** each student marks tasks as done independently; one student's progress does not affect another's.
* **Overdue detection:** tasks past their deadline are highlighted until completed.
* **Persistent sessions:** users stay signed in after reloading the page.

## 🛠 Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Lucide Icons, custom CSS |
| Backend | Node.js, Express 5, REST API |
| Database | SQLite (built into Node.js) |
| Testing | Node.js test runner, 21 end-to-end API tests |

## 🏗 Architecture

```
React (Vite)  ──HTTP/JSON──▶  Express API  ──SQL──▶  SQLite
src/lib/api.ts                server/src/routes      server/data/app.db
```

* The frontend talks to the backend only through one typed client, `src/lib/api.ts`.
* In development, Vite forwards `/api` requests to the backend, so no CORS setup is needed.
* The database has five tables: `users`, `sessions`, `subjects`, `tasks` and `task_completions` (per-student task status).

---

## 💻 Getting Started

**Requirements:** Node.js 22.13 or newer (the server uses the SQLite module built into Node).

1. Clone the repository:
   ```bash
   git clone https://github.com/Favkest11/Student-Task-Manager.git
   cd Student-Task-Manager
   ```
2. Start the backend (first terminal):
   ```bash
   cd server
   npm install
   npm run seed   # optional: demo accounts and sample data
   npm run dev    # API on http://localhost:3001
   ```
3. Start the frontend (second terminal, project root):
   ```bash
   npm install
   npm run dev
   ```
4. Open the address Vite prints (usually http://localhost:5173).

New accounts can sign in right after registration; no email confirmation is needed.

## 🧪 Tests

```bash
cd server
npm test
```

The tests start the real API with an in-memory database and cover registration and login, role checks, access to another teacher's data, per-student task status, input validation, rate limiting and SQL injection attempts.

---

## 🗄 Backend

### Project structure

```
server/
  src/
    index.js        starts the server
    app.js          Express app: CORS, JSON, routes, error handling
    db.js           SQLite connection and table definitions
    auth.js         password hashing, sessions, auth middleware
    validate.js     input validation
    rateLimit.js    limits login and registration attempts
    routes/         auth, subjects, tasks
    seed.js         demo accounts and sample data
  test/api.test.js  API tests
```

The database is a single file, `server/data/app.db`, created on first start.

### API

All requests and responses are JSON. Errors look like `{ "error": "message" }`.
Every route except register and login needs the header `Authorization: Bearer <token>`.

| Method | Path | Who | What |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | anyone | `{ email, password, role }` → `{ user, token }` |
| POST | `/api/auth/login` | anyone | `{ email, password }` → `{ user, token }` |
| GET | `/api/auth/me` | signed in | Current user |
| POST | `/api/auth/logout` | signed in | Ends the session |
| GET | `/api/subjects` | signed in | Teacher: own subjects. Student: all subjects |
| POST | `/api/subjects` | teacher | `{ title, description }` |
| PATCH | `/api/subjects/:id` | owner | Edit a subject |
| DELETE | `/api/subjects/:id` | owner | Delete a subject and its tasks |
| GET | `/api/tasks?subjectId=` | signed in | Teacher: tasks of own subjects. Student: all tasks with own status |
| POST | `/api/tasks` | teacher | `{ title, description, deadline, subjectId }` |
| PATCH | `/api/tasks/:id` | owner | Edit a task |
| DELETE | `/api/tasks/:id` | owner | Delete a task |
| PUT | `/api/tasks/:id/status` | student | `{ status: "Done" \| "To Do" }` for the current student |

### Security

* Passwords are stored as salted scrypt hashes, never as plain text.
* Sessions are random tokens valid for 30 days; only their hashes are stored in the database.
* Login and registration are limited to 30 attempts per 15 minutes per IP address.
* All SQL queries use parameters, so user input cannot change a query.
* A teacher can change only their own subjects and tasks.

### Settings

Copy `server/.env.example` to `server/.env` to change them.

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3001` | Port of the API |
| `DATABASE_PATH` | `./data/app.db` | Location of the SQLite file |
| `CORS_ORIGIN` | empty | Frontend addresses allowed to call the API, comma-separated. Needed in production |
| `TRUST_PROXY` | empty | Set to `1` behind a reverse proxy (most hosting platforms) |

---

## 🚀 Deployment

The frontend is a static site (Netlify); the backend needs a host that runs Node.js and keeps files between restarts (a persistent disk for the SQLite file).

1. Deploy the `server` folder with the start command `npm start` and point `DATABASE_PATH` to the persistent disk.
2. On the server, set `CORS_ORIGIN` to the frontend address and `TRUST_PROXY=1`.
3. In the frontend build settings, set `VITE_API_URL` to the backend address (for example `https://your-api.example.com`) and rebuild.

## 🗺 Roadmap

* Email confirmation and password reset
* Invite codes for teacher registration
* Assigning subjects to specific groups of students
