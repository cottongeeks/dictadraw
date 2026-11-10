import paper from 'paper'
import { blob, crescent, leaf, stipple, taperedStroke, veins, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  paper: '#f3ecdf',
  grain: '#9a8768',
  stem: '#6e5f4d',
  leaf: '#687c58',
  leafUnderside: '#a9b49b',
  olives: ['#3b2b3c', '#4a3448', '#77843f'],
}

export default {
  width: 1000,
  height: 1250,
  seed: 'olive',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'paper' })
    const sheet = new paper.Path.Rectangle({ name: 'sheet', point: [0, 0], size: [width, height], fillColor: colors.paper })
    stipple(sheet, { name: 'grain', count: 900, radius: [0.6, 1.4], rng: random('grain'), fillColor: colors.grain, opacity: 0.14 })

    new paper.Layer({ name: 'branch' })
    const main = sprig('main', [[270, 1150], [340, 860], [520, 560], [790, 190]], { leaves: 18, size: 1, thickness: 13 }, random)
    const fork = main.getPointAt(main.length * 0.34)
    const twig = sprig('twig', [fork, fork.add([150, -60]), fork.add([300, -60])], { leaves: 7, size: 0.8, thickness: 5 }, random)

    const stalks = new paper.Group({ name: 'stalks' })
    const olives = new paper.Group({ name: 'olives' })
    const attach = twig.getPointAt(twig.length * 0.5)
    const hangs: paper.PointLike[] = [[-28, 72], [36, 92], [2, 138]]
    for (const [i, offset] of hangs.entries()) {
      const rng = random(`olive-${i}`)
      const center = attach.add(offset)
      const knee = attach.add(center.subtract(attach).multiply(0.5)).add([rng.range(-12, 12), -10])
      taperedStroke({ name: `olive-${i}-stalk`, parent: stalks, spine: [attach, knee, center], width: (s) => 4 - 2 * s, fillColor: colors.stem })
      const olive = blob({ name: `olive-${i}`, parent: olives, center, radius: [30, 40], rotation: rng.range(-25, 25), irregularity: 0.04, rng, fillColor: colors.olives[i]! })
      crescent(olive, { side: 40, depth: 14, fillColor: '#00000038' })
      crescent(olive, { side: -130, depth: 6, fillColor: '#ffffff30' })
    }
  },
} satisfies Artwork

// A stem with alternating leaves along it; returns the stem's centerline.
function sprig(
  name: string,
  spine: paper.PointLike[],
  { leaves: count, size, thickness }: { leaves: number; size: number; thickness: number },
  random: (key: string) => Random,
): paper.Path {
  const group = new paper.Group({ name })
  const guide = new paper.Path({ segments: spine, insert: false })
  guide.smooth({ type: 'catmull-rom' })
  for (let i = 0; i < count; i++) {
    const rng = random(`${name}-leaf-${i}`)
    const t = Math.min(0.99, 0.08 + (0.9 * (i + rng.range(-0.3, 0.3))) / (count - 1))
    const at = guide.length * t
    const side = i % 2 ? 1 : -1
    const angle = guide.getTangentAt(at).angle + side * rng.range(28, 50)
    const width = size * rng.vary(38 - 12 * t, 0.12)
    const blade = leaf({
      name: `${name}-leaf-${i}`,
      parent: group,
      base: guide.getPointAt(at),
      angle,
      length: size * rng.vary(210 - 90 * t, 0.12),
      width,
      bend: side * rng.range(0.04, 0.2),
      asymmetry: rng.range(-0.15, 0.15),
      fillColor: rng.next() < 0.3 ? colors.leafUnderside : colors.leaf,
    })
    crescent(blade, { side: angle + 90, depth: width * 0.35, fillColor: '#2a301f', opacity: 0.12 })
    veins(blade, { count: 0 })
  }
  taperedStroke({ name: `${name}-stem`, parent: group, spine, width: (t) => thickness * (1 - t) + 2.5, fillColor: colors.stem })
  return guide
}
