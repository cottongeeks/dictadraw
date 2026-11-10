import paper from 'paper'
import { blob, crescent, gradient, leaf, petal, stipple, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  water: ['#2c6a6e', '#173f48'],
  ripple: '#d8efe8',
  shadow: '#0b2228',
  pads: ['#5d8c4c', '#6f9c55', '#4f7a43'],
  lotus: ['#efa9bb', '#f7cdd8'],
  gold: '#e9b949',
}

export default {
  width: 1200,
  height: 1200,
  seed: 'koi',
  draw({ width, height, random }) {
    const center = new paper.Point(width / 2, height / 2)

    new paper.Layer({ name: 'water' })
    new paper.Path.Rectangle({ name: 'pond', point: [0, 0], size: [width, height], fillColor: gradient(center, center.add([850, 0]), colors.water, true) })
    for (const [i, radius] of [150, 290, 420].entries()) {
      new paper.Path.Circle({ name: `ripple-${i}`, center: center.add([20, -10]), radius, strokeColor: colors.ripple, strokeWidth: 2, opacity: 0.08 })
    }

    new paper.Layer({ name: 'koi' })
    koi('koi-white', center, 235, 250, { body: '#f4eee4', patches: '#e0512b', fins: '#f6e6da' }, random('koi-white'))
    koi('koi-orange', center, 235, 70, { body: '#ef8a3a', patches: '#fbf3e8', fins: '#f6b27a' }, random('koi-orange'))

    new paper.Layer({ name: 'pads' })
    const pads: [number, number, number][] = [[940, 250, 150], [250, 960, 170], [1090, 600, 85], [120, 560, 75], [830, 1100, 110], [330, 130, 95]]
    for (const [i, [x, y, r]] of pads.entries()) lilyPad(`pad-${i}`, new paper.Point(x, y), r, random(`pad-${i}`))

    new paper.Layer({ name: 'lotus' })
    const bloom = new paper.Point(270, 930)
    new paper.Path.Circle({ name: 'lotus-shadow', center: bloom.add([10, 14]), radius: 80, fillColor: colors.shadow, opacity: 0.25 })
    for (const [ring, [count, length, offset]] of [[9, 92, 0], [7, 70, 20], [5, 46, 8]].entries()) {
      for (let k = 0; k < count!; k++) {
        const p = leaf({ name: `lotus-${ring}-${k}`, base: bloom, angle: (360 / count!) * k + offset!, length: length!, width: length! * 0.58, fillColor: colors.lotus[ring % 2]! })
        crescent(p, { side: (360 / count!) * k + offset! + 90, depth: length! * 0.12, fillColor: '#b8607a', opacity: 0.25 })
      }
    }
    const heart = new paper.Path.Circle({ name: 'lotus-heart', center: bloom, radius: 18, fillColor: colors.gold })
    stipple(heart, { count: 24, radius: 1.8, rng: random('lotus-heart'), fillColor: '#a8741f' })
  },
} satisfies Artwork

// A koi seen from above, swimming clockwise along a circle around `orbit`;
// `heading` is the angle on that circle where its head is.
function koi(name: string, orbit: paper.Point, radius: number, heading: number, palette: { body: string; patches: string; fins: string }, rng: Random) {
  const group = new paper.Group({ name })
  const spine = [0, 22, 44, 66, 88].map((back) => orbit.add(new paper.Point({ angle: heading - back, length: radius })))
  const guide = new paper.Path({ segments: spine, insert: false })
  guide.smooth({ type: 'catmull-rom' })
  const along = (t: number) => ({ point: guide.getPointAt(guide.length * t), angle: guide.getTangentAt(guide.length * t).angle })

  // Fins and shadow go under the body.
  const fins = new paper.Group({ name: `${name}-fins`, parent: group, opacity: 0.85 })
  const tail = along(1)
  for (const side of [-1, 1]) petal({ parent: fins, base: tail.point, angle: tail.angle + side * 24, length: 118, width: 56, fullness: 0.85, bend: side * 0.3, fillColor: palette.fins })
  const chest = along(0.27)
  for (const side of [-1, 1]) petal({ parent: fins, base: chest.point, angle: chest.angle + side * 120, length: 82, width: 36, fullness: 0.7, bend: side * 0.2, fillColor: palette.fins })

  const body = taperedStroke({ name: `${name}-body`, parent: group, spine, width: (t) => 78 * Math.sin(Math.PI * (0.04 + 0.96 * t) ** 0.6) + 3, fillColor: palette.body })
  const shadow = body.clone()
  shadow.set({ name: `${name}-shadow`, fillColor: colors.shadow, opacity: 0.3 })
  shadow.translate(new paper.Point(14, 18))
  shadow.insertBelow(fins)
  for (let i = 0; i < 3; i++) {
    const at = along(rng.range(0.08, 0.7))
    const patch = blob({ center: at.point.add(new paper.Point({ angle: at.angle + 90, length: rng.range(-20, 20) })), radius: rng.range(22, 38), irregularity: 0.3, rng: rng.fork(i), insert: false })
    body.intersect(patch).set({ name: `${name}-patch-${i}`, fillColor: palette.patches })
  }
  crescent(body, { name: `${name}-sheen`, side: -135, depth: 8, fillColor: '#ffffff', opacity: 0.3 }).bringToFront()
  const dorsal = [0.32, 0.42, 0.52, 0.62].map((t) => along(t).point)
  taperedStroke({ name: `${name}-dorsal`, parent: group, spine: dorsal, width: 9, fillColor: palette.fins, opacity: 0.4 })
  const head = along(0.06)
  for (const side of [-1, 1]) {
    new paper.Path.Circle({ parent: group, center: head.point.add(new paper.Point({ angle: head.angle + side * 90, length: 19 })), radius: 4, fillColor: '#1c1b1f' })
  }
}

// A round pad with its notch, a shadow on the water, and faint radial veins.
function lilyPad(name: string, center: paper.Point, radius: number, rng: Random) {
  const group = new paper.Group({ name })
  const notch = rng.range(0, 360)
  const pad = blob({ center, radius, points: 10, irregularity: 0.05, rng, insert: false })
  const wedge = new paper.Path({ segments: [center, center.add(new paper.Point({ angle: notch - 9, length: radius * 1.3 })), center.add(new paper.Point({ angle: notch + 9, length: radius * 1.3 }))], closed: true, insert: false })
  const leaf = pad.subtract(wedge, { insert: false })
  leaf.set({ name: `${name}-leaf`, fillColor: rng.pick(colors.pads), parent: group })
  const shadow = leaf.clone()
  shadow.set({ name: `${name}-shadow`, fillColor: colors.shadow, opacity: 0.3 })
  shadow.translate(new paper.Point(10, 14))
  shadow.insertBelow(leaf)
  crescent(leaf, { side: -135, depth: radius * 0.12, fillColor: '#e6f0c8', opacity: 0.2 })
  const veins = new paper.Group({ name: `${name}-veins`, parent: group, opacity: 0.22 })
  for (let k = 1; k < 12; k++) {
    const angle = notch + k * 30
    taperedStroke({ parent: veins, spine: [center, center.add(new paper.Point({ angle: angle + 4, length: radius * 0.5 })), center.add(new paper.Point({ angle, length: radius * 0.86 }))], width: (t) => 3 * (1 - t) + 0.5, fillColor: '#e6f0c8' })
  }
}
