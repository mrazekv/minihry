<script setup lang="ts">
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import { useRoundFocus } from '../../lib/focus'
import { computed, onBeforeUnmount, ref } from 'vue'
import { items } from '../../content/items'
import { memoryDeck, sample } from '../../lib/game'
import type { MemoryCard } from '../../lib/game'
import GameHeader from '../../components/GameHeader.vue'
import ItemArt from '../../components/ItemArt.vue'
import ResultPanel from '../../components/ResultPanel.vue'
const phase = ref<'setup' | 'play' | 'done'>('setup')
const pairs = ref(4)
const mode = ref('pictures')
const deck = ref<MemoryCard[]>([])
const open = ref<string[]>([])
const matched = ref<string[]>([])
const attempts = ref(0)
const locked = ref(false)
const message = ref('Otoč dvě kartičky a hledej dvojici.')
let timer: ReturnType<typeof setTimeout> | undefined
const byId = new Map(items.map(item => [item.id, item]))
const found = computed(() => matched.value.length)
function start() {
  clearTimeout(timer)
  const pool = pairs.value === 4 ? items.filter(item => item.level === 1) : items
  deck.value = memoryDeck(sample(pool, pairs.value).map(item => item.id), mode.value === 'names')
  open.value = []; matched.value = []; attempts.value = 0; locked.value = false
  message.value = 'Otoč dvě kartičky a hledej dvojici.'; phase.value = 'play'
}
function shown(card: MemoryCard) { return open.value.includes(card.key) || matched.value.includes(card.itemId) }
function flip(card: MemoryCard) {
  if (locked.value || shown(card)) return
  open.value.push(card.key)
  if (open.value.length < 2) { message.value = 'Teď vyber druhou kartičku.'; return }
  attempts.value++
  const [a, b] = open.value.map(key => deck.value.find(item => item.key === key)!)
  if (a!.itemId === b!.itemId) {
    matched.value.push(card.itemId); open.value = []
    message.value = `Dvojice! ${byId.get(card.itemId)!.name}. ${byId.get(card.itemId)!.description}`
    if (found.value === pairs.value) {
      locked.value = true
      timer = setTimeout(() => { phase.value = 'done' }, 850)
    }
  } else {
    locked.value = true; message.value = 'Tyto dvě k sobě nepatří. Zkus další dvojici.'
    timer = setTimeout(() => { open.value = []; locked.value = false }, 1100)
  }
}
onBeforeUnmount(() => clearTimeout(timer))
useRoundFocus(phase)
</script>
<template><div class="game-page"><GameHeader title="Pexeso ze sakristie" description="Otoč dvě kartičky a najdi, které patří k sobě." />
  <form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start"><div class="setup-illustration peach"><ItemArt id="chalice" /></div><h2>Jaké pexeso si zahraješ?</h2><div class="settings-grid"><ChoiceButtons id="pairs" v-model="pairs" label="Počet dvojic" :options="[{ value: 4, label: '4 dvojice', description: 'Na rozkoukání' }, { value: 6, label: '6 dvojic', description: 'Už to znám' }, { value: 10, label: '10 dvojic', description: 'Výzva' }]" /><ChoiceButtons id="mode" v-model="mode" label="Co hledáme?" :options="[{ value: 'pictures', label: 'Dva stejné obrázky' }, { value: 'names', label: 'Obrázek a název' }]" /></div><p class="muted">Bez časového limitu. Každý pokus se počítá jen pro zajímavost.</p><button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button></form>
  <template v-else-if="phase === 'play'"><div class="round-stats"><span>Dvojice <strong>{{ found }} / {{ pairs }}</strong></span><span>Pokusy <strong>{{ attempts }}</strong></span><button class="text-button" @click="start">Nové kolo ↻</button></div><p class="game-message" role="status">{{ message }}</p><div class="memory-grid" :class="{ 'many-cards': pairs === 10 }" :aria-label="`Pexeso, ${pairs} dvojic`"><button v-for="(card, index) in deck" :key="card.key" class="memory-card" :class="{ revealed: shown(card), matched: matched.includes(card.itemId) }" :data-item-id="card.itemId" :data-face="card.face" :aria-pressed="shown(card)" :aria-disabled="shown(card) || locked" :aria-label="shown(card) ? `${byId.get(card.itemId)!.name}${matched.includes(card.itemId) ? ', nalezená dvojice' : ''}` : `Otočit kartičku ${index + 1}`" @click="flip(card)"><template v-if="shown(card)"><ItemArt v-if="card.face === 'picture'" :id="card.itemId" /><span v-else class="memory-name">{{ byId.get(card.itemId)!.name }}</span><span v-if="matched.includes(card.itemId)" class="matched-tick" aria-hidden="true">✓</span></template><span v-else class="card-back" aria-hidden="true">✦</span></button></div></template>
  <ResultPanel v-else :message="`Našel jsi všech ${pairs} dvojic na ${attempts} pokusů. Chceš si je prohlédnout znovu?`" @again="start" @settings="phase = 'setup'" />
</div></template>
