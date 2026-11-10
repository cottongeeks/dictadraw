import type { Random } from './random.ts'

export * from './organic.ts'
export * from './random.ts'

/** The default export of every `artworks/<name>/scene.ts`. */
export interface Artwork {
  width: number
  height: number
  /** Changing it rerolls every random stream at once. */
  seed?: string | number
  /** Builds the scene into the current Paper.js project. */
  draw(context: DrawContext): void
}

export interface DrawContext {
  width: number
  height: number
  /** The deterministic random stream for one named object. */
  random(key: string): Random
}
