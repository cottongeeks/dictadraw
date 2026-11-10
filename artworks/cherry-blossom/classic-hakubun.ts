import { readFileSync } from 'node:fs'
import paper from 'paper'
import { blob, blossom, branches, petal, stipple, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

// 櫻 in seal script, the traditional form of 桜 (see the file for its sources and license).
const sakuraGlyph = readFileSync(new URL('sakura-seal-script.svg', import.meta.url), 'utf8').match(/ d="([^"]+)"/)![1]!

const colors = {
  seal: '#c03a38',
  sky: '#fdf7f6',
  bark: '#7a3f60',
  barkDark: '#5a2b47',
  cloud: '#fbdce9',
  petals: ['#f7b3d0', '#ef8fbc', '#fad5e5', '#ea72a8'],
  blush: '#e05597',
  heart: '#b02a6a',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'classic',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'sky' })
    new paper.Path.Rectangle({ name: 'sky-fill', point: [0, 0], size: [width, height], fillColor: colors.sky })

    // Blossom positions collect while the branches grow; flowers are drawn on top.
    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 48 : 30))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.15, 1)), level })
    }

    const clouds = new paper.Layer({ name: 'blossom-clouds', opacity: 0.8 })
    new paper.Layer({ name: 'tree' })
    const trunk = new paper.Point(170, 760)
    taperedStroke({ name: 'trunk', spine: [[150, height + 20], [185, 900], [160, 820], trunk], width: (t) => 74 - 30 * t, fillColor: colors.barkDark })
    const limbs: [string, number, number, number, number, number][] = [
      // name, angle, length, width, depth, base height above the trunk top
      ['limb-up-left', -112, 230, 26, 4, 0],
      ['limb-up', -80, 260, 24, 4, 0],
      ['limb-diagonal', -42, 300, 18, 4, 40],
      ['limb-right', -14, 340, 20, 4, 120],
      ['limb-low', 6, 380, 16, 4, 200],
    ]
    for (const [name, angle, length, width, depth, drop] of limbs) {
      const rng = random(name)
      branches({ name, base: trunk.add([0, drop]), angle, length, width, depth, forks: 2, spread: 30, shrink: 0.72, gnarl: 0.4, rng, onBranch: collect(rng.fork('spots')), fillColor: colors.bark })
    }

    // Soft clouds of blossom behind the branches give the canopy its density.
    for (const [i, spot] of spots.entries()) {
      if (i % 4) continue
      const rng = random(`cloud-${i}`)
      blob({ parent: clouds, center: spot.point, radius: rng.range(26, 46), irregularity: 0.3, rng, fillColor: colors.cloud })
    }

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      const near = 1 - spot.point.x / width
      blossom({
        center: spot.point.add([rng.range(-10, 10), rng.range(-10, 10)]),
        radius: rng.range(9, 14) + 4 * near,
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.5),
        fillColor: rng.pick(colors.petals),
        blush: colors.blush,
        heart: colors.heart,
        stamens: near > 0.6 ? 6 : 0,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 40; i++) {
      const x = drift.range(500, width - 30)
      petal({ base: [x, drift.range(60, height - 60)], angle: drift.range(0, 360), length: drift.range(7, 12), width: drift.range(5, 8), fullness: 0.7, fillColor: drift.pick(colors.petals) })
    }

    // A hakubun seal stamped last, over everything: a tall block of vermilion with the
    // character cut out, so the paper shows through it. The block's edge wavers a
    // little and a few paper-colored specks show where the ink missed.
    new paper.Layer({ name: 'seal' })
    const seal = new paper.Group({ name: 'sakura-seal', opacity: 0.92 })
    const box = new paper.Rectangle(1312, 96, 84, 140)
    const edge = random('seal-edge')
    const rectangle = new paper.Path.Rectangle({ rectangle: box, radius: 3, insert: false })
    const outline = new paper.Path({ closed: true, insert: false })
    for (let d = 0; d < rectangle.length; d += 8) outline.add(rectangle.getPointAt(d).add([edge.range(-0.7, 0.7), edge.range(-0.7, 0.7)]))
    outline.smooth({ type: 'continuous' })
    const glyph = new paper.CompoundPath({ pathData: sakuraGlyph, insert: false })
    glyph.fitBounds(box.expand(-10))
    const block = outline.subtract(glyph, { insert: false })
    block.set({ name: 'seal-block', parent: seal, fillColor: colors.seal })
    stipple(block, { parent: seal, count: 18, radius: [0.4, 1.1], rng: random('seal-wear'), fillColor: colors.sky })
    seal.rotate(-1.5)
  },
} satisfies Artwork
