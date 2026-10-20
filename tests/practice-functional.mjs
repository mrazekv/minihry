import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'
import { launchChrome, sleep } from './chrome.mjs'

// Public content tells us the expected answer; all actions use the rendered UI.
const source = await readFile(new URL('../src/content/practice.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { preparationTasks, oddTasks } = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173/'
const b = await launchChrome()
const ev = expression => b.evaluate(expression)
const click = async selector => {
  await ev(`(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e||e.disabled)throw Error('Unavailable: '+${JSON.stringify(selector)}); e.click() })()`)
  await sleep(25)
}
const next = () => click('.next-row .primary')
const selected = () => ev('Array.from(document.querySelectorAll(".preparation-tray .practice-item")).map(e=>e.dataset.itemId)')
const success = () => ev('!!document.querySelector(".game-message.success")')
async function setup(route, level) {
  await b.send('Page.navigate', { url: `${base}#/${route}` }); await sleep(220)
  await click(`.choice-button[data-value="${level}"]`); await click('.setup-panel button[type="submit"]')
}
async function restart() {
  assert.equal(await ev('!!document.querySelector("[data-testid=result]")'),true)
  await click('.result-panel .primary')
  assert.equal(await ev('!!document.querySelector(".question-title")'),true)
}
async function layout(label) {
  assert.equal(await ev('document.documentElement.scrollWidth>innerWidth+1'),false,label)
  const tree=await b.send('Accessibility.getFullAXTree')
  assert.deepEqual(tree.nodes.filter(n=>!n.ignored&&['button','link','textbox'].includes(n.role?.value)&&!n.name?.value?.trim()).map(n=>n.role.value),[],`${label}: named controls`)
}
async function drag(from,to,touch,cancellation='') {
  await ev('scrollTo(0,0)'); await sleep(30)
  const p=await ev(`(() => {const a=document.querySelector(${JSON.stringify(from)}).getBoundingClientRect(),z=document.querySelector(${JSON.stringify(to)}).getBoundingClientRect();return {a:{x:a.x+a.width/2,y:a.y+a.height/2},z:{x:z.x+z.width/2,y:z.y+z.height/2}}})()`)
  if(cancellation==='outside')p.z={x:2,y:2}
  const mouse=(type,point,buttons)=>b.send('Input.dispatchMouseEvent',{type,...point,button:type==='mouseMoved'?'none':'left',buttons,clickCount:1})
  const finger=(type,point)=>b.send('Input.dispatchTouchEvent',{type,touchPoints:point?[{...point,id:1}]:[]})
  if(touch)await finger('touchStart',p.a);else{await mouse('mouseMoved',p.a,0);await mouse('mousePressed',p.a,1)}
  for(let i=1;i<=7;i++){
    const point={x:p.a.x+(p.z.x-p.a.x)*i/7,y:p.a.y+(p.z.y-p.a.y)*i/7}
    if(touch)await finger('touchMove',point);else await mouse('mouseMoved',point,1)
    await sleep(16)
  }
  if(cancellation==='escape'){
    await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
    await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27})
  }
  if(touch)await finger(cancellation==='cancel'?'touchCancel':'touchEnd');else await mouse('mouseReleased',p.z,0)
  await sleep(90)
  assert.equal(await ev('!!document.querySelector(".transfer-ghost")'),false,'ghost removed')
}
async function preparation(level,touch){
  await setup('sakristie',level)
  const first=await ev('document.querySelector(".preparation-shelf .practice-item").dataset.itemId')
  const handle=`.practice-item[data-item-id="${first}"] .transfer-handle`
  for(const cancel of ['outside','escape',...(touch?['cancel']:[])]){
    await drag(handle,'.preparation-tray',touch,cancel);assert.deepEqual(await selected(),[],`cancel: ${cancel}`)
  }
  await drag(handle,'.preparation-tray',touch);assert.deepEqual(await selected(),[first],'drag to tray')
  await drag(handle,'.preparation-shelf',touch);assert.deepEqual(await selected(),[],'drag back')
  const count=preparationTasks.filter(t=>t.level<=level).length
  for(let i=0;i<count;i++){
    const id=await ev('document.querySelector(".question-title").dataset.taskId')
    const task=preparationTasks.find(t=>t.id===id)
    const extra=await ev(`Array.from(document.querySelectorAll('.preparation-shelf .practice-item')).map(e=>e.dataset.itemId).find(id=>!${JSON.stringify(task.required)}.includes(id))`)
    const choose=id=>click(`.practice-item[data-item-id="${id}"] .practice-item-choice`)
    await choose(extra);await next();assert.equal(await success(),false,'extra fails')
    await choose(extra);await choose(task.required[0]);await next();assert.equal(await success(),false,'missing fails')
    for(const id of task.required.slice(1))await choose(id)
    await next();assert.equal(await success(),true);await layout('preparation active')
    assert.equal(await ev('Array.from(document.querySelectorAll(".practice-item-choice")).every(e=>e.disabled)'),true)
    await next()
  }
  await restart();console.log(`PASS preparation ${level}: all ${count} tasks, corrections, ${touch?'touch':'mouse'} drag, outside/Escape/cancel, result/restart`)
}
async function odd(level){
  await setup('vetrelec',level)
  const count=oddTasks.filter(t=>t.level<=level).length
  for(let i=0;i<count;i++){
    const id=await ev('document.querySelector(".question-title").dataset.taskId'),task=oddTasks.find(t=>t.id===id)
    assert.equal(await ev('document.querySelectorAll(".practice-item").length'),4)
    await click(`.practice-item[data-item-id="${task.members[0]}"] button`);assert.equal(await success(),false)
    await click(`.practice-item[data-item-id="${task.odd}"] button`);assert.equal(await success(),true)
    await layout('odd active');await next()
  }
  await restart();console.log(`PASS odd ${level}: all ${count} questions, corrections, result/restart`)
}
async function church(level,touch){
  await setup('kostel',level)
  for(let i=0;i<6;i++){
    const id=await ev('document.querySelector(".question-title").dataset.placeId')
    if(i===0){
      await drag('.church-token .transfer-handle',`.church-spot[data-drop-zone="${id}"]`,touch,'outside');assert.equal(await success(),false)
      await click(`.church-spot:not([data-drop-zone="${id}"])`);assert.equal(await success(),false)
      await drag('.church-token .transfer-handle',`.church-spot[data-drop-zone="${id}"]`,touch)
    }else{
      await ev(`document.querySelector('.church-spot[data-drop-zone="${id}"]').focus()`)
      await b.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'})
      await b.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(30)
    }
    assert.equal(await success(),true,`church round ${i}: ${id}`);await layout('church active');await next()
  }
  await restart();console.log(`PASS church ${level}: 6 places, correction, keyboard, ${touch?'touch':'mouse'} drag, result/restart`)
}
try{
  for(const [width,level,touch] of [[1280,1,false],[390,2,true]]){
    await b.send('Emulation.setDeviceMetricsOverride',{width,height:1400,deviceScaleFactor:1,mobile:touch})
    await preparation(level,touch);await odd(level);await church(level,touch)
  }
  for(const route of ['sakristie','vetrelec','kostel']){
    await b.send('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:true})
    await setup(route,2);await layout(`320px ${route}`)
  }
  const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
  await writeFile('/tmp/minihry-church-mobile.png',Buffer.from(shot.data,'base64'))
  await b.send('Network.enable')
  for(let i=0;i<30 && !await ev('!!navigator.serviceWorker?.controller');i++)await sleep(100)
  assert.equal(await ev('!!navigator.serviceWorker?.controller'),true)
  await b.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0})
  await b.send('Page.reload',{ignoreCache:true})
  for(let i=0;i<60 && !await ev('!!document.querySelector(".setup-panel")');i++)await sleep(100)
  assert.equal(await ev('!!document.querySelector(".setup-panel")'),true,'new game reloads offline')
  for(const route of ['sakristie','vetrelec','kostel']){
    await ev(`location.hash=${JSON.stringify('#/'+route)}`);await sleep(100)
    await click('.setup-panel button[type="submit"]')
    assert.equal(await ev('!!document.querySelector(".question-title")'),true,`offline ${route}`)
  }
  assert.equal(b.errors.length,0,JSON.stringify(b.errors))
  console.log('PASS new games: 320px layout, accessible controls, offline reload/play, no browser errors')
}catch(error){
  console.log(await ev('({question:document.querySelector(".question-title")?.textContent,message:document.querySelector(".game-message")?.textContent,scroll:scrollY})'))
  const shot=await b.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})
  await writeFile('/tmp/minihry-practice-failure.png',Buffer.from(shot.data,'base64'))
  throw error
}finally{await b.close()}
