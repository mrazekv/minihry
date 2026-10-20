<script setup lang="ts">
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import { useRoundFocus } from '../../lib/focus'
import { computed, ref } from 'vue'
import { items } from '../../content/items'
import type { LiturgicalItem } from '../../content/items'
import { answerOptions, shuffle } from '../../lib/game'
import { preferences } from '../../storage/preferences'
import GameHeader from '../../components/GameHeader.vue'
import ItemArt from '../../components/ItemArt.vue'
import ResultPanel from '../../components/ResultPanel.vue'
const phase = ref<'setup' | 'play' | 'done'>('setup')
const difficulty = ref(preferences.value.difficulty)
const mode = ref('names')
const questions = ref<LiturgicalItem[]>([])
const options = ref<LiturgicalItem[]>([])
const index = ref(0)
const solved = ref(false)
const wrong = ref<string[]>([])
const firstTry = ref(0)
const feedback = ref('')
const current = computed(() => questions.value[index.value]!)
const pool = computed(() => items.filter(item => item.level <= difficulty.value))
function prepare() {
  solved.value = false; wrong.value = []; feedback.value = ''
  options.value = answerOptions(current.value, pool.value)
}
function start() {
  preferences.value.difficulty = difficulty.value
  const sequence = shuffle(pool.value)
  questions.value = Array.from({ length: 10 }, (_, i) => sequence[i % sequence.length]!)
  index.value = 0; firstTry.value = 0; prepare(); phase.value = 'play'
}
function answer(option: LiturgicalItem) {
  if (solved.value || wrong.value.includes(option.id)) return
  if (option.id === current.value.id) {
    if (!wrong.value.length) firstTry.value++
    solved.value = true; feedback.value = `Správně! ${current.value.name}. ${current.value.description}`
  } else {
    wrong.value.push(option.id)
    feedback.value = 'Tahle možnost nesedí. Zkus jinou.'
  }
}
function next() {
  if (!solved.value) return
  if (index.value === 9) phase.value = 'done'
  else { index.value++; prepare() }
}
useRoundFocus(phase, index)
</script>
<template><div class="game-page"><GameHeader title="Co je to?" description="Poznej předmět podle obrázku nebo najdi obrázek k jeho názvu." />
<form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start"><div class="setup-illustration sage"><ItemArt id="bell" /></div><h2>Co budeme poznávat?</h2><div class="settings-grid"><ChoiceButtons id="difficulty" v-model="difficulty" label="Obtížnost" :options="[{ value: 1, label: 'Začínám', description: 'Známé předměty' }, { value: 2, label: 'Už to znám', description: 'Více předmětů' }, { value: 3, label: 'Výzva', description: 'Celá sakristie' }]" /><ChoiceButtons id="mode" v-model="mode" label="Způsob poznávání" :options="[{ value: 'names', label: 'Obrázek → název' }, { value: 'pictures', label: 'Název → obrázek' }]" /></div><p class="muted">10 otázek. Při každé odpovědi se dozvíš něco nového.</p><button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button></form>
<template v-else-if="phase === 'play'"><div class="round-stats"><span>Otázka <strong>{{ index + 1 }} z 10</strong></span><span>{{ ['Začínám', 'Už to znám', 'Výzva'][difficulty - 1] }}</span></div><progress class="progress" :value="index + (solved ? 1 : 0)" max="10" aria-label="Dokončené otázky" /><h2 class="question-title">{{ mode === 'names' ? 'Jak se jmenuje tento předmět?' : `Kde je ${current.name.toLocaleLowerCase('cs')}?` }}</h2><div v-if="mode === 'names'" class="question-art" :data-item-id="current.id"><ItemArt :id="current.id" :label="solved ? current.name : 'Předmět k poznání'" /></div><p v-else class="question-word" :data-item-id="current.id">{{ current.name }}</p><div class="quiz-options" :class="{ 'picture-options': mode === 'pictures' }"><button v-for="(option, i) in options" :key="option.id" class="quiz-option" :class="{ correct: solved && option.id === current.id, incorrect: wrong.includes(option.id) }" :data-item-id="option.id" :disabled="solved || wrong.includes(option.id)" @click="answer(option)"><span class="option-letter" aria-hidden="true">{{ 'ABCD'[i] }}</span><ItemArt v-if="mode === 'pictures'" :id="option.id" :label="option.name" /><span v-else>{{ option.name }}</span><span v-if="solved && option.id === current.id" class="option-verdict" aria-label="Správně">✓</span><span v-else-if="wrong.includes(option.id)" class="option-verdict" aria-label="Jiný předmět">↻</span></button></div><p class="game-message" :class="{ success: solved }" role="status">{{ feedback || 'Nikam nespěcháme. Máš čas si to promyslet.' }}</p><div class="next-row"><button v-if="solved" class="primary" @click="next">{{ index === 9 ? 'Zobrazit výsledek' : 'Další otázka' }} <span aria-hidden="true">→</span></button></div></template>
<ResultPanel v-else :message="`Prošel jsi všech 10 otázek. Na první pokus jsi poznal ${firstTry} z 10 předmětů. Každým pokusem se učíš!`" @again="start" @settings="phase = 'setup'" />
</div></template>
