import { describe, expect, it } from 'vitest'
import { yearOrders } from '../src/content/learning'
import { nextYearStep, yearSegment, yearSlotPosition } from '../src/games/year/year-rules'

describe('Liturgický rok v kruhu', () => {
  it('má jednoho následujícího souseda pro každý krok a vrací se k adventu', () => {
    for (const order of yearOrders) {
      for (let i=0; i<order.steps.length; i++) {
        expect(nextYearStep(order.steps,order.steps[i]!.id)).toBe(order.steps[(i+1)%order.steps.length])
      }
      expect(nextYearStep(order.steps,order.steps.at(-1)!.id)?.id).toMatch(/^advent/)
    }
    expect(nextYearStep([], 'advent')).toBeUndefined()
    expect(nextYearStep(yearOrders[0]!.steps,'unknown')).toBeUndefined()
  })
  it('zachovává obě mezidobí i překryv tridua s počátkem velikonoční doby', () => {
    const steps=yearOrders[1]!.steps
    expect(nextYearStep(steps,'christmas')?.id).toBe('ordinary-first')
    expect(nextYearStep(steps,'ordinary-first')?.id).toBe('lent')
    expect(nextYearStep(steps,'triduum')?.id).toBe('easter')
    expect(nextYearStep(steps,'easter')?.id).toBe('ordinary-second')
    expect(nextYearStep(steps,'ordinary-second')?.id).toBe('advent')
  })
  it('začíná nahoře a všechna místa se vejdou do kruhu i pro 16 slavení', () => {
    for(const order of yearOrders){
      const positions=order.steps.map((_,i)=>yearSlotPosition(i,order.steps.length))
      expect(positions[0]).toEqual({left:'50%',top:'10%'})
      expect(parseFloat(positions[1]!.left)).toBeGreaterThan(50)
      expect(new Set(positions.map(p=>`${p.left},${p.top}`)).size).toBe(order.steps.length)
      for(let i=0;i<positions.length;i++){
        expect(parseFloat(positions[i]!.left)).toBeGreaterThanOrEqual(10)
        expect(parseFloat(positions[i]!.left)).toBeLessThanOrEqual(90)
        expect(parseFloat(positions[i]!.top)).toBeGreaterThanOrEqual(10)
        expect(parseFloat(positions[i]!.top)).toBeLessThanOrEqual(90)
        expect(yearSegment(i,positions.length)).not.toMatch(/NaN|Infinity/)
      }
    }
  })
})
