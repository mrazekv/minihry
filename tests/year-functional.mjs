import assert from 'node:assert/strict'
import { writeFile } from 'node:fs/promises'
import { launchChrome, sleep } from './chrome.mjs'
import { playYear } from './year-browser.mjs'
const b=await launchChrome()
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/'
try{
  for(const [width,touch] of [[1280,false],[390,true]]){
    await b.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:touch})
    for(const level of [0,1,2])for(const mode of ['circle','next'])await playYear(b,base,level,mode,touch)
  }
  // The dense circle must also work at the smallest width and largest text.
  await b.send('Page.navigate',{url:`${base}#/o-aplikaci`});await sleep(150)
  await b.evaluate('document.querySelector("#large-text").click()')
  await b.send('Emulation.setDeviceMetricsOverride',{width:320,height:1000,deviceScaleFactor:1,mobile:true})
  await playYear(b,base,2,'circle',true)
  await b.send('Network.enable')
  assert.equal(await b.evaluate('!!navigator.serviceWorker?.controller'),true)
  await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
  for(const mode of ['circle','next']){
    await b.send('Page.reload',{ignoreCache:true})
    for(let i=0;i<60&&!await b.evaluate('!!document.querySelector("#year-mode")');i++)await sleep(100)
    await b.evaluate(`document.querySelector('#year-mode [data-value="${mode}"]').click();document.querySelector('.setup-panel button[type=submit]').click()`)
    await sleep(40)
    assert.equal(await b.evaluate(`!!document.querySelector(${JSON.stringify(mode==='circle'?'.year-ring':'.year-prompt')})`),true)
  }
  assert.equal(b.errors.length,0,JSON.stringify(b.errors))
  console.log('PASS year: 320px with large text, offline reload and both game modes')
}catch(error){
  const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
  await writeFile('/tmp/minihry-year-failure.png',Buffer.from(shot.data,'base64'))
  throw error
}finally{await b.close()}
