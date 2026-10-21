import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { sleep } from './chrome.mjs'

const source=await readFile(new URL('../src/content/learning.ts',import.meta.url),'utf8')
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText
const {yearOrders}=await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

export async function playYear(browser,base,level=0,mode='circle',touch=false){
  const ev=expression=>browser.evaluate(expression)
  const click=async selector=>{
    await ev(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Unavailable '+${JSON.stringify(selector)});e.click()})()`)
    await sleep(25)
  }
  await browser.send('Page.navigate',{url:`${base}#/`});await sleep(70)
  await browser.send('Page.navigate',{url:`${base}#/rok`})
  for(let i=0;i<50&&!await ev('!!document.querySelector("#year-mode")');i++)await sleep(50)
  await click(`#year-mode .choice-button[data-value="${mode}"]`)
  await click(`#year-difficulty .choice-button[data-value="${level}"]`)
  await click('.setup-panel button[type=submit]')
  const steps=yearOrders[level].steps
  assert.equal(await ev('document.querySelectorAll(".order-list").length'),0,'year no longer uses vertical sorting')
  if(mode==='circle'){
    assert.equal(await ev('document.querySelectorAll(".year-slot").length'),steps.length)
    const firstIndex=level===0?0:1
    if(level===0){
      assert.equal(await ev('document.querySelector(".year-question").textContent'), 'Čím začíná liturgický rok?')
      assert.equal(await ev('document.querySelectorAll(".year-slot[data-filled-id]").length'),0,'begin with an empty circle')
      assert.equal(await ev('document.querySelectorAll(".year-slot svg").length'),0,'future slots do not reveal their symbols')
      assert.equal(await ev('Number(getComputedStyle(document.querySelector(".year-slot-future")).opacity)<=.15'),true,'future slots are faint')
    }
    for(let round=0;round<steps.length-firstIndex;round++){
      const index=round+firstIndex,id=steps[index].id
      const selector=`.year-slot[data-slot-index="${index}"]`
      const choice=`.year-circle-choice[data-step-id="${id}"]`
      assert.deepEqual(await ev('Array.from(document.querySelectorAll(".year-slot[data-filled-id]")).map(e=>e.dataset.filledId)'),steps.slice(0,index).map(step=>step.id),'circle advances in calendar order')
      assert.equal(await ev('document.querySelector(".year-slot[aria-current=step]").dataset.slotIndex'),String(index),'only the next place is active')
      assert.equal(await ev('document.querySelectorAll(".year-slot:not(:disabled)").length'),1,'no guessing of other positions')
      if(round===0){
        await click('.year-hint')
        assert.equal(await ev('document.querySelector("#year-hint").textContent.trim().length>0'),true)
        await click(`.year-circle-choice:not([data-step-id="${id}"])`)
        assert.equal(await ev('!!document.querySelector(".year-answer-wrong")'),true)
        // Move the selected candidate to the one highlighted target, or cancel outside.
        await ev('scrollTo(0,document.querySelector(".year-ring").getBoundingClientRect().top+scrollY-100)');await sleep(40)
        const points=await ev(`(()=>{const a=document.querySelector(${JSON.stringify(choice)}).getBoundingClientRect(),z=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{a:{x:a.x+a.width/2,y:a.y+a.height/2},z:{x:z.x+z.width/2,y:z.y+z.height/2}}})()`)
        const mouse=(type,p,buttons)=>browser.send('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'?'none':'left',buttons,clickCount:1})
        const finger=(type,p)=>browser.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]})
        for(const outside of [true,false]){
          const end=outside?{x:2,y:Math.max(80,points.a.y)}:points.z
          if(touch)await finger('touchStart',points.a);else{await mouse('mouseMoved',points.a,0);await mouse('mousePressed',points.a,1)}
          for(let i=1;i<=6;i++){
            const p={x:points.a.x+(end.x-points.a.x)*i/6,y:points.a.y+(end.y-points.a.y)*i/6}
            if(touch)await finger('touchMove',p);else await mouse('mouseMoved',p,1)
            await sleep(16)
          }
          if(touch)await finger('touchEnd');else await mouse('mouseReleased',end,0)
          await sleep(70)
          assert.equal(await ev(`!!document.querySelector(${JSON.stringify(selector)}).dataset.filledId`),!outside)
          assert.equal(await ev('!!document.querySelector(".year-ghost")'),false)
        }
      }else if(round===1){
        await ev(`document.querySelector(${JSON.stringify(choice)}).focus()`)
        await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'})
        await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(30)
      }else await click(choice)
      assert.equal(await ev(`document.querySelector(${JSON.stringify(selector)}).dataset.filledId`),id)
      assert.equal(await ev('!!document.querySelector(".game-message.success")'),true)
      assert.equal(await ev('document.documentElement.scrollWidth>innerWidth+1'),false)
      await click('.next-row .primary')
    }
  }else{
    const seen=[]
    for(let round=0;round<steps.length;round++){
      const id=await ev('document.querySelector(".year-prompt").dataset.stepId')
      seen.push(id)
      const next=steps[(steps.findIndex(step=>step.id===id)+1)%steps.length]
      assert.equal(await ev('document.querySelectorAll(".year-answer").length'),3)
      await click(`.year-answer:not([data-step-id="${next.id}"])`)
      assert.equal(await ev('!!document.querySelector(".year-answer-wrong")'),true)
      await click(`.year-answer[data-step-id="${next.id}"]`)
      assert.equal(await ev('!!document.querySelector(".game-message.success")'),true)
      if(id===steps.at(-1).id)assert.equal(next.id,steps[0].id,'last step wraps to Advent')
      await click('.next-row .primary')
    }
    assert.equal(new Set(seen).size,steps.length,'every transition is asked exactly once')
  }
  assert.equal(await ev('!!document.querySelector("[data-testid=result]")'),true)
  await click('.result-panel .primary')
  assert.equal(await ev('!!document.querySelector(".year-ring,.year-prompt")'),true,'restart works')
  console.log(`PASS year ${level}/${mode}: ${steps.length} places, corrections, ${mode==='circle'?(touch?'touch':'mouse')+' drag, keyboard':'cyclic transitions'}, result/restart`)
}
