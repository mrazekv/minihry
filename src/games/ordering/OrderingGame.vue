<script setup lang="ts">
import ChoiceButtons from '../../components/ChoiceButtons.vue'
import { seasonColors } from '../../content/liturgical-colors'
import { useOrderingDrag } from './useOrderingDrag'
import { useRoundFocus } from '../../lib/focus'
import { computed, nextTick, ref } from 'vue'
import { massOrders, yearOrders } from '../../content/learning'
import type { OrderStep } from '../../content/learning'
import { correctPositions, shuffledOrder } from '../../lib/game'
import GameHeader from '../../components/GameHeader.vue'
import ResultPanel from '../../components/ResultPanel.vue'
const props = defineProps<{ kind: 'mass' | 'year' }>()
const sets = computed(() => props.kind === 'mass' ? massOrders : yearOrders)
const difficulty = ref(0)
const phase = ref<'setup' | 'play' | 'done'>('setup')
const ordered = ref<OrderStep[]>([])
const checked = ref(false)
const checks = ref(0)
const hint = ref(false)
const feedback = ref('')
const current = computed(() => sets.value[difficulty.value]!)
const celebrations = computed(() => props.kind === 'year' && current.value.kind === 'celebrations')
const positions = computed(() => correctPositions(ordered.value, current.value.steps))
const title = computed(() => props.kind === 'mass' ? 'Jak jde mše za sebou?' : 'Cesta liturgickým rokem')
function start() {
  cancel()
  ordered.value = shuffledOrder(current.value.steps); checked.value = false; checks.value = 0; hint.value = false
  feedback.value = ''; phase.value = 'play'
}
async function move(index: number, offset: number, keepHandle = false) {
  const to = index + offset
  if (to < 0 || to >= ordered.value.length) return
  const item = ordered.value.splice(index, 1)[0]!
  ordered.value.splice(to, 0, item)
  checked.value = false
  feedback.value = `${item.label}: pozice ${to + 1} z ${ordered.value.length}.`
  await nextTick()
  const row = document.querySelector<HTMLElement>(`[data-step-id="${item.id}"]`)
  if (keepHandle) { row?.querySelector<HTMLButtonElement>('.drag-handle')?.focus(); return }
  const controls = Array.from(row?.querySelectorAll<HTMLButtonElement>('.order-controls button') || [])
  const preferred = controls[offset < 0 ? 0 : 1]
  ;(preferred && !preferred.disabled ? preferred : controls.find(button => !button.disabled))?.focus()
}
function check() {
  cancel()
  checks.value++; checked.value = true
  if (positions.value.every(Boolean)) phase.value = 'done'
  else feedback.value = `Správně je ${positions.value.filter(Boolean).length} z ${ordered.value.length} míst. Uprav pořadí a zkus to znovu.`
}
const { drag, list, draggedStep, ghostStyle, begin, update, finish, cancel, dropClass } = useOrderingDrag(ordered, move)
function setList(element: unknown) { list.value = element instanceof HTMLOListElement ? element : null }
function season(id: string) { return props.kind === 'year' ? seasonColors[id] : undefined }
useRoundFocus(phase)
</script>
<template>
  <div class="game-page ordering-page">
    <GameHeader :title="title" :description="kind === 'mass' ? 'Každá část má své místo. Sestav správné pořadí.' : celebrations ? 'Seřaď významné dny od první adventní neděle až ke Kristu Králi.' : 'Začni adventem a projdi celý liturgický rok.'" />
    <form v-if="phase === 'setup'" class="setup-panel" @submit.prevent="start">
      <div class="setup-symbol" :class="kind === 'mass' ? 'lilac' : 'yellow'" aria-hidden="true">{{ kind === 'mass' ? '≡' : '◷' }}</div>
      <h2>Jak podrobně se do toho pustíme?</h2>
      <ChoiceButtons id="difficulty" v-model="difficulty" label="Obtížnost" :options="sets.map((set, i) => ({ value: i, label: set.title }))" />
      <p class="muted">Kartičky můžeš přetahovat nebo přesouvat šipkami.</p>
      <button class="primary" type="submit">Začít hrát <span aria-hidden="true">→</span></button>
    </form>
    <template v-else-if="phase === 'play'">
      <div class="round-stats"><span>{{ current.title }}</span><button class="text-button" @click="hint = !hint">{{ hint ? 'Skrýt nápovědu' : 'Nápověda' }}</button></div>
      <p id="order-help" class="instruction">Přetáhni kartičky za úchyt ⠿ nebo použij šipky. Řadíme shora dolů.</p>
      <aside v-if="hint" class="hint-panel"><strong>Začínáme: {{ current.steps[0]!.label }}</strong><p>{{ current.steps[0]!.description }}</p><p v-if="celebrations">Nejdřív advent, potom Vánoce a velikonoční svátky. Na konci roku je slavnost Ježíše Krista Krále.</p><p v-else-if="kind === 'year'">Mezidobí má dva úseky: jeden před postní dobou a druhý po době velikonoční.</p></aside>
      <p v-if="celebrations" class="muted content-note">Řadíme jednotlivé dny, ne celá období. Barva patří danému slavení; datum Velikonoc se každý rok mění.</p><p v-else-if="kind === 'year'" class="muted content-note">Barvy ukazují základní barvu období; jednotlivé svátky mohou mít jinou.</p>
      <p v-if="kind === 'year' && difficulty === 1" class="muted content-note">Řadíme podle začátku období. Doba velikonoční začíná vigilií už během tridua.</p>
      <ol :ref="setList" class="order-list">
        <li v-for="(step, index) in ordered" :key="step.id" :data-step-id="step.id" :class="[season(step.id)?.className, dropClass(step.id), { 'position-correct': checked && positions[index], 'position-incorrect': checked && !positions[index] }]">
          <button type="button" class="drag-handle" :aria-label="`Přetáhnout ${step.label}`" aria-describedby="order-help" @pointerdown="begin($event, step.id)" @pointermove="update" @pointerup="finish" @pointercancel="cancel" @lostpointercapture="cancel" @keydown.up.prevent="move(index, -1, true)" @keydown.down.prevent="move(index, 1, true)"><span aria-hidden="true">⠿</span></button>
          <span class="step-number">{{ index + 1 }}</span>
          <span class="step-label">{{ step.label }}<small v-if="season(step.id)" class="season-label" :title="season(step.id)!.explanation"><i class="season-swatch" aria-hidden="true"></i>{{ season(step.id)!.label }}</small><small v-if="checked">{{ positions[index] ? '✓ Na správném místě' : '↕ Zkus jiné místo' }}</small></span>
          <div class="order-controls"><button :disabled="index === 0" :aria-label="`Posunout ${step.label} nahoru`" @click="move(index, -1)">↑</button><button :disabled="index === ordered.length - 1" :aria-label="`Posunout ${step.label} dolů`" @click="move(index, 1)">↓</button></div>
        </li>
      </ol>
      <Teleport to="body"><div v-if="drag?.moved && draggedStep" class="order-drag-preview" :class="season(draggedStep.id)?.className" :style="ghostStyle" aria-hidden="true"><span class="drag-grip">⠿</span><span class="step-label">{{ draggedStep.label }}<small v-if="season(draggedStep.id)" class="season-label">{{ season(draggedStep.id)!.label }}</small></span></div></Teleport>
      <p class="game-message" role="status">{{ feedback || 'Až budeš spokojený, zkontroluj pořadí.' }}</p>
      <div class="next-row"><button class="primary" @click="check">Zkontrolovat pořadí <span aria-hidden="true">✓</span></button></div>
    </template>
    <template v-else>
      <ResultPanel :message="`Všech ${ordered.length} částí je na správném místě. Počet kontrol: ${checks}.`" @again="start" @settings="phase = 'setup'" />
      <details class="explanation-list"><summary>Prohlédnout správné pořadí a vysvětlení</summary><ol><li v-for="step in current.steps" :key="step.id" :class="season(step.id)?.className"><strong>{{ step.label }}</strong><p>{{ step.description }}</p><p v-if="season(step.id)">{{ season(step.id)!.explanation }}</p></li></ol></details>
    </template>
  </div>
</template>
