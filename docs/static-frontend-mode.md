# Static frontend demo

From `C:\Users\maizar\Desktop\codekita.id`:

```powershell
pnpm run dev
```

Open `http://localhost:5173`. This explicitly uses Vite's `static` mode, does
not launch the backend, and needs no database or session configuration. The
script fails rather than silently changing ports if 5173 is occupied.

## Port 5173 is already in use

Before running the development command again, open `http://localhost:5173`.
If the existing page is this project's static demo, reuse that server; a second
`npm run dev` or `pnpm run dev` cannot bind the same port and is not needed.
On Windows, inspect the listener and its executable/parent without terminating it:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5173 | ForEach-Object {
  Get-CimInstance Win32_Process -Filter "ProcessId = $($_.OwningProcess)" |
    Select-Object ProcessId, ParentProcessId, ExecutablePath, CommandLine
}
```

Stop a confirmed CodeKita Vite server from the terminal that launched it with
Ctrl+C. Check its parent process if the port becomes occupied again; do not kill
unrelated processes. `dev:fullstack` also launches Vite and must not run
concurrently with the static dev server.

## Production validation and InfinityFree build

```powershell
npm run typecheck:frontend
npm run build
npm run preview
```

`npm run build` typechecks and produces a clean static release directly in
`C:\Users\maizar\Desktop\codekita.id\dist`. Upload the *contents* of this one
folder to the domain's `htdocs` root. It includes `index.html`, content-hashed
`assets`, the real published repository curriculum in `catalogue.json`,
`favicon.jpg`, status documents and `.htaccess`. Static hosting must preserve the
`.htaccess` SPA fallback for direct routes. Build and typecheck require no local
backend or database.

The public curriculum is authored in
`C:\Users\maizar\Desktop\codekita.id\packages\shared\src\starter-content.ts`.
Only paths explicitly marked published are emitted; no account activity or
assessment answer keys enter the public JSON. Search, academy/difficulty filters,
path detail and read-only lesson previews use this catalogue. Login, enrolment,
saved progress, assessment completion and curriculum administration still need
a separately hosted CodeKita API. Client-side route guards are not a security
boundary: the real backend must enforce authentication and authorization.

The original API clients, backend routes, Prisma files and normal `dev`, `build`
and `start` scripts remain available. The original full-stack launcher is now
`pnpm run dev:fullstack`; it requires a separately configured backend. Static
mode is selected by `pnpm run dev` or `pnpm run dev:frontend`. Never prefix secrets with
`VITE_`, since those variables can be exposed to frontend code.