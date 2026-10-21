<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import GameHeader from '../../components/GameHeader.vue'
import ResultPanel from '../../components/ResultPanel.vue'
import { shuffledOrder } from '../../lib/game'
import { useTransfer } from '../../lib/transfer'
import { useRoundFocus } from '../../lib/focus'
import ProcessionRowArt from './ProcessionRow.vue'
import { FINISH, STOP_POINTS, newWalk, routeAt, rowsForLevel, stopWalk, tickWalk } from './procession-rules'
import type { ProcessionLevel, ProcessionRow } from './procession-rules'

const phase = ref<'setup' | 'order' | 'walk' | 'done'>('setup')
const level = ref<ProcessionLevel>(1)
const rows = ref<ProcessionRow[]>([])
const expected = computed(() => rowsForLevel(level.value))
const checked = ref(false)
const ready = ref(false)
const checks = ref(0)
const feedback = ref('')
const state = ref(newWalk())
const slow = ref(false)
const stage = ref<SVGSVGElement | null>(null)
const direction = ref(0)
const targetX = ref<number | null>(null)
const history = ref<{ distance: number; x: number }[]>([])
const percent = computed(() => Math.floor(state.value.distance / FINISH * 100))
const camera = computed(() => 1450 - state.value.distance - 115)
const nextStop = computed(() => STOP_POINTS[state.value.stops])
const stopNear = computed(() => nextStop.value !== undefined && nextStop.value - state.value.distance <= 100)
const narrowNear = computed(() => level.value === 2 && state.value.distance >= 520 && state.value.distance <= 790)
const dragged = computed(() => rows.value.find(row => row.id === drag.value?.id))
let frame = 0, last = 0
const keys = new Set<string>()

function start() {
  cancel(); clearControls(); cancelAnimationFrame(frame)
  rows.value = shuffledOrder(expected.value)
  checks.value = 0; checked.value = false; ready.value = false; feedback.value = ''; phase.value = 'order'
}
function moveTo(id: string, to: number) {
  if (ready.value || to < 0 || to >= rows.value.length) return
  const from = rows.value.findIndex(row => row.id === id)
  if (from < 0 || from === to) return
  rows.value.splice(to, 0, rows.value.splice(from, 1)[0]!)
  checked.value = false
  feedback.value = `${rows.value[to]!.label}: řada ${to + 1}.`
  nextTick(() => document.querySelector<HTMLButtonElement>(`[data-row-id="${id}"] .procession-row-choice`)?.focus({ preventScroll: true }))
}
const { drag, ghostStyle, begin, cancel } = useTransfer((id, zone) => {
  if (zone.startsWith('procession-')) moveTo(id, Number(zone.slice('procession-'.length)))
})
function check() {
  cancel(); checked.value = true; checks.value++
  ready.value = rows.value.every((row, i) => row.id === expected.value[i]!.id)
  feedback.value = ready.value ? 'Průvod je správně seřazený. Můžeme vyrazit!' : 'Některé řady ještě potřebují jiné místo. Zkus je přesunout.'
}
async function walk() {
  cancel(); clearControls(); slow.value = false
  state.value = newWalk(); history.value = [{ distance: 0, x: 210 }]
  phase.value = 'walk'; last = 0
  await nextTick(); stage.value?.scrollIntoView({ block: 'center' }); frame = requestAnimationFrame(loop)
}
function clearControls() { direction.value = 0; targetX.value = null; keys.clear() }
function pause() {
  clearControls()
  if (state.value.status === 'moving') state.value = stopWalk(state.value)
  else { state.value = { ...state.value, status: 'moving', message: 'Držíme krok. Veď průvod dál.' }; last = 0 }
}
function suspend() {
  clearControls()
  if (phase.value === 'walk' && state.value.status === 'moving') state.value = { ...state.value, status: 'paused', message: 'Hra je pozastavená. Pokračuj, až budeš chtít.' }
}
function visibility() { if (document.hidden) suspend() }
function keyDown(event: KeyboardEvent) {
  if (phase.value !== 'walk' || (event.target as HTMLElement).closest('input,textarea,select,a')) return
  if (['ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code)) { event.preventDefault(); keys.add(event.code) }
  if (event.repeat) return
  if (event.code === 'Escape' || event.code === 'KeyP') { event.preventDefault(); suspend() }
  if (event.code === 'Space' && !(event.target as HTMLElement).closest('button')) { event.preventDefault(); pause() }
}
function keyUp(event: KeyboardEvent) { keys.delete(event.code) }
function hold(event: PointerEvent, value: number) {
  if (!event.isPrimary || event.button !== 0) return
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
  direction.value = value
}
function point(event: PointerEvent) {
  if (!stage.value) return
  const bounds = stage.value.getBoundingClientRect()
  targetX.value = Math.max(30, Math.min(390, (event.clientX - bounds.left) / bounds.width * 420))
}
function pointStart(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0 || state.value.status !== 'moving') return
  stage.value?.setPointerCapture(event.pointerId); point(event)
}
function pointMove(event: PointerEvent) { if (stage.value?.hasPointerCapture(event.pointerId)) point(event) }
function rowPosition(index: number) {
  const distance = Math.max(0, state.value.distance - index * 39)
  let past: { distance: number; x: number } | undefined
  for (let i = history.value.length - 1; i >= 0; i--) {
    if (history.value[i]!.distance <= distance) { past = history.value[i]; break }
  }
  return { x: index === 0 ? state.value.x : past?.x ?? routeAt(distance, level.value).center, y: 1450 - state.value.distance + index * 39 }
}
function loop(time: number) {
  if (phase.value !== 'walk') return
  const dt = last ? Math.min((time - last) / 1000, .05) : 0; last = time
  const steer = targetX.value === null ? direction.value || (Number(keys.has('ArrowRight')) - Number(keys.has('ArrowLeft'))) : Math.max(-1, Math.min(1, (targetX.value - state.value.x) / 8))
  const before = state.value
  state.value = tickWalk(before, steer, slow.value || keys.has('ShiftLeft') || keys.has('ShiftRight'), dt, level.value)
  if (state.value.status === 'regroup' && before.status === 'moving') {
    clearControls(); history.value = []
  }
  if (state.value.distance !== before.distance) {
    history.value.push({ distance: state.value.distance, x: state.value.x })
    history.value = history.value.filter(point => point.distance >= state.value.distance - 180)
  }
  if (state.value.status === 'done') { clearControls(); phase.value = 'done'; return }
  frame = requestAnimationFrame(loop)
}
const routePoints = Array.from({ length: 166 }, (_, i) => i * 10 - 220)
const corridor = computed(() => {
  const side = (sign: number) => routePoints.map(distance => { const route = routeAt(distance, level.value); return `${route.center + sign * route.width / 2},${1450 - distance}` })
  return [...side(-1), ...side(1).reverse()].join(' ')
})
const centerLine = computed(() => routePoints.map(distance => `${routeAt(distance, level.value).center},${1450 - distance}`).join(' '))
document.addEventListener('keydown', keyDown); document.addEventListener('keyup', keyUp)
document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', suspend)
onBeforeUnmount(() => { cancelAnimationFrame(frame); clearControls(); document.removeEventListener('keydown', keyDown); document.removeEventListener('keyup', keyUp); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', suspend) })
useRoundFocus(phase)
</script>
<template>
  <div class="game-page procession-game">
    <GameHeader title="Drž krok!" description="Seřaď vstupní průvod a doveď ho společně k oltáři." />
    <form v-if="phase==='setup'" class="setup-panel" @submit.prevent="start">
      <div class="setup-symbol sage" aria-hidden="true">↟</div><h2>Nachystáme průvod?</h2>
      <ChoiceButtons id="procession-level" v-model="level" label="Obtížnost" :options="[{value:1,label:'Malý průvod',description:'3 řady a široká ulička'},{value:2,label:'Slavnostní průvod',description:'4 řady, kadidlo a úzký průchod'}]" />
      <p class="muted">Nejdřív seřaď postavičky. Potom veď celý průvod uličkou, zpomal v úzkém místě a zastav u značek.</p>
      <button class="primary" type="submit">Začít hrát →</button>
    </form>
    <template v-else-if="phase==='order'">
      <h2 class="question-title">Kdo půjde první?</h2>
      <p class="instruction">{{level===2?'Slavnostní vstupní průvod s kadidlem.':'Jednoduchý vstupní průvod bez kadidla.'}} Čelo průvodu je nahoře. Přetáhni řady nebo použij šipky.</p>
      <div class="procession-front" aria-hidden="true">K oltáři ↑</div>
      <ol class="procession-order">
        <li v-for="(row,i) in rows" :key="row.id" :data-row-id="row.id" :data-drop-zone="`procession-${i}`" :class="{'procession-correct':checked&&row.id===expected[i]!.id,'procession-wrong':checked&&row.id!==expected[i]!.id,'transfer-over':drag?.moved&&drag.over===`procession-${i}`}">
          <button class="procession-row-choice" :disabled="ready" :aria-label="`Řada ${i+1}: ${row.label}. Přesunout přetažením nebo šipkami nahoru a dolů.`" @pointerdown="begin($event,row.id)" @keydown.up.prevent="moveTo(row.id,i-1)" @keydown.down.prevent="moveTo(row.id,i+1)"><span>{{i+1}}.</span><ProcessionRowArt :id="row.id"/><strong>{{row.label}}</strong></button>
          <div class="procession-order-controls"><button :disabled="ready||i===0" :aria-label="`Posunout ${row.label} dopředu`" @click="moveTo(row.id,i-1)">↑</button><button :disabled="ready||i===rows.length-1" :aria-label="`Posunout ${row.label} dozadu`" @click="moveTo(row.id,i+1)">↓</button></div>
          <p v-if="checked">{{row.id===expected[i]!.id?'✓ Na správném místě':'↕ Zkus jinou řadu'}}</p>
        </li>
      </ol>
      <p class="game-message" :class="{success:ready}" role="status">{{feedback||'Až budeš spokojený, zkontroluj pořadí.'}}</p>
      <div class="next-row"><button v-if="!ready" class="primary" @click="check">Zkontrolovat pořadí</button><button v-else class="primary procession-go" @click="walk">Vyrazit k oltáři →</button></div>
      <ol v-if="ready" class="procession-explanations"><li v-for="row in expected" :key="row.id">{{row.explanation}}</li></ol>
      <p class="muted content-note">Sestavujeme jednoduchý průvod bez jáhna a dalších kněží. Kříž se svícemi tvoří jednu řadu; konkrétní uspořádání závisí i na prostoru kostela.</p>
      <Teleport to="body"><div v-if="drag?.moved&&dragged" class="transfer-ghost procession-ghost" :style="ghostStyle" aria-hidden="true"><ProcessionRowArt :id="dragged.id"/>{{dragged.label}}</div></Teleport>
    </template>
    <template v-else-if="phase==='walk'">
      <div class="round-stats"><span>Cesta {{percent}} %</span><span>Zastavení {{state.stops}} / 2</span><button class="secondary pause-button" :disabled="state.status!=='moving'" @click="suspend">Pozastavit</button></div>
      <progress class="progress" :value="state.distance" :max="FINISH" aria-label="Cesta průvodu k oltáři"/>
      <p class="instruction procession-walk-instruction">{{state.status!=='moving'?state.message:stopNear?'Blíží se značka. U čáry stiskni Zastavit.':narrowNear?'Úzký průchod: zapni Zpomal a drž se středu.':'Veď průvod středem uličky prstem nebo šipkami ← →.'}}</p>
      <svg ref="stage" class="procession-stage" :viewBox="`0 ${camera} 420 460`" role="img" aria-label="Průvod v uličce kostela. Ovládání je také na tlačítkách pod plánkem." :data-distance="state.distance" :data-x="state.x" :data-center="routeAt(state.distance,level).center" :data-status="state.status" :data-stops="state.stops" @pointerdown.prevent="pointStart" @pointermove.prevent="pointMove" @pointerup="targetX=null" @pointercancel="targetX=null" @lostpointercapture="targetX=null">
        <rect x="0" :y="camera" width="420" height="460" fill="#e6e5d6"/>
        <path v-for="y in Array.from({length:40},(_,i)=>i*45)" :key="y" :d="`M0 ${y}H420`" stroke="#d5d6c4"/>
        <g v-for="d in Array.from({length:24},(_,i)=>i*48)" :key="d" fill="#b69972" stroke="#8c7657" stroke-width="1.5"><rect x="12" :y="1450-d" :width="Math.max(10,routeAt(d,level).center-routeAt(d,level).width/2-29)" height="22" rx="3"/><rect :x="routeAt(d,level).center+routeAt(d,level).width/2+17" :y="1450-d" :width="Math.max(10,391-routeAt(d,level).center-routeAt(d,level).width/2)" height="22" rx="3"/></g>
        <polygon :points="corridor" fill="#f7f0dc" stroke="#c9bd9e" stroke-width="2"/>
        <polyline :points="centerLine" fill="none" stroke="#b9c5a2" stroke-width="2" stroke-dasharray="5 10"/>
        <g transform="translate(210 150)" fill="#eee4ca" stroke="#9e8e6b" stroke-width="2"><path d="M-55-13H55v12H-55Zm7 12h96v33h-96Z"/><path d="M-58-18H58v8H-58Z" fill="#fffbee"/><path d="M0-46v22m-8-14H8" fill="none" stroke="#b8975c" stroke-width="3"/></g>
        <g v-for="(stop,i) in STOP_POINTS" :key="stop" :opacity="i < state.stops ? .25 : 1"><path :d="`M${routeAt(stop,level).center-routeAt(stop,level).width/2+4} ${1450-stop}h${routeAt(stop,level).width-8}`" stroke="#b96b3c" stroke-width="5" stroke-dasharray="8 4"/><text :x="routeAt(stop,level).center" :y="1450-stop-12" text-anchor="middle" font-size="13" fill="#8e4d2c">{{i<state.stops?'✓':i===1?'Zastav před oltářem':'Zastav u značky'}}</text></g>
        <g v-for="(row,i) in rows" :key="row.id" :transform="`translate(${rowPosition(i).x-38} ${rowPosition(i).y-25})`"><ProcessionRowArt :id="row.id" width="76" height="46"/></g>
        <rect v-if="state.status!=='moving'" x="0" :y="camera" width="420" height="460" fill="#fff9e955" pointer-events="none"/>
      </svg>
      <div class="procession-controls">
        <button class="secondary" aria-label="Vést průvod doleva" :disabled="state.status!=='moving'" @pointerdown="hold($event,-1)" @pointerup="direction=0" @pointercancel="direction=0" @lostpointercapture="direction=0" @click="event=>{if(event.detail===0)state.x-=10}">←</button>
        <button class="secondary" :aria-pressed="slow" @click="slow=!slow">{{slow?'Pomalu ✓':'Zpomal'}}</button>
        <button class="secondary" aria-label="Vést průvod doprava" :disabled="state.status!=='moving'" @pointerdown="hold($event,1)" @pointerup="direction=0" @pointercancel="direction=0" @lostpointercapture="direction=0" @click="event=>{if(event.detail===0)state.x+=10}">→</button>
        <button class="primary procession-stop" @click="pause">{{state.status==='moving'?'Zastavit':'Pokračovat →'}}</button>
      </div>
      <p class="muted procession-key-help">← → směr · Shift zpomalí · mezerník zastaví · P pozastaví. Na mobilu veď průvod prstem nebo tlačítky. Zpomal lze zapnout i klepnutím.</p>
      <p class="game-message" role="status">{{state.message}}</p>
    </template>
    <ResultPanel v-else title="Společně u oltáře!" :message="`Správně jsi seřadil ${rows.length} řady a dovedl celý průvod k oltáři. Zvládnutá zastavení: ${state.stops} ze 2. Počet srovnání průvodu: ${state.corrections}.`" @again="start" @settings="phase='setup'"/>
  </div>
</template>
