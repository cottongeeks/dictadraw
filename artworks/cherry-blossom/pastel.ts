import paper from 'paper'
import { blob, blossom, branches, merge, petal, stipple, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

// The user's vintage pastels, with the deep plum for line work only.
const colors = {
  thistle: '#d8bfd8',
  mauve: '#d1b1cb',
  taupe: '#cab7a2',
  cream: '#e8d4c1',
  sand: '#e5c8a5',
  grey: '#c9c0bb',
}
const ink = '#7f5b78'

export default {
  width: 1500,
  height: 1000,
  seed: 'pastel',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'sky' })
    const sheet = new paper.Path.Rectangle({ name: 'paper', point: [0, 0], size: [width, height], fillColor: colors.cream })
    new paper.Path.Circle({ name: 'sun', center: [1060, 380], radius: 210, fillColor: colors.sand })
    for (const [i, radius] of [250, 285].entries()) new paper.Path.Circle({ name: `sun-ring-${i}`, center: [1060, 380], radius, strokeColor: colors.taupe, strokeWidth: 1.5 })

    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 60 : 40))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.2, 1)), level })
    }

    // Branches first, off-scene, so their blossom spots can shape the clouds behind them.
    const tree = new paper.Group({ name: 'tree' })
    const trunk = new paper.Point(170, 760)
    taperedStroke({ name: 'trunk', parent: tree, spine: [[150, height + 20], [185, 900], [160, 820], trunk], width: (t) => 66 - 26 * t, fillColor: ink })
    const limbs: [string, number, number, number, number][] = [
      ['limb-up-left', -112, 230, 24, 0],
      ['limb-up', -80, 260, 22, 0],
      ['limb-diagonal', -42, 300, 16, 40],
      ['limb-right', -14, 340, 18, 120],
      ['limb-low', 6, 380, 14, 200],
    ]
    for (const [name, angle, length, width, drop] of limbs) {
      const rng = random(name)
      branches({ name, parent: tree, base: trunk.add([0, drop]), angle, length, width, depth: 4, forks: 2, spread: 30, shrink: 0.72, gnarl: 0.4, rng, onBranch: collect(rng.fork('spots')), fillColor: ink })
    }
    tree.remove()

    // Flat blossom clouds: a mauve mass outlined in plum, a lighter thistle mass over it.
    new paper.Layer({ name: 'clouds' })
    const mass = (key: string, radius: [number, number], shift: paper.PointLike, every: number) =>
      spots
        .filter((_, i) => i % every === 0)
        .map((spot, i) => blob({ center: spot.point.add(shift), radius: random(`${key}-${i}`).range(...radius), irregularity: 0.25, rng: random(`${key}-${i}`) }))
    solid(merge(mass('back', [34, 52], [0, 0], 2), { name: 'cloud-back', fillColor: colors.mauve, strokeColor: ink, strokeWidth: 1.5 }))
    solid(merge(mass('front', [20, 34], [-8, -10], 3), { name: 'cloud-front', fillColor: colors.thistle }))

    paper.project.activeLayer.addChild(new paper.Layer({ name: 'branches', children: [tree] }))

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      if (i % 2) continue
      const rng = random(`blossom-${i}`)
      blossom({ center: spot.point.add([rng.range(-14, 14), rng.range(-14, 14)]), radius: rng.range(8, 13), rotation: rng.range(0, 360), tilt: rng.range(0, 0.4), fillColor: colors.cream, strokeColor: ink, strokeWidth: 0.8, blush: colors.mauve, heart: ink })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 34; i++) {
      petal({ base: [drift.range(480, width - 40), drift.range(80, height - 60)], angle: drift.range(0, 360), length: drift.range(9, 14), width: drift.range(6, 9), fullness: 0.7, fillColor: drift.pick([colors.mauve, colors.thistle, colors.cream]), strokeColor: ink, strokeWidth: 0.8 })
    }

    const grain = new paper.Layer({ name: 'grain' })
    stipple(sheet, { name: 'grain-dots', parent: grain, count: 1200, radius: [0.5, 1.2], rng: random('grain'), fillColor: colors.taupe, opacity: 0.6 })
  },
} satisfies Artwork

// Removes the small holes left where merged blobs don't quite meet.
function solid(shape: paper.PathItem) {
  if (!(shape instanceof paper.CompoundPath)) return
  for (const child of [...shape.children] as paper.Path[]) if (!child.clockwise) child.remove()
}
