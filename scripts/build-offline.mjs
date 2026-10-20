import { readdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
const directory = 'dist'
async function walk(path) {
  const files = []
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const full = join(path, entry.name)
    if (entry.isDirectory()) files.push(...await walk(full))
    else if (entry.name !== 'sw.js') files.push(full)
  }
  return files
}
const files = (await walk(directory)).sort()
const hash = createHash('sha256')
for (const file of files) { hash.update(file); hash.update(await readFile(file)) }
const version = hash.digest('hex').slice(0, 16)
const assets = files.map(file => './' + file.slice(directory.length + 1))
const worker = `// Generated from all production assets. Do not edit dist/sw.js.
const PREFIX = 'minihry:' + self.registration.scope + ':';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify(assets)};
const ROOT = new URL(self.registration.scope);
const SHELL = new URL('index.html', ROOT).href;
const KNOWN_FILES = new Set(FILES.map(file => new URL(file, ROOT).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES.map(file => new Request(new URL(file, ROOT), { cache: 'reload' })))));
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name);
    await self.clients.claim();
  })());
});
async function readCache(cache, key) {
  try { return await cache?.match(key); } catch { return undefined; }
}
function unavailable(documentRequest) {
  const body = documentRequest
    ? '<!doctype html><html lang="cs"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>miniHry — bez připojení</title><main><h1>Teď se nemůžeme připojit</h1><p>Soubory pro hraní nejsou v tomto zařízení úplně uložené. Připoj se k internetu a obnov stránku.</p><a href="' + ROOT.href + '">Zkusit znovu</a></main></html>'
    : 'Soubor není dostupný offline. Připoj se k internetu a zkus to znovu.';
  return new Response(body, { status: 503, statusText: 'Service Unavailable', headers: {
    'Content-Type': documentRequest ? 'text/html; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store'
  }});
}
async function respond(request, url) {
  // The app root (also fetched by browser/PWA checks) and index.html are the same shell.
  // Resolve against SW scope explicitly, independent of request mode, fragment or query.
  const shellRequest = url.pathname === ROOT.pathname || url.pathname === new URL(SHELL).pathname;
  const key = shellRequest ? SHELL : request;
  let cache;
  try { cache = await caches.open(CACHE); } catch { /* Storage may be unavailable or evicted. */ }
  const cached = await readCache(cache, key);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    // Repair missing precached entries online, without caching arbitrary URLs or errors.
    if (response.ok && cache && (shellRequest || KNOWN_FILES.has(url.href))) {
      try { await cache.put(key, response.clone()); } catch { /* Quota must not block the response. */ }
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      const shell = await readCache(cache, SHELL);
      if (shell) return shell;
    }
    // Always settle respondWith with a Response, even when both cache and network fail.
    return unavailable(shellRequest || request.mode === 'navigate');
  }
}
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  event.respondWith(respond(event.request, url));
});

`
await writeFile(join(directory, 'sw.js'), worker)
console.log(`Offline cache ${version}: ${assets.length} local files.`)
