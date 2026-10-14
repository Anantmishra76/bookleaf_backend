# BookLeaf Author Support & Communication Portal

A full-stack support portal where authors can view their books and raise support tickets, and admins can manage queries with AI-assisted classification and response drafts.

## Tech stack

| Frontend                                       | Backend                       | Database   | AI            |
| ---------------------------------------------- | ----------------------------- | ---------- | ------------- |
| React, Vite, Tailwind CSS, React Router, Axios | Node.js, Express, JWT, bcrypt | PostgreSQL | Google Gemini |

## Features

**Author portal**

- Email/password login and access to the author's own data.
- Book details, production status, sales, and royalty figures.
- Book-specific or general support tickets.
- Ticket history, status, and public admin responses.
- Automatic updates: ticket list every 10 seconds and details every 8 seconds.

**Admin portal**

- Ticket queue with status, category, priority, and date filters.
- Ticket details with author information and response history.
- Status updates, category/priority overrides, and self-assignment.
- Editable AI response drafts and manual replies.
- Private internal notes that authors cannot access.

## Project structure

Keep the two projects beside each other when extracting the ZIP:


bookleaf/
  bookleaf_backend/
    config/         Database connection, environment checks, knowledge base
    controllers/    Request validation and application logic
    middleware/     Authentication, role checks, and JSON errors
    migrations/     Database table definitions
    routes/         API routes
    scripts/        Migration runner
    services/       Gemini integration
    tests/          Automated checks
    docs/           API documentation and test report
    app.js          Express application
    server.js       Server startup
    seed.js         Sample data import
    .env.example    Backend configuration template
    README.md       This guide
  bookleaf_frontend/
    src/
      components/   Shared UI and admin forms
      pages/        Login, author pages, and admin pages
      services/     Shared Axios client
      utils/        Ticket options and labels
    .env.example    Frontend configuration template

## Requirements

- Node.js 24 and npm (used during development).
- PostgreSQL running locally, or an accessible hosted PostgreSQL instance.
- A Gemini API key to test AI features. The manual support workflow works without one.

## 1. Set up the backend

Open a terminal in the extracted `bookleaf` folder:

```sh
cd bookleaf_backend
npm ci
```

Copy `.env.example` to `.env`. In Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env` instead. Edit the new `.env` file:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/bookleafdb
PORT=5000
JWT_SECRET=YOUR_GENERATED_SECRET
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
```

Replace the database username and password with your own PostgreSQL credentials. URL-encode special characters in connection URL credentials. Generate your JWT secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the generated value into `JWT_SECRET`. For AI features, create your own key in [Google AI Studio](https://aistudio.google.com/apikey). If you do not have a key, remove `GEMINI_API_KEY`; tickets and manual admin replies will still work. Provider availability, quotas, and billing depend on your account.

Actual `.env` files are intentionally excluded from the submission. Each reviewer supplies credentials for their own database and AI account. Only configuration templates are included.

### Create and seed the database

Create an empty database using pgAdmin or a PostgreSQL query tool:

```sql
CREATE DATABASE bookleafdb;
```

If `bookleafdb` already exists, keep it. From `bookleaf_backend`, run:

```sh
npm run db:setup
```

This creates the tables and imports the supplied **10 authors and 18 books**, plus an admin account. Tickets are created through the application; they are not included in the sample seed.

For an already-seeded database, run only `npm run db:migrate`. The migration runner records applied files and skips them on subsequent runs. Seeding again avoids duplicate records but updates sample author profiles and books; it does not reset existing passwords or erase tickets.

Start the backend:

```sh
npm run dev
```

The default API address is `http://localhost:5000`. Check [API health](http://localhost:5000/api/health). Startup validates configuration and verifies the database connection before accepting requests. Use `npm start` to run without the development watcher.

## 2. Set up the frontend

Keep the backend running. Open a second terminal in the extracted `bookleaf` folder:

```sh
cd bookleaf_frontend
npm ci
```

Copy `.env.example` to `.env` and set:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```sh
npm run dev
```

Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173). If you change the backend port, update `VITE_API_URL` and restart Vite. Never put database credentials, JWT secrets, or AI keys in frontend environment variables.

## Demo credentials

| Role   | Email                  | Password     |
| ------ | ---------------------- | ------------ |
| Author | priya.sharma@email.com | Bookleaf@123 |
| Admin  | admin@bookleaf.local   | Bookleaf@123 |

All newly seeded authors use the email in `bookleaf_sample_data.json` and the same demo password. Existing account passwords are preserved when seeding again.

### Try the workflow

1. Sign in as an author, view books, and create a support ticket.
2. Sign out and sign in as admin, or use a separate browser tab for each session.
3. Open the ticket, review its classification, and assign it to yourself.
4. Edit the AI draft or write a manual response, then send it.
5. Add a private internal note and update the ticket status.
6. Return to the author's ticket page. The response and status update automatically; the internal note stays private.

## API overview

Protected endpoints require `Authorization: Bearer YOUR_LOGIN_TOKEN`. Login returns the token and the user's ID, email, and role. Tokens expire after one day.

| Method | Endpoint                         | Access | Purpose                              |
| ------ | -------------------------------- | ------ | ------------------------------------ |
| GET    | /                                | Public | Welcome message                      |
| GET    | /api/health                      | Public | API/database health                  |
| POST   | /api/auth/login                  | Public | Email/password login                 |
| GET    | /api/books                       | Author | Own books and royalty details        |
| POST   | /api/tickets                     | Author | Create a ticket                      |
| GET    | /api/tickets                     | Author | Own ticket list                      |
| GET    | /api/tickets/:id                 | Author | Own ticket and public responses      |
| GET    | /api/admin/tickets               | Admin  | Filtered ticket queue                |
| GET    | /api/admin/tickets/:id           | Admin  | Ticket, responses, and private notes |
| PATCH  | /api/admin/tickets/:id           | Admin  | Update fields or self-assign         |
| POST   | /api/admin/tickets/:id/responses | Admin  | Send a public reply                  |
| POST   | /api/admin/tickets/:id/notes     | Admin  | Add a private note                   |
| POST   | /api/admin/tickets/:id/ai-draft  | Admin  | Generate or reuse a draft            |

Example login body:

```json
{
  "email": "priya.sharma@email.com",
  "password": "Bookleaf@123"
}
```

Detailed requests, filters, response formats, and error codes are documented in:

- [Author ticket API](docs/tickets.md)
- [Admin ticket API](docs/admin-tickets.md)
- [AI integration](docs/ai.md)
- [Startup and login validation](docs/server-setup.md)

## Architecture and AI approach

The backend separates routes, controllers, middleware, database configuration, and AI calls. PostgreSQL foreign keys model the relationships between users, authors, books, tickets, and messages. Money uses `NUMERIC` columns. Queries use parameters, and author ownership is checked using the verified JWT user ID.

Responses and internal notes share a message table with an `is_internal` flag. Author queries explicitly exclude private notes. AI drafts are stored separately and are never sent automatically.

Gemini classifies tickets into the six required categories and assigns a priority. Response drafts use the relevant BookLeaf knowledge-base section, available book facts, and up to five recent public responses. Structured output is validated before use. Prompts instruct the model to avoid invented facts and unverified claims about completed actions.

Tickets are saved before classification. AI calls time out after 15 seconds; if they fail, tickets remain available and admins can respond manually. Draft caching and limited context reduce repeated requests and token usage. The frontend uses Axios for all API calls and keeps the demo session in `sessionStorage`.

## Verification

From `bookleaf_backend`:

```sh
npm run test:server
npm run test:ai
npm run test:database
npm run test:admin
```

Server and AI unit checks use mocked dependencies. Database tests require PostgreSQL access; the setup test also requires permission to create a schema. Test changes are rolled back. Admin tests may advance sequence counters and use mocked Gemini responses.

From `bookleaf_frontend`:

```sh
npm run lint
npm run build
```

Local browser checks covered both portals, live AI drafts, ticket updates, response polling, ownership restrictions, and private-note visibility. See the [test report](docs/qa/test-report-2026-10-14.md) for evidence and testing limits.

## Notes, assumptions, and limitations

- Supplied royalty and sales figures are displayed as provided; the app does not calculate platform-level sales or execute payouts.
- Production-stage books, missing publication dates, and zero royalties are supported.
- Attachments have a UI picker only. Files are not uploaded or sent.
- The admin queue uses manual refresh; author ticket pages poll for updates.
- AI-generated content requires admin review. Unsaved draft edits are not persisted.
- AI classification runs within ticket creation; background jobs, retries, and saved failure status are future improvements.
- Pagination, login rate limiting, HttpOnly cookie sessions, and stricter deployment CORS are future improvements.
- Deployment, dedicated mobile checks, and cross-browser testing remain pending.

## Troubleshooting

| Problem                   | What to check                                                                                 |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Backend will not start    | PostgreSQL is running, DATABASE_URL is correct, JWT_SECRET is set, and the port is available. |
| Missing table error       | Run `npm run db:migrate` in the backend.                                                      |
| Demo login fails          | Run the seed on a new database; existing passwords are not reset by seeding.                  |
| Frontend cannot reach API | Backend is running and VITE_API_URL includes `/api` and the correct port.                     |
| AI draft unavailable      | Use manual replies; check the Gemini key, model access, and quota.                            |

## ZIP submission

Include both project folders, source files, lockfiles, `.env.example` templates, migrations, sample JSON, tests, and documentation. Exclude actual `.env` files, `node_modules`, `.git`, and generated build folders such as `dist`.

For deployment, supply hosted database settings and backend secrets, set the frontend's API URL before building, and configure the frontend host to serve `index.html` for client-side routes. No deployed demo URL is included at this stage.
