import paper from 'paper'
import { blob, gradient, merge, petal, ridge, stipple, taperedStroke, type Artwork } from '../../src/index.ts'

const colors = {
  sky: ['#8c84b4', '#d9a5a6', '#f6cf9f'],
  sun: '#fff0d2',
  cloud: '#f7d7c8',
  hills: ['#b7a0bd', '#9b8fae', '#7f8b77', '#55694b'],
  tree: '#3f5139',
  trunk: '#4a3d36',
  grass: ['#3e5536', '#4c6640', '#5d7a48'],
  flowers: ['#fbeedd', '#f0a07c', '#f6c88c'],
}

export default {
  width: 1600,
  height: 1000,
  seed: 'dusk',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'sky' })
    new paper.Path.Rectangle({ name: 'sky-gradient', point: [0, 0], size: [width, height], fillColor: gradient([0, 0], [0, 700], colors.sky) })
    const sun = new paper.Point(480, 610)
    new paper.Path.Circle({ name: 'sun-glow', center: sun, radius: 420, fillColor: gradient(sun, sun.add([420, 0]), ['#fff3dc99', '#fff3dc00'], true) })
    new paper.Path.Circle({ name: 'sun', center: sun, radius: 95, fillColor: colors.sun })
    const clouds: [number, number, number][] = [[300, 250, 220], [1150, 180, 160], [900, 330, 260]]
    for (const [i, [x, y, rx]] of clouds.entries()) {
      const rng = random(`cloud-${i}`)
      const puffs = [-0.45, 0, 0.4].map((dx, k) =>
        blob({ center: [x + dx * rx, y - (k === 1 ? 10 : 0)], radius: [rx * (k === 1 ? 0.55 : 0.5), k === 1 ? 26 : 16], points: 8, irregularity: 0.12, rng }),
      )
      merge(puffs, { name: `cloud-${i}`, fillColor: colors.cloud, opacity: 0.55 })
    }
    const birds: [number, number, number][] = [[1240, 300, 1], [1290, 330, 0.7]]
    for (const [i, [x, y, s]] of birds.entries()) {
      taperedStroke({ name: `bird-${i}`, spine: [[x - 22 * s, y - 8 * s], [x, y], [x + 22 * s, y - 10 * s]], width: 3.5 * s, fillColor: '#5b5070' })
    }

    new paper.Layer({ name: 'hills' })
    const crests: [number | [number, number], number, number][] = [
      [[590, 560], 40, 3],
      [[660, 610], 45, 2],
      [[730, 690], 55, 2],
      [[860, 820], 50, 3],
    ]
    const hills = crests.map(([y, amplitude, waves], i) =>
      ridge({ name: `hill-${i}`, y, amplitude, waves, rng: random(`hill-${i}`), fillColor: colors.hills[i]! }),
    )

    new paper.Layer({ name: 'tree' })
    const root = new paper.Point(1170, 680)
    taperedStroke({ name: 'trunk', spine: [root.add([0, 20]), root.add([-4, -45]), root.add([3, -95])], width: (t) => 12 - 6 * t, fillColor: colors.trunk })
    // Overlapping masses merged into one silhouette, then lit from the sun's side.
    const masses: [number, number, number][] = [[0, -130, 46], [-44, -112, 36], [44, -108, 38], [-24, -160, 38], [26, -166, 36], [0, -190, 30], [-62, -132, 24], [64, -134, 24]]
    const canopy = merge(
      masses.map(([dx, dy, r], i) => blob({ center: root.add([dx, dy]), radius: r, irregularity: 0.15, rng: random(`canopy-${i}`) })),
      { name: 'canopy', fillColor: colors.tree },
    )
    // A lumpy mass reads as one volume when its light and shade end on one smooth
    // terminator, so cut each with a large circle rather than a crescent.
    const { center, width: size } = canopy.bounds
    const cut = (dx: number, dy: number, radius: number) => new paper.Path.Circle({ center: center.add([dx * size, dy * size]), radius: radius * size, insert: false })
    canopy.subtract(cut(0.3, 0.12, 0.62)).set({ name: 'canopy-light', fillColor: '#d8c07e', opacity: 0.3 })
    canopy.subtract(cut(-0.25, -0.3, 0.74)).set({ name: 'canopy-shade', fillColor: '#1c2619', opacity: 0.4 })

    new paper.Layer({ name: 'foreground' })
    stipple(hills[3]!, { name: 'hill-3-grain', count: 500, radius: [0.8, 1.8], rng: random('hill-grain'), fillColor: '#2f3f2a', opacity: 0.35, density: (_u, v) => v })
    const grass = new paper.Group({ name: 'grass' })
    const rng = random('grass')
    for (let i = 0; i < 180; i++) {
      const x = rng.range(-20, width + 20)
      const tall = rng.range(70, 190)
      const lean = rng.range(-40, 40)
      const base = rng.range(5, 7)
      taperedStroke({
        parent: grass,
        spine: [[x, height + 10], [x + lean * 0.3, height - tall * 0.5], [x + lean, height - tall]],
        width: (t) => base * (1 - t),
        fillColor: rng.pick(colors.grass),
      })
    }
    const flowers = new paper.Group({ name: 'flowers' })
    for (let i = 0; i < 14; i++) {
      const r = random(`flower-${i}`)
      const base = new paper.Point(r.range(40, width - 40), height + 10)
      const head = base.add([r.range(-25, 25), -r.range(90, 170)])
      const flower = new paper.Group({ name: `flower-${i}`, parent: flowers })
      taperedStroke({ parent: flower, spine: [base, base.add(head).divide(2).add([r.range(-10, 10), 0]), head], width: (t) => 3 - 1.5 * t, fillColor: colors.grass[0]! })
      const color = r.pick(colors.flowers)
      const size = r.range(12, 20)
      for (let k = 0; k < 5; k++) petal({ parent: flower, base: head, angle: k * 72 + r.range(0, 72), length: size, width: size * 0.8, fullness: 0.7, fillColor: color })
      new paper.Path.Circle({ parent: flower, center: head, radius: size * 0.22, fillColor: '#c4823f' })
    }
  },
} satisfies Artwork
