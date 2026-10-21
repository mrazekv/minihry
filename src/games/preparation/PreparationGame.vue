<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import GameHeader from '../../components/GameHeader.vue'
import ItemArt from '../../components/ItemArt.vue'
import PracticeItem from '../../components/PracticeItem.vue'
import ResultPanel from '../../components/ResultPanel.vue'
import { items } from '../../content/items'
import { preparationTasks } from '../../content/practice'
import type { PreparationTask } from '../../content/practice'
import { shuffle } from '../../lib/game'
import { useRoundFocus } from '../../lib/focus'
import { checkSelection } from '../../lib/practice'
import { useTransfer } from '../../lib/transfer'

const phase = ref<'setup' | 'play' | 'done'>('setup')
const difficulty = ref(1)
const rounds = ref<PreparationTask[]>([])
const index = ref(0)
const selected = ref<string[]>([])
const shelf = ref<string[]>([])
const solved = ref(false)
const checked = ref(false)
const helped = ref(false)
const firstTry = ref(0)
const message = ref('')
const current = computed(() => rounds.value[index.value]!)
const lookup = new Map(items.map(item => [item.id, item]))
const name = (id: string) => lookup.get(id)!.name
const errors = computed(() => current.value ? checkSelection(selected.value, current.value.required) : { missing: [], extra: [], correct: false })
function resetRound() {
  selected.value = []; solved.value = false; checked.value = false; helped.value = false; message.value = ''
  shelf.value = shuffle([...current.value.required, ...current.value.distractors.slice(0, difficulty.value === 1 ? 2 : 5)])
}
function start() {
  rounds.value = shuffle(preparationTasks.filter(task => task.level <= difficulty.value))
  index.value = 0; firstTry.value = 0; resetRound(); phase.value = 'play'
}
function toggle(id: string) {
  if (solved.value) return
  selected.value = selected.value.includes(id) ? selected.value.filter(value => value !== id) : [...selected.value, id]
  checked.value = false; message.value = ''
  nextTick(() => document.querySelector<HTMLButtonElement>(`.practice-item[data-item-id="${id}"] .practice-item-choice`)?.focus({ preventScroll: true }))
}
const { drag, ghostStyle, begin, cancel, handleClick } = useTransfer((id, zone) => {
  if (solved.value || !shelf.value.includes(id)) return
  if (zone === 'tray' && !selected.value.includes(id)) toggle(id)
  if (zone === 'shelf' && selected.value.includes(id)) toggle(id)
})
function check() {
  if (solved.value) return
  checked.value = true
  if (errors.value.correct) {
    solved.value = true
    if (!helped.value) firstTry.value++
    message.value = `Všechno je připravené! ${current.value.explanation}`
  } else {
    helped.value = true
    message.value = `Ještě to uprav. ${errors.value.extra.length ? 'Něco tu je navíc. ' : ''}${errors.value.missing.length ? 'Něco potřebného chybí.' : ''}`
  }
}
function next() {
  if (!solved.value) return
  cancel()
  if (index.value + 1 === rounds.value.length) phase.value = 'done'
  else { index.value++; resetRound() }
}
useRoundFocus(phase, index)
</script>
<template><div class="game-page practice-game preparation-game" :class="{ 'preparation-playing': phase==='play', 'preparation-reviewed': checked }">
  <GameHeader title="Připrav sakristii" description="Vyber a nachystej věci potřebné pro ministrantskou službu." />
  <form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start">
    <div class="setup-illustration peach"><ItemArt id="credence-table" /></div><h2>Co dnes nachystáme?</h2>
    <ChoiceButtons id="preparation-difficulty" v-model="difficulty" label="Obtížnost" :options="[{value:1,label:'S nápovědou',description:'5 úkolů a menší polička'},{value:2,label:'Samostatně',description:'8 úkolů včetně rouch'}]" />
    <p class="muted">Věci vybereš klepnutím nebo přetažením obrázku. Na přípravu máš dost času.</p>
    <button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button>
  </form>
  <template v-else-if="phase === 'play'">
    <div class="preparation-question">
    <div class="round-stats"><span>Úkol <strong>{{ index + 1 }} z {{ rounds.length }}</strong></span><span>Nachystáno {{ selected.length }} / {{ current.required.length }}</span></div>
    <progress class="progress" :value="index + (solved ? 1 : 0)" :max="rounds.length" aria-label="Dokončené úkoly" />
    <h2 class="question-title" :data-task-id="current.id">{{ current.title }}</h2>
    </div>
    <section class="preparation-tray" :class="{ 'transfer-over': drag?.moved && drag.over === 'tray' }" data-drop-zone="tray" aria-labelledby="tray-title">
      <h3 id="tray-title">Připravené věci</h3>
      <div v-if="selected.length" class="practice-grid tray-grid">
        <PracticeItem v-for="id in selected" :id="id" :key="id" :name="name(id)" :hide-name="!checked" :selected="true" :disabled="solved" transferable :class="{ 'practice-wrong': checked && errors.extra.includes(id) }" @choose="handleClick(()=>toggle(id),$event)" @drag="begin($event,id)" />
      </div><p v-else class="tray-empty">Sem nachystej vybrané věci.</p>
    </section>
    <section class="preparation-shelf" :class="{ 'transfer-over': drag?.moved && drag.over === 'shelf' }" data-drop-zone="shelf" aria-labelledby="shelf-title">
      <h3 id="shelf-title">Polička</h3><div class="practice-grid">
        <PracticeItem v-for="id in shelf.filter(id=>!selected.includes(id))" :id="id" :key="id" :name="name(id)" :hide-name="!checked" :disabled="solved" transferable @choose="handleClick(()=>toggle(id),$event)" @drag="begin($event,id)" />
      </div>
    </section>
    <p class="game-message" :class="{success:solved}" role="status">{{ message }}</p>
    <div class="next-row"><button v-if="!solved" class="primary" :disabled="!selected.length" @click="check">Zkontrolovat</button><button v-else class="primary" @click="next">{{ index + 1 === rounds.length ? 'Zobrazit výsledek' : 'Další úkol' }} →</button></div>
    <div class="preparation-instructions"><p class="instruction">Klepni na obrázek nebo ho přetáhni mezi připravené věci. Stejně ho vrátíš zpět.</p><p v-if="difficulty === 1" class="hint-panel">{{ current.hint }}</p></div>
    <Teleport to="body"><div v-if="drag?.moved" class="transfer-ghost" :style="ghostStyle" aria-hidden="true"><ItemArt :id="drag.id" /></div></Teleport>
  </template>
  <ResultPanel v-else :message="`Připravil jsi všech ${rounds.length} úkolů. Hned napoprvé se ti jich povedlo ${firstTry}. Teď víš lépe, co se při službě hodí!`" @again="start" @settings="phase='setup'" />
</div></template>
