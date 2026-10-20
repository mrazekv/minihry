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
    assert.equal(await ev('document.querySelectorAll(".year-slot[data-filled-id]").length'),1,'Advent is fixed at start')
    for(let round=0;round<steps.length-1;round++){
      const id=await ev('document.querySelector(".year-token").dataset.stepId')
      const index=steps.findIndex(step=>step.id===id)
      const selector=`.year-slot[data-slot-index="${index}"]`
      if(round===0){
        await click('.year-hint')
        assert.equal(await ev('document.querySelector("#year-hint").textContent.includes("místo '+(index+1)+'")'),true)
        const wrong=await ev(`Array.from(document.querySelectorAll('.year-slot')).find(e=>!e.disabled&&e.dataset.slotIndex!==${JSON.stringify(String(index))}).dataset.slotIndex`)
        await click(`.year-slot[data-slot-index="${wrong}"]`)
        assert.equal(await ev('!!document.querySelector(".year-slot-wrong")'),true)
        // Test the actual pointer path, including cancelling a drop outside the ring.
        await ev('document.querySelector(".year-ring").scrollIntoView({block:"center"})');await sleep(40)
        const points=await ev(`(()=>{const a=document.querySelector('.year-token').getBoundingClientRect(),z=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return{a:{x:a.x+a.width/2,y:a.y+a.height/2},z:{x:z.x+z.width/2,y:z.y+z.height/2}}})()`)
        const mouse=(type,p,buttons)=>browser.send('Input.dispatchMouseEvent',{type,...p,button:type==='mouseMoved'?'none':'left',buttons,clickCount:1})
        const finger=(type,p)=>browser.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]})
        for(const outside of [true,false]){
          const end=outside?{x:2,y:Math.max(40,points.a.y)}:points.z
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
        await ev(`document.querySelector(${JSON.stringify(selector)}).focus()`)
        await browser.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'})
        await browser.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await sleep(30)
      }else await click(selector)
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
