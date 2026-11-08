# CodeKita error pages and InfinityFree deployment

Implementation and local verification: November 8, 2026.

## Design audit and scope

The existing public homepage and workspace shell use the shared `--ck-*` tokens:
background `#090D13`, surface `#121922`, border `#293443`, primary `#B8F34A`,
foreground `#F3F6FA`, and secondary text `#9AA8BA`. The project also contains older
legacy colors and a dashboard-specific palette; neither was used to invent a new
error-page identity. Error pages reuse the terminal logo, Inter/system typography,
JetBrains Mono labels, 40px grid, 16px panel corners, existing Button component,
subtle .5s entrance transition, and both reduced-motion preferences.

No homepage, course, dashboard, login, registration or authorization behavior was
redesigned. No dependency was added. Existing Vercel configuration was preserved.

## Application behavior

- `/403`, `/404`, `/500`, and `/503` show the corresponding error screen.
- Unknown frontend routes, including `/dashboard/not-a-route`, use the standalone
  404 screen without nesting a second header, footer or main landmark.
- Existing public/dashboard layouts and lazy route imports remain in the route
  tree. There is still exactly one `createBrowserRouter` instance.
- The root data-router boundary handles route loader/action/render failures.
  Deliberately thrown router Responses with 403, 404 or 503 select that screen.
  Unhandled exceptions select 500. Raw error text, stacks, request URLs and server
  payloads are never interpolated into error-page content.
- Existing API/query/form error handling remains in place. An `ApiError(404)` is
  **not** treated as an unknown frontend route. This change does not globally
  redirect failed API requests to an error page.
- The outer React boundary encloses Providers and RouterProvider. Its 500 screen
  works outside router/query/toast contexts, with regular anchor navigation.
- Existing unauthenticated login redirects and non-admin dashboard redirects are
  unchanged. `/403` does not grant or enforce any permission by itself.
- Home recovery is always available. Dashboard recovery is available for a
  resolved authenticated session, or in the existing static-demo mode where the
  dashboard is a public preview. Standalone server documents cannot know the
  session and deliberately do not guess it from storage.
- Retry is available on actual 500/503 failures through an explicit callback;
  route/application failures reload the failed page. The direct `/500` and `/503`
  previews have no retry, because retrying those routes would only display the
  same screen again. Async retry disables duplicates and uses a safe failure message.
- All user-facing strings and accessible labels use the existing i18next setup.
  `codekita-language`, the existing language switcher, document language and
  storage-denied behavior are respected. Error metadata is restored on unmount.
- Error screens set a localized document title and `noindex, nofollow`, focus the
  heading on entry, retain language-selector focus when switching, and provide a
  keyboard skip link. No automatic polling, redirect or retry loop is installed.

## Local build and preview

Run from `C:\Users\maizar\Desktop\codekita.id`:

```powershell
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build:static
pnpm run preview:static
```

The correct static output is:

`C:\Users\maizar\Desktop\codekita.id\dist\frontend-static`

Do **not** upload the parent `C:\Users\maizar\Desktop\codekita.id\dist` directory:
it can also contain full-stack server output, test reports and screenshots.

Build scripts regenerate the four standalone HTML files before Vite copies public
assets. To regenerate without building, run `pnpm run generate:error-documents`.
To verify they are current, run `node scripts/generate-error-documents.mjs --check`.

## InfinityFree upload

1. Back up the target site's files and its existing `.htaccess` before changing
   deployment. This repository had no existing public `.htaccess`; the hosting
   account may already have one.
2. Upload the **contents** of the static output directory to the domain's document
   root: `/htdocs` or `/<your-domain>/htdocs` as shown in the hosting file manager.
   The root should directly contain `index.html`, `assets`, `status`, `favicon.svg`
   and `.htaccess`. Enable hidden-file visibility so `.htaccess` is included.
3. If the domain already has rules, merge the CodeKita rules into that domain's
   `.htaccess`. Preserve SSL/canonical-domain redirects, PHP applications, API
   routing and security rules. Put any site-specific rewrites **before** the SPA
   fallback. Do not replace the hosting account's parent/master `.htaccess`.
4. Publish assets and the `status` directory before the new `index.html`, then
   merge/enable the rewrite rules. Retain older hashed assets for active tabs when
   possible; do not blindly remove unrelated server files.
5. This configuration assumes a domain-root deployment, matching the existing
   router and Vite base. A subdirectory deployment requires coordinated changes
   to Vite base, router basename, recovery links and ErrorDocument/rewrite paths;
   it is not enabled by this change.

InfinityFree free hosting serves the **built frontend**, not this project's
NestJS/Node.js backend. Never upload `.env`, source files, Prisma credentials,
`node_modules`, or the server runtime. The supplied static build remains the
existing honest demo: no real login, account creation, writes or saved progress.
A real full-stack deployment needs a separate Node-compatible backend and a
review of API origin, CORS, credentials, sessions and CSRF—not merely a new URL.

## HTTP status versus frontend display

The domain's local server documents are `/status/403.html`, `/status/404.html`,
`/status/500.html`, and `/status/503.html`. Local `ErrorDocument` paths avoid an
external redirect that would replace the original error response with a 3xx.

| Request | Expected result under the supplied rules |
| --- | --- |
| Browser navigation to `/courses`, `/dashboard` or `/login` | SPA `index.html`; normal client route and existing auth/demo behavior |
| Browser navigation to `/unknown-page` accepting HTML | SPA HTTP 200, then client-side 404 screen; not a real server 404 |
| Missing `/assets/missing.js`, `/missing.png` or `/status/missing.html` | Server 404; no rewrite to SPA HTML 200 |
| Missing `/api/health` | Server handling/404; never fabricated SPA API response |
| Existing file or directory | Passed through unchanged |
| POST/PUT/etc. to an unknown URL | Passed to server handling; never rewritten to the SPA |
| Direct `/status/404.html` | HTTP 200 document preview; does not itself trigger a 404 |
| A genuine server error where ErrorDocument is supported | Original error status with local standalone document |

The fallback is intentionally limited to GET/HEAD requests accepting `text/html`.
Missing filenames containing an extension are intentionally left to the server.
The current application does not define dotted frontend slugs. If such routes are
added later, review the file-extension exclusion rather than removing asset guards.

Custom error pages cannot fix a malformed `.htaccess`, an inaccessible document
root, an account suspension, or a provider-level error produced before the site's
rules run. A host-level 500/503 may therefore still show the hosting provider's
response. These documents are prepared for supported server-level errors, not a
promise that every infrastructure outage can execute site configuration.

Static documents inline CSS, token values and installed Lucide SVGs. They make no
React, backend, stylesheet, image or font-network requests. They use the same font
family stack with system fallback when Inter/JetBrains Mono are unavailable.
Both languages are pre-rendered from the existing JSON translations; a tiny native
script selects language using the same preference key. There is no second runtime
translation dictionary. Without JavaScript, Indonesian recovery and an English
section remain usable. A 500/503 retry is exposed only when the document is served
at the original failed URL; it performs a new GET navigation instead of replaying
a failed POST. No retry appears on direct static document previews.

## Staging-host verification (still required)

Local Vite preview does not execute Apache `.htaccess`. No Apache binary, hosting
account, or deployment credentials were available in this task. Before production:

- Open `/`, `/courses`, `/dashboard`, `/login`, and an unknown nested route in a
  browser, then refresh each. Test both languages and a private session.
- Confirm a real JS/CSS asset returns its proper content type, not HTML.
- Request a nonexistent asset and confirm **HTTP 404**, not a redirect or HTTP 200.
- Check that missing `/api/health` is not the SPA. Browser security challenges on
  the host may affect command-line probes; use the browser Network panel as well.
- Open each `/status/*.html` directly, including with JavaScript disabled.
- Test a genuine 403/500/503 only on a disposable staging location. Never break
  the production `.htaccess` or permissions to manufacture a test error.
- Clear cached hosting-error redirects when validating changed rules.

Vercel settings in `C:\Users\maizar\Desktop\codekita.id\vercel.json` remain
unchanged. Vercel does not use `.htaccess`; this work does not promise custom
Vercel infrastructure-error interception. Its existing SPA rewrites and static
build output continue to be covered by the existing configuration tests.

## Automated verification and artifacts

Verified locally:

- Frontend and backend TypeScript checks; repository ESLint with zero warnings.
- 144 tests across 23 files, including 30 error-specific tests and matching ID/EN
  namespace keys.
- Static production build; generated documents and `.htaccess` present in output.
- Real Chrome production-preview smoke: 18 existing routes at three viewports,
  including home, courses, dashboard and login; existing demo safety checks.
- Error screens at 320/390/768/1440px in both languages, reload persistence, home
  and dashboard recovery, document metadata, one main/h1, 44px recovery controls,
  description-text AA contrast, keyboard selection and reduced motion.
- Standalone documents at 320/768/1440px, no external resource requests, and usable
  ID/EN content with JavaScript disabled. No API calls, failed requests, uncaught
  exceptions, console errors or page overflow in the browser run.

Run the browser suite after building (preview port 4173 must be free):

```powershell
node scripts/static-browser-smoke.mjs --preview
```

The harness uses installed Chrome and Node's built-in WebSocket; it installs no
browser automation library. Set `CHROME_PATH` if Chrome is elsewhere.

Screenshots: `C:\Users\maizar\Desktop\codekita.id\dist\qa-errors`.
The checks are not a complete WCAG audit or a substitute for real assistive-device
testing and a staging-host HTTP check.

## Files added or modified by this task

Application and styling:

- `C:\Users\maizar\Desktop\codekita.id\src\pages\error-page.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\pages\not-found.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\styles\error-page.css`
- `C:\Users\maizar\Desktop\codekita.id\src\components\route-error-boundary.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\components\error-boundary.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\components\academy\shared.tsx` (same logo, translated label and router-independent recovery)
- `C:\Users\maizar\Desktop\codekita.id\src\app\routes.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\app\router.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\App.tsx`
- `C:\Users\maizar\Desktop\codekita.id\src\main.tsx`

Translations:

- `C:\Users\maizar\Desktop\codekita.id\src\lib\i18n.ts`
- `C:\Users\maizar\Desktop\codekita.id\src\locales\en\errors.json`
- `C:\Users\maizar\Desktop\codekita.id\src\locales\id\errors.json`
- `C:\Users\maizar\Desktop\codekita.id\src\locales\en\common.json`
- `C:\Users\maizar\Desktop\codekita.id\src\locales\id\common.json`

Hosting, generation and verification:

- `C:\Users\maizar\Desktop\codekita.id\public\.htaccess`
- `C:\Users\maizar\Desktop\codekita.id\public\status\403.html`
- `C:\Users\maizar\Desktop\codekita.id\public\status\404.html`
- `C:\Users\maizar\Desktop\codekita.id\public\status\500.html`
- `C:\Users\maizar\Desktop\codekita.id\public\status\503.html`
- `C:\Users\maizar\Desktop\codekita.id\scripts\generate-error-documents.mjs`
- `C:\Users\maizar\Desktop\codekita.id\scripts\error-documents.test.ts`
- `C:\Users\maizar\Desktop\codekita.id\scripts\error-browser-checks.mjs`
- `C:\Users\maizar\Desktop\codekita.id\scripts\static-browser-smoke.mjs` (existing checks preserved)
- `C:\Users\maizar\Desktop\codekita.id\src\pages\error-page.test.tsx`
- `C:\Users\maizar\Desktop\codekita.id\package.json` (scripts only)
- `C:\Users\maizar\Desktop\codekita.id\docs\error-pages-and-infinityfree.md`

## Documentation consulted

Official Apache custom-error documentation:
`https://httpd.apache.org/docs/2.4/custom-error.html`

React Router v6 route error handling:
`https://reactrouter.com/6.30.1/route/error-element`

Vite static deployment:
`https://vite.dev/guide/static-deploy.html`

InfinityFree staff guidance on building locally and server-side JavaScript:
`https://forum.infinityfree.com/t/my-website-doesnt-load-properly/87946`

InfinityFree staff confirmation that site ErrorDocument rules override defaults:
`https://forum.infinityfree.com/t/control-panel-forbidden-error/112846`