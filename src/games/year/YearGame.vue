<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import GameHeader from '../../components/GameHeader.vue'
import ResultPanel from '../../components/ResultPanel.vue'
import { yearOrders } from '../../content/learning'
import type { OrderStep } from '../../content/learning'
import { seasonColors } from '../../content/liturgical-colors'
import { answerOptions, shuffle } from '../../lib/game'
import { useRoundFocus } from '../../lib/focus'
import { useTransfer } from '../../lib/transfer'
import { nextYearStep, yearColorHex, yearSegment, yearSlotPosition } from './year-rules'
import YearSymbol from './YearSymbol.vue'

const phase = ref<'setup' | 'play' | 'done'>('setup')
const mode = ref<'circle' | 'next'>('circle')
const difficulty = ref(0)
const index = ref(0)
const rounds = ref<OrderStep[]>([])
const filled = ref<boolean[]>([])
const options = ref<OrderStep[]>([])
const wrong = ref<string[]>([])
const solved = ref(false)
const hinted = ref(false)
const usedHint = ref(false)
const firstTry = ref(0)
const feedback = ref('')
const current = computed(() => yearOrders[difficulty.value]!)
const celebrations = computed(() => current.value.kind === 'celebrations')
const card = computed(() => rounds.value[index.value]!)
const correctIndex = computed(() => current.value.steps.findIndex(step => step.id === card.value?.id))
const nextAnswer = computed(() => nextYearStep(current.value.steps, card.value?.id ?? '')!)
const season = (id: string) => seasonColors[id]!
const placed = computed(() => current.value.steps.filter((_, i) => filled.value[i]))

function prepareRound() {
  wrong.value = []; solved.value = false; hinted.value = false; usedHint.value = false; feedback.value = ''
  if (mode.value === 'next') options.value = answerOptions(nextAnswer.value, current.value.steps, 3)
}
function start() {
  cancel()
  filled.value = current.value.steps.map((_, i) => i === 0)
  rounds.value = shuffle(mode.value === 'circle' ? current.value.steps.slice(1) : current.value.steps)
  index.value = 0; firstTry.value = 0; prepareRound(); phase.value = 'play'
}
function place(slot: number) {
  if (solved.value || filled.value[slot]) return
  if (slot === correctIndex.value) {
    filled.value[slot] = true
    if (!wrong.value.length && !usedHint.value) firstTry.value++
    solved.value = true
    feedback.value = `Správně! ${card.value.description}`
  } else {
    const key = String(slot)
    if (!wrong.value.includes(key)) wrong.value.push(key)
    feedback.value = 'Tady kartička ještě nesedí. Zkus jiné místo v kruhu nebo si odkryj nápovědu.'
  }
}
const { drag, ghostStyle, begin, cancel, handleClick } = useTransfer((id, zone) => {
  if (mode.value === 'circle' && id === card.value.id && zone.startsWith('year-')) place(Number(zone.slice(5)))
})
function answer(step: OrderStep) {
  if (solved.value || wrong.value.includes(step.id)) return
  if (step.id === nextAnswer.value.id) {
    if (!wrong.value.length) firstTry.value++
    solved.value = true
    const wrapping = card.value.id === current.value.steps.at(-1)!.id
    feedback.value = `${wrapping ? 'Rok se uzavírá a začíná nový advent. ' : 'Správně! '}${nextAnswer.value.description}`
  } else {
    wrong.value.push(step.id)
    feedback.value = 'Tohle v našem přehledu nenásleduje hned potom. Zkus jinou možnost.'
  }
}
async function next() {
  if (!solved.value) return
  cancel()
  if (index.value + 1 === rounds.value.length) phase.value = 'done'
  else {
    index.value++; prepareRound()
    await nextTick()
    document.querySelector('.year-question')?.scrollIntoView({ block: 'nearest' })
  }
}
function showHint() { hinted.value = !hinted.value; usedHint.value = true }
const hintText = computed(() => {
  if (!card.value) return ''
  const previous = current.value.steps[correctIndex.value - 1]!
  return `Hledej místo ${correctIndex.value + 1}, za „${previous.label}“. ${card.value.description}`
})
useRoundFocus(phase, index)
</script>
<template><div class="game-page year-game">
  <GameHeader title="Cesta liturgickým rokem" description="Doplň kruh roku nebo zjisti, co následuje. Od adventu zase k adventu." />
  <form v-if="phase==='setup'" class="setup-panel" @submit.prevent="start">
    <div class="setup-symbol yellow" aria-hidden="true">↻</div><h2>Jak si projdeme rok?</h2>
    <ChoiceButtons id="year-mode" v-model="mode" label="Herní režim" :options="[{value:'circle',label:'Kruh liturgického roku',description:'Doplň kartičky na místa v kruhu'},{value:'next',label:'Co následuje?',description:'Vyber ze tří možností, co je hned dál'}]" />
    <ChoiceButtons id="year-difficulty" v-model="difficulty" label="Obtížnost" :options="yearOrders.map((set,i)=>({value:i,label:set.title,description:i===0?'6 míst, barvy a obrázky':i===1?'7 míst včetně tridua':'16 vybraných svátků a slavností'}))" />
    <p class="muted">Bez časového limitu. V kruhu vyber místo klepnutím nebo přetáhni kartičku.</p><button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button>
  </form>
  <template v-else-if="phase==='play'">
    <div class="round-stats"><span>{{mode==='circle'?'Kruh roku':'Co následuje?'}}</span><span>{{mode==='circle'?`Doplněno ${placed.length} z ${current.steps.length}`:`Otázka ${index+1} z ${rounds.length}`}}</span></div>
    <progress class="progress" :value="mode==='circle'?placed.length:index+(solved?1:0)" :max="mode==='circle'?current.steps.length:rounds.length" aria-label="Postup liturgickým rokem" />
    <template v-if="mode==='circle'">
      <h2 class="question-title year-question">Kam patří kartička?</h2>
      <p class="year-direction">Začínáme nahoře adventem. Pokračujeme doprava po kruhu. ↻</p>
      <div class="year-ring" :class="{'year-ring-basic':difficulty===0}" role="group" aria-label="Kruh liturgického roku. Místo jedna je advent, pokračujeme po směru hodinových ručiček.">
        <svg class="year-ring-track" viewBox="0 0 360 360" aria-hidden="true"><circle cx="180" cy="180" r="144" fill="none" stroke="#dedccf" stroke-width="22"/><path v-for="(step,i) in current.steps" :key="step.id" :d="yearSegment(i,current.steps.length)" fill="none" :stroke="difficulty===0||filled[i]?yearColorHex[season(step.id).className]:'#d4d2c5'" stroke-width="19" stroke-linecap="round" /></svg>
        <button v-for="(step,i) in current.steps" :key="step.id" type="button" class="year-slot" :class="[filled[i]||difficulty===0?season(step.id).className:'',{'year-slot-filled':filled[i],'year-slot-wrong':wrong.includes(String(i)),'transfer-over':drag?.moved&&drag.over===`year-${i}`} ]" :style="yearSlotPosition(i,current.steps.length)" :data-slot-index="i" :data-filled-id="filled[i]?step.id:undefined" :data-drop-zone="`year-${i}`" :disabled="filled[i]||solved" :aria-label="filled[i]?`Místo ${i+1}: ${step.label}, doplněno`:`Místo ${i+1}${difficulty===0?`, ${season(step.id).label}`:''}`" @click="place(i)">
          <YearSymbol v-if="difficulty===0&&!filled[i]" :id="step.id" /><span>{{i+1}}</span><small v-if="filled[i]" aria-hidden="true">✓</small>
        </button>
        <div class="year-center"><span class="eyebrow">{{solved?'Na svém místě':'Tvoje kartička'}}</span>
          <button type="button" class="year-token" :class="season(card.id).className" :data-step-id="card.id" :disabled="solved" :aria-label="`${card.label}. Přetáhni kartičku nebo vyber místo v kruhu.`" @pointerdown="begin($event,card.id)" @click="handleClick(()=>{feedback='Klepni na volné místo v kruhu.'},$event)"><YearSymbol v-if="difficulty===0" :id="card.id" /><strong>{{card.label}}</strong><small>{{season(card.id).label}}</small></button>
        </div>
      </div>
      <p class="year-scale-note">Kruh ukazuje pořadí; velikost dílků neodpovídá délce období.</p>
    </template>
    <template v-else>
      <h2 class="question-title year-question">Co je v našem přehledu hned dál?</h2>
      <div class="year-prompt" :class="season(card.id).className" :data-step-id="card.id"><YearSymbol v-if="difficulty===0" :id="card.id" /><strong>{{card.label}}</strong><span>{{season(card.id).label}}</span></div>
      <div class="year-next-options"><button v-for="step in options" :key="step.id" type="button" class="year-answer" :class="[season(step.id).className,{'year-answer-correct':solved&&step.id===nextAnswer.id,'year-answer-wrong':wrong.includes(step.id)}]" :data-step-id="step.id" :disabled="solved||wrong.includes(step.id)" @click="answer(step)"><span>{{step.label}}</span><small>{{season(step.id).label}}<span v-if="solved&&step.id===nextAnswer.id"> · ✓ Správně</span><span v-if="wrong.includes(step.id)"> · Zkus jinou</span></small></button></div>
    </template>
    <p class="game-message" :class="{success:solved}" role="status">{{feedback||'Nikam nespěcháme. Máš čas si to promyslet.'}}</p>
    <div v-if="solved" class="next-row"><button class="primary" @click="next">{{index+1===rounds.length?'Zobrazit výsledek':mode==='circle'?'Další kartička':'Další otázka'}} →</button></div>
    <template v-else-if="mode==='circle'"><button type="button" class="text-button year-hint" :aria-expanded="hinted" aria-controls="year-hint" @click="showHint">{{hinted?'Skrýt nápovědu':'Chci nápovědu'}}</button><p v-show="hinted" id="year-hint" class="hint-panel">{{hintText}}</p></template>
    <div v-if="mode==='circle'" class="year-placed"><h3>Už na svém místě</h3><ol><li v-for="(step,i) in current.steps" v-show="filled[i]" :key="step.id" :value="i+1" :class="season(step.id).className"><strong>{{i+1}}. {{step.label}}</strong><small>{{season(step.id).label}}</small></li></ol></div>
    <p v-if="celebrations" class="muted content-note">Pracujeme s vybranými svátky a slavnostmi. Mezi nimi jsou v kalendáři i další dny; datum Velikonoc se mění.</p><p v-else-if="difficulty===1" class="muted content-note">Řadíme podle začátku období. Doba velikonoční začíná vigilií už během tridua. Mezidobí má dva úseky.</p><p v-else class="muted content-note">Barvy ukazují základní barvu období; jednotlivé svátky mohou mít jinou. Mezidobí má dva úseky.</p>
    <Teleport to="body"><div v-if="drag?.moved" class="transfer-ghost year-ghost" :class="season(card.id).className" :style="ghostStyle" aria-hidden="true">{{card.label}}</div></Teleport>
  </template>
  <template v-else><ResultPanel :message="`${mode==='circle'?'Doplnil jsi celý kruh roku.':'Prošel jsi celý přehled roku.'} Na první pokus${mode==='circle'?' bez nápovědy':''} se ti povedlo ${firstTry} z ${rounds.length} odpovědí.`" @again="start" @settings="phase='setup'" /><details class="explanation-list"><summary>Prohlédnout rok a vysvětlení</summary><ol><li v-for="step in current.steps" :key="step.id"><strong>{{step.label}}</strong><p>{{step.description}}</p><p>{{season(step.id).explanation}}</p></li></ol></details></template>
</div></template>
