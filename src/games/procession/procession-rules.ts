export type ProcessionLevel = 1 | 2
export interface ProcessionRow { id: string; label: string; explanation: string }
export const processionRows: ProcessionRow[] = [
  { id: 'incense', label: 'Kadidelnice a loďka', explanation: 'Pokud se používá kadidlo, ministranti s kadidelnicí a loďkou jdou v čele.' },
  { id: 'cross', label: 'Kříž a dvě svíce', explanation: 'Kříž jde mezi dvěma svícemi. V této hře tvoří společnou řadu v široké uličce.' },
  { id: 'servers', label: 'Ostatní ministranti', explanation: 'Ostatní ministranti následují za křížem a svícemi.' },
  { id: 'priest', label: 'Kněz', explanation: 'V našem jednoduchém vstupním průvodu jde kněz za ministranty.' },
]
export function rowsForLevel(level: ProcessionLevel) {
  return processionRows.filter(row => level === 2 || row.id !== 'incense')
}
export const FINISH = 1200
export const STOP_POINTS = [440, 1170]
export function routeAt(distance: number, level: ProcessionLevel) {
  const d = Math.max(0, Math.min(FINISH, distance))
  const wave = Math.sin(Math.PI * Math.max(0, Math.min(1, (d - 100) / 940)))
  const center = 210 + (level === 1 ? 48 : 65) * Math.sin((d - 100) / 150) * wave
  const narrow = level === 2 && d >= 610 && d <= 790
  return { center, width: narrow ? 94 : level === 1 ? 144 : 122, narrow }
}
export type WalkStatus = 'moving' | 'paused' | 'regroup' | 'stopped' | 'done'
export interface WalkState { distance: number; x: number; stops: number; corrections: number; status: WalkStatus; message: string }
export function newWalk(): WalkState {
  return { distance: 0, x: 210, stops: 0, corrections: 0, status: 'moving', message: 'Veď průvod středem uličky. Před oranžovou čárou zastav.' }
}
export function stopWalk(state: WalkState): WalkState {
  if (state.status !== 'moving') return state
  const stop = STOP_POINTS[state.stops]
  if (stop !== undefined && Math.abs(stop - state.distance) <= 45) {
    return { ...state, stops: state.stops + 1, status: 'stopped', message: 'Pěkné zastavení! Až budeš připravený, pokračuj.' }
  }
  return { ...state, status: 'paused', message: 'Průvod stojí. Pokračuj, až budeš chtít.' }
}
export function tickWalk(state: WalkState, direction: number, slow: boolean, seconds: number, level: ProcessionLevel): WalkState {
  if (state.status !== 'moving') return state
  const dt = Math.max(0, Math.min(seconds, .05))
  const distance = Math.min(FINISH, state.distance + (slow ? 15 : 32) * dt)
  const x = Math.max(30, Math.min(390, state.x + Math.max(-1, Math.min(1, direction)) * 100 * dt))
  const route = routeAt(distance, level)
  const stop = STOP_POINTS[state.stops]
  if (stop !== undefined && distance > stop + 12) {
    return { ...state, distance: stop - 20, x: routeAt(stop - 20, level).center, corrections: state.corrections + 1, status: 'regroup', message: 'Čáru jsme přešli. Kousek se vrátíme. Pokračuj a u čáry stiskni Zastavit.' }
  }
  if (Math.abs(x - route.center) > route.width / 2 - 32) {
    return { ...state, x: routeAt(state.distance, level).center, corrections: state.corrections + 1, status: 'regroup', message: 'Jsme moc blízko lavic. Průvod se srovná uprostřed. Pak můžeš pokračovat.' }
  }
  if (route.narrow && !slow) {
    return { ...state, x: routeAt(state.distance, level).center, corrections: state.corrections + 1, status: 'regroup', message: 'Tady je úzký průchod. Zapni Zpomal a pak pokračuj, aby průvod držel pohromadě.' }
  }
  return { ...state, distance, x, status: distance >= FINISH ? 'done' : 'moving' }
}
