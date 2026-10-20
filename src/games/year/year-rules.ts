import type { OrderStep } from '../../content/learning'

/** The last selected event/period leads back to Advent in the next year. */
export function nextYearStep(steps: readonly OrderStep[], id: string): OrderStep | undefined {
  const index = steps.findIndex(step => step.id === id)
  return index < 0 ? undefined : steps[(index + 1) % steps.length]
}

/** Even spacing represents order, not the duration of a season. */
export function yearSlotPosition(index: number, total: number) {
  const angle = index * 2 * Math.PI / total
  return { left: `${50 + 40 * Math.sin(angle)}%`, top: `${50 - 40 * Math.cos(angle)}%` }
}

export function yearSegment(index: number, total: number) {
  const point = (part: number) => {
    const angle = part * 2 * Math.PI / total
    return `${180 + 144 * Math.sin(angle)} ${180 - 144 * Math.cos(angle)}`
  }
  return `M ${point(index + .07)} A 144 144 0 0 1 ${point(index + .93)}`
}

export const yearColorHex: Record<string, string> = {
  'season-violet': '#9b7eab', 'season-white': '#fdf9e9', 'season-green': '#789969',
  'season-red': '#b75c4e', 'season-triduum': '#bf9786',
}
