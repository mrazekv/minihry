import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchChrome, sleep } from './chrome.mjs'

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/'
const browser = await launchChrome()
const evaluate = value => browser.evaluate(value)
async function navigate(route) {
  await browser.send('Page.navigate', { url: `${base}#/${route}` })
  for (let i=0; i<50 && !await evaluate('document.readyState === "complete" && !!document.querySelector("main h1")'); i++) await sleep(50)
  await sleep(100)
}
async function layout(context) {
  const result = await evaluate(`(() => ({
    overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
    clipped:Array.from(document.querySelectorAll('button:not(.church-spot):not(.year-slot),.church-spot-number,.step-label,.memory-name,.practice-item-choice,.specimen')).filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>({text:e.textContent.trim().slice(0,80),class:e.className})),
    unnamed:Array.from(document.querySelectorAll('button')).filter(e=>!e.getAttribute('aria-label')&&!e.textContent.trim()).map(e=>e.className)
  }))()`)
  assert.equal(result.overflow,false,`${context}: horizontal overflow`)
  assert.deepEqual(result.clipped,[],`${context}: clipped text`)
  assert.deepEqual(result.unnamed,[],`${context}: named controls`)
}
try {
  await navigate('o-aplikaci')
  // Upgrade an older saved preference without losing the existing settings.
  await evaluate(`localStorage.setItem('minihry.preferences.v1', JSON.stringify({difficulty:3,reducedMotion:true}))`)
  await browser.send('Page.reload',{ignoreCache:true});await sleep(250)
  assert.equal(await evaluate('document.querySelector("#large-text").checked'),false)
  assert.equal(await evaluate('getComputedStyle(document.documentElement).fontSize'),'20px')
  await evaluate('document.querySelector("#large-text").click()');await sleep(60)
  assert.equal(await evaluate('getComputedStyle(document.documentElement).fontSize'),'24px')
  const saved=await evaluate(`JSON.parse(localStorage.getItem('minihry.preferences.v1'))`)
  assert.deepEqual(saved,{difficulty:3,reducedMotion:true,largeText:true})
  await browser.send('Page.reload',{ignoreCache:true});await sleep(250)
  assert.equal(await evaluate('document.querySelector("#large-text").checked'),true,'preference survives reload')

  for (const large of [false,true]) {
    await navigate('o-aplikaci')
    await evaluate(`if(document.querySelector('#large-text').checked!==${large})document.querySelector('#large-text').click()`)
    await navigate('')
    const routes=await evaluate(`Array.from(new Set(['',...Array.from(document.querySelectorAll('a[href^="#/"]')).map(a=>a.hash.slice(2))]))`)
    for(const route of routes){
      await navigate(route)
      for(const width of [320,390,768,1280]){
        await browser.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
        await layout(`${large?'large':'normal'} ${route||'home'} ${width}px`)
      }
      if(await evaluate('!!document.querySelector(".setup-panel button[type=submit]")')){
        await evaluate(`document.querySelector('.choice-field .choice-button:last-child')?.click();if(document.querySelector('#year-difficulty'))document.querySelector('#year-difficulty .choice-button:last-child').click();document.querySelector('.setup-panel button[type=submit]').click()`)
        await sleep(50)
        // Reveal both images and long item names in the densest memory deck.
        if(route==='pexeso')await evaluate(`document.querySelectorAll('.memory-card').forEach(e=>e.click())`)
        for(const width of [320,390,768,1280]){
          await browser.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
          await layout(`${large?'large':'normal'} active ${route} ${width}px`)
        }
      }
    }
  }
  await navigate('o-aplikaci')
  await evaluate(`Array.from(document.querySelectorAll('button')).find(e=>e.textContent.includes('Obnovit výchozí')).click()`)
  await sleep(50)
  assert.equal(await evaluate('document.querySelector("#large-text").checked'),false)
  assert.equal(await evaluate('getComputedStyle(document.documentElement).fontSize'),'20px','reset restores the larger default')
  assert.equal(browser.errors.length,0,JSON.stringify(browser.errors))
  console.log('PASS typography: larger default, extra-large preference, migration, persistence, reset; all routes and active games at 320/390/768/1280px in both sizes.')
} catch(error) {
  const shot=await browser.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
  await writeFile('/tmp/minihry-typography-failure.png',Buffer.from(shot.data,'base64'))
  throw error
} finally {await browser.close()}
