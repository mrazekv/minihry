import { afterEach, describe, expect, it, vi } from 'vitest'
import { answerOptions, correctPositions, memoryDeck, shuffledOrder } from '../src/lib/game'
import {
  collides, GROUND, JUMP_SPEED, PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_X, tickJump,
} from '../src/games/runner/physics'

afterEach(() => vi.restoreAllMocks())

describe('Pexeso: každou dvojici lze skutečně najít', () => {
  const ids = ['chalice', 'paten', 'bell', 'missal']
  it.each([false, true])('má dvě jednoznačné karty na předmět, názvy = %s', names => {
    const deck = memoryDeck(ids, names)
    expect(deck).toHaveLength(ids.length * 2)
    expect(new Set(deck.map(card => card.key)).size).toBe(deck.length)
    expect(new Set(deck.map(card => card.itemId))).toEqual(new Set(ids))
    for (const id of ids) {
      const pair = deck.filter(card => card.itemId === id)
      expect(pair).toHaveLength(2)
      expect(pair.map(card => card.face).sort()).toEqual(names ? ['name', 'picture'] : ['picture', 'picture'])
    }
    expect(ids).toEqual(['chalice', 'paten', 'bell', 'missal'])
  })
  it('umí prázdnou sadu bez neplatných karet', () => expect(memoryDeck([], true)).toEqual([]))
})

describe('Poznávačka: odpověď se neztratí mezi možnostmi', () => {
  const pool = ['chalice', 'paten', 'bell', 'missal', 'alb', 'candle'].map(id => ({ id }))
  it('nabídne čtyři různé možnosti a právě jednu správnou', () => {
    for (const answer of pool) {
      const options = answerOptions(answer, pool)
      expect(options).toHaveLength(4)
      expect(new Set(options.map(item => item.id)).size).toBe(4)
      expect(options.filter(item => item.id === answer.id)).toHaveLength(1)
      expect(options.every(item => pool.some(candidate => candidate.id === item.id))).toBe(true)
    }
  })
  it('zařadí správnou odpověď i pokud chybí ve zdrojové sadě', () => {
    const answer = { id: 'monstrance' }
    const options = answerOptions(answer, pool)
    expect(options).toHaveLength(4)
    expect(new Set(options.map(item => item.id)).size).toBe(4)
    expect(options.filter(item => item.id === answer.id)).toEqual([answer])
  })
  it('malou sadu nedoplňuje falešnými ani opakovanými možnostmi', () => {
    const answer = pool[0]!
    for (const small of [[], [answer], pool.slice(0, 2)]) {
      const options = answerOptions(answer, small)
      expect(options).toHaveLength(new Set([answer.id, ...small.map(item => item.id)]).size)
      expect(new Set(options.map(item => item.id)).size).toBe(options.length)
      expect(options.filter(item => item.id === answer.id)).toHaveLength(1)
    }
  })
})

describe('Řazení: zadání není předem vyřešené', () => {
  const steps = ['a', 'b', 'c', 'd'].map(id => ({ id }))
  it('opraví i náhodné zamíchání, které ponechá původní pořadí', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999)
    const order = shuffledOrder(steps)
    expect(order.map(step => step.id)).not.toEqual(steps.map(step => step.id))
    expect(order).toHaveLength(steps.length)
    expect(new Set(order)).toEqual(new Set(steps))
    expect(steps.map(step => step.id)).toEqual(['a', 'b', 'c', 'd'])
  })
  it('bezpečně zpracuje nula a jeden krok', () => {
    expect(shuffledOrder([])).toEqual([])
    expect(shuffledOrder([steps[0]!])).toEqual([steps[0]])
  })
  it('označí právě správné pozice, včetně chybějící očekávané pozice', () => {
    expect(correctPositions(steps, steps)).toEqual([true, true, true, true])
    expect(correctPositions([steps[0]!, steps[2]!, steps[1]!, steps[3]!], steps)).toEqual([true, false, false, true])
    expect(correctPositions([{ id: 'a' }, { id: 'extra' }], [{ id: 'a' }])).toEqual([true, false])
  })
})

describe('Cesta ke kostelu: kolize a skok', () => {
  const floor = GROUND - PLAYER_HEIGHT
  const obstacle = { x: PLAYER_X + 10, width: 30, hit: false, passed: false }
  it('rozpozná překážku pod nohama i bezpečně přeskočenou', () => {
    expect(collides(floor, obstacle)).toBe(true)
    expect(collides(floor - 40, obstacle)).toBe(false)
    expect(collides(floor, { ...obstacle, x: PLAYER_X + PLAYER_WIDTH + 10 })).toBe(false)
    expect(collides(floor, { ...obstacle, x: PLAYER_X - obstacle.width - 10 })).toBe(false)
  })
  it('vystoupá, začne klesat a dopadne bez propadu nebo odrazu', () => {
    let state = { y: floor, velocity: JUMP_SPEED }
    let highestY = floor
    let wasRising = false
    let wasFalling = false
    for (let frame = 0; frame < 180; frame++) {
      state = tickJump(state.y, state.velocity, 1 / 60)
      highestY = Math.min(highestY, state.y)
      wasRising ||= state.velocity < 0
      wasFalling ||= state.velocity > 0
      expect(state.y).toBeLessThanOrEqual(floor)
    }
    expect(highestY).toBeLessThan(floor - 50)
    expect(wasRising).toBe(true)
    expect(wasFalling).toBe(true)
    expect(state).toEqual({ y: floor, velocity: 0 })
    expect(tickJump(state.y, state.velocity, 1 / 60)).toEqual(state)
  })
  it('větší krok při pádu zastaví na podlaze', () => {
    expect(tickJump(floor - 10, 300, 0.1)).toEqual({ y: floor, velocity: 0 })
  })
})
