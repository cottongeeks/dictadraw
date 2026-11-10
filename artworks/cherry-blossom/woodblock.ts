import paper from 'paper'
import { blossom, branches, gradient, petal, ridge, stipple, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  paper: '#efe3cb',
  prussian: '#2d4a6a',
  sun: '#c8432f',
  mist: '#e6d6b8',
  hills: '#b9c3bd',
  ink: '#2a211e',
  petals: ['#fbf3ec', '#f8e3e1', '#fdf8f2'],
  blush: '#e89aa5',
  heart: '#a3323a',
  line: '#7a4a3c',
  seal: '#b7362a',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'woodblock',
  draw({ width, height, random }) {
    // Paper, a sky band graded from the top edge (bokashi), a red sun, distant hills.
    new paper.Layer({ name: 'sky' })
    const sheet = new paper.Path.Rectangle({ name: 'paper', point: [0, 0], size: [width, height], fillColor: colors.paper })
    new paper.Path.Rectangle({ name: 'bokashi', point: [0, 0], size: [width, 300], fillColor: gradient([0, 0], [0, 300], [colors.prussian, `${colors.prussian}00`]) })
    new paper.Path.Circle({ name: 'sun', center: [1110, 360], radius: 150, fillColor: colors.sun })
    ridge({ name: 'far-hills', y: [820, 760], amplitude: 40, waves: 2, rng: random('hills'), fillColor: colors.hills })
    ridge({ name: 'mist', y: [880, 860], amplitude: 18, waves: 3, rng: random('mist'), fillColor: colors.mist })

    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 55 : 36))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.2, 1)), level })
    }

    // One gnarled ink branch sweeps up from the lower left toward the sun.
    new paper.Layer({ name: 'branch' })
    const reach: [string, [number, number], number, number, number][] = [
      ['branch-main', [-40, 760], -22, 440, 42],
      ['branch-spur', [-40, 930], -8, 280, 22],
    ]
    for (const [name, base, angle, length, width] of reach) {
      const rng = random(name)
      branches({ name, base, angle, length, width, depth: 4, forks: 2, spread: 38, shrink: 0.7, gnarl: 0.5, rng, onBranch: collect(rng.fork('spots')), fillColor: colors.ink })
    }

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      blossom({
        center: spot.point.add([rng.range(-8, 8), rng.range(-8, 8)]),
        radius: rng.range(12, 18),
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.45),
        fillColor: rng.pick(colors.petals),
        strokeColor: colors.line,
        strokeWidth: 0.9,
        blush: colors.blush,
        heart: colors.heart,
        stamens: 6,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 26; i++) {
      petal({ base: [drift.range(450, width - 60), drift.range(120, height - 160)], angle: drift.range(0, 360), length: drift.range(9, 14), width: drift.range(6, 9), fullness: 0.7, fillColor: colors.petals[0]!, strokeColor: colors.line, strokeWidth: 0.8 })
    }

    // A red seal of nested squares, and the print's grain.
    new paper.Layer({ name: 'seal' })
    const seal = new paper.Group({ name: 'seal-stamp', opacity: 0.9 })
    new paper.Path.Rectangle({ parent: seal, point: [1370, 840], size: [62, 84], radius: 4, fillColor: colors.seal })
    new paper.Path.Rectangle({ parent: seal, point: [1378, 848], size: [46, 68], strokeColor: colors.paper, strokeWidth: 2.5 })
    for (const y of [862, 880, 898]) new paper.Path.Line({ parent: seal, from: [1388, y], to: [1414, y], strokeColor: colors.paper, strokeWidth: 3 })
    const grain = new paper.Layer({ name: 'grain' })
    stipple(sheet, { name: 'grain-dots', parent: grain, count: 1400, radius: [0.5, 1.2], rng: random('grain'), fillColor: '#8a7356', opacity: 0.18 })
  },
} satisfies Artwork
