import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const project = fileURLToPath(new URL('../', import.meta.url));
const root = resolve(project, 'dist');
const entries = (await readdir(root)).sort();
assert.deepEqual(entries, ['.htaccess', 'assets', 'catalogue.json', 'favicon.jpg', 'index.html', 'status'].sort(), 'dist must contain only the frontend static release, never backend output, stale ZIPs, or nested releases');
assert.ok((await stat(join(root, 'index.html'))).isFile());
assert.ok((await stat(join(root, 'favicon.jpg'))).size > 0);
assert.ok((await stat(join(root, '.htaccess'))).isFile());
assert.deepEqual(await readFile(join(root, 'favicon.jpg')), await readFile(join(project, 'src/assets/img/icon.jpg')), 'Favicon must match the CodeKita source logo');
const rules = await readFile(join(root, '.htaccess'), 'utf8');
const directives = rules.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('#'));
assert.ok(directives.includes('Options -MultiViews'), 'MultiViews must not bypass SPA routing');
const cacheRules = rules.match(/<IfModule mod_headers\.c>([\s\S]*?)<\/IfModule>/)?.[1] ?? '';
assert.match(cacheRules, /<Files "index\.html">[\s\S]*?Header set Cache-Control "no-cache, must-revalidate"[\s\S]*?<\/Files>/, 'HTML entry point must revalidate after deployment');
assert.match(cacheRules, /<Files "catalogue\.json">[\s\S]*?Header set Cache-Control "no-cache, must-revalidate"[\s\S]*?<\/Files>/, 'Catalogue must not remain stale after deployment');
assert.ok(cacheRules.includes('<FilesMatch "-[A-Za-z0-9_-]{8,}'), 'Immutable caching must match Vite-style content-hashed assets');
assert.ok(cacheRules.includes('(?:js|css|jpg|jpeg|png|svg|webp|avif|gif|woff2?|ttf|ico)$">'), 'Immutable caching must be restricted to static asset file extensions');
assert.ok(cacheRules.includes('Header set Cache-Control "public, max-age=31536000, immutable"'), 'Hashed assets must use immutable long-term caching');
// Validate the active directives in order, not comments or the obsolete !-f/!-d form.
// Existing files/directories must exit before the guarded browser-page fallback.
const rewriteDirectives = directives.slice(0, directives.indexOf('<IfModule mod_headers.c>')).filter((line) => /^(?:Rewrite(?:Engine|Base|Cond|Rule)\b|<\/?IfModule\b)/.test(line));
assert.deepEqual(rewriteDirectives, [
  '<IfModule mod_rewrite.c>',
  'RewriteEngine On',
  'RewriteBase /',
  'RewriteCond %{REQUEST_FILENAME} -f [OR]',
  'RewriteCond %{REQUEST_FILENAME} -d',
  'RewriteRule ^ - [L]',
  'RewriteRule ^(?:api|assets|status)(?:/|$) - [L,NC]',
  'RewriteRule \\.[^/]+$ - [L]',
  'RewriteCond %{REQUEST_METHOD} ^(?:GET|HEAD)$',
  'RewriteCond %{HTTP_ACCEPT} text/html [NC]',
  'RewriteRule ^ /index.html [L]',
  '</IfModule>',
], 'Release rewrite directives must preserve files, API/assets, and guarded SPA fallback in order');
for (const code of [403, 404, 500, 503]) {
  assert.ok(directives.includes(`ErrorDocument ${code} /status/${code}.html`));
  assert.ok((await stat(join(root, 'status', `${code}.html`))).size > 0);
}
assert.deepEqual((await readdir(join(root, 'status'))).sort(), ['403.html', '404.html', '500.html', '503.html']);
const assets = await readdir(join(root, 'assets'));
assert.ok(assets.length > 0, 'Vite assets must exist');
const files = ['index.html', ...assets.map((file) => join('assets', file)), 'favicon.jpg', 'catalogue.json', ...[403, 404, 500, 503].map(code => `status/${code}.html`)];
const html = await readFile(join(root, 'index.html'), 'utf8');
for (const [, url] of html.matchAll(/(?:src|href)="(\/[^"?#]+)"/g)) {
  assert.ok((await stat(join(root, url.slice(1)))).isFile(), `Missing entry asset ${url}`);
}
assert.ok(assets.some(file => /^icon-.+\.jpg$/.test(file)), 'Imported CodeKita logo must be emitted');
for (const file of assets) assert.ok(/\.(?:js|css|jpg|jpeg|png|svg|webp|avif|gif|woff2?|ttf|ico)$/.test(file), `Unexpected asset: ${file}`);
const catalogue = JSON.parse(await readFile(join(root, 'catalogue.json'), 'utf8'));
assert.equal(catalogue.version, 1);
assert.equal(catalogue.source, 'repository-starter-curriculum');
assert.ok(Array.isArray(catalogue.paths) && catalogue.paths.length > 0);
const slugs = new Set(catalogue.paths.map(path => path.slug));
assert.equal(slugs.size, catalogue.paths.length);
for (const path of catalogue.paths) {
  assert.ok(['programming', 'cybersecurity', 'ai'].includes(path.academy));
  assert.equal(path.moduleCount, path.modules.length);
  assert.equal(path.lessonCount, path.modules.reduce((sum, module) => sum + module.lessons.length, 0));
  for (const prerequisite of path.prerequisites) assert.ok(slugs.has(prerequisite));
}
for (const path of catalogue.paths) {
  assert.ok(path.title && path.description, `Published path ${path.slug} must have real catalogue metadata`);
  assert.ok(path.modules.length > 0, `Published path ${path.slug} must contain modules`);
  for (const module of path.modules) {
    assert.ok(module.lessons.length > 0, `Published module ${module.slug} must contain lessons`);
    for (const lesson of module.lessons) {
      assert.ok(lesson.title && lesson.content.length >= 20, `Published lesson ${lesson.id} must contain authored instructional content`);
      assert.ok(lesson.objectives.length > 0, `Published lesson ${lesson.id} must contain learning objectives`);
      assert.ok(lesson.assessment.question && lesson.assessment.options.length >= 2, `Published lesson ${lesson.id} must contain a public assessment`);
    }
  }
}
assert.doesNotMatch(JSON.stringify(catalogue), /"(?:correctIndex|userId|password|completedLessonIds|createdAt|updatedAt)"/, 'Catalogue must not invent account state, dates, or publish assessment answers');
for (const file of files) {
  const content = await readFile(join(root, file));
  assert.ok(content.length > 0, `Empty release file: ${file}`);
  if (!/\.(?:js|json|html|css)$/.test(file)) continue;
  const js = content.toString('utf8');
  for (const forbidden of [/localhost:\d{2,5}/i, /127\.0\.0\.1/i, /DATABASE_URL/i, /SESSION_SECRET/i, /postgres(?:ql)?:\/\//i, /BEGIN [A-Z ]*PRIVATE KEY/i, /src\/server\//i, /node_modules\//i]) assert.doesNotMatch(js, forbidden, `Forbidden runtime or secret marker ${forbidden} in ${file}`);
}
console.log(`PASS: dist has ${files.length + 1} static files and ${catalogue.paths.length} public paths; assets, logo, catalogue, guarded SPA rewrite, status documents, and secret/runtime scans passed.`);