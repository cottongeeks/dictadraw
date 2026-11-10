// The drawing vocabulary: organic primitives built on Paper.js.
// Each returns an ordinary Paper.js item, so anything Paper.js can do
// (boolean ops, transforms, clipping) still applies to the result.

import paper from 'paper'
import type { Random } from './random.ts'

/** Paper.js item properties every primitive accepts. */
export interface Look {
  name?: string
  parent?: paper.Item
  fillColor?: paper.ColorLike | null
  strokeColor?: paper.ColorLike | null
  strokeWidth?: number
  strokeCap?: 'round' | 'square' | 'butt'
  opacity?: number
  blendMode?: string
  /** `false` keeps the shape out of the scene, for use in boolean operations. */
  insert?: boolean
}

function finish<T extends paper.Item>(item: T, { insert = true, ...look }: Look): T {
  item.set(look)
  if (!insert) item.remove()
  return item
}

/** A closed, smooth, irregular shape: clouds, stones, hills, foliage masses. */
export function blob({
  center,
  radius,
  rotation = 0,
  points = 7,
  irregularity = 0.2,
  rng,
  ...look
}: Look & {
  center: paper.PointLike
  /** One radius, or [rx, ry] for an elongated blob. */
  radius: number | [number, number]
  /** Degrees. */
  rotation?: number
  /** Number of lobes around the outline. */
  points?: number
  /** 0 is a clean ellipse; 0.3 is noticeably lumpy. */
  irregularity?: number
  rng: Random
}): paper.Path {
  const [rx, ry] = typeof radius === 'number' ? [radius, radius] : radius
  const path = new paper.Path({ closed: true })
  for (let i = 0; i < points; i++) {
    const angle = ((i + rng.range(-1, 1) * irregularity) / points) * Math.PI * 2
    const r = rng.vary(1, irregularity)
    path.add(new paper.Point(Math.cos(angle) * rx * r, Math.sin(angle) * ry * r))
  }
  path.smooth({ type: 'continuous' })
  path.rotate(rotation, new paper.Point(0, 0))
  path.translate(new paper.Point(center))
  return finish(path, look)
}

/**
 * A band across the whole canvas with a rolling top edge, filled down past the
 * bottom: hills, dunes, waves, water layers. Draw far bands first.
 */
export function ridge({
  y,
  amplitude,
  waves = 3,
  rng,
  ...look
}: Look & {
  /** Crest height; [left, right] for a slope. */
  y: number | [number, number]
  /** How far the crest rises and dips around `y`. */
  amplitude: number
  /** Number of rises across the canvas. */
  waves?: number
  rng: Random
}): paper.Path {
  const [yLeft, yRight] = typeof y === 'number' ? [y, y] : y
  const { left, right, bottom, width } = paper.view.bounds
  const bleed = 40
  const steps = waves * 2
  const crest = new paper.Path()
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = left - bleed + t * (width + 2 * bleed) + (i % steps ? rng.range(-0.3, 0.3) * (width / steps) : 0)
    const rise = (i % 2 ? -1 : 0.6) * amplitude * rng.range(0.5, 1)
    crest.add(new paper.Point(x, yLeft + (yRight - yLeft) * t + rise))
  }
  crest.smooth({ type: 'continuous' })
  crest.add(new paper.Point(right + bleed, bottom + bleed), new paper.Point(left - bleed, bottom + bleed))
  crest.closed = true
  return finish(crest, look)
}

/**
 * A filled brush mark along a spine: stems, hair strands, grass, calligraphic lines.
 * `width` is the widest point (the mark swells in the middle and tapers at both
 * ends), or a profile from t = 0 (start) to t = 1 (end), such as `t => 8 * (1 - t)`.
 */
export function taperedStroke({
  spine,
  width,
  samples = 24,
  ...look
}: Look & {
  spine: paper.PointLike[]
  width: number | ((t: number) => number)
  samples?: number
}): paper.Path {
  const guide = new paper.Path({ segments: spine, insert: false })
  guide.smooth({ type: 'catmull-rom' })
  const profile = typeof width === 'number' ? (t: number) => width * Math.sin(Math.PI * t) ** 0.6 : width
  const left: paper.Point[] = []
  const right: paper.Point[] = []
  const caps: paper.Point[][] = []
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const at = guide.length * t
    const point = guide.getPointAt(at)
    const normal = guide.getNormalAt(at).multiply(profile(t) / 2)
    left.push(point.add(normal))
    right.unshift(point.subtract(normal))
    // Round caps at both ends, so smoothing doesn't bulge a blunt end.
    if (i === 0 || i === samples) {
      const back = guide.getTangentAt(at).multiply((i ? 1 : -1) * normal.length)
      const side = i ? normal : normal.multiply(-1)
      caps.push([1, 2, 3].map((k) => point.add(side.multiply(Math.cos((k * Math.PI) / 4))).add(back.multiply(Math.sin((k * Math.PI) / 4)))))
    }
  }
  // Where the width reaches zero, the sides and cap meet in one point; keep it once.
  const outline = [...left, ...caps[1]!, ...right, ...caps[0]!].filter((p, i, all) => p.getDistance(all[(i + 1) % all.length]!) > 0.01)
  const path = new paper.Path({ segments: outline, closed: true })
  path.smooth({ type: 'catmull-rom' })
  return finish(path, look)
}

/**
 * A branching structure grown from `base`: trees, twigs, coral, roots. Every
 * branch continues from its tip and sends `forks` side branches off along its
 * length, until `depth` levels have grown. `onBranch` receives each branch's
 * centerline and level (0 for the first), to grow blossoms, leaves, or fruit.
 */
export function branches({
  base,
  angle,
  length,
  width,
  depth = 4,
  forks = 2,
  spread = 32,
  shrink = 0.72,
  gnarl = 0.25,
  rng,
  onBranch,
  name,
  parent,
  ...look
}: Look & {
  base: paper.PointLike
  /** Degrees: 0 right, -90 up. */
  angle: number
  length: number
  /** Thickness at the base. */
  width: number
  depth?: number
  /** Side branches per branch. */
  forks?: number
  /** Degrees side branches turn away from their parent. */
  spread?: number
  /** Each level's length and thickness relative to its parent. */
  shrink?: number
  /** How much each branch zigzags: 0 straight, 0.5 gnarled. */
  gnarl?: number
  rng: Random
  onBranch?: (centerline: paper.Path, level: number) => void
}): paper.Group {
  const group = new paper.Group({ name: name ?? '' })
  if (parent) parent.addChild(group)
  const grow = (start: paper.Point, heading: number, len: number, w: number, level: number) => {
    const spine = [start]
    let direction = heading
    for (let i = 0; i < 3; i++) {
      direction += rng.range(-1, 1) * gnarl * 50
      spine.push(spine[i]!.add(new paper.Point({ angle: direction, length: len / 3 })))
    }
    const last = level === depth
    const end = last ? Math.max(0.8, w * 0.3) : w * shrink
    taperedStroke({ parent: group, spine, width: (t) => w + (end - w) * t, samples: w > 6 ? 16 : 8, ...look })
    const centerline = new paper.Path({ segments: spine, insert: false })
    centerline.smooth({ type: 'catmull-rom' })
    onBranch?.(centerline, level)
    if (last) return
    grow(spine[3]!, direction + rng.range(-0.3, 0.3) * spread, len * shrink * rng.range(0.85, 1.1), end, level + 1)
    const flip = rng.next() < 0.5 ? 1 : -1
    for (let k = 0; k < forks; k++) {
      const t = rng.range(0.3, 0.9)
      const at = centerline.length * t
      const side = k % 2 ? flip : -flip
      const childAngle = centerline.getTangentAt(at).angle + side * spread * rng.range(0.7, 1.3)
      grow(centerline.getPointAt(at), childAngle, len * shrink * rng.range(0.6, 0.95), (w + (end - w) * t) * 0.75, level + 1)
    }
  }
  grow(new paper.Point(base), angle, length, width, 0)
  return group
}

/**
 * A five-petal flower with notched petal tips: cherry, plum, apple blossom.
 * `fillColor` colors the petals; `blush` tints their inner half; `heart` colors
 * the center and `stamens` dots around it. `tilt` from 0 (face on) to 0.7
 * foreshortens the flower, seen from the side.
 */
export function blossom({
  center,
  radius,
  rotation = 0,
  tilt = 0,
  petals = 5,
  notch = 0.14,
  blush,
  heart,
  stamens = 0,
  name,
  parent,
  ...look
}: Look & {
  center: paper.PointLike
  radius: number
  /** Degrees. */
  rotation?: number
  tilt?: number
  petals?: number
  /** Depth of the notch at each petal tip, as a fraction of the radius. */
  notch?: number
  blush?: paper.ColorLike
  heart?: paper.ColorLike
  stamens?: number
}): paper.Group {
  const at = new paper.Point(center)
  const group = new paper.Group({ name: name ?? '' })
  if (parent) parent.addChild(group)
  // Petals share one compound path, so a blossom stays one shape per color.
  const ring = (scale: number) =>
    new paper.CompoundPath({
      parent: group,
      children: Array.from({ length: petals }, (_, k) => notchedPetal(radius * scale, notch).rotate((360 / petals) * k, new paper.Point(0, 0))),
    })
  ring(1).set(look)
  // The blush is a star of straight lines: it reads as the flower's eye at a
  // fraction of the path data of a second petal ring.
  if (blush) new paper.Path.Star({ parent: group, center: [0, 0], points: petals, radius1: radius * 0.55, radius2: radius * 0.22, fillColor: blush }).rotate(90, new paper.Point(0, 0))
  if (heart) {
    new paper.Path.Circle({ parent: group, center: [0, 0], radius: radius * 0.2, fillColor: heart })
    if (stamens) {
      new paper.CompoundPath({
        parent: group,
        fillColor: heart,
        children: Array.from({ length: stamens }, (_, k) => new paper.Path.Circle({ center: new paper.Point({ angle: (360 / stamens) * k + 18, length: radius * 0.4 }), radius: radius * 0.06, insert: false })),
      })
    }
  }
  group.scale(1, 1 - tilt, new paper.Point(0, 0))
  group.rotate(rotation, new paper.Point(0, 0))
  group.translate(at)
  return group
}

// One petal from the origin along +x, widest toward its notched tip.
function notchedPetal(length: number, notch: number): paper.Path {
  const w = length * 0.8
  const points: [number, number][] = [[0, 0], [0.62, -0.5], [1, -0.22], [1 - notch, 0], [1, 0.22], [0.62, 0.5]]
  const path = new paper.Path({ segments: points.map(([x, y]) => new paper.Point(x * length, y * w)), closed: true, insert: false })
  path.smooth({ type: 'catmull-rom' })
  for (const corner of [0, 3]) path.segments[corner]!.clearHandles()
  return path
}

interface LobeOptions extends Look {
  /** Where the stem attaches. */
  base: paper.PointLike
  /** Direction from base to tip in degrees: 0 points right, -90 points up. */
  angle: number
  length: number
  width: number
  /** Curls the tip sideways; -0.3 to 0.3 is natural. */
  bend?: number
  /** Makes one side fuller than the other; -0.4 to 0.4. */
  asymmetry?: number
}

/** A pointed leaf blade. Add `veins(leaf, ...)` for a midrib and side veins. */
export function leaf(options: LobeOptions): paper.Path {
  return lobe(options, (h) => [
    [0.2, 1.6 * h],
    [0.7, 1.0 * h],
  ])
}

/**
 * A rounded petal, narrow at the base. `fullness` from 0 (slender) to 1 (broad,
 * spoon-like) moves the widest point toward the tip.
 */
export function petal({ fullness = 0.5, ...options }: LobeOptions & { fullness?: number }): paper.Path {
  return lobe(options, (h) => [
    [0.12, (1.25 - 0.5 * fullness) * h],
    [0.95 + 0.12 * fullness, (1.2 + 0.7 * fullness) * h],
  ])
}

// Builds a two-curve shape from base to tip along +x, bends it, then places it.
// `controls` gives the two control points of one side, as [x / length, y].
function lobe(
  { base, angle, length, width, bend = 0, asymmetry = 0, ...look }: LobeOptions,
  controls: (halfWidth: number) => [number, number][],
): paper.Path {
  const warp = (x: number, y: number) => new paper.Point(x * length, y + bend * length * x * x)
  const side = (sign: number) =>
    controls((width / 2) * (1 + sign * asymmetry)).map(([x, y]) => warp(x, sign * y))
  const [upperOut, upperIn] = side(-1) as [paper.Point, paper.Point]
  const [lowerIn, lowerOut] = side(1) as [paper.Point, paper.Point]
  const start = warp(0, 0)
  const tip = warp(1, 0)
  const path = new paper.Path({
    closed: true,
    segments: [
      new paper.Segment(start, lowerIn.subtract(start), upperOut.subtract(start)),
      new paper.Segment(tip, upperIn.subtract(tip), lowerOut.subtract(tip)),
    ],
  })
  path.rotate(angle, start)
  path.translate(new paper.Point(base))
  return finish(path, look)
}

/**
 * A midrib and paired side veins for a shape made by `leaf` or `petal`.
 * Drawn just above the blade, in the same group.
 */
export function veins(
  blade: paper.Path,
  { count = 5, width, name, parent, opacity = 0.35, ...look }: Look & { count?: number; width?: number },
): paper.Group {
  const [upper, lower] = blade.curves as [paper.Curve, paper.Curve]
  const length = upper.point1.getDistance(upper.point2)
  const w = width ?? Math.max(0.6, length * 0.012)
  const mid = (t: number) => upper.getPointAtTime(t).add(lower.getPointAtTime(1 - t)).divide(2)
  const edges = [(t: number) => upper.getPointAtTime(t), (t: number) => lower.getPointAtTime(1 - t)]
  const group = placeGroup(name ?? (blade.name ? `${blade.name}-veins` : ''), blade, parent)
  // Opacity on the group, so overlapping strokes don't stack into brighter spots.
  group.opacity = opacity
  const style = { fillColor: '#ffffff', ...look, parent: group }
  taperedStroke({ spine: [0.02, 0.3, 0.6, 0.92].map(mid), width: (t) => w * 1.5 * (1 - 0.9 * t), ...style })
  for (let i = 1; i <= count; i++) {
    const t = 0.08 + (0.72 * i) / (count + 1)
    const from = mid(t)
    for (const edge of edges) {
      // Leave the midrib heading outward, then arch toward the tip.
      const bow = from.add(edge(t + 0.08).subtract(from).multiply(0.5))
      const to = from.add(edge(t + 0.15).subtract(from).multiply(0.85))
      taperedStroke({ spine: [from, bow, to], width: (s) => w * (1 - s), samples: 12, ...style })
    }
  }
  return group
}

/**
 * The part of `subject` left uncovered when a copy is pushed away from `side`:
 * a crescent hugging that side. Use dark for form shadows, light for highlights.
 */
export function crescent(
  subject: paper.PathItem,
  { side, depth, ...look }: Look & { /** Degrees: 0 right, 90 down. */ side: number; depth: number },
): paper.PathItem {
  const shifted = subject.clone({ insert: false })
  shifted.translate(new paper.Point({ angle: side + 180, length: depth }))
  const shape = subject.subtract(shifted)
  // Boolean results copy the subject's name; a second item must not share its id.
  return finish(shape, { name: '', fillColor: '#00000033', strokeColor: null, ...look })
}

/** Unites overlapping shapes into one silhouette, replacing them: canopies, clouds, bushes. */
export function merge(shapes: paper.PathItem[], look: Look = {}): paper.PathItem {
  const [first, ...rest] = shapes as [paper.PathItem, ...paper.PathItem[]]
  const merged = rest.reduce((shape, next) => shape.unite(next, { insert: false }), first)
  merged.insertAbove(first)
  for (const shape of shapes) shape.remove()
  return finish(merged, look)
}

/** Dots scattered inside a shape, for texture, grain, and stippled shading. */
export function stipple(
  within: paper.PathItem,
  {
    count,
    radius,
    rng,
    density = () => 1,
    name,
    parent,
    opacity = 1,
    ...look
  }: Look & {
    count: number
    /** One radius, or [min, max]. */
    radius: number | [number, number]
    rng: Random
    /** Relative chance of a dot at (u, v), each 0 to 1 across the shape's bounds. */
    density?: (u: number, v: number) => number
  },
): paper.Group {
  const [rMin, rMax] = typeof radius === 'number' ? [radius, radius] : radius
  const { x, y, width, height } = within.bounds
  const group = placeGroup(name ?? (within.name ? `${within.name}-stipple` : ''), within, parent)
  group.opacity = opacity
  for (let placed = 0, tries = 0; placed < count && tries < count * 50; tries++) {
    const u = rng.next()
    const v = rng.next()
    const point = new paper.Point(x + u * width, y + v * height)
    if (rng.next() > density(u, v) || !within.contains(point)) continue
    new paper.Path.Circle({ center: point, radius: rng.range(rMin, rMax), parent: group, ...look })
    placed++
  }
  return group
}

// Groups of marks sit right above the item they decorate unless given a parent.
function placeGroup(name: string, above: paper.Item, parent?: paper.Item): paper.Group {
  const group = new paper.Group({ name })
  if (parent) parent.addChild(group)
  else group.insertAbove(above)
  return group
}

/** A linear gradient from `from` to `to`, or radial when `radial` is set. */
export function gradient(
  from: paper.PointLike,
  to: paper.PointLike,
  stops: (paper.ColorLike | [paper.ColorLike, number])[],
  radial = false,
): paper.Color {
  return new paper.Color({ gradient: { stops, radial }, origin: from, destination: to })
}
