import { describe, expect, it } from 'vitest'
import { FINISH, STOP_POINTS, newWalk, routeAt, rowsForLevel, stopWalk, tickWalk } from '../src/games/procession/procession-rules'
import type { ProcessionLevel } from '../src/games/procession/procession-rules'

describe('Ministrantský průvod', () => {
  it('řadí společně kříž se svícemi a přidává kadidlo jen do slavnostní varianty', () => {
    expect(rowsForLevel(1).map(row => row.id)).toEqual(['cross', 'servers', 'priest'])
    expect(rowsForLevel(2).map(row => row.id)).toEqual(['incense', 'cross', 'servers', 'priest'])
  })
  it('při přiblížení k lavicím průvod srovná, ale neukončí hru', () => {
    const state = tickWalk({ ...newWalk(), x: 390 }, 0, false, .05, 1)
    expect(state.status).toBe('regroup')
    expect(state.corrections).toBe(1)
    expect(state.distance).toBe(0)
    expect(state.x).toBe(210)
    expect(tickWalk(state, 1, false, 1, 1)).toEqual(state)
  })
  it('vyžaduje zpomalení v úzkém průchodu', () => {
    const state = { ...newWalk(), distance: 650, x: routeAt(650, 2).center, stops: 1 }
    expect(tickWalk(state, 0, false, .05, 2).status).toBe('regroup')
    expect(tickWalk(state, 0, true, .05, 2).distance).toBeGreaterThan(650)
  })
  it('počítá jen zastavení u značek a vrátí přejetý průvod před značku', () => {
    expect(stopWalk(newWalk()).stops).toBe(0)
    const state = { ...newWalk(), distance: STOP_POINTS[0]!, x: routeAt(STOP_POINTS[0]!, 1).center }
    expect(stopWalk(state)).toMatchObject({ stops: 1, status: 'stopped' })
    const missed = tickWalk({ ...state, distance: state.distance + 12 }, 0, false, .05, 1)
    expect(missed.status).toBe('regroup')
    expect(missed.distance).toBeLessThan(STOP_POINTS[0]!)
    expect(missed.stops).toBe(0)
    expect(stopWalk(stopWalk(state)).stops).toBe(1)
  })
  it.each([1, 2] as ProcessionLevel[])('umožní dojít celý průvod úrovně %i bez chyb a obsloužit obě zastavení', level => {
    let state = newWalk()
    let ticks = 0
    while (state.status !== 'done' && ticks++ < 4000) {
      const stop = STOP_POINTS[state.stops]
      if (stop !== undefined && stop - state.distance < 20) {
        state = { ...stopWalk(state), status: 'moving' }
      }
      const target = routeAt(state.distance + 2, level)
      const direction = Math.max(-1, Math.min(1, (target.center - state.x) / 5))
      state = tickWalk(state, direction, level === 2 && state.distance > 590 && state.distance < 800, .05, level)
      expect(state.status).not.toBe('regroup')
    }
    expect(state.status).toBe('done')
    expect(state.distance).toBe(FINISH)
    expect(state.stops).toBe(2)
    expect(state.corrections).toBe(0)
  })
})
