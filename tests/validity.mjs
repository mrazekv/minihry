import assert from 'node:assert/strict'
import { launchChrome, sleep } from './chrome.mjs'

// Run against the built app, optionally under a GitHub Pages-style subdirectory.
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/'
const browser = await launchChrome()
const findings = []
try {
  await browser.send('Network.enable')
  await browser.send('Page.navigate', { url: base })
  for (let i = 0; i < 50; i++) {
    if (await browser.evaluate('Boolean(document.querySelector("main"))')) break
    await sleep(100)
  }
  await browser.evaluate('document.activeElement?.blur(); window.scrollTo(0,0)')
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 })
  assert.equal(await browser.evaluate('document.activeElement?.classList.contains("skip-link")'), true, 'First keyboard stop is the skip-to-content link')
  await browser.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await browser.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 })
  await sleep(100)
  assert.equal(await browser.evaluate('document.activeElement?.tagName'), 'MAIN', 'Skip link moves keyboard focus into main content')
  const routes = await browser.evaluate(`Array.from(new Set(['', ...Array.from(document.querySelectorAll('a[href]')).map(a=>a.getAttribute('href')).filter(h=>h.startsWith('#/') && h!=='#/')]))`)
  assert.ok(routes.length > 1, 'Home must link to actual application routes')
  for (const route of routes) {
    await browser.send('Page.navigate', { url: new URL(route || '#/', base).href })
    await sleep(150)
    if (route) assert.equal(await browser.evaluate('document.activeElement?.tagName'), 'H1', `${route}: route navigation focuses the heading`)
    for (const width of [320, 390, 768, 1280]) {
      await browser.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
      await sleep(60)
      const dom = await browser.evaluate(`(() => {
        const ids = Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
        const interactive = 'a[href],button,input,select,textarea';
        return {
          lang:document.documentElement.lang,
          mainCount:document.querySelectorAll('main').length,
          h1Count:document.querySelectorAll('h1').length,
          overflow:document.documentElement.scrollWidth > innerWidth + 1,
          duplicateIds:ids.filter((id,i)=>ids.indexOf(id)!==i),
          brokenReferences:Array.from(document.querySelectorAll('[aria-labelledby],[aria-describedby]')).flatMap(e=>['aria-labelledby','aria-describedby'].flatMap(a=>(e.getAttribute(a)||'').split(/\\s+/).filter(Boolean).filter(id=>!document.getElementById(id)))),
          missingImages:Array.from(document.images).filter(i=>!i.hasAttribute('alt') || !i.complete || !i.naturalWidth).map(i=>i.src),
          missingSymbols:Array.from(document.querySelectorAll('use')).map(e=>e.getAttribute('href')).filter(h=>h?.startsWith('#')&&!document.getElementById(h.slice(1))),
          nestedInteractive:Array.from(document.querySelectorAll(interactive)).filter(e=>e.querySelector(interactive)).map(e=>e.outerHTML.slice(0,160)),
          externalResources:performance.getEntriesByType('resource').filter(r=>new URL(r.name).origin!==location.origin).map(r=>r.name)
        };
      })()`)
      assert.equal(dom.lang, 'cs', `${route}: Czech document language`)
      assert.equal(dom.mainCount, 1, `${route}: one main landmark`)
      assert.equal(dom.h1Count, 1, `${route}: one page heading`)
      for (const key of ['duplicateIds','brokenReferences','missingImages','missingSymbols','nestedInteractive','externalResources']) {
        if (dom[key].length) findings.push({ route, width, check: key, value: dom[key] })
      }
      if (dom.overflow) findings.push({ route, width, check: 'horizontal overflow' })
    }
    const tree = await browser.send('Accessibility.getFullAXTree')
    const unnamed = tree.nodes.filter(n=>!n.ignored && ['button','link','combobox','textbox','checkbox','radio','slider'].includes(n.role?.value) && !n.name?.value?.trim())
    if (unnamed.length) findings.push({ route, check: 'unnamed controls', nodes: unnamed.map(n=>({ role:n.role.value, node:n.backendDOMNodeId })) })
    const choices = await browser.evaluate(`Array.from(document.querySelectorAll('.choice-field')).map(field=>({
      legend:field.querySelector('legend')?.textContent?.trim(),
      selected:field.querySelectorAll('.choice-button[aria-pressed="true"]').length,
      allButtons:Array.from(field.querySelectorAll('.choice-button')).every(button=>button.type==='button' && button.hasAttribute('aria-pressed'))
    }))`)
    assert.equal(await browser.evaluate('document.querySelectorAll("select").length'),0,`${route}: settings use visible choices`)
    for (const choice of choices) {
      assert.ok(choice.legend,`${route}: choice group has a legend`)
      assert.equal(choice.selected,1,`${route}: exactly one selected choice per group`)
      assert.equal(choice.allButtons,true,`${route}: choices expose toggle state without submitting the form`)
    }
    if (route === '#/mse') {
      // Longest option plus drag handles and arrows must fit a small phone.
      await browser.send('Emulation.setDeviceMetricsOverride',{ width:320,height:900,deviceScaleFactor:1,mobile:false })
      await browser.evaluate(`document.querySelector('.choice-field .choice-button:last-child').click(); document.querySelector('.setup-panel button[type=submit]').click()`)
      await sleep(100)
      const active = await browser.evaluate(`(() => {
        const rows=Array.from(document.querySelectorAll('.order-list li'));
        return {
          rows:rows.length,
          overflow:document.documentElement.scrollWidth>innerWidth+1,
          clipped:rows.filter(row=>row.scrollWidth>row.clientWidth+1).map(row=>row.dataset.stepId),
          controlsFit:rows.every(row=>Array.from(row.querySelectorAll('button')).every(button=>{
            const rect=button.getBoundingClientRect(),bounds=row.getBoundingClientRect();
            return rect.left>=bounds.left && rect.right<=bounds.right && rect.height>=24 && rect.width>=24;
          })),
          handlesNamed:rows.every(row=>row.querySelector('.drag-handle')?.getAttribute('aria-label')?.trim()),
          described:rows.every(row=>document.getElementById(row.querySelector('.drag-handle')?.getAttribute('aria-describedby'))),
          colorsText:rows.every(row=>row.querySelector('.season-label')?.textContent?.trim())
        };
      })()`)
      assert.ok(active.rows>=7,`${route}: detailed ordering is active`)
      assert.equal(active.overflow,false,`${route}: active order has no viewport overflow at 320px`)
      assert.deepEqual(active.clipped,[],`${route}: all ordering row contents fit at 320px`)
      assert.equal(active.controlsFit,true,`${route}: drag and arrow targets fit and meet 24px minimum`)
      assert.equal(active.handlesNamed && active.described,true,`${route}: drag handles have names and instructions`)
      await browser.evaluate(`document.querySelector('.drag-handle').focus()`)
      const before = await browser.evaluate('document.querySelector(".order-list li").dataset.stepId')
      await browser.send('Input.dispatchKeyEvent',{ type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40 })
      await browser.send('Input.dispatchKeyEvent',{ type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40 })
      await sleep(80)
      assert.equal(await browser.evaluate('document.querySelectorAll(".order-list li")[1].dataset.stepId'),before,`${route}: keyboard can reorder from the drag handle`)
      assert.equal(await browser.evaluate('document.activeElement?.classList.contains("drag-handle")'),true,`${route}: keyboard focus remains on the same drag handle`)
      await browser.send('Input.dispatchKeyEvent',{ type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40 })
      await browser.send('Input.dispatchKeyEvent',{ type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40 })
      await sleep(80)
      assert.equal(await browser.evaluate('document.querySelectorAll(".order-list li")[2].dataset.stepId'),before,`${route}: a second keyboard move works without refocusing`)
      assert.equal(await browser.evaluate('document.activeElement?.classList.contains("drag-handle")'),true,`${route}: repeated moves preserve handle focus`)
    }
  }
  assert.deepEqual(findings, [], 'DOM, accessibility names, mobile layout and local resource audit')
  assert.deepEqual(browser.errors, [], 'No browser runtime errors')
  console.log(`Validity audit passed: ${routes.length} routes at 320, 390, 768 and 1280 px; named controls; visible choices; active ordering keyboard/320px layout; local resources.`)
} finally {
  await browser.close()
}
