# Teacher Student API

A REST API that lets teachers perform administrative functions for their students:
register students, find students common to a group of teachers, suspend students,
and retrieve the students who can receive a notification.

Built with Node.js, TypeScript, Express 5 and MySQL 8.

---

## 1. Hosted API (AWS)

**Base URL:** http://18.139.60.28:5000

The API is deployed on an AWS EC2 instance, running the same Docker Compose setup
described in section 2 (API container + MySQL container).

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/register` | Register one or more students to a teacher |
| GET | `/api/commonstudents?teacher=...` | Students common to all given teachers |
| POST | `/api/suspend` | Suspend a student |
| POST | `/api/retrievefornotifications` | Students who can receive a notification |

**Quick check (no setup needed)**

macOS / Linux / Git Bash:

```bash
curl -i -X POST http://18.139.60.28:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"teacher":"teacherken@gmail.com","students":["studentjon@gmail.com","studenthon@gmail.com"]}'

curl "http://18.139.60.28:5000/api/commonstudents?teacher=teacherken%40gmail.com"
```

Windows PowerShell:

```powershell
Invoke-RestMethod -Method Post -Uri http://18.139.60.28:5000/api/register -ContentType "application/json" -Body '{"teacher":"teacherken@gmail.com","students":["studentjon@gmail.com","studenthon@gmail.com"]}'

Invoke-RestMethod "http://18.139.60.28:5000/api/commonstudents?teacher=teacherken%40gmail.com"
```

Expected: `204 No Content` for the first call. The second call returns `200` with a
`students` list that includes `studenthon@gmail.com` and `studentjon@gmail.com`.

> The hosted database is shared, so it may also contain data added by other testers.
> For results that exactly match the specification examples, run the API locally (section 2).

To run the full Postman collection against the hosted API, see
[Testing with Postman](#5-testing-with-postman).

The hosted API is served over plain HTTP on a public IP for assessment purposes.
See [Known limitations](#8-known-limitations).

---

## 2. Run locally with Docker (recommended)

Starts MySQL and the API together. The database schema is created automatically.
No `.env` file or other setup is needed.

**Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and **running**
(it includes Docker Compose).

```bash
git clone https://github.com/RamyaTechSourceCode/teacher-student-api.git
cd teacher-student-api
docker compose up --build
```

The first run takes 1–2 minutes. When the logs show `Database connected` and `Server listening`,
the API is available at **http://localhost:5000**.

Useful commands:

```bash
docker compose ps                  # container status
docker compose logs -f api         # API logs
docker compose down                # stop
docker compose down -v             # stop and delete all data (fresh database next start)
```

---
## 3. Run locally without Docker (Node.js)

Runs the API directly with Node.js, with hot reload. MySQL still runs in Docker
(simplest way to get the correct version and schema).

**Prerequisites:** Node.js 22 LTS (20+ works), npm, Docker Desktop

```bash
git clone https://github.com/RamyaTechSourceCode/teacher-student-api.git
cd teacher-student-api
npm ci
```

Create `.env` from the example:

```bash
cp .env.example .env               # macOS / Linux
Copy-Item .env.example .env        # Windows PowerShell
```

The defaults match the Docker setup and work as they are:

```
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3307
DB_NAME=teacher_student_db
DB_USER=app_user
DB_PASSWORD=app_password
DB_ROOT_PASSWORD=rootpass
```

Start only the database, then the API:

```bash
docker compose up -d mysql
npm run dev
```

The API is available at **http://localhost:5000**. MySQL is exposed on
`127.0.0.1:3307` (port 3307 avoids clashing with a MySQL already installed on 3306).

> If you change any `DB_*` password after MySQL has been created, reset it with
> `docker compose down -v` (this deletes the data). MySQL only applies passwords on first start.

> Using your own MySQL instead of Docker: create a database and a user with access to it,
> run the schema against that database
> (e.g. `mysql -u root -p teacher_student_db < db/schema.sql`),
> and set the `DB_*` values in `.env` to match.

Other scripts:

| Command | Description |
|---|---|
| `npm run dev` | Start with hot reload (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm test` | Run unit tests |
| `npm run test:integration` | Run integration tests against a MySQL test database (Docker) |
| `npm run test:coverage` | Unit tests with a coverage report |
| `npm run lint` | Lint with ESLint |
| `npm run format` | Format with Prettier |

---

## 5. Testing with Postman

1. In Postman, press **Ctrl+O** (or **File → Import**) and select
   `postman/teacher-student-api.postman_collection.json`.
2. The collection has two variables (collection → **Variables** tab):
   - `baseUrl`: the hosted API, `http://18.139.60.28:5000` (default)
   - `localUrl`: `http://localhost:5000`

   To test a local instance, set `baseUrl` to `{{localUrl}}`.
3. Run the requests **in order** (collection → **Run**). Later requests depend on data
   created by the Register requests.

**Hosted API:** the database is shared with other testers, so results may include extra
students added by others.

**Local instance:** for results that exactly match the specification examples, start from
an empty database first:

```bash
docker compose down -v
docker compose up -d
```

---

## 6. API reference

Request bodies are JSON and require the header `Content-Type: application/json`.
Errors always return:

```json
{ "message": "description of the problem" }
```

### POST /api/register

Registers one or more students to a teacher.

**Request**

```json
{
  "teacher": "teacherken@gmail.com",
  "students": ["studentjon@gmail.com", "studenthon@gmail.com"]
}
```

**Response:** `204 No Content`

- Teachers and students are created if they don't exist.
- Registering an already-registered student is not an error (safe to retry).
- 1–1000 students per request.

### GET /api/commonstudents

Returns students registered to **all** the given teachers.

**Request**

```
GET /api/commonstudents?teacher=teacherken%40gmail.com&teacher=teacherjoe%40gmail.com
```

**Response:** `200 OK`

```json
{ "students": ["commonstudent1@gmail.com", "commonstudent2@gmail.com"] }
```

- Students are sorted by email.
- An unknown teacher has no students, so the result is `{ "students": [] }`.
- The same teacher given twice (in any letter case) counts once.

### POST /api/suspend

**Request**

```json
{ "student": "studentmary@gmail.com" }
```

**Response:** `204 No Content`

- `404` if the student doesn't exist.
- Suspending an already-suspended student returns `204`.

### POST /api/retrievefornotifications

**Request**

```json
{
  "teacher": "teacherken@gmail.com",
  "notification": "Hello students! @studentagnes@gmail.com @studentmiche@gmail.com"
}
```

**Response:** `200 OK`

```json
{ "recipients": ["studentbob@gmail.com", "studentagnes@gmail.com", "studentmiche@gmail.com"] }
```

- Recipients are students who are **not suspended** and are either registered to the teacher
  or @mentioned.
- @mentioned students are included even if they aren't registered to any teacher.
- No duplicates. Registered students come first (sorted by email), then mentioned students
  in the order they appear.
- An unknown teacher returns only the mentioned students.

### Error responses

| Status | When | Example message |
|---|---|---|
| 400 | Invalid or missing fields, invalid email, malformed JSON, body not JSON | `teacher: Invalid email address` |
| 404 | Student not found (suspend), unknown route | `Student not found: nobody@gmail.com` |
| 405 | Unsupported HTTP method on a valid route (e.g. `GET /api/suspend`) | `Method not allowed` |
| 413 | Request body larger than 10 KB | `Request body is too large` |
| 500 | Unexpected server error (details only in server logs) | `Internal server error` |

---

## 7. Design and assumptions

**Project structure**

```
src/
  app.ts            Express app: middleware, routes, error handler
  server.ts         Start-up (DB check, listen, graceful shutdown)
  config/           Environment validation (Zod), DB pool, logger
  routes/           Route definitions and request validation
  controllers/      HTTP in/out only
  services/         Business rules
  repositories/     SQL queries (parameterised)
  validators/       Zod schemas per endpoint
  middleware/       Validation and global error handling
  utils/            @mention parsing
  errors/           AppError (status code + client-safe message)
db/schema.sql       Tables, created automatically by the MySQL container
tests/unit/         Jest unit tests (mocked data layer)
postman/            Postman collection
```

**Assumptions**

- Emails are matched case-insensitively. Responses return emails as they were first stored.
- Registering the same teacher/student pair again is allowed and has no effect (idempotent).
- Suspending an already-suspended student returns `204` (idempotent). Suspending an
  email that does not exist returns `404`.
- `commonstudents` returns students registered to **all** given teachers. An unknown
  teacher returns an empty list rather than an error.
- For notifications, recipients are the teacher's non-suspended students plus any
  @mentioned students who are not suspended. A mentioned email that does not exist in
  the database is still included, since the spec does not require mentioned students
  to be registered. Duplicates are removed.
- A mention is `@` followed by an email, not preceded by a letter, digit, underscore,
  dot or another `@`, so a plain email address in the text (`bob@gmail.com`) is not treated as
  a mention. Mentions can be separated by spaces, commas or new lines.
- Limits: up to 1000 students per register request, 100 teachers per
  `commonstudents` query, 5000 characters per notification, 10 KB request body.

**Security**

- All SQL uses parameterised queries; register runs in a transaction.
- All input is validated with Zod before reaching the controllers.
- Environment variables are validated at start-up; the app exits if any are missing.
- `helmet` sets secure HTTP headers; request body size is limited.
- Unexpected errors return a generic message; stack traces go only to the server logs.
- The API connects as a dedicated database user with access to its own database only,
  not as `root`.
- Secrets live in `.env` (git- and docker-ignored); `.env.example` holds placeholders.
- The Docker image is multi-stage and runs as a non-root user; MySQL is not exposed publicly.

**Logging**

Structured logging with pino. Every request gets an ID (returned as the `x-request-id`
header) that appears on its request and error log lines. Query strings are left out of
request logs because they contain email addresses. Logs are human-readable in
development, JSON in production, and silent during tests.

---

## 8. Known limitations

- The hosted API uses HTTP, not HTTPS. In production, TLS would be terminated by a
  reverse proxy or an load balancer in front of the API.
- No rate limiting on the public endpoint. In production this could be added with
  middleware such as `express-rate-limit` or at the load balancer / API gateway.
- The hosted database is shared by all testers, so its data changes over time. For
  results that exactly match the specification examples, run locally with a fresh database.
- Tests mock the database layer; the SQL queries are verified with the Postman
  collection rather than automated integration tests.
- No authentication: the specification states that login and access control are
  assumed to be handled already.
