# CodeKita database deployment

The application uses the existing React/Vite + NestJS/Fastify monorepo, Prisma 6,
and PostgreSQL. There is no static application mode. Browser storage holds only
language and reduced-motion preferences, never accounts or learning records.

## Local development

Use Node.js 22+ (validated locally with Node 24) and the existing lockfile.
Configure the root `.env` with `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` and
`VITE_API_URL=http://localhost:3000`. The API client appends `/api` automatically.
Use one hostname consistently; do not mix localhost and 127.0.0.1 in the browser.
`CORS_ORIGIN=http://localhost:5173`, `COOKIE_SECURE=false`, `COOKIE_SAME_SITE=lax`.

```powershell
npm install
npx prisma validate
npx prisma generate
npm run db:status
# Review the history and back up an existing database BEFORE deployment:
npm run db:deploy
npm run db:seed
npm run db:import-content
npm run dev
```

`npm run dev` compiles and starts NestJS and Vite. Frontend HMR is enabled;
backend edits currently require restarting the command. `npm run build` generates
Prisma Client and builds both applications. `npm start` starts the compiled backend.
No migration or seed runs automatically at startup or build.

## Database safety

Never use `prisma migrate reset` or `db push --accept-data-loss` on existing data.
If tables exist but migration history is absent, compare the actual database to
the initial migration and baseline deliberately; do not blindly mark it applied.
Migrations 0003 and 0004 add models and enable RLS, without deleting existing rows.
Course/category deletion in the API means archive; curriculum updates preserve
module/lesson IDs and assessed answer keys. Roles map User to existing STUDENT.

The content import is idempotent and never overwrites existing courses. It copies
the existing original repository lessons/labs into PostgreSQL, not mock users or
activity. Templates are served from PostgreSQL and require explicit admin save.

## Supabase connectivity

Copy connection settings from the project's Connect panel. Runtime may use the
transaction pooler on port 6543 with `pgbouncer=true`, `sslmode=require` and a small
`connection_limit`. `DIRECT_URL` is for migrations: direct port 5432 if IPv6 is
available, or the session pooler on 5432 where IPv4 is required. Never use the
transaction pooler for migration/DDL. Percent-encode passwords; do not disable SSL.
Use a trusted server database role with access to RLS-enabled application tables.
The browser never uses Supabase keys or connects directly to PostgreSQL.

## Production Node.js host

Deploy to a host/container that runs a persistent Node.js process. Build with
`npm run build`, run migrations as a reviewed release job, then `npm start`.
Keep `.server-build`, Prisma generated client/engine and production dependencies
available to the process. Inject secrets through the host secret manager.

Set `NODE_ENV=production`, a stable random `SESSION_SECRET` (at least 32 random
bytes recommended), `COOKIE_SECURE=true`, `CORS_ORIGIN` to the exact HTTPS frontend
origin, and `ENABLE_SWAGGER=false`. Configure `PORT` as required by the host.
Set `TRUST_PROXY` to the exact number of trusted proxy hops, never an arbitrary
unrestricted value. Use `/api/health` for database readiness. Session tokens are
HTTP-only and stored as HMAC hashes; pre-migration raw sessions expire normally.

### Combined frontend/backend

Set build-time `VITE_API_URL=/api`. Nest serves the built frontend and `/api`.
Place HTTPS in front of the Node service. SameSite=Lax works for same-site hosts.

### Separate frontend

Build with `VITE_API_URL=https://YOUR_API_HOST` and `npm run build:frontend`.
Upload only `dist` to static hosting; deploy Nest separately. InfinityFree cannot
run NestJS. Vercel config is frontend-only and also needs the build-time API URL.
Use an API subdomain on the same registrable site where possible. Truly cross-site
hosting needs SameSite=None + Secure, and can still fail under third-party cookie
blocking; a same-site reverse proxy is the reliable option. Never upload `.env`,
Prisma files, `node_modules` or `.server-build` to a public document root.

## Administrator provisioning

Register the real account normally, run the role seed, then an authorized operator
runs `npm run admin:grant -- registered-email ADMIN`. Use `SUPER_ADMIN` explicitly
only for the owner who should manage administrators. No account/password is seeded.
Instructors can edit only their own courses; only admins manage categories/users.

## Verification

`npm test` covers password hashing, CSRF, configuration validation and guards.
The live API test creates random temporary records and cleans only their exact IDs:

```powershell
$env:CODEKITA_LIVE_TESTS='1'
$env:CODEKITA_BROWSER_TESTS='1'
npm run test:api
```

Use a disposable/staging database for repeated CI runs. The browser check uses an
installed Chrome/Edge (`CHROME_PATH` override), submits the real React profile form,
reads the saved value independently with Prisma, and reloads the page.
No test fixtures are bundled in the application. Lab execution is intentionally
unavailable until an isolated runner is configured; lab content and saved drafts
are database-driven. The marketing code preview is an illustration, not learner data.