import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { items } from '../src/content/items'
import { seasonColors } from '../src/content/liturgical-colors'
import { latinPairs, massOrders, yearOrders } from '../src/content/learning'

const unique = (values: string[]) => expect(new Set(values).size).toBe(values.length)

describe('learning content integrity', () => {
  it('has a distinct usable drawing for all 20–30 liturgical items', () => {
    expect(items.length).toBeGreaterThanOrEqual(20)
    expect(items.length).toBeLessThanOrEqual(30)
    unique(items.map(item => item.id))
    unique(items.map(item => item.name))
    const svg = readFileSync(new URL('../src/assets/items.svg', import.meta.url), 'utf8')
    const symbols = [...svg.matchAll(/<symbol\b[^>]*\bid="([^"]+)"/g)].map(match => match[1])
    unique(symbols)
    for (const item of items) {
      expect(symbols, `Drawing for ${item.name}`).toContain(item.id)
      expect(item.description.trim()).not.toBe('')
      expect([1, 2, 3]).toContain(item.level)
    }
    // All three levels must offer at least four candidates for recognition.
    for (const level of [1, 2, 3]) expect(items.filter(item => item.level <= level).length).toBeGreaterThanOrEqual(4)
  })

  it('has unambiguous matching answers and enough Latin pairs at each level', () => {
    unique(latinPairs.map(pair => pair.id))
    unique(latinPairs.map(pair => pair.latin.toLocaleLowerCase('cs')))
    unique(latinPairs.map(pair => pair.czech.toLocaleLowerCase('cs')))
    for (const pair of latinPairs) {
      expect(pair.latin.trim()).not.toBe('')
      expect(pair.czech.trim()).not.toBe('')
      expect([1, 2, 3]).toContain(pair.level)
    }
    for (const level of [1, 2, 3]) expect(latinPairs.filter(pair => pair.level <= level).length).toBeGreaterThanOrEqual(4)
  })

  it('contains complete, distinct ordering cards', () => {
    unique([...massOrders, ...yearOrders].map(order => order.id))
    for (const order of [...massOrders, ...yearOrders]) {
      expect(order.steps.length).toBeGreaterThanOrEqual(4)
      unique(order.steps.map(step => step.id))
      unique(order.steps.map(step => step.label))
      for (const step of order.steps) expect(step.description.trim()).not.toBe('')
    }
  })

  it('preserves the two stretches of Ordinary Time around Lent and Easter', () => {
    // The two parts must remain distinct cards even though both are green.
    for (const order of yearOrders.filter(order => order.kind !== 'celebrations')) {
      const sequence = order.steps.map(step => step.id)
      expect(sequence.indexOf('ordinary-first')).toBeGreaterThan(sequence.indexOf('christmas'))
      expect(sequence.indexOf('lent')).toBeGreaterThan(sequence.indexOf('ordinary-first'))
      expect(sequence.indexOf('easter')).toBeGreaterThan(sequence.indexOf('lent'))
      expect(sequence.indexOf('ordinary-second')).toBeGreaterThan(sequence.indexOf('easter'))
      expect(sequence[0]).toBe('advent')
    }
  })

  it('offers a third level with chronologically unambiguous celebrations and their own colors', () => {
    expect(yearOrders).toHaveLength(3)
    const celebrations = yearOrders.find(order => order.kind === 'celebrations')!
    expect(celebrations.steps.map(step => step.id)).toEqual([
      'advent-sunday', 'christmas-day', 'epiphany', 'baptism', 'ash-wednesday',
      'palm-sunday', 'maundy-thursday', 'good-friday', 'easter-sunday', 'ascension',
      'pentecost', 'trinity', 'corpus-christi', 'assumption', 'all-saints', 'christ-king',
    ])
    // Red exceptions must not inherit the surrounding Lent/Easter period color.
    for (const id of ['palm-sunday', 'good-friday', 'pentecost']) expect(seasonColors[id].className).toBe('season-red')
    for (const id of ['christmas-day', 'epiphany', 'baptism', 'maundy-thursday', 'easter-sunday', 'ascension', 'trinity', 'corpus-christi', 'assumption', 'all-saints', 'christ-king']) expect(seasonColors[id].className).toBe('season-white')
    for (const order of yearOrders) for (const step of order.steps) {
      expect(seasonColors[step.id], `Color for ${step.label}`).toBeDefined()
      expect(seasonColors[step.id].label.trim()).not.toBe('')
      expect(seasonColors[step.id].explanation.trim()).not.toBe('')
    }
  })

})
