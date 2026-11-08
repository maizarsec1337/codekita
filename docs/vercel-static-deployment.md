# Vercel static frontend deployment

The existing CodeKita production deployment was inspected read-only on November
7, 2026. Vercel selected the Node framework, packaged `server.js` as a root
Lambda, and its build logs reported unresolved NestJS/Prisma imports. Recent
runtime logs report `Cannot find module` for `@prisma/client`. The existing
production URL returned HTTP 500; these local changes have not been deployed.

The repository's `vercel.json` explicitly selects Vite, runs
`npm ci --ignore-scripts` and `npm run build:static`, and publishes only
`dist/frontend-static`. The install setting avoids the existing Prisma
postinstall. The static build runs Vite in `static` mode and cleans only that
output directory. Existing NestJS sources, full-stack commands, Prisma schema,
and migrations remain unchanged.

The SPA rewrite sends extensionless non-API page paths to `/index.html`; it
excludes `/api`, `/assets`, and paths containing a file extension so assets,
missing files, and the rewrite destination are not rewritten. This is a static
demo; it does not deploy or enable an API or provide actual authentication.

Local validation:

```powershell
npm run build:static
npm run typecheck:frontend
pnpm exec vitest run scripts/vercel-config.test.ts
node scripts/static-browser-smoke.mjs --preview
```

The browser smoke test runs a local Vite preview on port 4173 and requires
Chrome. It tests the built frontend and Vite's SPA fallback, **not Vercel's CDN**.
The rewrite source is covered by a local regex test; final routing behavior must
still be checked on Vercel. No actual deployment or production configuration
update was performed.

Before the next authorized deployment, ensure Vercel's root directory points
to this project and that any dashboard-level overrides do not replace the
repository's Vite framework, build command, install command, or output
directory. If Git-based deployment is used, include `vercel.json`,
`.vercelignore`, and the updated `package.json` in the approved commit. After
deployment, inspect the build output to confirm no functions are emitted and
verify `/`, `/login`, `/dashboard`, a nested course path, and static assets over
HTTP. The old production URL will keep returning the existing error until a new
deployment succeeds and is promoted/aliased. No secret should be committed or
exposed through a `VITE_` variable.