import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { items } from '../src/content/items'
import { churchPlaces, handTowel, oddTasks, preparationTasks } from '../src/content/practice'
import { checkSelection } from '../src/lib/practice'

describe('Příprava sakristie', () => {
  it('vyžaduje všechny potřebné věci a žádné navíc, v libovolném pořadí', () => {
    expect(checkSelection(['a', 'b'], ['b', 'a']).correct).toBe(true)
    expect(checkSelection(['a'], ['a', 'b'])).toEqual({ missing: ['b'], extra: [], correct: false })
    expect(checkSelection(['a', 'b', 'c'], ['a', 'b'])).toEqual({ missing: [], extra: ['c'], correct: false })
    expect(checkSelection(['c'], ['a', 'b'])).toEqual({ missing: ['a', 'b'], extra: ['c'], correct: false })
    expect(checkSelection([], ['a']).correct).toBe(false)
  })
  it('má řešitelné úkoly, různé možnosti a samostatný ručník pro lavabo', () => {
    const ids = new Set([...items.map(item => item.id), handTowel.id])
    const svg = readFileSync(new URL('../src/assets/items.svg', import.meta.url), 'utf8')
    expect(svg).toContain(`id="${handTowel.id}"`)
    expect(new Set(preparationTasks.map(task => task.id)).size).toBe(preparationTasks.length)
    for (const task of preparationTasks) {
      expect(task.required.length).toBeGreaterThanOrEqual(2)
      const choices = [...task.required, ...task.distractors]
      expect(new Set(choices).size, task.id).toBe(choices.length)
      choices.forEach(id => expect(ids.has(id), id).toBe(true))
      expect(checkSelection(task.required, task.required).correct).toBe(true)
      expect(task.hint && task.explanation && task.title).toBeTruthy()
    }
    const lavabo = preparationTasks.find(task => task.id === 'lavabo')!
    expect(lavabo.required).toContain('hand-towel')
    expect(lavabo.distractors).toContain('purificator')
    expect(preparationTasks.filter(task => task.level === 1)).toHaveLength(5)
  })
})

describe('Nové obrázkové hry', () => {
  it('nabízí právě čtyři různé obrázky a jednoho vetřelce', () => {
    const ids = new Set([...items.map(item => item.id), handTowel.id])
    expect(new Set(oddTasks.map(task => task.id)).size).toBe(oddTasks.length)
    for (const task of oddTasks) {
      expect(task.members).toHaveLength(3)
      const choices = [...task.members, task.odd]
      expect(new Set(choices).size).toBe(4)
      choices.forEach(id => expect(ids.has(id), id).toBe(true))
      expect(task.question && task.explanation).toBeTruthy()
    }
  })
  it('má šest odlišných míst uvnitř plánku s kresbami a nápovědou', () => {
    expect(churchPlaces).toHaveLength(6)
    expect(new Set(churchPlaces.map(place => place.id)).size).toBe(6)
    for (const place of churchPlaces) {
      expect(items.some(item => item.id === place.id)).toBe(true)
      expect(place.x).toBeGreaterThan(10)
      expect(place.x).toBeLessThan(90)
      expect(place.y).toBeGreaterThanOrEqual(10)
      expect(place.y).toBeLessThan(90)
      expect(place.clue.trim()).not.toBe('')
    }
  })
})
