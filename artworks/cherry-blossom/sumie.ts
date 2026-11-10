import paper from 'paper'
import { blossom, branches, gradient, petal, stipple, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  paper: '#f2ede3',
  fiber: '#bdb3a2',
  wash: '#6f6a64',
  ink: '#1e1c1a',
  inkMid: '#4d4945',
  pink: '#e7a1b2',
  bud: '#c9637f',
  seal: '#b5352a',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'sumie',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'paper' })
    const sheet = new paper.Path.Rectangle({ name: 'rice-paper', point: [0, 0], size: [width, height], fillColor: colors.paper })
    stipple(sheet, { name: 'fibers', count: 900, radius: [0.4, 1.1], rng: random('fibers'), fillColor: colors.fiber, opacity: 0.35 })
    // A soft pale wash behind the branch, fading out into the paper.
    const wash = new paper.Path.Circle({ name: 'wash', center: [1080, 300], radius: 520, fillColor: gradient([1080, 300], [1600, 300], [[`${colors.wash}1c`, 0], [`${colors.wash}00`, 1]], true) })
    wash.scale(1, 0.55)

    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 95 : 65))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.25, 1)), level })
    }

    // Each branch is painted twice from the same random stream: a broad pale
    // wash that bleeds into the paper, then the dark ink stroke over it.
    new paper.Layer({ name: 'branches' })
    const reach: [string, [number, number], number, number, number][] = [
      ['branch-main', [1560, 110], 168, 450, 30],
      ['branch-drop', [1560, 360], 192, 250, 15],
    ]
    for (const [name, base, angle, length, width] of reach) {
      const shape = { base, angle, length, depth: 4, forks: 2, spread: 36, shrink: 0.7, gnarl: 0.45 }
      branches({ ...shape, name: `${name}-wash`, width: width * 1.8, rng: random(name), fillColor: colors.wash }).opacity = 0.18
      branches({ ...shape, name, width, rng: random(name), onBranch: collect(random(`${name}-spots`)), fillColor: colors.ink })
    }

    // Mostly pink blossoms, some white ones outlined in ink, and dark buds.
    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      const center = spot.point.add([rng.range(-10, 10), rng.range(-10, 10)])
      const kind = rng.next()
      if (kind > 0.82) {
        new paper.Path.Circle({ center, radius: rng.range(3.5, 6), fillColor: colors.bud })
        continue
      }
      const outlined = kind > 0.55
      blossom({
        center,
        radius: rng.range(11, 17),
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.4),
        notch: 0.06,
        fillColor: outlined ? colors.paper : colors.pink,
        strokeColor: outlined ? colors.inkMid : null,
        strokeWidth: 1.1,
        opacity: outlined ? 1 : 0.9,
        heart: colors.ink,
        stamens: 7,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 8; i++) {
      petal({ base: [drift.range(380, 1100), drift.range(420, 900)], angle: drift.range(0, 360), length: drift.range(9, 13), width: drift.range(6, 8), fullness: 0.7, fillColor: colors.pink, opacity: 0.85 })
    }

    // A tall seal and a round one in the empty lower left.
    new paper.Layer({ name: 'seals' })
    const seal = new paper.Group({ name: 'seal', opacity: 0.88 })
    new paper.Path.Rectangle({ parent: seal, point: [120, 800], size: [56, 84], radius: 3, fillColor: colors.seal })
    new paper.Path.Rectangle({ parent: seal, point: [128, 808], size: [40, 68], strokeColor: colors.paper, strokeWidth: 2.5 })
    for (const y of [822, 842]) new paper.Path.Line({ parent: seal, from: [136, y], to: [160, y], strokeColor: colors.paper, strokeWidth: 3 })
    new paper.Path.Line({ parent: seal, from: [148, 852], to: [148, 868], strokeColor: colors.paper, strokeWidth: 3 })
    const round = new paper.Group({ name: 'seal-round', opacity: 0.88 })
    new paper.Path.Circle({ parent: round, center: [148, 762], radius: 17, fillColor: colors.seal })
    new paper.Path.Circle({ parent: round, center: [148, 762], radius: 9, strokeColor: colors.paper, strokeWidth: 2.5 })
  },
} satisfies Artwork
