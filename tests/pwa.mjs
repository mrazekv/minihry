import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { appendFile, cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve, sep } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { launchChrome, sleep } from './chrome.mjs'

// Isolate the deployment and mutate only this copy to exercise a real SW update.
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const temporary = await mkdtemp(join(tmpdir(), 'minihry-pwa-'))
const directory = join(temporary, 'dist')
const contentTypes = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webmanifest':'application/manifest+json' }
let browser
const server = createServer(async (request, response) => {
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    if (!path.startsWith('/minihry/')) { response.writeHead(404).end(); return }
    const file = resolve(directory, path.slice('/minihry/'.length) || 'index.html')
    if (!file.startsWith(directory + sep)) { response.writeHead(403).end(); return }
    const data = await readFile(file)
    const extension = file.slice(file.lastIndexOf('.'))
    response.writeHead(200, { 'Content-Type':contentTypes[extension] || 'application/octet-stream', 'Cache-Control':'no-store' }).end(data)
  } catch { response.writeHead(404).end() }
})
async function until(expression, message) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await browser.evaluate(expression)) return
    await sleep(100)
  }
  assert.fail(message)
}
try {
  await cp(resolve(process.env.PWA_BUILD_DIR || join(root, 'dist')), directory, { recursive:true })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}/minihry/`
  browser = await launchChrome()
  await browser.send('Network.enable')
  await browser.send('Page.navigate', { url:base })
  await until('Boolean(document.querySelector(".games-grid"))', 'Home must load under /minihry/')
  await browser.evaluate('navigator.serviceWorker.ready.then(r=>r.scope)')
  await until('Boolean(navigator.serviceWorker.controller)', 'First service worker must control the page')
  await sleep(150)
  assert.equal(await browser.evaluate('Boolean(document.querySelector(".update-banner"))'),false,'First install must not offer an update')
  const cached = await browser.evaluate(`(async()=>{
    const registration=await navigator.serviceWorker.ready;
    const manifest=await(await fetch('manifest.webmanifest')).json();
    const names=await caches.keys();
    const cache=await caches.open(names.find(n=>n.startsWith('minihry:')));
    return { scope:registration.scope,manifest,names,urls:(await cache.keys()).map(r=>r.url) };
  })()`)
  assert.equal(cached.scope,base)
  assert.equal(new URL(cached.manifest.start_url,base).href,base)
  assert.equal(new URL(cached.manifest.scope,base).href,base)
  assert.ok(cached.urls.every(url=>url.startsWith(base)))
  for(const icon of cached.manifest.icons) assert.ok(cached.urls.includes(new URL(icon.src,base).href),'Manifest icon must be available offline')

  await browser.evaluate('window.__pwaReloadMarker=true')
  await browser.send('Network.emulateNetworkConditions',{ offline:true,latency:0,downloadThroughput:0,uploadThroughput:0 })
  await browser.send('Page.reload',{ ignoreCache:true })
  await until('!window.__pwaReloadMarker && document.querySelectorAll(".game-card").length===6','Root must load as a new document while offline')
  assert.equal(await browser.evaluate('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)'),true)
  await browser.send('Network.emulateNetworkConditions',{ offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1 })
  await browser.evaluate(`document.querySelector('a[href="#/pexeso"]').click()`)
  await until('Boolean(document.querySelector(".setup-panel"))','Memory setup must load')
  await browser.evaluate('document.querySelector(".setup-panel button[type=submit]").click()')
  await until('Boolean(document.querySelector(".memory-grid"))','Memory game must start')
  await browser.evaluate('window.__pwaReloadMarker=true')

  await appendFile(join(directory,'index.html'),'\n<!-- PWA update integration test -->\n')
  await promisify(execFile)(process.execPath,[join(root,'scripts/build-offline.mjs')],{ cwd:temporary })
  await browser.evaluate('navigator.serviceWorker.getRegistration().then(r=>r.update()).then(()=>true)')
  await until('Boolean(document.querySelector(".update-banner"))','Second version must offer an update')
  assert.equal(await browser.evaluate('Boolean(document.querySelector(".update-banner button"))'),false,'No update button during an active game')
  assert.equal(await browser.evaluate('Boolean(document.querySelector(".memory-grid")) && window.__pwaReloadMarker===true'),true,'Waiting update must preserve active game')
  await browser.evaluate('document.querySelector(".back-link").click()')
  await until('Boolean(document.querySelector(".games-grid")) && Boolean(document.querySelector(".update-banner button"))','Home must allow the update')
  await browser.evaluate('document.querySelector(".update-banner button").click()')
  await until('!window.__pwaReloadMarker && document.querySelectorAll(".game-card").length===6','Accepting update must reload the new document')
  assert.equal(await browser.evaluate('Boolean(document.querySelector(".update-banner"))'),false)
  const updatedNames = await browser.evaluate('caches.keys()')
  assert.ok(updatedNames.some(name=>!cached.names.includes(name)),'Updated worker must activate a new versioned cache')
  assert.ok(cached.names.every(name=>!updatedNames.includes(name)),'Old application cache is cleaned after activation')
  assert.deepEqual(browser.errors,[],'No browser errors during install, offline load or update')
  console.log('PWA integration passed: subdirectory, manifest icons, first install, offline root reload, waiting update, active-game protection and explicit activation.')
} finally {
  if(browser) await browser.close()
  await new Promise(resolve=>server.close(resolve))
  await rm(temporary,{ recursive:true,force:true })
}
