import { computed, onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'
import type { OrderStep } from '../../content/learning'
interface DragState {
  id: string
  pointerId: number
  startX: number
  startY: number
  x: number
  y: number
  offsetX: number
  offsetY: number
  width: number
  moved: boolean
  overId: string | null
}
/** Pointer capture provides the same drag interaction for mouse, pen and touch. */
export function useOrderingDrag(ordered: Ref<OrderStep[]>, reorder: (from: number, offset: number) => Promise<void>) {
  const drag = ref<DragState | null>(null)
  const list = ref<HTMLOListElement | null>(null)
  let handle: HTMLButtonElement | null = null
  let scrollFrame = 0
  const draggedStep = computed(() => ordered.value.find(step => step.id === drag.value?.id))
  const ghostStyle = computed(() => drag.value ? {
    left: `${drag.value.x - drag.value.offsetX}px`, top: `${drag.value.y - drag.value.offsetY}px`, width: `${drag.value.width}px`,
  } : {})
  function targetAt(x: number, y: number): string | null {
    if (!list.value) return null
    const bounds = list.value.getBoundingClientRect()
    if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null
    const rows = Array.from(list.value.querySelectorAll<HTMLElement>('li[data-step-id]'))
    // Include gaps between cards in the nearest drop destination.
    return rows.reduce<{ id: string | null; distance: number }>((nearest, row) => {
      const box = row.getBoundingClientRect()
      const distance = Math.abs(y - (box.top + box.height / 2))
      return distance < nearest.distance ? { id: row.dataset.stepId!, distance } : nearest
    }, { id: null, distance: Infinity }).id
  }
  function autoScroll() {
    const state = drag.value
    if (!state?.moved) return
    const edge = 72
    const delta = state.y < edge ? -Math.min(14, (edge - state.y) / 4) : state.y > window.innerHeight - edge ? Math.min(14, (state.y - window.innerHeight + edge) / 4) : 0
    if (delta) { window.scrollBy(0, delta); state.overId = targetAt(state.x, state.y) }
    scrollFrame = requestAnimationFrame(autoScroll)
  }
  function cancel() {
    const pointerId = drag.value?.pointerId
    drag.value = null
    cancelAnimationFrame(scrollFrame)
    document.body.classList.remove('ordering-drag-active')
    if (pointerId !== undefined && handle?.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
    handle = null
  }
  function begin(event: PointerEvent, id: string) {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    cancel()
    handle = event.currentTarget as HTMLButtonElement
    const row = handle.closest('li')!
    const bounds = row.getBoundingClientRect()
    handle.focus({ preventScroll: true })
    handle.setPointerCapture(event.pointerId)
    drag.value = { id, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: event.clientX, y: event.clientY, offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top, width: bounds.width, moved: false, overId: id }
  }
  function update(event: PointerEvent) {
    const state = drag.value
    if (!state || state.pointerId !== event.pointerId) return
    state.x = event.clientX; state.y = event.clientY
    if (!state.moved && Math.hypot(state.x - state.startX, state.y - state.startY) >= 6) {
      state.moved = true; document.body.classList.add('ordering-drag-active'); scrollFrame = requestAnimationFrame(autoScroll)
    }
    if (state.moved) { event.preventDefault(); state.overId = targetAt(state.x, state.y) }
  }
  async function finish(event: PointerEvent) {
    const state = drag.value
    if (!state || state.pointerId !== event.pointerId) return
    const target = targetAt(event.clientX, event.clientY)
    const from = ordered.value.findIndex(step => step.id === state.id)
    const to = ordered.value.findIndex(step => step.id === target)
    const moved = state.moved
    cancel()
    if (moved && from >= 0 && to >= 0 && from !== to) {
      await reorder(from, to - from)
      list.value?.querySelector<HTMLButtonElement>(`li[data-step-id="${state.id}"] .drag-handle`)?.focus({ preventScroll: true })
    }
  }
  function dropClass(id: string) {
    if (!drag.value?.moved) return {}
    const from = ordered.value.findIndex(step => step.id === drag.value!.id)
    const to = ordered.value.findIndex(step => step.id === drag.value!.overId)
    return { dragging: drag.value.id === id, 'drop-before': drag.value.overId === id && to < from, 'drop-after': drag.value.overId === id && to > from }
  }
  function escape(event: KeyboardEvent) { if (event.key === 'Escape') cancel() }
  window.addEventListener('keydown', escape)
  onBeforeUnmount(() => { cancel(); window.removeEventListener('keydown', escape) })
  return { drag, list, draggedStep, ghostStyle, begin, update, finish, cancel, dropClass }
}
