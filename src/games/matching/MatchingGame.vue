<script setup lang="ts">
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import { useRoundFocus } from '../../lib/focus'
import { computed, onBeforeUnmount, ref } from 'vue'
import { latinPairs } from '../../content/learning'
import type { LatinPair } from '../../content/learning'
import { sample, shuffle } from '../../lib/game'
import GameHeader from '../../components/GameHeader.vue'
import ResultPanel from '../../components/ResultPanel.vue'
const phase = ref<'setup' | 'play' | 'done'>('setup')
const difficulty = ref(1)
const left = ref<LatinPair[]>([])
const right = ref<LatinPair[]>([])
const selectedLatin = ref<string | null>(null)
const selectedCzech = ref<string | null>(null)
const matched = ref<string[]>([])
const busy = ref(false)
const attempts = ref(0)
const message = ref('Vyber výraz vlevo a jeho význam vpravo.')
const count = computed(() => [4, 6, 8][difficulty.value - 1]!)
let timer: ReturnType<typeof setTimeout> | undefined
function start() {
  clearTimeout(timer)
  const chosen = sample(latinPairs.filter(pair => pair.level <= difficulty.value), count.value)
  left.value = shuffle(chosen); right.value = shuffle(chosen)
  selectedLatin.value = null; selectedCzech.value = null; matched.value = []; attempts.value = 0; busy.value = false
  message.value = 'Vyber výraz vlevo a jeho význam vpravo.'; phase.value = 'play'
}
function select(side: 'latin' | 'czech', id: string) {
  if (busy.value || matched.value.includes(id)) return
  if (side === 'latin') selectedLatin.value = selectedLatin.value === id ? null : id
  else selectedCzech.value = selectedCzech.value === id ? null : id
  if (!selectedLatin.value || !selectedCzech.value) { message.value = 'Teď vyber odpovídající kartičku v druhém sloupci.'; return }
  attempts.value++
  if (selectedLatin.value === selectedCzech.value) {
    const pair = left.value.find(item => item.id === id)!
    matched.value.push(id); message.value = `Správně! ${pair.latin} znamená ${pair.czech.toLocaleLowerCase('cs')}.`
    selectedLatin.value = null; selectedCzech.value = null
    if (matched.value.length === count.value) { busy.value = true; timer = setTimeout(() => { phase.value = 'done' }, 850) }
  } else {
    message.value = 'Tyhle dvě k sobě nepatří. Zkus jinou dvojici.'; busy.value = true
    timer = setTimeout(() => { selectedLatin.value = null; selectedCzech.value = null; busy.value = false }, 850)
  }
}
onBeforeUnmount(() => clearTimeout(timer))
useRoundFocus(phase)
</script>
<template><div class="game-page"><GameHeader title="Latina po kapkách" description="Spoj latinský výraz s jeho českým významem." /><form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start"><div class="setup-symbol rose" aria-hidden="true">Pax</div><h2>Pár slovíček pro začátek?</h2><ChoiceButtons id="difficulty" v-model="difficulty" label="Obtížnost" :options="[{ value: 1, label: 'Začínám', description: '4 jednoduchá slovíčka' }, { value: 2, label: 'Už to znám', description: '6 výrazů' }, { value: 3, label: 'Výzva', description: '8 výrazů' }]" /><p class="muted">Klepni na dvě kartičky, které patří k sobě. Pořadí výběru je na tobě.</p><button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button></form><template v-else-if="phase === 'play'"><div class="round-stats"><span>Spojeno <strong>{{ matched.length }} / {{ count }}</strong></span><span>Pokusy <strong>{{ attempts }}</strong></span></div><p class="game-message" role="status">{{ message }}</p><div class="matching-board"><section aria-labelledby="latin-heading"><h2 id="latin-heading">Latinsky</h2><button v-for="pair in left" :key="pair.id" class="latin-choice" :class="{ selected: selectedLatin === pair.id, matched: matched.includes(pair.id) }" :data-match-id="pair.id" data-side="latin" :aria-pressed="selectedLatin === pair.id" :disabled="matched.includes(pair.id) || busy" @click="select('latin', pair.id)"><span lang="la">{{ pair.latin }}</span><span v-if="matched.includes(pair.id)" aria-label="Spojeno">✓</span></button></section><section aria-labelledby="czech-heading"><h2 id="czech-heading">Česky</h2><button v-for="pair in right" :key="pair.id" class="latin-choice" :class="{ selected: selectedCzech === pair.id, matched: matched.includes(pair.id) }" :data-match-id="pair.id" data-side="czech" :aria-pressed="selectedCzech === pair.id" :disabled="matched.includes(pair.id) || busy" @click="select('czech', pair.id)"><span>{{ pair.czech }}</span><span v-if="matched.includes(pair.id)" aria-label="Spojeno">✓</span></button></section></div></template><ResultPanel v-else :message="`Spojil jsi všech ${count} dvojic na ${attempts} pokusů. Třeba některý výraz poznáš při příští mši.`" @again="start" @settings="phase = 'setup'" /></div></template>
