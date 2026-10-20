export function shuffle<T>(values: readonly T[], random = Math.random): T[] {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}
export function sample<T>(values: readonly T[], count: number): T[] {
  return shuffle(values).slice(0, count)
}
export function shuffledOrder<T extends { id: string }>(values: readonly T[]): T[] {
  const mixed = shuffle(values)
  if (mixed.length > 1 && mixed.every((value, index) => value.id === values[index]!.id)) mixed.push(mixed.shift()!)
  return mixed
}
export function correctPositions<T extends { id: string }>(given: readonly T[], expected: readonly T[]): boolean[] {
  return given.map((step, index) => step.id === expected[index]?.id)
}
export interface MemoryCard { key: string; itemId: string; face: 'picture' | 'name' }
export function memoryDeck(ids: readonly string[], names: boolean): MemoryCard[] {
  return shuffle(ids.flatMap(itemId => [
    { key: `${itemId}-a`, itemId, face: 'picture' as const },
    { key: `${itemId}-b`, itemId, face: names ? 'name' as const : 'picture' as const },
  ]))
}
export function answerOptions<T extends { id: string }>(answer: T, pool: readonly T[], count = 4): T[] {
  return shuffle([answer, ...sample(pool.filter(item => item.id !== answer.id), count - 1)])
}
