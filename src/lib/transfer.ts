import { computed, onBeforeUnmount, ref } from 'vue'

/** Touch/mouse/pen transfer. Selection changes only after a valid drop. */
export function useTransfer(drop: (id: string, zone: string) => void) {
  const drag = ref<{ id: string; pointer: number; x: number; y: number; startX: number; startY: number; moved: boolean; over: string | null } | null>(null)
  let source: HTMLElement | null = null
  let frame = 0
  let suppressClick = false
  const ghostStyle = computed(() => ({ left: `${drag.value?.x ?? 0}px`, top: `${drag.value?.y ?? 0}px` }))
  function zoneAt(x: number, y: number) {
    const zone = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-zone]')
    return zone && !zone.hasAttribute('disabled') ? zone.dataset.dropZone ?? null : null
  }
  function cancel() {
    const pointer = drag.value?.pointer
    drag.value = null
    cancelAnimationFrame(frame)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', finish)
    window.removeEventListener('pointercancel', cancel)
    window.removeEventListener('keydown', escape)
    window.removeEventListener('blur', cancel)
    if (pointer !== undefined && source?.hasPointerCapture(pointer)) source.releasePointerCapture(pointer)
    source = null
  }
  function scroll() {
    const state = drag.value
    if (!state?.moved) return
    const distance = state.y < 64 ? state.y - 64 : state.y > innerHeight - 64 ? state.y - innerHeight + 64 : 0
    if (distance) { window.scrollBy(0, Math.max(-12, Math.min(12, distance / 4))); state.over = zoneAt(state.x, state.y) }
    frame = requestAnimationFrame(scroll)
  }
  function begin(event: PointerEvent, id: string) {
    if (!event.isPrimary || event.button !== 0) return
    cancel(); suppressClick = false
    source = event.currentTarget as HTMLElement
    source.focus({ preventScroll: true })
    source.setPointerCapture(event.pointerId)
    drag.value = { id, pointer: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, moved: false, over: null }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', cancel)
    window.addEventListener('keydown', escape)
    window.addEventListener('blur', cancel)
  }
  function move(event: PointerEvent) {
    const state = drag.value
    if (!state || state.pointer !== event.pointerId) return
    state.x = event.clientX; state.y = event.clientY
    if (!state.moved && Math.hypot(state.x - state.startX, state.y - state.startY) > 6) {
      state.moved = true; suppressClick = true; frame = requestAnimationFrame(scroll)
    }
    if (state.moved) { event.preventDefault(); state.over = zoneAt(state.x, state.y) }
  }
  function finish(event: PointerEvent) {
    const state = drag.value
    if (!state || state.pointer !== event.pointerId) return
    const zone = zoneAt(event.clientX, event.clientY)
    cancel()
    if (state.moved && zone) drop(state.id, zone)
  }
  function escape(event: KeyboardEvent) { if (event.key === 'Escape') cancel() }
  function handleClick(action: () => void, event?: MouseEvent) {
    if (suppressClick && event?.detail !== 0) { suppressClick = false; return }
    suppressClick = false
    action()
  }
  onBeforeUnmount(cancel)
  return { drag, ghostStyle, begin, cancel, handleClick }
}
