import paper from 'paper'
import { stipple, type Artwork } from '../../src/index.ts'

// The user's vintage pastel swatch for every fill, plus one deep plum (a darker
// shade of the mauve) used only for line work, so the pattern reads at a distance.
const colors = {
  thistle: '#d8bfd8',
  mauve: '#d1b1cb',
  taupe: '#cab7a2',
  cream: '#e8d4c1',
  sand: '#e5c8a5',
  grey: '#c9c0bb',
}
const ink = '#7f5b78'

const size = 1200
const center = new paper.Point(size / 2, size / 2)
const origin = new paper.Point(0, 0)
const polar = (angle: number, radius: number) => center.add(new paper.Point({ angle, length: radius }))
const disc = (name: string, radius: number, fillColor: string) => new paper.Path.Circle({ name, center, radius, fillColor })
const line = (name: string, radius: number, strokeColor: string, strokeWidth = 2) => new paper.Path.Circle({ name, center, radius, strokeColor, strokeWidth })
// `count` angles evenly around the circle, starting at `offset` degrees.
const around = (count: number, offset = 0) => Array.from({ length: count }, (_, k) => offset + (360 / count) * k)
// A group whose first child, `mask`, clips everything added to it later.
const clipped = (name: string, mask: paper.PathItem) => new paper.Group({ name, children: [mask], clipped: true })
const annulus = (outer: number, inner: number) =>
  new paper.Path.Circle({ center, radius: outer, insert: false }).subtract(new paper.Path.Circle({ center, radius: inner, insert: false }), { insert: false })

export default {
  width: size,
  height: size,
  seed: 'mandala',
  draw({ random }) {
    new paper.Layer({ name: 'ground' })
    new paper.Path.Rectangle({ name: 'paper', point: [0, 0], size: [size, size], fillColor: colors.cream })
    for (const [i, corner] of ([[0, 0], [size, 0], [size, size], [0, size]] as const).entries()) {
      const fan = new paper.Group({ name: `corner-${i}` })
      new paper.Path.Circle({ parent: fan, center: corner, radius: 70, fillColor: colors.mauve })
      for (const radius of [100, 130, 160]) new paper.Path.Circle({ parent: fan, center: corner, radius, strokeColor: ink, strokeWidth: 1.5 })
    }
    line('frame-ring', 586, ink)

    // A crown of triangles, each with a smaller cream triangle nested inside.
    new paper.Layer({ name: 'crown' })
    for (const [k, a] of around(48).entries()) {
      const step = 360 / 48 / 2
      new paper.Path({ name: `crown-${k}`, segments: [polar(a - step, 520), polar(a, 568), polar(a + step, 520)], closed: true, fillColor: k % 2 ? colors.thistle : colors.mauve, strokeColor: ink, strokeWidth: 1.5 })
      new paper.Path({ name: `crown-${k}-inner`, segments: [polar(a - step / 2, 520), polar(a, 548), polar(a + step / 2, 520)], closed: true, fillColor: colors.sand })
    }

    new paper.Layer({ name: 'dot-band' })
    disc('dot-band-ground', 528, colors.grey)
    line('dot-band-edge', 528, ink)
    for (const [k, a] of around(96).entries()) new paper.Path.Circle({ name: `dot-${k}`, center: polar(a, 514), radius: 3, fillColor: colors.cream })

    // A chain of circles, each passing through its neighbors' centers.
    new paper.Layer({ name: 'lattice' })
    disc('lattice-ground', 500, colors.sand)
    const lattice = clipped('lattice-lines', annulus(500, 440))
    for (const a of around(96)) new paper.Path.Circle({ parent: lattice, center: polar(a, 470), radius: 30, strokeColor: ink, strokeWidth: 1.2 })
    line('lattice-outer-edge', 500, ink)
    line('lattice-inner-edge', 440, ink)

    new paper.Layer({ name: 'lenses' })
    disc('lens-band', 439, colors.mauve)
    for (const [k, a] of around(24).entries()) lens(`lens-${k}`, polar(a, 420), a, 34, 15).set({ fillColor: colors.cream, strokeColor: ink, strokeWidth: 1.2 })
    for (const [k, a] of around(24, 7.5).entries()) new paper.Path.Circle({ name: `lens-dot-${k}`, center: polar(a, 420), radius: 3, fillColor: colors.cream })

    new paper.Layer({ name: 'field' })
    disc('field-ground', 400, colors.thistle)
    line('field-edge', 400, ink, 1.5)
    for (const [k, a] of around(72).entries()) new paper.Path.Circle({ name: `bead-${k}`, center: polar(a, 388), radius: 3, fillColor: colors.cream })
    // A diamond with a dot on either side of each gate.
    for (const [k, a] of around(4).flatMap((axis) => [axis - 30, axis + 30]).entries()) {
      new paper.Path.RegularPolygon({ name: `diamond-${k}`, center: polar(a, 345), sides: 4, radius: 18, fillColor: colors.sand, strokeColor: ink, strokeWidth: 1.5 }).rotate(a + 90)
      new paper.Path.Circle({ name: `diamond-${k}-dot`, center: polar(a, 345), radius: 4, fillColor: colors.cream })
    }

    new paper.Layer({ name: 'palace' })
    const walls = [colors.cream, colors.taupe, colors.sand, colors.grey]
    for (const [k, fillColor] of walls.entries()) palaceOutline(7 * k).set({ name: `wall-${k}`, fillColor })
    palaceOutline(0).set({ name: 'wall-outline', strokeColor: ink, strokeWidth: 2 })
    const floor = palaceOutline(25, false)
    const quadrants = [colors.mauve, colors.sand, colors.taupe, colors.grey]
    for (const [k, fillColor] of quadrants.entries()) {
      const wedge = new paper.Path({ segments: [center, center.add([-size, -size]), center.add([size, -size])], closed: true, insert: false })
      wedge.rotate(90 * k, center)
      floor.intersect(wedge, { insert: false }).set({ name: `quadrant-${['top', 'right', 'bottom', 'left'][k]}`, fillColor, parent: paper.project.activeLayer })
    }
    for (const [k, a] of around(4, 45).entries()) new paper.Path.Line({ name: `diagonal-${k}`, from: center, to: polar(a, 318), strokeColor: ink, strokeWidth: 1.5 })
    // Semicircle scallops along the inner face of each wall.
    const scallops = clipped('scallops', palaceOutline(25, false))
    for (const turn of [0, 90, 180, 270]) {
      for (const sign of [-1, 1]) {
        for (let x = 41; x <= 217; x += 16) {
          const at = new paper.Point(sign * x, -225).rotate(turn, origin).add(center)
          new paper.Path.Circle({ parent: scallops, center: at, radius: 7, fillColor: (x - 41) % 32 ? colors.cream : colors.thistle })
        }
      }
    }
    palaceOutline(25).set({ name: 'floor-edge', strokeColor: ink, strokeWidth: 1.5 })

    // The center: an eight-point star from two squares, around a seed-of-life rosette.
    new paper.Layer({ name: 'star' })
    disc('star-ground', 205, colors.cream)
    line('star-ground-edge', 205, ink)
    new paper.Path.Star({ name: 'octagram', center, points: 8, radius1: 196, radius2: 196 * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8), fillColor: colors.mauve })
    for (const [k, turn] of [0, 45].entries()) {
      new paper.Path.RegularPolygon({ name: `star-square-${k}`, center, sides: 4, radius: 196, strokeColor: ink, strokeWidth: 1.5 }).rotate(turn)
    }
    for (const [k, a] of around(8, -90).entries()) new paper.Path.Circle({ name: `star-point-${k}`, center: polar(a, 196), radius: 5, fillColor: colors.taupe })
    disc('sand-ring', 146, colors.sand)
    line('sand-ring-edge', 146, ink, 1.5)
    for (const [k, a] of around(16).entries()) new paper.Path.Circle({ name: `sand-ring-dot-${k}`, center: polar(a, 132), radius: 3, fillColor: colors.cream })
    disc('rosette-ground', 118, colors.thistle)
    const rosette = clipped('rosette', new paper.Path.Circle({ center, radius: 118, insert: false }))
    for (const a of around(8, -90)) new paper.Path.Circle({ parent: rosette, center: polar(a, 59), radius: 59, strokeColor: ink, strokeWidth: 1.2 })
    line('rosette-edge', 118, ink, 1.5)
    disc('center-ring', 30, colors.taupe)
    line('center-ring-edge', 30, ink, 1.5)
    disc('center', 18, colors.cream)
    disc('bindu', 7, colors.mauve)

    // Faint paper grain.
    const grain = new paper.Layer({ name: 'grain' })
    const sheet = new paper.Path.Rectangle({ point: [0, 0], size: [size, size], insert: false })
    stipple(sheet, { name: 'grain-light', parent: grain, count: 1400, radius: [0.5, 1.2], rng: random('grain-light'), fillColor: colors.cream, opacity: 0.7 })
    stipple(sheet, { name: 'grain-dark', parent: grain, count: 1000, radius: [0.5, 1.1], rng: random('grain-dark'), fillColor: colors.taupe, opacity: 0.7 })
  },
} satisfies Artwork

// A pointed lens (vesica) from the overlap of two equal circles, centered on
// `at` and pointing along `angle`.
function lens(name: string, at: paper.Point, angle: number, length: number, width: number): paper.PathItem {
  const [a, b] = [length / 2, width / 2]
  const radius = (a * a + b * b) / (2 * b)
  const offset = radius - b
  const upper = new paper.Path.Circle({ center: [0, -offset], radius, insert: false })
  const shape = upper.intersect(new paper.Path.Circle({ center: [0, offset], radius, insert: false }), { insert: false })
  shape.rotate(angle, origin)
  shape.translate(at)
  shape.set({ name, parent: paper.project.activeLayer })
  return shape
}

// The palace walls moved `inset` inward: a square with a T-shaped gate centered
// on each side. Moving every edge inward keeps nested wall bands even.
function palaceOutline(inset: number, insert = true): paper.Path {
  const [half, neckWidth, barWidth, neck, top] = [250, 58, 110, 30, 100]
  const i = inset
  const side: [number, number][] = [
    [-(half - i), -(half - i)],
    [-(neckWidth - i), -(half - i)],
    [-(neckWidth - i), -(half + neck + i)],
    [-(barWidth - i), -(half + neck + i)],
    [-(barWidth - i), -(half + top - i)],
    [barWidth - i, -(half + top - i)],
    [barWidth - i, -(half + neck + i)],
    [neckWidth - i, -(half + neck + i)],
    [neckWidth - i, -(half - i)],
  ]
  const segments = [0, 90, 180, 270].flatMap((turn) => side.map(([x, y]) => new paper.Point(x, y).rotate(turn, origin).add(center)))
  return new paper.Path({ segments, closed: true, insert })
}
