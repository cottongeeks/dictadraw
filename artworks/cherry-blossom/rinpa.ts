import paper from 'paper'
import { blob, blossom, branches, petal, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

const colors = {
  gold: ['#d6b263', '#d3ae5e', '#d9b669', '#d1ab5b'],
  seam: '#c29c4c',
  fold: '#9c7a38',
  stream: '#25303c',
  wave: '#cba757',
  bark: '#3b3428',
  moss: '#73814d',
  white: '#f7f0e0',
  pink: '#e48d9a',
  heart: '#b8862f',
}

export default {
  width: 1500,
  height: 1000,
  seed: 'rinpa',
  draw({ width, height, random }) {
    // Gold leaf laid in squares, on a screen of four folding panels.
    new paper.Layer({ name: 'gold-leaf' })
    const leaf = random('gold-leaf')
    const sheets = new paper.Group({ name: 'leaf-squares' })
    for (let x = 0; x < width; x += 125) {
      for (let y = 0; y < height; y += 125) {
        new paper.Path.Rectangle({ parent: sheets, point: [x, y], size: [125, 125], fillColor: leaf.pick(colors.gold), strokeColor: colors.seam, strokeWidth: 1 })
      }
    }
    for (const [i, x] of [375, 750, 1125].entries()) new paper.Path.Line({ name: `fold-${i}`, from: [x, 0], to: [x, height], strokeColor: colors.fold, strokeWidth: 2, opacity: 0.6 })

    // A stylized stream: a broad dark band with flowing gold lines clipped inside it.
    new paper.Layer({ name: 'stream' })
    const course: paper.PointLike[] = [[1230, -80], [1040, 240], [1150, 560], [960, 1080]]
    const water = taperedStroke({ name: 'water', spine: course, width: (t) => 260 + 180 * t, fillColor: colors.stream })
    const guide = new paper.Path({ segments: course, insert: false })
    guide.smooth({ type: 'catmull-rom' })
    const currents = new paper.Group({ name: 'currents', children: [water.clone({ insert: false })], clipped: true })
    for (let k = -9; k <= 9; k++) {
      const line = new paper.Path({ parent: currents, strokeColor: colors.wave, strokeWidth: 2.5, strokeCap: 'round' })
      for (let s = 0; s <= 60; s++) {
        const at = (guide.length * s) / 60
        const sway = Math.sin(s * 0.45 + k * 0.7) * 10
        line.add(guide.getPointAt(at).add(guide.getNormalAt(at).multiply(k * 22 + sway)))
      }
      line.smooth({ type: 'catmull-rom' })
    }

    const spots: { point: paper.Point; level: number }[] = []
    const mossy: paper.Point[] = []
    const collect = (rng: Random) => (centerline: paper.Path, level: number) => {
      if (level < 2) {
        for (let i = 0; i < centerline.length / 28; i++) mossy.push(centerline.getPointAt(centerline.length * rng.next()))
        return
      }
      const count = Math.round(centerline.length / (level === 2 ? 50 : 34))
      for (let i = 0; i < count; i++) spots.push({ point: centerline.getPointAt(centerline.length * rng.range(0.2, 1)), level })
    }

    new paper.Layer({ name: 'tree' })
    const limbs: [string, [number, number], number, number, number][] = [
      ['trunk', [230, 1060], -68, 330, 48],
      ['limb-side', [250, 820], -18, 300, 24],
    ]
    for (const [name, base, angle, length, width] of limbs) {
      const rng = random(name)
      branches({ name, base, angle, length, width, depth: 4, forks: 2, spread: 36, shrink: 0.7, gnarl: 0.45, rng, onBranch: collect(rng.fork('spots')), fillColor: colors.bark })
    }
    // Pooled green on the old wood, as in tarashikomi.
    const moss = new paper.Group({ name: 'moss' })
    for (const [i, point] of mossy.entries()) {
      const rng = random(`moss-${i}`)
      blob({ parent: moss, center: point, radius: rng.range(3, 8), irregularity: 0.3, rng, fillColor: colors.moss, opacity: 0.8 })
    }

    new paper.Layer({ name: 'blossoms' })
    for (const [i, spot] of spots.entries()) {
      const rng = random(`blossom-${i}`)
      blossom({
        center: spot.point.add([rng.range(-8, 8), rng.range(-8, 8)]),
        radius: rng.range(11, 17),
        rotation: rng.range(0, 360),
        tilt: rng.range(0, 0.35),
        fillColor: rng.next() < 0.6 ? colors.white : colors.pink,
        heart: colors.heart,
        stamens: 6,
      })
    }

    new paper.Layer({ name: 'falling-petals' })
    const drift = random('falling')
    for (let i = 0; i < 18; i++) {
      petal({ base: [drift.range(500, 1350), drift.range(150, 900)], angle: drift.range(0, 360), length: drift.range(10, 14), width: drift.range(7, 9), fullness: 0.7, fillColor: drift.next() < 0.6 ? colors.white : colors.pink })
    }
  },
} satisfies Artwork
