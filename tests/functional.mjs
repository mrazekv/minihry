import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchChrome, sleep } from './chrome.mjs'

const base = process.env.TEST_BASE_URL || process.env.TEST_URL || 'http://127.0.0.1:4173/'
const chrome = await launchChrome()
const evaluate = expression => chrome.evaluate(expression)
const all = selector => evaluate(`Array.from(document.querySelectorAll(${JSON.stringify(selector)})).map(e=>{const c=e.cloneNode(true);c.querySelectorAll('[aria-hidden="true"]').forEach(n=>n.remove());return {text:c.textContent.trim(),id:e.dataset.itemId,step:e.dataset.stepId,match:e.dataset.matchId,side:e.dataset.side,disabled:e.disabled,pressed:e.getAttribute('aria-pressed')}})`)
const click = selector => evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw Error('Missing '+${JSON.stringify(selector)});if(e.disabled)throw Error('Disabled '+${JSON.stringify(selector)});e.click()})()`)
const button = async text => {
  await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>{const c=e.cloneNode(true);c.querySelectorAll('[aria-hidden="true"]').forEach(n=>n.remove());return c.textContent.trim()===${JSON.stringify(text)}});if(!e)throw Error('Missing button '+${JSON.stringify(text)});if(e.disabled)throw Error('Disabled button '+${JSON.stringify(text)});e.click()})()`)
  await sleep(40)
}
const waitFor = async (expression, description, timeout = 6000) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return
    await sleep(70)
  }
  throw new Error(`Timed out: ${description}`)
}
const navigate = async route => {
  await chrome.send('Page.navigate', { url: `${base}#/${route}` })
  await waitFor(`document.querySelector('main') && document.readyState === 'complete'`, route)
  await sleep(150)
}
const noOverflow = async name => {
  const dimensions = await evaluate(`({body:document.documentElement.scrollWidth,viewport:innerWidth})`)
  assert.ok(dimensions.body <= dimensions.viewport + 1, `${name}: horizontal overflow ${JSON.stringify(dimensions)}`)
}
const setup = async route => { await navigate(route); await button('Začít hrát') }
const select = async (selector, value) => {
  await click(`${selector} button[data-value="${value}"]`)
  await sleep(30)
  assert.equal(await evaluate(`document.querySelectorAll(${JSON.stringify(`${selector} button[aria-pressed="true"]`)}).length`), 1, 'exactly one option is selected')
  assert.equal(await evaluate(`document.querySelector(${JSON.stringify(`${selector} button[data-value="${value}"]`)}).getAttribute('aria-pressed')`), 'true')
}
const result = async () => {
  await waitFor(`!!document.querySelector('[data-testid="result"]')`, 'result screen')
  await button('Hrát znovu')
  assert.equal(await evaluate(`!!document.querySelector('[data-testid="result"]')`), false, 'restart clears result')
}

async function memory(pairs = 4, mode = 'pictures') {
  await navigate('pexeso')
  await select('#pairs', pairs)
  await select('#mode', mode)
  await button('Začít hrát')
  const cards = await all('.memory-card')
  assert.equal(cards.length, pairs * 2)
  const ids = [...new Set(cards.map(card => card.id))]
  await click(`.memory-card[data-item-id="${ids[0]}"]`)
  await click(`.memory-card[data-item-id="${ids[1]}"]`)
  await sleep(1100)
  for (const id of ids) {
    const selector = `.memory-card[data-item-id="${id}"]`
    await evaluate(`document.querySelectorAll(${JSON.stringify(selector)})[0].click()`)
    await sleep(20)
    await evaluate(`document.querySelectorAll(${JSON.stringify(selector)})[1].click()`)
    await sleep(130)
  }
  await result()
  console.log(`PASS pexeso ${pairs}/${mode}: mismatch, matching every pair, result, restart`)
}

async function quiz(mode = 'names', difficulty = 1) {
  await navigate('poznavacka')
  await select('#mode', mode)
  await select('#difficulty', difficulty)
  await button('Začít hrát')
  let rounds = 0
  while (!(await evaluate(`!!document.querySelector('[data-testid="result"]')`))) {
    assert.ok(rounds++ < 30, 'quiz must finish')
    const id = await evaluate(`document.querySelector('.question-art, .question-word').dataset.itemId`)
    if (rounds === 1) {
      await click(`.quiz-option:not([data-item-id="${id}"])`)
      assert.equal(await evaluate(`document.querySelector('.question-art, .question-word').dataset.itemId`), id, 'wrong answer keeps question')
    }
    await click(`.quiz-option[data-item-id="${id}"]`)
    await sleep(40)
    const labels = (await all('button')).map(item => item.text)
    await button(labels.includes('Další otázka') ? 'Další otázka' : 'Zobrazit výsledek')
  }
  await result()
  console.log(`PASS poznávačka ${mode}/${difficulty}: incorrect correction, ${rounds} questions, result, restart`)
}

const orderIds = async () => (await all('.order-list li[data-step-id]')).map(item => item.step)
async function dragOrder(pointerType = 'mouse', cancel = false) {
  await evaluate(`document.querySelector('.order-list li').scrollIntoView({block:'center'})`)
  await sleep(40)
  const before = await orderIds()
  const points = await evaluate(`(()=>{const rows=[...document.querySelectorAll('.order-list li')];const a=rows[0].querySelector('.drag-handle').getBoundingClientRect();const b=rows[2].getBoundingClientRect();return {start:{x:a.x+a.width/2,y:a.y+a.height/2},end:{x:a.x+a.width/2,y:b.y+b.height/2}}})()`)
  if (cancel === 'outside') points.end.x = await evaluate('innerWidth-2')
  const mouse = async (type, point, buttons) => chrome.send('Input.dispatchMouseEvent', { type, ...point, button: type === 'mouseMoved' ? 'none' : 'left', buttons, clickCount: 1 })
  const touch = async (type, point) => chrome.send('Input.dispatchTouchEvent', { type, touchPoints: point ? [{ ...point, id: 1, radiusX: 1, radiusY: 1, force: 1 }] : [] })
  if (pointerType === 'touch') await touch('touchStart', points.start)
  else { await mouse('mouseMoved', points.start, 0); await mouse('mousePressed', points.start, 1) }
  for (let step = 1; step <= 8; step++) {
    const point = { x: points.start.x + (points.end.x - points.start.x) * step / 8, y: points.start.y + (points.end.y - points.start.y) * step / 8 }
    if (pointerType === 'touch') await touch('touchMove', point)
    else await mouse('mouseMoved', point, 1)
    await sleep(35)
  }
  if (cancel === 'escape') {
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
    await chrome.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
  }
  if (pointerType === 'touch') await touch(cancel === true ? 'touchCancel' : 'touchEnd')
  else await mouse('mouseReleased', points.end, 0)
  await sleep(60)
  if (cancel) assert.deepEqual(await orderIds(), before, 'cancelled/outside drag preserves original order')
  else {
    const expected = [...before]
    expected.splice(2, 0, expected.splice(0, 1)[0])
    assert.deepEqual(await orderIds(), expected, `${pointerType} drag moves first card to third position`)
  }
  assert.equal(await evaluate(`document.querySelectorAll('.dragging').length`), 0, 'drag state clears')
  console.log(`PASS ordering ${pointerType}: ${cancel === 'outside' ? 'drop outside cancels' : cancel === 'escape' ? 'Escape cancels' : cancel ? 'pointercancel rollback' : 'real pointer drag'}`)
}

async function ordering(route, expected, difficulty = 0) {
  await navigate(route)
  await select('#difficulty', difficulty)
  await button('Začít hrát')
  if (route === 'rok') {
    const colors = { 'advent-sunday': 'violet', 'christmas-day': 'white', epiphany: 'white', baptism: 'white', 'ash-wednesday': 'violet', 'palm-sunday': 'red', 'maundy-thursday': 'white', 'good-friday': 'red', 'easter-sunday': 'white', ascension: 'white', pentecost: 'red', trinity: 'white', 'corpus-christi': 'white', assumption: 'white', 'all-saints': 'white', 'christ-king': 'white', advent: 'violet', christmas: 'white', 'ordinary-first': 'green', lent: 'violet', triduum: 'triduum', easter: 'white', 'ordinary-second': 'green' }
    for (const id of expected) assert.ok(await evaluate(`document.querySelector(${JSON.stringify(`li[data-step-id="${id}"]`)}).classList.contains(${JSON.stringify(`season-${colors[id]}`)})`), `${id} uses its liturgical color`)
  }
  await button('Nápověda')
  assert.ok(await evaluate(`!!document.querySelector('.hint-panel')`))
  await button('Skrýt nápovědu')
  await button('Zkontrolovat pořadí')
  assert.equal(await evaluate(`!!document.querySelector('[data-testid="result"]')`), false, 'initial order is intentionally shuffled')
  await dragOrder('mouse')
  await chrome.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 })
  await dragOrder('touch')
  await dragOrder('touch', true)
  await dragOrder('touch', 'outside')
  await dragOrder('touch', 'escape')
  await chrome.send('Emulation.setTouchEmulationEnabled', { enabled: false })
  for (let index = 0; index < expected.length; index++) {
    let current = (await all('.order-list li[data-step-id]')).findIndex(item => item.step === expected[index])
    assert.ok(current >= 0, `Missing expected step ${expected[index]}`)
    while (current > index) {
      await click(`.order-list li[data-step-id="${expected[index]}"] button[aria-label$="nahoru"]`)
      await sleep(20)
      current--
    }
  }
  await button('Zkontrolovat pořadí')
  await result()
  console.log(`PASS ${route}/${difficulty}: hint, incorrect check, move controls, correct ordering, result, restart`)
}

async function latin(difficulty = 1) {
  await navigate('latina')
  await select('#difficulty', difficulty)
  await button('Začít hrát')
  const choices = await all('.latin-choice[data-side="latin"]')
  assert.ok(choices.length >= 3)
  await click(`.latin-choice[data-side="latin"][data-match-id="${choices[0].match}"]`)
  await click(`.latin-choice[data-side="czech"][data-match-id="${choices[1].match}"]`)
  await sleep(1000)
  for (const choice of choices) {
    await click(`.latin-choice[data-side="latin"][data-match-id="${choice.match}"]`)
    await click(`.latin-choice[data-side="czech"][data-match-id="${choice.match}"]`)
    await sleep(80)
  }
  await result()
  console.log(`PASS latina/${difficulty}: mismatch, all matches, result, restart`)
}

async function runner(smokeOnly = false) {
  await setup('cesta')
  assert.ok(await evaluate(`!!document.querySelector('canvas')`))
  await button('Skok')
  await button('Pozastavit')
  assert.ok((await all('button')).some(item => item.text === 'Pokračovat'))
  await sleep(500)
  assert.equal(await evaluate(`!!document.querySelector('[data-testid="result"]')`), false)
  await button('Pokračovat')
  if (smokeOnly) {
    console.log('PASS cesta smoke: canvas, jump, pause, continue')
    return
  }
  await waitFor(`!!document.querySelector('[data-testid="result"]')`, 'runner finishes after collisions', 60000)
  await result()
  console.log('PASS cesta: start, jump, pause, continue, collisions, result, restart')
  // Play using only the rendered puddles, as a player would, without reading game state.
  await evaluate(`window.__minihryAutoJump=setInterval(()=>{const c=document.querySelector('canvas');if(!c)return;const p=c.getContext('2d').getImageData(165,245,1,1).data;if(p[0]===126&&p[1]===175&&p[2]===180)document.querySelector('.jump-button').click()},30)`)
  try {
    await waitFor(`!!document.querySelector('[data-testid="result"]')`, 'runner can be won by jumping over puddles', 50000)
    assert.equal(await evaluate(`document.querySelector('#result-title').textContent`), 'Jsi u kostela!', 'runner victory')
  } finally {
    await evaluate(`clearInterval(window.__minihryAutoJump)`)
  }
  console.log('PASS cesta: rendered-puddle controls reach the church and victory')
}

const celebrationOrder = ['advent-sunday', 'christmas-day', 'epiphany', 'baptism', 'ash-wednesday', 'palm-sunday', 'maundy-thursday', 'good-friday', 'easter-sunday', 'ascension', 'pentecost', 'trinity', 'corpus-christi', 'assumption', 'all-saints', 'christ-king']

try {
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  if (process.env.TEST_YEAR_LEVEL_ONLY === '1') {
    await ordering('rok', celebrationOrder, 2)
    await noOverflow('desktop celebrations')
    await navigate('')
    await chrome.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
    await ordering('rok', celebrationOrder, 2)
    await noOverflow('mobile celebrations')
    assert.equal(chrome.errors.length, 0, JSON.stringify(chrome.errors))
    console.log('PASS third year level: 16 celebrations, colors, mouse/touch sorting, results and restart on desktop/mobile')
  } else {
  await navigate('')
  assert.ok((await all('a')).length >= 6, 'home contains game links')
  await noOverflow('desktop home')
  await memory()
  await quiz()
  // IDs are the public content identifiers, not access to Vue internals.
  await ordering('mse', ['entrance', 'word', 'eucharist', 'dismissal'])
  await ordering('rok', ['advent', 'christmas', 'ordinary-first', 'lent', 'easter', 'ordinary-second'])
  await latin()
  await runner(process.env.TEST_CHANGES_ONLY === '1')
  await chrome.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await memory(10, 'names')
  await quiz('pictures', 3)
  await ordering('mse', ['first-reading', 'psalm', 'second-reading', 'acclamation', 'gospel', 'homily', 'creed', 'intercessions'], 2)
  await ordering('rok', ['advent', 'christmas', 'ordinary-first', 'lent', 'triduum', 'easter', 'ordinary-second'], 1)
  await navigate('')
  await ordering('rok', celebrationOrder, 2)
  await latin(3)
  for (const route of ['', 'pexeso', 'poznavacka', 'mse', 'rok', 'latina', 'cesta', 'slovnicek']) {
    await navigate(route)
    await noOverflow(`mobile ${route || 'home'}`)
    if (route && route !== 'slovnicek') {
      await button('Začít hrát')
      await noOverflow(`mobile active ${route}`)
    }
  }
  const screenshot = await chrome.send('Page.captureScreenshot', { format: 'png' })
  await writeFile('/tmp/minihry-mobile-test.png', Buffer.from(screenshot.data, 'base64'))
  await evaluate(`(()=>{const e=document.querySelector('#item-search');e.value='KALICH';e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await sleep(60)
  const filteredNames = (await all('.specimen h2')).map(item => item.text.toLocaleLowerCase('cs'))
  assert.ok(filteredNames.length > 0 && filteredNames.every(name => name.includes('kalich')), 'dictionary search ignores case')
  await evaluate(`(()=>{const e=document.querySelector('#item-search');e.value='nenalezenypredmet';e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await sleep(60)
  assert.ok(await evaluate(`!!document.querySelector('.empty-state')`), 'dictionary empty state')
  assert.equal(chrome.errors.length, 0, JSON.stringify(chrome.errors))
  console.log('PASS mobile 390px: direct links and all game screens, no overflow or browser errors')
  await navigate('pexeso')
  await waitFor(`!!document.querySelector('#pairs')`, 'navigate before offline reload')
  await waitFor(`!!navigator.serviceWorker?.controller`, 'production service worker controls page', 10000)
  await chrome.send('Network.enable')
  await chrome.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await chrome.send('Page.reload', { ignoreCache: true })
  await waitFor(`document.querySelector('#pairs') && document.readyState === 'complete'`, 'offline reload renders game')
  await button('Začít hrát')
  assert.equal((await all('.memory-card')).length, 8, 'offline game plays')
  await chrome.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  console.log('PASS offline: production reload and playable pexeso without network')
  }
} finally {
  await chrome.close()
}
