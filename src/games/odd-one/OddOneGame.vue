<script setup lang="ts">
import { computed, ref } from 'vue'
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import GameHeader from '../../components/GameHeader.vue'
import ItemArt from '../../components/ItemArt.vue'
import PracticeItem from '../../components/PracticeItem.vue'
import ResultPanel from '../../components/ResultPanel.vue'
import { items } from '../../content/items'
import { handTowel, oddTasks } from '../../content/practice'
import type { OddTask } from '../../content/practice'
import { shuffle } from '../../lib/game'
import { useRoundFocus } from '../../lib/focus'

const phase = ref<'setup' | 'play' | 'done'>('setup')
const difficulty = ref(1)
const rounds = ref<OddTask[]>([])
const index = ref(0)
const options = ref<string[]>([])
const wrong = ref<string[]>([])
const solved = ref(false)
const firstTry = ref(0)
const message = ref('')
const current = computed(() => rounds.value[index.value]!)
const lookup = new Map([...items, handTowel].map(item=>[item.id,item]))
function resetRound() { wrong.value=[]; solved.value=false; message.value=''; options.value=shuffle([...current.value.members,current.value.odd]) }
function start() { rounds.value=shuffle(oddTasks.filter(task=>task.level<=difficulty.value)); index.value=0; firstTry.value=0; resetRound(); phase.value='play' }
function answer(id: string) {
  if(solved.value || wrong.value.includes(id)) return
  if(id===current.value.odd) {
    if(!wrong.value.length) firstTry.value++
    solved.value=true; message.value=`Správně! ${current.value.explanation}`
  } else { wrong.value.push(id); message.value='Tahle věc do skupiny patří. Přečti si zadání a zkus jinou.' }
}
function next() { if(!solved.value)return; if(index.value+1===rounds.value.length)phase.value='done'; else{index.value++;resetRound()} }
useRoundFocus(phase,index)
</script>
<template><div class="game-page practice-game">
  <GameHeader title="Co sem nepatří?" description="Najdi ve čtveřici vetřelce. Pokaždé zjistíš, co spojuje ostatní věci." />
  <form v-if="phase==='setup'" class="setup-panel" @submit.prevent="start"><div class="setup-illustration sage"><ItemArt id="chasuble" /></div><h2>Najdeš vetřelce?</h2>
    <ChoiceButtons id="odd-difficulty" v-model="difficulty" label="Obtížnost" :options="[{value:1,label:'Začínám',description:'5 známých skupin'},{value:2,label:'Výzva',description:'10 skupin a více souvislostí'}]" />
    <p class="muted">V každé čtveřici je právě jedna odpověď. Řiď se tím, na co se ptá zadání.</p><button class="primary" type="submit">Začít hrát →</button>
  </form>
  <template v-else-if="phase==='play'">
    <div class="round-stats"><span>Otázka <strong>{{index+1}} z {{rounds.length}}</strong></span><span>Hledáme jednu věc</span></div>
    <progress class="progress" :value="index+(solved?1:0)" :max="rounds.length" aria-label="Dokončené otázky" />
    <h2 class="question-title" :data-task-id="current.id">{{current.question}}</h2>
    <div class="practice-grid odd-grid"><PracticeItem v-for="id in options" :id="id" :key="id" :name="lookup.get(id)!.name" :disabled="solved||wrong.includes(id)" :class="{'practice-wrong':wrong.includes(id),'practice-correct':solved&&id===current.odd}" @choose="answer(id)" /></div>
    <p class="game-message" :class="{success:solved}" role="status">{{message||'Prohlédni si všechny čtyři věci. Která nesplňuje zadání?'}}</p>
    <div class="next-row"><button v-if="solved" class="primary" @click="next">{{index+1===rounds.length?'Zobrazit výsledek':'Další čtveřice'}} →</button></div>
  </template>
  <ResultPanel v-else :message="`Našel jsi všech ${rounds.length} vetřelců, z toho ${firstTry} na první pokus. Každá skupina tě naučila novou souvislost!`" @again="start" @settings="phase='setup'" />
</div></template>
