import { nextTick, watch } from 'vue'
import type { Ref } from 'vue'
/** Obnoví fokus, když se po změně kola odstraní právě použité tlačítko. */
export function useRoundFocus(phase: Ref<string>, step?: Ref<number>) {
  watch(() => [phase.value, step?.value], async () => {
    await nextTick()
    const selector = phase.value === 'done' ? '#result-title' : phase.value === 'setup'
      ? '.setup-panel h2' : '.question-title, .instruction, .game-message, .runner-instruction'
    const element = document.querySelector<HTMLElement>(selector)
    if (element) { element.setAttribute('tabindex', '-1'); element.focus() }
  }, { flush: 'post' })
}
