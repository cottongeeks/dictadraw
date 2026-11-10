import paper from 'paper'
import { blob, blossom, branches, gradient, petal, ridge, stipple, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  skyTop: '#17152f',
  skyBottom: '#3a2c58',
  moon: '#f4e8d2',
  moonShade: '#e3d2b6',
  bark: '#07060f',
  hills: '#1d1834',
  petals: ['#f8dce6', '#fbeef2', '#efc3d3'],
  blush: '#de94b0',
  heart: '#8a3a5e',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'moonlight',
  draw({ width, height, random }) {
    new paper.Layer({ name: 'sky' })
    const sky = new paper.Path.Rectangle({ name: 'night', point: [0, 0], size: [width, height], fillColor: gradient([0, 0], [0, height], [colors.skyTop, colors.skyBottom]) })
    stipple(sky, { name: 'stars', count: 140, radius: [0.6, 1.7], rng: random('stars'), fillColor: colors.moon, opacity: 0.7, density: (_u, v) => 1 - v * 0.8 })
    const moon = new paper.Point(1030, 430)
    new paper.Path.Circle({ name: 'moon-glow', center: moon, radius: 420, fillColor: gradient(moon, moon.add([420, 0]), [['#f4e8d244', 0.5], ['#f4e8d200', 1]], true) })
    new paper.Path.Circle({ name: 'moon', center: moon, radius: 240, fillColor: colors.moon })
    const maria = new paper.Group({ name: 'moon-maria', opacity: 0.35 })
    const seas: [number, number, number, number][] = [[-80, -50, 62, 40], [40, 20, 50, 34], [-30, 105, 40, 26], [100, -95, 26, 20], [120, 70, 22, 16]]
    for (const [i, [dx, dy, rx, ry]] of seas.entries()) blob({ parent: maria, center: moon.add([dx, dy]), radius: [rx, ry], rotation: -20, points: 9, irregularity: 0.3, rng: random(`sea-${i}`), fillColor: colors.moonShade })
    ridge({ name: 'far-hills', y: [900, 860], amplitude: 30, waves: 2, rng: random('hills'), fillColor: colors.hills })

    const spots: { point: paper.Point; level: number }[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) return
      const count = Math.round(centerline.length / (level === 2 ? 40 : 26))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.2, 1)), level })
    }

    // Branches reach in from the top left and cross in front of the moon.
    new paper.Layer({ name: 'branches' })
    const reach: [string, [number, number], number, number, number][] = [
      ['branch-main', [-40, 230], 10, 440, 34],
      ['branch-lower', [-40, 640], -26, 300, 20],
    ]
    for (const [name, base, angle, length, width] of reach) {
      const rng = random(name)
      branches({ name, base, angle, length, width, depth: 5, forks: 2, spread: 34, shrink: 0.7, gnarl: 0.35, rng, onBranch: collect(rng.fork('spots')), fillColor: colors.bark })
    }

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      blossom({
        center: spot.point.add([rng.range(-9, 9), rng.range(-9, 9)]),
        radius: rng.range(9, 15),
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.5),
        fillColor: rng.pick(colors.petals),
        blush: colors.blush,
        heart: colors.heart,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 45; i++) {
      petal({ base: [drift.range(250, width - 30), drift.range(200, height - 30)], angle: drift.range(0, 360), length: drift.range(7, 12), width: drift.range(5, 8), fullness: 0.7, fillColor: drift.pick(colors.petals), opacity: drift.range(0.6, 1) })
    }
  },
} satisfies Artwork
