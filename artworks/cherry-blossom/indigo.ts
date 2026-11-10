import paper from 'paper'
import { blossom, branches, petal, stipple, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  indigo: '#1e3456',
  pale: '#e8eef3',
  sky: '#a9bfd4',
  mid: '#6f8db0',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'indigo',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'cloth' })
    const cloth = new paper.Path.Rectangle({ name: 'indigo', point: [0, 0], size: [width, height], fillColor: colors.indigo })
    stipple(cloth, { name: 'weave', count: 1500, radius: [0.4, 1], rng: random('weave'), fillColor: colors.pale, opacity: 0.08 })

    // Seigaiha: rows of overlapping fans of concentric rings; later rows overlap earlier ones.
    new paper.Layer({ name: 'seigaiha' })
    const radius = 56
    for (let row = 0, y = 790; y < height + radius; row++, y += radius / 2) {
      const fans = new paper.Group({ name: `wave-row-${row}` })
      for (let x = row % 2 ? -radius : 0; x < width + radius; x += radius * 2) {
        new paper.Path.Circle({ parent: fans, center: [x, y], radius, fillColor: colors.indigo, strokeColor: colors.pale, strokeWidth: 3 })
        for (const scale of [0.74, 0.48, 0.22]) new paper.Path.Circle({ parent: fans, center: [x, y], radius: radius * scale, strokeColor: colors.pale, strokeWidth: 3 })
      }
    }

    // A sakura kamon: one large flat blossom inside a ring.
    new paper.Layer({ name: 'kamon' })
    const crest = new paper.Point(1170, 330)
    new paper.Path.Circle({ name: 'kamon-ring', center: crest, radius: 158, strokeColor: colors.pale, strokeWidth: 9 })
    blossom({ name: 'kamon-blossom', center: crest, radius: 128, rotation: -90, notch: 0.2, fillColor: colors.pale, heart: colors.indigo, stamens: 5 })
    new paper.Path.Circle({ name: 'kamon-eye', center: crest, radius: 9, fillColor: colors.pale })

    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 48 : 32))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.2, 1)), level })
    }

    new paper.Layer({ name: 'branches' })
    const reach: [string, [number, number], number, number, number][] = [
      ['branch-main', [-40, 170], 16, 380, 28],
      ['branch-lower', [-40, 470], -8, 270, 16],
    ]
    for (const [name, base, angle, length, width] of reach) {
      const rng = random(name)
      branches({ name, base, angle, length, width, depth: 4, forks: 2, spread: 34, shrink: 0.7, gnarl: 0.35, rng, onBranch: collect(rng.fork('spots')), fillColor: colors.sky })
    }

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      blossom({
        center: spot.point.add([rng.range(-9, 9), rng.range(-9, 9)]),
        radius: rng.range(10, 15),
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.4),
        fillColor: colors.pale,
        blush: colors.sky,
        heart: colors.indigo,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 30; i++) {
      petal({ base: [drift.range(350, width - 40), drift.range(120, 860)], angle: drift.range(0, 360), length: drift.range(8, 12), width: drift.range(6, 8), fullness: 0.7, fillColor: drift.next() < 0.7 ? colors.pale : colors.sky })
    }
  },
} satisfies Artwork
