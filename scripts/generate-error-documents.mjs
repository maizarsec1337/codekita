import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ArrowLeft, Compass, Info, Languages, LockKeyhole, RotateCcw, ServerCrash, ShieldCheck, Terminal, Wrench } from "lucide-react";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFile(resolve(root, path), "utf8");
const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const icon = (component, size = 16, strokeWidth = 1.5) => renderToStaticMarkup(createElement(component, { size, strokeWidth, "aria-hidden": true }));

/** Build-time reuse only: the HTML has no React, i18next, API or asset dependency.
 * Language enhancement switches pre-rendered strings, not a second dictionary. */
export async function generateErrorDocuments({ check = false } = {}) {
  const [tokensSource, styles, en, id, enCommon, idCommon] = await Promise.all([
    read("src/styles/legacy-base.css"), read("src/styles/error-page.css"),
    read("src/locales/en/errors.json").then(JSON.parse), read("src/locales/id/errors.json").then(JSON.parse),
    read("src/locales/en/common.json").then(JSON.parse), read("src/locales/id/common.json").then(JSON.parse),
  ]);
  const dictionaries = { en: { ...enCommon, ...en }, id: { ...idCommon, ...id } };
  const text = (key) => `<span data-language="id" lang="id">${escape(dictionaries.id[key])}</span><span data-language="en" lang="en">${escape(dictionaries.en[key])}</span>`;
  const label = (key) => `aria-label="${escape(dictionaries.id[key])}" data-label-id="${escape(dictionaries.id[key])}" data-label-en="${escape(dictionaries.en[key])}"`;
  const tokens = [...tokensSource.matchAll(/--ck-[\w-]+:\s*[\d ]+;/g)].map(([value]) => value).join("\n");
  if (!tokens.includes("--ck-primary:")) throw new Error("CodeKita design tokens were not found");
  const extraStyles = `
    :root { color-scheme: dark; ${tokens} }
    body { margin: 0; } a { color: inherit; } svg { flex-shrink: 0; }
    [hidden], html:lang(id) [data-language="en"], html:lang(en) [data-language="id"] { display: none !important; }
    .ck-static-logo { display: inline-flex; align-items: center; flex-shrink: 0; gap: 10px; text-decoration: none; }
    .ck-static-mark { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 8px; background: rgb(var(--ck-primary)); color: rgb(var(--ck-primary-foreground)); }
    .ck-static-wordmark { font-size: 20px; font-weight: 700; letter-spacing: -.025em; }
    .ck-static-wordmark b { color: rgb(var(--ck-primary)); }
    .ck-static-academy { margin-left: 8px; padding: 2px 6px; border: 1px solid rgb(var(--ck-border)); border-radius: 4px; font: 9px "JetBrains Mono", ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: rgb(var(--ck-text-secondary)); }
    .ck-static-language { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; padding: 0 8px; border: 1px solid rgb(var(--ck-border)); border-radius: 8px; background: rgb(var(--ck-surface)); }
    .ck-static-language select { max-width: 128px; background: transparent; color: inherit; border: 0; padding: 8px 0; font: 12px Inter, system-ui, sans-serif; }
    .ck-static-primary { background: rgb(var(--ck-primary)); color: rgb(var(--ck-primary-foreground)); }
    .ck-static-primary:hover { background: rgb(var(--ck-primary) / .9); }
    .ck-static-retry { background: transparent; color: inherit; border: 1px solid rgb(var(--ck-border)); font-family: inherit; cursor: pointer; }
    .ck-static-retry:hover { background: rgb(var(--ck-surface-elevated)); }
    .ck-static-skip { position: absolute; left: 16px; top: -100px; z-index: 10; padding: 12px; background: rgb(var(--ck-primary)); color: rgb(var(--ck-primary-foreground)); }
    .ck-static-skip:focus { top: 12px; }
    .ck-static-noscript { width: min(100%, 1120px); margin: 0 auto; padding: 24px; border-top: 1px solid rgb(var(--ck-border)); }
    .ck-static-noscript p { color: rgb(var(--ck-text-secondary)); line-height: 1.8; }
    @media (max-width: 639px) { .ck-static-academy { display: none; } }
  `;
  // Preference key, supported languages and fallback intentionally match src/lib/i18n.ts.
  const enhancement = `
    (() => {
      const select = document.getElementById('error-language');
      const normalize = value => /^(en|id)(-|$)/i.test(value || '') ? value.slice(0, 2).toLowerCase() : null;
      let saved;
      try { saved = localStorage.getItem('codekita-language'); document.documentElement.dataset.reducedMotion = localStorage.getItem('ck-reduced-motion') || 'false'; } catch { /* Private storage may be unavailable. */ }
      const language = normalize(saved) || (navigator.languages || [navigator.language]).map(normalize).find(Boolean) || 'id';
      function apply(value) {
        document.documentElement.lang = value;
        document.querySelectorAll('[data-label-id]').forEach(element => {
          const translated = element.getAttribute('data-label-' + value);
          if (element.tagName === 'TITLE') element.textContent = translated;
          else element.setAttribute('aria-label', translated);
        });
        select.value = value;
      }
      apply(language);
      document.getElementById('error-language-control').hidden = false;
      select.addEventListener('change', () => {
        apply(select.value);
        try { localStorage.setItem('codekita-language', select.value); } catch { /* Switching still works in memory. */ }
      });
      const retry = document.getElementById('error-retry');
      if (retry && !/^\\/status\\/(500|503)\\.html$/.test(location.pathname)) {
        retry.hidden = false;
        // A new GET navigation never automatically resubmits a failed POST.
        retry.addEventListener('click', () => { retry.disabled = true; location.replace(location.href); });
      }
    })();
  `;
  for (const [code, illustration] of [[403, ShieldCheck], [404, Compass], [500, ServerCrash], [503, Wrench]]) {
    const title = (language) => dictionaries[language].documentTitle.replace("{{code}}", String(code)).replace("{{title}}", dictionaries[language][`${code}.label`]);
    const html = `<!doctype html>
<!-- Generated by scripts/generate-error-documents.mjs. Edit the source tokens/translations, not this file. -->
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title data-label-id="${escape(title("id"))}" data-label-en="${escape(title("en"))}">${escape(title("id"))}</title>
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(renderToStaticMarkup(createElement(Terminal, { color: `rgb(${tokensSource.match(/--ck-primary:\s*([\d ]+);/)[1].trim()})` })))}">
  <style>${extraStyles}\n${styles}</style>
</head>
<body class="ck-error">
  <a href="#error-content" class="ck-static-skip">${text("skip")}</a>
  <header class="ck-error-header">
    <a class="ck-static-logo" href="/" ${label("logoHome")}><span class="ck-static-mark">${icon(Terminal, 23, 2.5)}</span><span class="ck-static-wordmark">code<b>kita</b><span class="ck-static-academy">academy</span></span></a>
    <label class="ck-static-language" id="error-language-control" hidden>${icon(Languages)}<select id="error-language" ${label("language")}><option value="id">${escape(idCommon.indonesian)}</option><option value="en">${escape(enCommon.english)}</option></select></label>
  </header>
  <main id="error-content" class="ck-error-main" aria-labelledby="error-heading" tabindex="-1">
    <div class="ck-error-layout">
      <div class="ck-error-copy">
        <p class="ck-error-kicker">${text(`${code}.label`)}</p>
        <h1 id="error-heading">${text(`${code}.title`)}</h1>
        <p class="ck-error-description">${text(`${code}.description`)}</p>
        <nav class="ck-error-actions" ${label("recovery")}><a class="ck-error-action ck-static-primary" href="/">${icon(ArrowLeft)}${text("home")}</a>${code >= 500 ? `<button id="error-retry" type="button" class="ck-error-action ck-static-retry" hidden>${icon(RotateCcw)}${text("retry")}</button>` : ""}</nav>
        <p class="ck-error-hint">${icon(Info, 15)}<span>${text(`${code}.hint`)}</span></p>
      </div>
      <div class="ck-error-panel">
        <div class="ck-error-panel-bar" aria-hidden="true"><span class="ck-error-panel-dots"><i></i><i></i><i></i></span><span>codekita / academy</span>${icon(LockKeyhole, 13)}</div>
        <div class="ck-error-art"><div class="ck-error-symbol" role="img" ${label(`${code}.illustration`)}>${icon(illustration, 34)}</div><p class="ck-error-code">${code}</p></div>
        <div class="ck-error-panel-foot">${text(`${code}.label`)}</div>
      </div>
    </div>
  </main>
  <noscript><section class="ck-static-noscript" lang="en" aria-label="English"><h2>${escape(en[`${code}.title`])}</h2><p>${escape(en[`${code}.description`])}</p><p>${escape(en[`${code}.hint`])}</p><a href="/">${escape(en.home)}</a></section></noscript>
  <footer class="ck-error-footer"><p>CodeKita.id</p><p>${text("footer")}</p></footer>
  <script>${enhancement}</script>
</body>
</html>
`;
    const destination = resolve(root, `public/status/${code}.html`);
    if (check) {
      if (await readFile(destination, "utf8") !== html) throw new Error(`Regenerate stale error document: ${destination}`);
    } else {
      await mkdir(resolve(root, "public/status"), { recursive: true });
      await writeFile(destination, html, "utf8");
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await generateErrorDocuments({ check: process.argv.includes("--check") });
  console.log("CodeKita standalone error documents: 403, 404, 500, 503 ready.");
}