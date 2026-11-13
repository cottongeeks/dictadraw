import paper from 'paper'
import { blob, crescent, gradient, stipple, type Artwork, type Random } from '../../src/index.ts'

// A compact cassette face on, after the "Nur geträumt" postcard, at the real
// cassette ratio: 100.4 × 63.8 mm at 20 units per mm.
const W = 2008
const H = 1276
const cx = W / 2

const layout = {
  corner: 44,
  label: { x: 88, y: 84, right: W - 88, bottom: 957, radius: 20 },
  panel: { x: 129, y: 114, right: 1426, bottom: 450, radius: 14, firstRule: 65, rulePitch: 61.5 },
  band: { top: 483, bottom: 809 },
  window: { x: 289, right: W - 289, y: 509, bottom: 789, radius: 26 },
  reels: { y: 649, offset: 433, radius: 114, ring: 22, shadow: 127, teeth: [5, -7] },
  tape: { frame: { half: 266, top: 520, bottom: 778 }, glass: { half: 248, top: 530, bottom: 768 }, packs: [403, 359], tick: 53 },
  trapezoid: { top: 1007, topHalf: 627, bottomHalf: 701, bevel: 12 },
  holes: { large: { offset: 495, y: 1206, dish: 43, rim: 61 }, small: { offset: 289, y: 1189, size: [89, 76] as [number, number] } },
  screws: [[65, 54], [W - 65, 54], [51, 1186], [W - 51, 1186], [cx, 1096]] as [number, number][],
  texture: { pitch: 20, ribs: 32 },
}

// The photo's plastic is lit from above; these are about 55% of its values.
const colors = {
  shell: ['#38342f', '#403b35'],
  slat: '#3d3933',
  slatLight: '#47433c',
  slatShade: '#2a2723',
  groove: '#16130f',
  rib: '#7d776d',
  ribShadow: '#1c1a17',
  recess: '#14120f',
  edge: '#0d0c0a',
  pink: '#f6094f',
  cream: '#e4d5c1',
  rule: '#c94f45',
  band: ['#c4468a', ['#a32b70', 0.55], '#861957'] as (string | [string, number])[],
  window: '#3d3a35',
  hubDisc: '#5a534b',
  hub: '#d8d0c0',
  hubShade: '#a89f90',
  tape: ['#b49a85', '#9c826e'],
  tapeRing: '#7c6452',
  glass: ['#776c60', ['#988c7d', 0.5], '#776c60'] as (string | [string, number])[],
  ink: '#f7eef2',
  steel: ['#efe7da', ['#cdc1b0', 0.55], '#968a78'] as (string | [string, number])[],
  recessCross: '#a69784',
}

export default {
  width: W,
  height: H,
  seed: 'cassette',
  draw({ random }) {
    shell(random)
    relief()
    label()
    cassetteWindow(random)
    new paper.Layer({ name: 'screws' })
    for (const [i, [x, y]] of layout.screws.entries()) screw(`screw-${i}`, new paper.Point(x, y), random(`screw-${i}`))
  },
} satisfies Artwork

const rounded = (x: number, y: number, right: number, bottom: number, radius: number, look: object = {}) =>
  new paper.Path.Rectangle({ rectangle: new paper.Rectangle(new paper.Point(x, y), new paper.Point(right, bottom)), radius, ...look })

// The ribbed plastic: horizontal slats with dark grooves, crossed by bright vertical ribs.
function shell(random: (key: string) => Random) {
  new paper.Layer({ name: 'body' })
  const body = rounded(0, 0, W, H, layout.corner, { name: 'shell', fillColor: gradient([0, 0], [0, H], colors.shell) })
  const texture = new paper.Group({ name: 'texture', children: [body.clone({ insert: false }).set({ name: '' })], clipped: true })
  const { pitch, ribs } = layout.texture
  const rows = Math.ceil(H / pitch) + 1
  const bands = (name: string, y: number, height: number, fillColor: string, opacity = 1) =>
    new paper.CompoundPath({
      name,
      parent: texture,
      fillColor,
      opacity,
      children: Array.from({ length: rows }, (_, k) => new paper.Path.Rectangle({ point: [0, k * pitch + y], size: [W, height], insert: false })),
    })
  bands('slat-light', 7, 3, colors.slatLight)
  bands('slat-shade', 17, 5, colors.slatShade, 0.8)
  bands('grooves', 1, 5, colors.groove)
  const step = W / ribs
  const columns = (name: string, dx: number, width: number, fillColor: string, opacity = 1) =>
    new paper.CompoundPath({
      name,
      parent: texture,
      fillColor,
      opacity,
      children: Array.from({ length: ribs }, (_, k) => new paper.Path.Rectangle({ point: [(k + 0.5) * step + dx, 0], size: [width, H], insert: false })),
    })
  columns('rib-shadows', -4, 3, colors.ribShadow, 0.8)
  columns('ribs', -1, 3.5, colors.rib)
  // Outside the clipped group: resvg 2.6 panics on translucent groups inside clip groups in some crops.
  const grain = (name: string, count: number, fillColor: string, opacity: number) =>
    stipple(body, { name, count, radius: [0.5, 1.4], rng: random(name), fillColor, opacity }).insertAbove(texture)
  grain('grain-dark', 1400, '#0b0a08', 0.5)
  grain('grain-light', 2600, '#8d867b', 0.35)
  rounded(2, 2, W - 2, H - 2, layout.corner - 2, { name: 'shell-rim', strokeColor: gradient([0, 0], [0, H], ['#3a3631', '#7a746a']), strokeWidth: 3.5, opacity: 0.8 })
}

// The channel around the label, and the raised trapezoid with its holes.
function relief() {
  new paper.Layer({ name: 'relief' })
  const { x, y, right, bottom, radius } = layout.label
  rounded(x - 10, y - 10, right + 10, bottom + 14, radius + 10, { name: 'label-recess', fillColor: colors.recess })

  const { top, topHalf, bottomHalf, bevel } = layout.trapezoid
  const slope = (bottomHalf - topHalf) / (H - top)
  const shift = bevel * Math.hypot(1, slope)
  const left = (y: number, inset = 0) => new paper.Point(cx - topHalf - slope * (y - top) + inset, y)
  const right_ = (y: number, inset = 0) => new paper.Point(cx + topHalf + slope * (y - top) - inset, y)
  const [tl, tr, bl, br] = [left(top), right_(top), left(H), right_(H)]
  const [tli, tri, bli, bri] = [left(top + bevel, shift), right_(top + bevel, shift), left(H, shift), right_(H, shift)]
  const trap = new paper.Group({ name: 'trapezoid' })
  const face = (name: string, points: paper.Point[], fillColor: string, opacity = 0.9) => new paper.Path({ name, parent: trap, segments: points, closed: true, fillColor, opacity })
  face('trapezoid-top', [tl, tr, tri, tli], '#57524a')
  face('trapezoid-left', [tl, tli, bli, bl], '#625d54')
  face('trapezoid-right', [tr, br, bri, tri], '#1e1c19')
  new paper.Path({ name: 'trapezoid-edge', parent: trap, segments: [bl, tl, tr, br], strokeColor: colors.edge, strokeWidth: 3 })
  new paper.Path({ name: 'trapezoid-shine', parent: trap, segments: [bli, tli, tri], strokeColor: '#9a9488', strokeWidth: 2, opacity: 0.7 })

  const holes = new paper.Group({ name: 'holes' })
  const { large, small } = layout.holes
  for (const [i, side] of [-1, 1].entries()) {
    const c = new paper.Point(cx + side * large.offset, large.y)
    const g = new paper.Group({ name: `capstan-hole-${i}`, parent: holes })
    const rim = new paper.Path.Circle({ parent: g, center: c, radius: large.rim, fillColor: '#46423b', strokeColor: colors.edge, strokeWidth: 2.5 })
    crescent(rim, { parent: g, side: 90, depth: 5, fillColor: '#8a847a', opacity: 0.5 })
    new paper.Path.Circle({
      parent: g,
      center: c,
      radius: large.dish,
      fillColor: gradient(c.add([-34, -34]), c.add([30, 30]), ['#1e1b18', ['#4a463f', 0.45], '#8a847a']),
      strokeColor: colors.edge,
      strokeWidth: 2,
    })
  }
  for (const [i, side] of [-1, 1].entries()) {
    const c = new paper.Point(cx + side * small.offset, small.y)
    const [w, h] = small.size
    const g = new paper.Group({ name: `guide-hole-${i}`, parent: holes })
    rounded(c.x - w / 2 - 3, c.y - h / 2 - 3, c.x + w / 2 + 3, c.y + h / 2 + 3, 32, { parent: g, strokeColor: '#5c574e', strokeWidth: 3, opacity: 0.6 })
    const hole = rounded(c.x - w / 2, c.y - h / 2, c.x + w / 2, c.y + h / 2, 30, { parent: g, fillColor: gradient(c.add([0, -h / 2]), c.add([0, h / 2]), ['#0e0c0a', '#231f1b']) })
    crescent(hole, { parent: g, side: 90, depth: 4, fillColor: '#6a645a', opacity: 0.6 })
  }
}

// The pink label: cream writing panel with rules, the purple band, and "SEITE A".
function label() {
  new paper.Layer({ name: 'label' })
  const { x, y, right, bottom, radius } = layout.label
  rounded(x, y, right, bottom, radius, { name: 'label-pink', fillColor: colors.pink })
  const p = layout.panel
  rounded(p.x, p.y, p.right, p.bottom, p.radius, { name: 'writing-panel', fillColor: colors.cream })
  new paper.CompoundPath({
    name: 'rules',
    fillColor: colors.rule,
    children: Array.from({ length: 5 }, (_, k) =>
      new paper.Path.Rectangle({ point: [p.x + 59, p.y + p.firstRule + k * p.rulePitch - 1.5], size: [p.right - 47 - (p.x + 59), 3], insert: false }),
    ),
  })
  const { top, bottom: bandBottom } = layout.band
  new paper.Path.Rectangle({ name: 'band', point: [x, top], size: [right - x, bandBottom - top], fillColor: gradient([x, 0], [right, 0], colors.band) })
  seiteA((x + layout.window.x) / 2, layout.reels.y)
}

// "SEITE" in a condensed sans over a large light "A", centered on (x, y).
function seiteA(x: number, y: number) {
  const g = new paper.Group({ name: 'seite-a' })
  const s = 6.6
  const ink = { parent: g, strokeColor: colors.ink, strokeWidth: s, strokeCap: 'butt', strokeJoin: 'miter' }
  const cap = 41
  const top = y - 75
  const widths = [23.5, 19.7, 7.4, 25.6, 20.7]
  const gaps = [6, 6, 2.5, 5]
  let left = x - (widths.reduce((a, b) => a + b) + gaps.reduce((a, b) => a + b)) / 2
  const a = s / 2
  const glyphs: ((w: number) => paper.Path[])[] = [
    (w) => [
      new paper.Path({
        segments: [
          new paper.Segment([w - a, 0.27 * cap], [0, 0], [0, -0.13 * cap]),
          new paper.Segment([w / 2, a], [0.3 * w, 0], [-0.3 * w, 0]),
          new paper.Segment([a, 0.27 * cap], [0, -0.12 * cap], [0, 0.13 * cap]),
          new paper.Segment([w / 2, 0.5 * cap], [-0.32 * w, -0.05 * cap], [0.32 * w, 0.05 * cap]),
          new paper.Segment([w - a, 0.74 * cap], [0, -0.13 * cap], [0, 0.12 * cap]),
          new paper.Segment([w / 2, cap - a], [0.3 * w, 0], [-0.3 * w, 0]),
          new paper.Segment([a, 0.73 * cap], [0, 0.13 * cap], [0, 0]),
        ],
      }),
    ],
    (w) => [new paper.Path({ segments: [[w, a], [a, a], [a, cap - a], [w, cap - a]] }), new paper.Path({ segments: [[a, cap / 2], [w - 1.5, cap / 2]] })],
    () => [new paper.Path({ segments: [[a, 0], [a, cap]] })],
    (w) => [new paper.Path({ segments: [[0, a], [w, a]] }), new paper.Path({ segments: [[w / 2, a], [w / 2, cap]] })],
  ]
  for (const [i, w] of widths.entries()) {
    const glyph = glyphs[i === 4 ? 1 : i]!
    for (const stroke of glyph(w)) stroke.set(ink).translate(new paper.Point(left, top))
    left += w + (gaps[i] ?? 0)
  }

  // The "A" is filled: two legs meeting in a short flat apex, and a crossbar.
  const [w, h, t] = [80, 88, 7.6]
  const c = w / 2
  const q = 6
  const slope = (c - q) / h
  const leg = t * Math.hypot(1, slope)
  const notch = (leg - q) / slope
  const chevron = new paper.Path({ segments: [[0, h], [c - q, 0], [c + q, 0], [w, h], [w - leg, h], [c, notch], [leg, h]], closed: true, insert: false })
  const outline = new paper.Path({ segments: [[0, h], [c - q, 0], [c + q, 0], [w, h]], closed: true, insert: false })
  const bar = outline.intersect(new paper.Path.Rectangle({ point: [0, 0.64 * h - t * 0.42], size: [w, t * 0.85], insert: false }), { insert: false })
  const letter = chevron.unite(bar, { insert: false })
  letter.set({ name: 'letter-a', fillColor: colors.ink })
  letter.translate(new paper.Point(x - c, top + cap + 21))
  g.addChild(letter)
}

// The dark window with both reels and the tape window between them.
function cassetteWindow(random: (key: string) => Random) {
  new paper.Layer({ name: 'window' })
  const win = layout.window
  const panel = rounded(win.x, win.y, win.right, win.bottom, win.radius, { name: 'window-panel', fillColor: colors.window })
  stipple(panel, { name: 'window-grain', count: 900, radius: [0.5, 1.2], rng: random('window-grain'), fillColor: '#857d71', opacity: 0.3 })
  const r = layout.reels
  for (const [i, side] of [-1, 1].entries()) reel(i ? 'reel-right' : 'reel-left', new paper.Point(cx + side * r.offset, r.y), r.teeth[i]!)
  tapeWindow(random)
}

function reel(name: string, c: paper.Point, offset: number) {
  const { radius, ring, shadow } = layout.reels
  const g = new paper.Group({ name })
  new paper.Path.Circle({ parent: g, name: `${name}-shadow`, center: c, radius: shadow, fillColor: '#191714' })
  new paper.Path.Circle({
    parent: g,
    name: `${name}-hub`,
    center: c,
    radius,
    fillColor: gradient(c.add([-radius, -radius]), c.add([radius, radius]), ['#e6dfd1', colors.hub, '#c8bfae']),
    strokeColor: colors.hubShade,
    strokeWidth: 1.5,
  })
  const inner = radius - ring
  const disc = new paper.Path.Circle({ parent: g, name: `${name}-hole`, center: c, radius: inner, fillColor: colors.hubDisc, strokeColor: colors.hubShade, strokeWidth: 1.5 })
  crescent(disc, { parent: g, side: -120, depth: 6, fillColor: '#2d2924', opacity: 0.45 })
  const teeth = new paper.Group({ parent: g, name: `${name}-teeth` })
  for (let k = 0; k < 6; k++) {
    const angle = offset + k * 60
    const tooth = new paper.Path.Rectangle({ parent: teeth, point: [inner - 20, -12.5], size: [24, 25], radius: 2, fillColor: colors.hub })
    tooth.rotate(angle, new paper.Point(0, 0))
    tooth.translate(c)
    crescent(tooth, { parent: teeth, side: angle + 90, depth: 3, fillColor: colors.hubShade, opacity: 0.45 })
  }
}

function tapeWindow(random: (key: string) => Random) {
  const { frame, glass, packs, tick } = layout.tape
  const g = new paper.Group({ name: 'tape-window' })
  rounded(cx - frame.half, frame.top, cx + frame.half, frame.bottom, 4, { parent: g, name: 'tape-frame', fillColor: '#2a2824', strokeColor: '#655e53', strokeWidth: 2 })
  const pane = rounded(cx - glass.half, glass.top, cx + glass.half, glass.bottom, 2, { insert: false })
  const view = new paper.Group({ parent: g, name: 'tape-view', children: [pane.clone({ insert: false })], clipped: true })
  rounded(cx - glass.half, glass.top, cx + glass.half, glass.bottom, 2, { parent: view, name: 'tape-glass', fillColor: gradient([cx - 60, 0], [cx + 90, 0], colors.glass) })
  const { offset, y } = layout.reels
  for (const [i, side] of [-1, 1].entries()) {
    const hub = new paper.Point(cx + side * offset, y)
    const radius = packs[i]!
    const name = i ? 'tape-right' : 'tape-left'
    const pack = new paper.Group({ parent: view, name })
    new paper.Path.Circle({ parent: pack, center: hub, radius, fillColor: gradient([0, glass.top], [0, glass.bottom], colors.tape), strokeColor: '#6e5948', strokeWidth: 2 })
    const rng = random(name)
    for (let k = 0, rr = radius - rng.range(14, 24); rr > 200; k++, rr -= rng.range(30, 52)) {
      new paper.Path.Circle({ parent: pack, center: hub, radius: rr, strokeColor: colors.tapeRing, strokeWidth: rng.range(1, 2.2), opacity: rng.range(0.35, 0.6) })
    }
  }
  // Clear plastic catching the light at both ends of the window.
  for (const [side, bulge] of [[-1, 9], [1, 24]] as const) {
    const edge = cx + side * glass.half
    const circle = new paper.Path.Circle({ center: [edge + side * 320, y], radius: 320 + bulge, insert: false })
    pane.intersect(circle, { insert: false }).set({ name: side < 0 ? 'glint-left' : 'glint-right', fillColor: '#ece6da', opacity: side < 0 ? 0.6 : 0.85 }).addTo(view)
  }
  const scale = new paper.Group({ parent: g, name: 'tape-scale' })
  new paper.Path.Rectangle({ parent: scale, point: [cx - glass.half + 8, y - 0.8], size: [2 * glass.half - 16, 1.6], fillColor: colors.ink, opacity: 0.55 })
  new paper.CompoundPath({
    parent: scale,
    name: 'ticks',
    fillColor: colors.ink,
    children: Array.from({ length: 9 }, (_, k) => {
      const half = k === 4 ? 60 : k % 2 ? 14 : 31
      return new paper.Path.Rectangle({ point: [cx + (k - 4) * tick - 2.5, y - half], size: [5, 2 * half], insert: false })
    }),
  })
}

// A Phillips screw head sunk in a dark ring.
function screw(name: string, c: paper.Point, rng: Random) {
  const g = new paper.Group({ name })
  blob({ parent: g, name: `${name}-socket`, center: c, radius: 39.5, irregularity: 0.05, points: 10, rng, fillColor: '#171411' })
  const head = new paper.Path.Circle({ parent: g, name: `${name}-head`, center: c, radius: 34.5, fillColor: gradient(c.add([-12, -14]), c.add([30, 30]), colors.steel, true) })
  const bar = () => new paper.Path.Rectangle({ point: c.subtract([20, 5]), size: [40, 10], radius: 2.5, insert: false })
  const across = bar()
  across.rotate(90, c)
  const cross = bar().unite(across, { insert: false })
  cross.rotate(rng.range(0, 90), c)
  cross.set({ name: `${name}-cross`, fillColor: colors.recessCross }).addTo(g)
  crescent(cross, { parent: g, side: -135, depth: 3.5, fillColor: '#5a4f42', opacity: 0.8 })
  crescent(head, { parent: g, side: -135, depth: 5, fillColor: '#ffffff', opacity: 0.35 })
  crescent(head, { parent: g, side: 45, depth: 4, fillColor: '#3a332b', opacity: 0.4 })
}
