// Seeded randomness. Every object draws from its own stream, keyed by name,
// so changing one leaf never reshuffles the rest of the illustration.

export interface Random {
  /** Uniform number in [0, 1). */
  next(): number
  range(min: number, max: number): number
  /** `value` scaled by a random factor in [1 - amount, 1 + amount]. */
  vary(value: number, amount: number): number
  pick<T>(items: readonly T[]): T
  /** An independent stream derived from this one. */
  fork(key: string | number): Random
}

export function createRandom(seed: string | number): Random {
  const key = String(seed)
  let state = hash(key)
  const next = () => {
    // mulberry32
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const range = (min: number, max: number) => min + (max - min) * next()
  return {
    next,
    range,
    vary: (value, amount) => value * range(1 - amount, 1 + amount),
    pick: (items) => items[Math.floor(next() * items.length)]!,
    fork: (child) => createRandom(`${key}/${child}`),
  }
}

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}
