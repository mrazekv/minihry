import assert from 'node:assert/strict'
import {writeFile} from 'node:fs/promises'
import {launchChrome,sleep} from './chrome.mjs'
const b=await launchChrome(), base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173/'
const ev=expression=>b.evaluate(expression)
const click=async selector=>{await ev(`document.querySelector(${JSON.stringify(selector)}).click()`);await sleep(10)}
const key=(type,code)=>b.send('Input.dispatchKeyEvent',{type,key:code==='Space'?' ':code,code,windowsVirtualKeyCode:code==='ArrowLeft'?37:code==='ArrowRight'?39:code==='Space'?32:27})
const tick=async(count=1)=>{await ev(`window.advanceProcession(${count})`)}
const state=()=>ev(`(()=>{const e=document.querySelector('.procession-stage');return e?{distance:+e.dataset.distance,x:+e.dataset.x,center:+e.dataset.center,status:e.dataset.status,stops:+e.dataset.stops}:null})()`)
try{
  // Advance the animation clock deterministically; gameplay receives ordinary frame deltas.
  await b.send('Page.addScriptToEvaluateOnNewDocument',{source:`{
    let seq=0,clock=100;const callbacks=new Map();
    window.requestAnimationFrame=cb=>{callbacks.set(++seq,cb);return seq};
    window.cancelAnimationFrame=id=>callbacks.delete(id);
    window.advanceProcession=count=>{for(let i=0;i<count;i++){clock+=50;const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(clock))}};
  }`})
  for(const [level,width,touch] of [[1,1280,false],[2,390,true]]){
    await b.send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:touch})
    await b.send('Emulation.setTouchEmulationEnabled',{enabled:touch})
    await b.send('Page.navigate',{url:`${base}#/`});await sleep(80)
    await b.send('Page.navigate',{url:`${base}#/pruvod`});
    for(let i=0;i<50&&!await ev('!!document.querySelector("#procession-level")');i++)await sleep(50)
    await click(`#procession-level [data-value="${level}"]`);await click('.setup-panel button[type=submit]')
    await click('.next-row .primary');assert.equal(await ev('!!document.querySelector(".procession-wrong")'),true,'wrong order allows corrections')
    // Real pointer drag swaps the first two rows, on both mouse and touch.
    const initial=await ev('Array.from(document.querySelectorAll("[data-row-id]")).map(e=>e.dataset.rowId)')
    await ev('document.querySelector(".procession-order").scrollIntoView({block:"center"})')
    const p=await ev(`(()=>{const rows=[...document.querySelectorAll('.procession-row-choice')];return rows.slice(0,2).map(e=>{const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}})})()`)
    if(touch)await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p[0],id:1}]})
    else await b.send('Input.dispatchMouseEvent',{type:'mousePressed',...p[0],button:'left',buttons:1,clickCount:1})
    for(let i=1;i<=6;i++){
      const q={x:p[0].x+(p[1].x-p[0].x)*i/6,y:p[0].y+(p[1].y-p[0].y)*i/6}
      if(touch)await b.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...q,id:1}]})
      else await b.send('Input.dispatchMouseEvent',{type:'mouseMoved',...q,buttons:1})
    }
    if(touch)await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})
    else await b.send('Input.dispatchMouseEvent',{type:'mouseReleased',...p[1],button:'left',buttons:0,clickCount:1})
    await sleep(20)
    assert.deepEqual(await ev('Array.from(document.querySelectorAll("[data-row-id]")).map(e=>e.dataset.rowId)'),[initial[1],initial[0],...initial.slice(2)],'pointer reorders rows')
    const expected=level===1?['cross','servers','priest']:['incense','cross','servers','priest']
    for(let i=0;i<expected.length;i++){
      while(await ev(`Array.from(document.querySelectorAll('[data-row-id]')).findIndex(e=>e.dataset.rowId===${JSON.stringify(expected[i])})`)>i)
        await click(`[data-row-id="${expected[i]}"] .procession-order-controls button:first-child`)
    }
    await click('.next-row .primary');assert.equal(await ev('!!document.querySelector(".procession-go")'),true)
    const ids=await ev('Array.from(document.querySelectorAll("[id]")).map(e=>e.id)');assert.equal(new Set(ids).size,ids.length,'drawings have distinct IDs')
    if(touch){const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('/tmp/minihry-procession-order.png',Buffer.from(shot.data,'base64'))}
    await click('.procession-go');await tick()
    await key('keyDown','Escape');const paused=await state();await tick(50);assert.equal((await state()).distance,paused.distance,'pause freezes progress');await key('keyUp','Escape');await click('.procession-stop')
    await key('keyDown','ArrowRight');await tick(20);await key('keyUp','ArrowRight');assert.equal((await state()).status,'regroup','collision allows regroup and retry');await click('.procession-stop')
    if(touch){
      // Actual finger steering on the map.
      const p=await ev(`(()=>{const r=document.querySelector('.procession-stage').getBoundingClientRect();return{x:r.left+r.width*.53,y:r.top+r.height*.3}})()`)
      const old=(await state()).x
      await b.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...p,id:1}]});await tick(2)
      await b.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok((await state()).x>old,'touch steers the procession')
    }
    let held='',slowed=false,finished=false
    for(let i=0;i<2400;i++){
      const s=await state();if(!s){finished=true;break}
      assert.equal(s.status,'moving',`uninterrupted path: ${JSON.stringify(s)}`)
      if(s.stops<2&&[440,1170][s.stops]-s.distance<18){
        await click('.procession-stop');assert.equal((await state()).stops,s.stops+1);const d=(await state()).distance;await tick(5);assert.equal((await state()).distance,d);await click('.procession-stop')
      }
      if(level===2&&!slowed&&s.distance>580&&s.distance<=810){await click('.procession-controls [aria-pressed]');slowed=true}
      if(level===2&&slowed&&s.distance>810){await click('.procession-controls [aria-pressed]');slowed=false}
      const desired=s.center-s.x>2?'ArrowRight':s.center-s.x< -2?'ArrowLeft':''
      if(desired!==held){if(held)await key('keyUp',held);if(desired)await key('keyDown',desired);held=desired}
      await tick()
      if(touch&&i===300){const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('/tmp/minihry-procession-walk.png',Buffer.from(shot.data,'base64'))}
      assert.equal(await ev('document.documentElement.scrollWidth>innerWidth+1'),false)
    }
    if(held)await key('keyUp',held)
    assert.equal(finished,true,'whole route is completable')
    assert.equal(await ev('!!document.querySelector("[data-testid=result]")'),true)
    assert.ok(await ev('document.querySelector(".result-panel").textContent.includes("2 ze 2")'))
    await click('.result-panel .primary');assert.equal(await ev('!!document.querySelector(".procession-order")'),true,'replay starts with ordering')
    console.log(`PASS procession ${level}: ${touch?'touch':'mouse'} reorder, corrections, complete route, pause, collisions, stops, restart`)
  }
  await b.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true})
  await ev('document.documentElement.classList.add("large-text")');assert.equal(await ev('document.documentElement.scrollWidth>innerWidth+1'),false)
  for(const [i,id] of ['incense','cross','servers','priest'].entries()){
    while(await ev(`Array.from(document.querySelectorAll('[data-row-id]')).findIndex(e=>e.dataset.rowId===${JSON.stringify(id)})`)>i)
      await click(`[data-row-id="${id}"] .procession-order-controls button:first-child`)
  }
  await click('.next-row .primary');await click('.procession-go');await tick()
  const controls=await ev(`(()=>{const elements=[...document.querySelectorAll('.procession-controls button')];return{overflow:document.documentElement.scrollWidth>innerWidth+1,clipped:elements.some(e=>e.scrollWidth>e.clientWidth+2),unnamed:elements.some(e=>!e.textContent.trim()&&!e.getAttribute('aria-label'))}})()`)
  assert.deepEqual(controls,{overflow:false,clipped:false,unnamed:false},'320px large text active controls fit')
  await key('keyDown','Escape');await key('keyUp','Escape')
  await b.send('Network.enable');await sleep(200)
  assert.equal(await ev('!!navigator.serviceWorker.controller'),true)
  await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
  await b.send('Page.reload');await sleep(250);assert.equal(await ev('!!document.querySelector("#procession-level")'),true,'offline route loads')
  await click('.setup-panel button[type=submit]');assert.equal(await ev('document.querySelectorAll("[data-row-id]").length'),3)
  assert.equal(b.errors.length,0,JSON.stringify(b.errors))
  console.log('PASS procession: 320px with large text, offline load/play, no browser errors')
}catch(error){const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});await writeFile('/tmp/minihry-procession-failure.png',Buffer.from(shot.data,'base64'));throw error}
finally{await b.close()}
