import paper from 'paper'
import { blob, crescent, gradient, merge, stipple, taperedStroke, type Artwork, type Random } from '../../src/index.ts'

type Pt = [number, number]

// Variation: a wide 16:9 street frieze of candy-colored Altbau, with the
// Fernsehturm balancing her on the right.
// Drawn in world units: the facades meet the sidewalk at y = 1170 and the road
// ends at y = 1500. The slice of the world below `world.top` is scaled by
// `world.fit` onto the canvas.
const world = { width: 2400, top: 100, fit: 0.8 }
const ground = 1170

const layout: {
  sun: Pt
  tower: { x: number; size: number }
  woman: { at: Pt; size: number }
  ampel: number
  trees: [number, number][]
  facades: { edges: number[]; tops: number[] }
  clouds: [number, number, number][]
  ribbons: [Pt[], number, string][]
  bubbles: number
  lawn: boolean
  reflection: boolean
} = {
  sun: [2070, 330],
  tower: { x: 1560, size: 1 },
  woman: { at: [880, 1350], size: 0.72 },
  ampel: 2270,
  trees: [[170, 140], [1290, 150], [2010, 145]],
  facades: { edges: [-10, 250, 540, 820, 1090, 1370, 1650, 1930, 2200, 2410], tops: [645, 600, 630, 585, 640, 605, 625, 590, 650] },
  clouds: [[260, 340, 160], [820, 230, 115], [1250, 350, 135], [2330, 660, 130], [60, 680, 95]],
  ribbons: [],
  bubbles: 34,
  lawn: false,
  reflection: false,
}

const colors = {
  sky: ['#0757c9', '#1688ee', '#4cbcf6', '#a4e6ff'],
  cloud: ['#ffffff', '#c3e2fb'] as [string, string],
  cloudShade: '#86bfee',
  facades: [['#a9efff', '#36c2ea'], ['#ffe39a', '#ffad33'], ['#a9d6ff', '#3f97ec'], ['#e0ff9e', '#8fd83a'], ['#b2f7e2', '#38cba2']] as [string, string][],
  glass: ['#c9f4ff', '#45b4ec', '#1c70b9'],
  leaves: ['#dcfa6c', '#86d62c', '#2f9a2a'],
  trunk: '#86654b',
  skin: '#f7ceb2',
  skinShade: '#e3a587',
  hair: '#7b4325',
  hairDark: '#4f2817',
  hairLight: '#c07a45',
  top: ['#d2f0ff', '#93d4fb', '#56b2ea'],
  skirt: ['#d8f2ff', '#93d2ff', '#5aaee8'],
  pleat: '#3c83bd',
  panel: '#ff9a1a',
  aqua: '#2fc3e6',
  lime: ['#dcff86', '#93dc2a', '#5aa81c'],
  chrome: ['#ffffff', '#e2edf5', '#a7bdcf'],
  curb: ['#eaf7ff', '#86b4d2'],
  road: ['#2f84c0', '#174f86'],
  pavement: ['#aadcf0', '#5ea7d2'],
  joint: ['#5f9ec6', 0.7] as [string, number],
  cobbles: ['#86bddb', '#3f7fae'],
  lawn: ['#b8f54a', '#4fb52a'],
}

export default {
  width: Math.round(world.width * world.fit),
  height: Math.round((1500 - world.top) * world.fit),
  seed: 'berlin-aero',
  draw({ random }) {
    sky(random)
    fernsehturm(layout.tower.x, layout.tower.size)
    street(random)
    new paper.Layer({ name: 'trees' })
    for (const [i, [x, r]] of layout.trees.entries()) linden(`linden-${i}`, new paper.Point(x, ground), r, random(`linden-${i}`))
    const pavement = sidewalk(random)
    ampel(layout.ampel)
    const figure = woman()
    if (layout.reflection) reflect(figure, pavement)
    bubbles(random)
    flares()
    for (const layer of paper.project.layers) {
      layer.translate(new paper.Point(0, -world.top))
      layer.scale(world.fit, new paper.Point(0, 0))
    }
  },
} satisfies Artwork


function sky(random: (key: string) => Random) {
  new paper.Layer({ name: 'sky' })
  const W = world.width
  new paper.Path.Rectangle({ name: 'sky-gradient', point: [0, 0], size: [W, ground], fillColor: gradient([0, world.top], [0, 950], colors.sky) })
  const sun = new paper.Point(layout.sun)
  new paper.Path.Circle({ name: 'sun-glow', center: sun, radius: 560, fillColor: gradient(sun, sun.add([560, 0]), ['#ffffffff', ['#fffbe0bb', 0.1], ['#ffffff40', 0.4], '#ffffff00'], true) })
  const rays = new paper.Group({ name: 'sun-rays', opacity: 0.3 })
  for (let k = 0; k < 14; k++) {
    const angle = k * (360 / 14) + 8
    const length = k % 2 ? 300 : 460
    const tip = sun.add(new paper.Point({ angle, length }))
    new paper.Path({
      parent: rays,
      segments: [sun, sun.add(new paper.Point({ angle: angle - 2.2, length })), sun.add(new paper.Point({ angle: angle + 2.2, length }))],
      closed: true,
      fillColor: gradient(sun, tip, ['#ffffff', '#ffffff00']),
    })
  }
  new paper.Path.Circle({ name: 'sun', center: sun, radius: 44, fillColor: '#ffffff' })
  if (layout.ribbons.length) aurora()

  const puffs: [number, number, number][] = [[-0.6, 0.18, 0.4], [-0.2, -0.18, 0.55], [0.28, -0.08, 0.5], [0.66, 0.2, 0.36], [0, 0.22, 0.5]]
  for (const [i, [x, y, r]] of layout.clouds.entries()) {
    const rng = random(`cloud-${i}`)
    const cloud = merge(
      puffs.map(([dx, dy, s]) => blob({ center: [x + dx * r, y + dy * r], radius: r * s * rng.vary(1, 0.1), irregularity: 0.12, points: 8, rng })),
      { name: `cloud-${i}`, fillColor: gradient([x, y - r * 0.6], [x, y + r * 0.5], [colors.cloud[0], [colors.cloud[0], 0.4], colors.cloud[1]]) },
    )
    crescent(cloud, { name: `cloud-${i}-shade`, side: 100, depth: r * 0.1, fillColor: colors.cloudShade, opacity: 0.45 })
  }
}

// Vista-style ribbons of light sweeping across the sky, fading at both ends.
function aurora() {
  const group = new paper.Group({ name: 'aurora' })
  for (const [i, [spine, w, color]] of layout.ribbons.entries()) {
    taperedStroke({
      parent: group,
      name: `aurora-${i}`,
      spine,
      width: (t) => w * (0.3 + Math.sin(Math.PI * t)),
      fillColor: gradient([0, 0], [world.width, 0], [`${color}00`, [`${color}ee`, 0.3], [`${color}dd`, 0.7], `${color}00`]),
      opacity: 0.9,
    })
    // A thin gel highlight riding the top of each ribbon.
    taperedStroke({
      parent: group,
      name: `aurora-${i}-shine`,
      spine: spine.map(([x, y]) => [x, y - w * 0.28] as Pt),
      width: (t) => w * 0.22 * Math.sin(Math.PI * t),
      fillColor: gradient([0, 0], [world.width, 0], ['#ffffff00', ['#ffffffaa', 0.4], '#ffffff00']),
    })
  }
}

function fernsehturm(x: number, size: number) {
  const tower = new paper.Layer({ name: 'fernsehturm' })
  const concrete = (w: number) => gradient([x - w, 0], [x + w, 0], ['#ffffff', ['#e6f1f8', 0.35], ['#a9c6dc', 0.85], '#c6dbe9'])
  new paper.Path({ name: 'tower-shaft', segments: [[x - 32, ground], [x - 15, 470], [x + 15, 470], [x + 32, ground]], closed: true, fillColor: concrete(32) })
  new paper.Path({ name: 'tower-collar', segments: [[x - 26, 488], [x - 12, 470], [x + 12, 470], [x + 26, 488]], closed: true, fillColor: concrete(26) })
  new paper.Path.Rectangle({ name: 'tower-upper-shaft', point: [x - 11, 300], size: [22, 70], fillColor: concrete(11) })
  new paper.Path.Rectangle({ name: 'tower-antenna-ring', point: [x - 15, 296], size: [30, 9], radius: 3, fillColor: concrete(15) })
  const antenna = new paper.Group({ name: 'tower-antenna' })
  for (let k = 0; k < 7; k++) {
    const y = 296 - k * 24
    const w = 9 - k * 0.6
    new paper.Path.Rectangle({ parent: antenna, point: [x - w / 2, y - 24], size: [w, 24], fillColor: k % 2 ? '#ffffff' : '#ff5b4d' })
  }

  const center = new paper.Point(x, 420)
  const r = 60
  const sphere = new paper.Path.Circle({
    name: 'tower-sphere',
    center,
    radius: r,
    fillColor: gradient(center.add([-24, -26]), center.add([-24 + 96, -26]), ['#ffffff', ['#e3f2fc', 0.22], ['#a6cbe6', 0.55], ['#5d95c2', 0.85], '#3f78a6'], true),
  })
  const lines = new paper.Group({ name: 'tower-sphere-grid', opacity: 0.3 })
  for (const s of [0.35, 0.7, 0.95]) new paper.Path.Ellipse({ parent: lines, center, radius: [r * s, r], strokeColor: '#ffffff', strokeWidth: 1.2 })
  for (const dy of [-0.55, -0.25, 0.3, 0.6]) {
    const half = r * Math.sqrt(1 - dy * dy)
    new paper.Path.Line({ parent: lines, from: center.add([-half, dy * r]), to: center.add([half, dy * r]), strokeColor: '#ffffff', strokeWidth: 1.2 })
  }
  const band = new paper.Path.Rectangle({ point: [x - r, 398], size: [2 * r, 15], insert: false })
  sphere.intersect(band, { insert: false }).set({ name: 'tower-windows', fillColor: gradient([x - r, 0], [x + r, 0], ['#5fb7e0', '#1f5f8a', '#163f63']) }).insertAbove(lines)
  new paper.Path.Ellipse({ name: 'tower-sphere-glint', center: center.add([-24, -30]), radius: [17, 9], fillColor: '#ffffffdd' }).rotate(-35)
  tower.scale(size, new paper.Point(x, ground))
}

function street(random: (key: string) => Random) {
  new paper.Layer({ name: 'street' })
  const { edges, tops } = layout.facades
  for (const [i, top] of tops.entries()) {
    const x0 = edges[i]!
    const x1 = edges[i + 1]!
    const [light, base] = colors.facades[i % colors.facades.length]!
    const g = new paper.Group({ name: `altbau-${i}` })
    new paper.Path.Rectangle({ parent: g, name: `altbau-${i}-wall`, point: [x0, top], size: [x1 - x0, ground - top], fillColor: gradient([0, top], [0, ground], [light, [base, 0.4], base]) })
    new paper.Path.Rectangle({ parent: g, point: [x0, top + 14], size: [x1 - x0, 7], fillColor: '#1d4f80', opacity: 0.15 })
    new paper.Path.Rectangle({ parent: g, name: `altbau-${i}-cornice`, point: [x0 - 6, top - 4], size: [x1 - x0 + 12, 18], radius: 3, fillColor: '#ffffff' })
    const cols = Math.max(1, Math.floor((x1 - x0) / 88))
    const step = (x1 - x0) / cols
    const rng = random(`altbau-${i}`)
    let floor = 0
    for (let y = top + 50; y + 80 < 1060; y += 100, floor++) {
      new paper.Path.Rectangle({ parent: g, point: [x0, y + 88], size: [x1 - x0, 5], fillColor: '#ffffff', opacity: 0.6 })
      for (let c = 0; c < cols; c++) {
        const wx = x0 + step * (c + 0.5) - 23
        windowPane(g, wx, y, 46, 74, floor === 0 && rng.next() < 0.5)
      }
    }
    // Shop front on the ground floor.
    const shop = new paper.Path.Rectangle({ parent: g, name: `altbau-${i}-shop`, point: [x0 + 18, 1075], size: [x1 - x0 - 36, ground - 1075], radius: [6, 6], fillColor: gradient([0, 1075], [0, ground], colors.glass) })
    for (let k = 1; k < 3; k++) new paper.Path.Rectangle({ parent: g, point: [x0 + 18 + ((x1 - x0 - 36) * k) / 3 - 2, 1075], size: [4, ground - 1075], fillColor: '#ffffff' })
    gloss(shop, { height: 0.55, opacity: 0.6 })
    new paper.Path.Rectangle({ parent: g, point: [x0 + 10, 1062], size: [x1 - x0 - 20, 12], radius: 3, fillColor: '#ffffff' })
  }
}

// A tall Altbau window: white frame, glassy pane with a diagonal glint, a cap above.
function windowPane(parent: paper.Group, x: number, y: number, w: number, h: number, balcony: boolean) {
  new paper.Path.Rectangle({ parent, point: [x - 9, y - 12], size: [w + 18, 8], radius: 2, fillColor: '#ffffff' })
  new paper.Path.Rectangle({ parent, point: [x - 4, y - 4], size: [w + 8, h + 8], radius: 3, fillColor: '#ffffff' })
  new paper.Path.Rectangle({ parent, point: [x, y], size: [w, h], radius: 2, fillColor: gradient([x, y], [x + w * 0.3, y + h], colors.glass) })
  new paper.Path({ parent, segments: [[x + 3, y + h * 0.62], [x + w * 0.58, y + 3], [x + w * 0.82, y + 3], [x + 3, y + h * 0.9]], closed: true, fillColor: '#ffffff', opacity: 0.45 })
  new paper.Path.Rectangle({ parent, point: [x + w / 2 - 1.5, y], size: [3, h], fillColor: '#ffffff', opacity: 0.9 })
  if (balcony) {
    new paper.Path.Rectangle({ parent, point: [x - 14, y + h - 4], size: [w + 28, 22], radius: 4, fillColor: '#ffffff', opacity: 0.85 })
  }
}

function linden(name: string, root: paper.Point, r: number, rng: Random) {
  const g = new paper.Group({ name })
  taperedStroke({ parent: g, name: `${name}-trunk`, spine: [root.add([0, 6]), root.add([-6, -120]), root.add([4, -250])], width: (t) => 26 - 10 * t, fillColor: colors.trunk })
  const c = root.add([0, -250 - r * 0.55])
  const masses: [number, number, number][] = [[0, 0, 0.62], [-0.52, 0.16, 0.45], [0.52, 0.12, 0.48], [-0.3, -0.42, 0.45], [0.32, -0.44, 0.43], [0, -0.66, 0.36], [-0.75, -0.1, 0.3], [0.78, -0.14, 0.3]]
  const canopy = merge(
    masses.map(([dx, dy, s], i) => blob({ center: c.add([dx * r, dy * r]), radius: s * r, irregularity: 0.12, rng: rng.fork(i) })),
    { name: `${name}-canopy`, fillColor: gradient(c.add([0, -r]), c.add([0, r * 0.7]), colors.leaves) },
  )
  g.addChild(canopy)
  const { center, width: size } = canopy.bounds
  canopy.subtract(new paper.Path.Circle({ center: center.add([-0.15 * size, -0.45 * size]), radius: 0.78 * size, insert: false })).set({ name: `${name}-shade`, fillColor: '#1d6e22', opacity: 0.35 })
  stipple(canopy, { name: `${name}-sparkle`, count: 40, radius: [4, 9], rng: rng.fork('sparkle'), fillColor: '#f2ffb0', opacity: 0.4, density: (_u, v) => 1 - v })
  gloss(canopy, { name: `${name}-gloss`, height: 0.45, opacity: 0.55 })
}

// The pavement, with a lawn strip along the houses when `layout.lawn` is set.
function sidewalk(random: (key: string) => Random): paper.Path {
  new paper.Layer({ name: 'sidewalk' })
  const W = world.width
  const back = layout.lawn ? ground + 46 : ground
  const front = layout.lawn ? 1440 : 1393
  const pavement = new paper.Path.Rectangle({ name: 'pavement', point: [0, back], size: [W, 1440 - back], fillColor: gradient([0, back], [0, 1440], colors.pavement) })
  if (layout.lawn) {
    const lawn = new paper.Path.Rectangle({ name: 'lawn', point: [0, ground], size: [W, back - ground], fillColor: gradient([0, ground], [0, back], colors.lawn) })
    stipple(lawn, { name: 'lawn-flowers', count: 140, radius: [2, 3.5], rng: random('lawn'), fillColor: '#f6ffc4', opacity: 0.7 })
    new paper.Path.Rectangle({ name: 'lawn-edge', point: [0, back - 3], size: [W, 6], radius: 3, fillColor: '#ffffff', opacity: 0.7 })
  }
  new paper.Path.Rectangle({ name: 'wall-shadow', point: [0, ground], size: [W, 10], fillColor: gradient([0, ground], [0, ground + 10], ['#1d4f80aa', '#1d4f8000']) })
  const joints = new paper.Group({ name: 'slab-joints', opacity: colors.joint[1] })
  const vp = new paper.Point(layout.woman.at[0] + 40, 760)
  for (let x = -400; x <= W + 400; x += 140) {
    const from = new paper.Point(x, back)
    const to = vp.add(from.subtract(vp).multiply((front - 3 - vp.y) / (back - vp.y)))
    new paper.Path.Line({ parent: joints, from, to, strokeColor: colors.joint[0], strokeWidth: 2 })
  }
  for (const y of [back + 85, front - 3]) new paper.Path.Line({ parent: joints, from: [0, y], to: [W, y], strokeColor: colors.joint[0], strokeWidth: 2 })
  if (!layout.lawn) {
    const cobbles = new paper.Path.Rectangle({ name: 'kleinpflaster', point: [0, 1393], size: [W, 47], fillColor: colors.cobbles[0] })
    stipple(cobbles, { name: 'kleinpflaster-stones', count: Math.round(W * 0.35), radius: [2.5, 4.5], rng: random('cobbles'), fillColor: colors.cobbles[1], opacity: 0.6 })
  }
  new paper.Path.Rectangle({ name: 'curb', point: [0, 1440], size: [W, 22], fillColor: gradient([0, 1440], [0, 1462], colors.curb) })
  new paper.Path.Rectangle({ name: 'road', point: [0, 1462], size: [W, 40], fillColor: gradient([0, 1462], [0, 1500], colors.road) })
  new paper.Path.Rectangle({ name: 'road-sheen', point: [0, 1466], size: [W, 6], fillColor: '#ffffff', opacity: 0.25 })
  const foot = new paper.Point(layout.woman.at)
  const r = 240 * layout.woman.size
  new paper.Path.Ellipse({ name: 'woman-shadow', center: foot, radius: [r, r * 0.085], fillColor: gradient(foot, foot.add([r, 0]), ['#1d4f8066', '#1d4f8000'], true) })
  return pavement
}

// The glossy pavement mirrors her, clipped to the pavement.
function reflect(figure: paper.Layer, pavement: paper.Path) {
  const mirror = new paper.Group({ name: 'woman-reflection', opacity: 0.2, insert: false })
  for (const child of figure.children) mirror.addChild(child.clone({ insert: false }))
  for (const item of mirror.getItems({})) item.name = ''
  mirror.scale(1, -1, new paper.Point(layout.woman.at))
  const mask = pavement.clone({ insert: false })
  mask.name = ''
  const clip = new paper.Group({ name: 'woman-reflection-clip', children: [mask, mirror], clipped: true })
  clip.insertAbove(pavement)
}

// The Berlin pedestrian light, its green Ampelmännchen walking.
function ampel(x: number) {
  new paper.Layer({ name: 'ampel' })
  new paper.Path.Rectangle({ name: 'ampel-pole', point: [x - 8, 1040], size: [16, 385], fillColor: gradient([x - 8, 0], [x + 8, 0], ['#ffffff', '#c9d9e6', '#7c9ab2', '#d3e3ee']) })
  new paper.Path.Ellipse({ name: 'ampel-foot', center: [x, 1425], radius: [16, 5], fillColor: '#7c9ab2' })
  const glowAt = new paper.Point(x, 1000)
  new paper.Path.Circle({ name: 'ampel-glow', center: glowAt, radius: 120, fillColor: gradient(glowAt, glowAt.add([120, 0]), ['#b8ff6a99', '#b8ff6a00'], true) })
  const housing = new paper.Path.Rectangle({ name: 'ampel-housing', point: [x - 42, 860], size: [84, 190], radius: 20, fillColor: gradient([x - 42, 0], [x + 42, 0], ['#56636f', '#2a333c', '#1a2027']) })
  gloss(housing, { name: 'ampel-housing-gloss', height: 0.4, opacity: 0.4 })
  const red = new paper.Point(x, 912)
  new paper.Path.Circle({ name: 'ampel-red', center: red, radius: 31, fillColor: gradient(red, red.add([31, 0]), ['#6a2424', '#2a0d0f'], true) })
  ampelmann('ampelmann-red', red, false).set({ fillColor: '#8e3030', opacity: 0.7 })
  const green = new paper.Point(x, 996)
  new paper.Path.Circle({ name: 'ampel-green', center: green, radius: 31, fillColor: gradient(green, green.add([31, 0]), ['#1f6a2a', '#0c2a12'], true) })
  ampelmann('ampelmann-green', green, true).set({ fillColor: '#c6ff5e' })
  new paper.Path.Ellipse({ name: 'ampel-green-glint', center: green.add([-12, -16]), radius: [11, 6], fillColor: '#ffffff', opacity: 0.55 }).rotate(-30)
}

function ampelmann(name: string, center: paper.Point, walking: boolean): paper.PathItem {
  const s = (pts: [number, number][], w: number) => taperedStroke({ spine: pts, width: () => w, samples: 10 })
  const parts: paper.PathItem[] = [
    new paper.Path.Circle({ center: [0, -11], radius: 5.5 }),
    new paper.Path.Circle({ center: [5.2, -10.5], radius: 2.4 }),
    new paper.Path.Rectangle({ point: [-4.5, -23], size: [9, 8], radius: 1.5 }),
    new paper.Path.Rectangle({ point: [-7.5, -17], size: [15, 2.4], radius: 1 }),
    new paper.Path.Ellipse({ center: [0, 1], radius: [4.6, 8] }),
  ]
  if (walking) {
    parts.push(s([[0, -3], [6, 1], [11, 6]], 3.2), s([[-1, -3], [-6, 2], [-10, 7]], 3.2), s([[1, 7], [6, 14], [10, 21]], 4.2), s([[-1, 7], [-5, 14], [-11, 20]], 4.2))
  } else {
    parts.push(s([[-12, 0], [0, -3], [12, 0]], 3.4), new paper.Path.Rectangle({ point: [-4.5, 6], size: [9, 16], radius: 1.5 }))
  }
  const shape = merge(parts, { name })
  shape.translate(center)
  return shape
}

// The woman, drawn in design units (a head is 156 tall), then scaled by
// `layout.woman.size` and placed with her soles at `layout.woman.at`.
function woman(): paper.Layer {
  const layer = new paper.Layer({ name: 'woman' })
  const skin = colors.skin
  const shade = colors.skinShade

  // Far arm swings back, behind everything.
  const farArm = new paper.Group({ name: 'arm-far' })
  taperedStroke({ parent: farArm, spine: [[540, 600], [515, 680], [497, 752], [480, 820], [468, 860]], width: (t) => 40 - 18 * t, fillColor: shade })
  blob({ parent: farArm, center: [465, 875], radius: [13, 18], rotation: 10, irregularity: 0.05, rng: fixed(), fillColor: shade })

  const hair = new paper.Group({ name: 'hair' })
  const back = smoothPath(hair, 'hair-back', [
    [598, 380], [582, 356], [545, 338], [497, 352], [466, 394], [456, 450], [448, 520], [432, 592], [420, 662], [402, 730], [388, 772],
    [424, 745], [440, 785], [462, 735], [486, 705], [500, 650], [512, 585], [526, 520], [542, 470], [560, 430], [578, 404],
  ])
  back.fillColor = gradient([0, 340], [0, 780], [colors.hair, colors.hairDark])
  for (const [i, pts] of [
    [[478, 380], [462, 470], [445, 580], [425, 690], [400, 760]],
    [[500, 390], [490, 480], [472, 600], [450, 700], [435, 775]],
    [[520, 420], [508, 520], [490, 630], [470, 720]],
  ].entries()) {
    taperedStroke({ parent: hair, name: `hair-strand-${i}`, spine: pts as [number, number][], width: 6, fillColor: i === 1 ? colors.hairLight : colors.hairDark, opacity: 0.5 })
  }

  // Legs: the far leg strides forward, the near one pushes off.
  const legWidth = profile([[0, 92], [0.15, 84], [0.46, 52], [0.53, 50], [0.66, 58], [0.9, 32], [1, 30]])
  const farLeg = new paper.Group({ name: 'leg-far' })
  taperedStroke({ parent: farLeg, name: 'leg-far-skin', spine: [[578, 900], [612, 1080], [640, 1250], [672, 1410], [703, 1555]], width: legWidth, fillColor: shade })
  sneaker('shoe-far', farLeg, new paper.Point(703, 1553), 0, true)
  const nearLeg = new paper.Group({ name: 'leg-near' })
  taperedStroke({ parent: nearLeg, name: 'leg-near-skin', spine: [[545, 905], [528, 1080], [515, 1255], [470, 1390], [420, 1513]], width: legWidth, fillColor: skin })
  taperedStroke({ parent: nearLeg, name: 'leg-near-shine', spine: [[528, 1270], [500, 1370], [466, 1460]], width: 7, fillColor: '#ffffff', opacity: 0.35 })
  sneaker('shoe-near', nearLeg, new paper.Point(420, 1512), 26, false)

  // Torso, tank top, skirt.
  const body = new paper.Group({ name: 'body' })
  const torso = smoothPath(body, 'torso', [[528, 560], [510, 588], [500, 645], [507, 718], [520, 792], [604, 792], [606, 742], [612, 702], [633, 662], [624, 612], [596, 586], [582, 562]])
  torso.fillColor = skin
  const topRegion = new paper.Path({ segments: [[460, 588], [538, 584], [572, 616], [646, 626], [652, 770], [460, 766]], closed: true, insert: false })
  const top = torso.intersect(topRegion, { insert: false }).set({ name: 'tank-top', fillColor: gradient([0, 590], [0, 770], colors.top) })
  top.insertAbove(torso)
  gloss(top, { name: 'tank-top-gloss', height: 0.45, opacity: 0.7 })
  taperedStroke({ parent: body, name: 'tank-top-strap', spine: [[546, 568], [552, 590], [560, 614]], width: () => 9, fillColor: colors.top[1]! })

  const skirt = smoothPath(body, 'skirt', [[516, 782], [496, 862], [472, 960], [450, 1062], [492, 1052], [535, 1068], [578, 1050], [622, 1064], [664, 1044], [706, 1046], [676, 960], [640, 870], [608, 782]])
  skirt.fillColor = gradient([0, 782], [0, 1066], colors.skirt)
  for (const [i, [xw, xh]] of ([[548, 520], [590, 650]] as const).entries()) {
    const wedge = new paper.Path({ segments: [[xw - 5, 805], [xw + 5, 805], [xh + 30, 1090], [xh - 30, 1090]], closed: true, insert: false })
    skirt.intersect(wedge, { insert: false }).set({ name: `skirt-panel-${i}`, fillColor: gradient([0, 805], [0, 1070], ['#ffc065', colors.panel, '#f07c00']) }).insertAbove(skirt)
  }
  const pleats = new paper.Group({ name: 'skirt-pleats', parent: body, opacity: 0.35 })
  for (const [xw, xh] of [[530, 492], [568, 578], [600, 690]] as const) taperedStroke({ parent: pleats, spine: [[xw, 800], [xh, 1055]], width: 3, fillColor: colors.pleat })
  const waistband = new paper.Path.Rectangle({ point: [480, 780], size: [160, 18], insert: false })
  skirt.intersect(waistband, { insert: false }).set({ name: 'skirt-waistband', fillColor: gradient([0, 780], [0, 798], colors.lime) }).insertAbove(pleats)
  gloss(skirt, { name: 'skirt-gloss', height: 0.4, opacity: 0.6 })

  // Neck and head in profile, facing right.
  const head = new paper.Group({ name: 'head' })
  const neck = smoothPath(head, 'neck', [[530, 480], [578, 494], [586, 570], [526, 574]])
  neck.fillColor = skin
  neck.intersect(new paper.Path.Ellipse({ center: [562, 500], radius: [44, 16], insert: false }), { insert: false }).set({ name: 'neck-shadow', fillColor: shade, opacity: 0.7 }).insertAbove(neck)
  const face = smoothPath(head, 'face', [
    [490, 402], [530, 352], [580, 362], [603, 395], [607, 412], [603, 423], [621, 446], [606, 456], [611, 465], [605, 471], [609, 478],
    [602, 487], [606, 497], [590, 509], [560, 501], [522, 480], [494, 446],
  ])
  face.fillColor = skin
  face.intersect(new paper.Path.Ellipse({ center: [607, 472], radius: [9, 10], insert: false }), { insert: false }).set({ name: 'lips', fillColor: '#ee7486' }).insertAbove(face)
  new paper.Path.Circle({ parent: head, name: 'blush', center: [584, 458], radius: 14, fillColor: '#ff8a9a', opacity: 0.3 })
  new paper.Path.Ellipse({ parent: head, name: 'eyeshadow', center: [588, 420], radius: [11, 6], fillColor: '#46d3ee', opacity: 0.55 })
  new paper.Path({ parent: head, name: 'eye-white', segments: [[578, 426], [588, 421], [598, 428], [589, 433]], closed: true, fillColor: '#ffffff' }).smooth({ type: 'catmull-rom' })
  new paper.Path.Ellipse({ parent: head, name: 'iris', center: [593, 427.5], radius: [3.4, 5], fillColor: '#4a2a1a' })
  taperedStroke({ parent: head, name: 'eyeliner', spine: [[576, 425], [588, 419.5], [599, 427], [605, 421]], width: (t) => 1.5 + 2.5 * Math.sin(Math.PI * t), fillColor: '#2a1710' })
  taperedStroke({ parent: head, name: 'eyebrow', spine: [[574, 410], [589, 404], [603, 409]], width: 4.5, fillColor: colors.hairDark })

  const hairFront = smoothPath(hair, 'hair-front', [[518, 343], [568, 343], [599, 364], [609, 394], [594, 385], [575, 381], [558, 392], [552, 420], [548, 452], [530, 480], [504, 472], [486, 430], [490, 382]])
  hairFront.fillColor = gradient([0, 340], [0, 440], [colors.hairLight, colors.hair])
  hair.addChild(hairFront)
  hairFront.insertAbove(face)
  taperedStroke({ name: 'hair-shine', spine: [[512, 362], [540, 350], [572, 356]], width: 9, fillColor: '#ffffff', opacity: 0.4 }).insertAbove(hairFront)

  // Near arm, bent forward, holding a lime player.
  const arm = new paper.Group({ name: 'arm-near' })
  const upper = taperedStroke({ spine: [[550, 580], [550, 670], [546, 762]], width: (t) => 48 - 14 * t })
  const fore = taperedStroke({ spine: [[546, 762], [590, 744], [628, 712]], width: (t) => 34 - 12 * t })
  const armShape = merge([upper, fore], { name: 'arm-near-skin', fillColor: skin })
  arm.addChild(armShape)
  crescent(armShape, { name: 'arm-near-shade', side: 160, depth: 8, fillColor: shade, opacity: 0.6 })
  const player = new paper.Group({ name: 'player', parent: arm })
  const pc = new paper.Point(652, 688)
  const casing = new paper.Path.Rectangle({ parent: player, name: 'player-casing', point: pc.add([-18, -32]), size: [36, 64], radius: 9, fillColor: gradient(pc.add([-18, 0]), pc.add([18, 0]), colors.lime) })
  new paper.Path.Rectangle({ parent: player, name: 'player-screen', point: pc.add([-12, -26]), size: [24, 18], radius: 3, fillColor: gradient(pc.add([0, -26]), pc.add([0, -8]), ['#e8fdff', '#7fd6f3']) })
  new paper.Path.Circle({ parent: player, name: 'player-wheel', center: pc.add([0, 12]), radius: 12, fillColor: '#efffd0' })
  new paper.Path.Circle({ parent: player, name: 'player-button', center: pc.add([0, 12]), radius: 4.5, fillColor: colors.lime[1]! })
  gloss(casing, { name: 'player-gloss', height: 0.5, opacity: 0.7 })
  player.rotate(-18, pc)
  blob({ parent: arm, name: 'hand-near', center: [636, 708], radius: [15, 13], rotation: -30, irregularity: 0.05, rng: fixed(), fillColor: skin })
  taperedStroke({ parent: arm, name: 'thumb-near', spine: [[634, 704], [646, 694], [654, 684]], width: (t) => 10 - 3 * t, fillColor: skin })

  // Headphones: glossy white band and cup, aqua glass dome with a fish inside.
  const phones = new paper.Group({ name: 'headphones' })
  const bandShape = taperedStroke({ parent: phones, name: 'headphones-band', spine: [[538, 410], [528, 372], [530, 348], [544, 336], [566, 334]], width: (t) => 24 - 9 * t, fillColor: gradient([520, 0], [560, 0], colors.chrome) })
  taperedStroke({ parent: phones, name: 'headphones-band-stripe', spine: [[535, 395], [529, 370], [532, 349], [546, 339]], width: () => 6, fillColor: colors.aqua, opacity: 0.8 })
  gloss(bandShape, { name: 'headphones-band-gloss', height: 0.5, opacity: 0.5 })
  const cupAt = new paper.Point(538, 452)
  const cup = new paper.Path.Ellipse({ parent: phones, name: 'headphones-cup', center: cupAt, radius: [40, 47], fillColor: gradient(cupAt.add([-14, -18]), cupAt.add([46, 30]), colors.chrome, true) })
  new paper.Path.Ellipse({ parent: phones, name: 'headphones-ring', center: cupAt, radius: [31, 37], fillColor: gradient(cupAt.add([0, -37]), cupAt.add([0, 37]), ['#9ff0ff', colors.aqua, '#1385b8']) })
  const dome = new paper.Path.Ellipse({ parent: phones, name: 'headphones-dome', center: cupAt, radius: [25, 30], fillColor: gradient(cupAt.add([-6, -8]), cupAt.add([22, 22]), ['#f0feff', '#9eeefa', '#2fb6d8'], true) })
  fish(phones, cupAt.add([2, 6]), 0.55)
  new paper.Path.Ellipse({ parent: phones, name: 'headphones-dome-glint', center: cupAt.add([-9, -14]), radius: [9, 5], fillColor: '#ffffff', opacity: 0.9 }).rotate(-35)
  gloss(cup, { name: 'headphones-cup-gloss', height: 0.45, opacity: 0.5 }).insertBelow(dome)
  taperedStroke({ parent: phones, name: 'headphones-cable', spine: [[536, 497], [552, 560], [596, 602], [636, 636], [648, 660]], width: () => 3.5, fillColor: colors.aqua })

  layer.scale(layout.woman.size, new paper.Point(560, 1600))
  layer.translate(new paper.Point(layout.woman.at).subtract([560, 1600]))
  return layer
}

function sneaker(name: string, parent: paper.Group, ankle: paper.Point, angle: number, far: boolean) {
  const g = new paper.Group({ name, parent })
  const upper = new paper.Path({ parent: g, name: `${name}-upper`, segments: [[-30, -26], [-6, -34], [16, -20], [46, -8], [80, 4], [100, 22], [102, 40], [-34, 40], [-40, 6]], closed: true })
  upper.smooth({ type: 'catmull-rom' })
  upper.fillColor = gradient([0, -28], [0, 40], far ? ['#eef5fa', '#c4d6e4'] : ['#ffffff', '#dcebf5'])
  taperedStroke({ parent: g, spine: [[-24, 22], [20, 8], [74, 20]], width: 9, fillColor: colors.lime[1]! })
  const sole = new paper.Path.Rectangle({ parent: g, name: `${name}-sole`, point: [-40, 32], size: [144, 17], radius: 8.5, fillColor: gradient([0, 32], [0, 49], ['#a8f0fb', colors.aqua]) })
  gloss(upper, { height: 0.4, opacity: 0.7 })
  gloss(sole, { height: 0.5, opacity: 0.6 })
  g.rotate(angle, new paper.Point(0, 0))
  g.translate(ankle)
}

// A small clownfish facing right, centered at `at`.
function fish(parent: paper.Group, at: paper.Point, scale: number) {
  const g = new paper.Group({ name: 'dome-fish', parent })
  const body = new paper.Path.Ellipse({ parent: g, center: [0, 0], radius: [22, 13], fillColor: '#ff8a1c' })
  new paper.Path({ parent: g, segments: [[-18, 0], [-32, -11], [-30, 11]], closed: true, fillColor: '#ff7a10' }).insertBelow(body)
  for (const x of [-8, 8]) {
    body.intersect(new paper.Path.Rectangle({ point: [x - 3, -15], size: [6, 30], insert: false }), { insert: false }).set({ fillColor: '#ffffff' }).insertAbove(body)
  }
  new paper.Path.Circle({ parent: g, center: [14, -3], radius: 2.4, fillColor: '#1d1d24' })
  g.scale(scale, new paper.Point(0, 0))
  g.translate(at)
}

function bubbles(random: (key: string) => Random) {
  new paper.Layer({ name: 'bubbles' })
  const rng = random('bubbles')
  const { at, size } = layout.woman
  // Keep her whole column clear, so bubbles don't stack into a tower above her head.
  const figure = new paper.Rectangle(at[0] - 170 * size, world.top, 330 * size, at[1] - world.top)
  let placed = 0
  for (let tries = 0; placed < layout.bubbles && tries < 800; tries++) {
    const r = 10 + rng.next() ** 2 * 55
    const c = new paper.Point(rng.range(20, world.width - 20), rng.range(world.top + 40, 1040))
    if (figure.expand(r * 2).contains(c)) continue
    bubble(`bubble-${placed++}`, c, r)
  }
}

function bubble(name: string, c: paper.Point, r: number) {
  const g = new paper.Group({ name })
  const ball = new paper.Path.Circle({
    parent: g,
    center: c,
    radius: r,
    fillColor: gradient(c, c.add([r, 0]), ['#ffffff00', ['#e8fbff10', 0.55], ['#bff3ff50', 0.86], '#ffffffcc'], true),
    strokeColor: '#ffffffaa',
    strokeWidth: Math.max(1, r * 0.035),
  })
  crescent(ball, { side: 40, depth: r * 0.16, fillColor: '#ffa8ec', opacity: 0.3 })
  crescent(ball, { side: -150, depth: r * 0.12, fillColor: '#a8ffcf', opacity: 0.3 })
  new paper.Path.Ellipse({ parent: g, center: c.add([-0.38 * r, -0.42 * r]), radius: [0.3 * r, 0.15 * r], fillColor: '#ffffff', opacity: 0.9 }).rotate(-40)
  new paper.Path.Circle({ parent: g, center: c.add([0.48 * r, 0.42 * r]), radius: 0.07 * r, fillColor: '#ffffff', opacity: 0.8 })
}

function flares() {
  new paper.Layer({ name: 'flares', opacity: 0.5 })
  const sun = new paper.Point(layout.sun)
  const toward = new paper.Point(sun.x < world.width / 2 ? 250 : -250, 390)
  const spots: [number, number, string][] = [[0.3, 22, '#ffffff'], [0.55, 36, '#f4fffb'], [0.75, 12, '#ffffff']]
  for (const [i, [t, r, color]] of spots.entries()) {
    const c = sun.add(toward.multiply(t))
    new paper.Path.Circle({ name: `flare-${i}`, center: c, radius: r, fillColor: gradient(c, c.add([r, 0]), [`${color}00`, [`${color}55`, 0.75], `${color}00`], true) })
  }
}

// A white gel highlight across the top of a shape, the signature Aero gloss.
function gloss(shape: paper.PathItem, { name = '', height = 0.5, opacity = 0.7, inset = 0.08 } = {}): paper.PathItem {
  const b = shape.bounds
  const inner = shape.clone({ insert: false }) as paper.PathItem
  inner.scale(1 - 2 * inset, 1 - 2 * inset, b.center)
  const band = new paper.Path.Rectangle({ point: b.topLeft, size: [b.width, b.height * height], insert: false })
  const highlight = inner.intersect(band, { insert: false })
  const hb = highlight.bounds
  const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0')
  highlight.set({ name, fillColor: gradient([0, hb.top], [0, hb.bottom], [`#ffffff${alpha}`, '#ffffff00']), strokeColor: null })
  highlight.insertAbove(shape)
  return highlight
}

function smoothPath(parent: paper.Group, name: string, points: [number, number][]): paper.Path {
  const path = new paper.Path({ parent, name, segments: points, closed: true })
  path.smooth({ type: 'catmull-rom' })
  return path
}

// Piecewise-linear width profile from [t, width] pairs.
function profile(table: [number, number][]) {
  return (t: number) => {
    for (let i = 1; i < table.length; i++) {
      const [t0, w0] = table[i - 1]!
      const [t1, w1] = table[i]!
      if (t <= t1) return w0 + ((w1 - w0) * (t - t0)) / (t1 - t0)
    }
    return table[table.length - 1]![1]
  }
}

// Hand-placed shapes that only need a blob's smoothness, not its variation.
function fixed(): Random {
  return { next: () => 0.5, range: (a, b) => (a + b) / 2, vary: (v) => v, pick: (items) => items[0]!, fork: () => fixed() }
}
