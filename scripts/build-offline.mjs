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
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
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
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Cached application shell and hashed assets stay on the same version until update is accepted.
    const cached = await cache.match(event.request, { ignoreSearch: false });
    if (cached) return cached;
    if (event.request.mode === 'navigate') return await cache.match('./index.html');
    return fetch(event.request);
  })());
});
`
await writeFile(join(directory, 'sw.js'), worker)
console.log(`Offline cache ${version}: ${assets.length} local files.`)
