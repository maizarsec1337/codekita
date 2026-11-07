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
unrelated Node processes or VS Code. `dev:fullstack` and the standalone
`scripts/check-dev.mjs` also launch Vite and therefore must not run concurrently
with the static dev server. The browser smoke test starts its own server and
requires port 5173 to be free.

```powershell
pnpm lint:frontend
pnpm typecheck:frontend
pnpm build:frontend
pnpm test:frontend-browser
```

The frontend build is written to `C:\Users\maizar\Desktop\codekita.id\dist\frontend-static`.
Static hosting must provide an SPA fallback to `index.html` for direct route
loads. The browser smoke test requires Chrome (or `CHROME_PATH`) and an unused
port 5173; it starts and stops its own Vite process.

`C:\Users\maizar\Desktop\codekita.id\src\data\static-demo.ts` adapts the
existing local starter curriculum and contains example dashboard, profile and
leaderboard data. A visible banner identifies all content as a demo. Login and
registration forms validate fictional input locally, no user session or admin privilege is created, and
enrollment, saved progress, assessment completion and curriculum writes are
unavailable. The admin page is a public **preview only**, not an authorization
mechanism. Client-side guards are not a security boundary: the real backend must
enforce authentication and authorization on every protected operation.

The original API clients, backend routes, Prisma files and normal `dev`, `build`
and `start` scripts remain available. The original full-stack launcher is now
`pnpm run dev:fullstack`; it requires a separately configured backend. Static
mode is selected by `pnpm run dev` or `pnpm run dev:frontend`. Never prefix secrets with
`VITE_`, since those variables can be exposed to frontend code.