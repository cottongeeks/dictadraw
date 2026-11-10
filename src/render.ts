// pnpm art:render <artwork>[/<variation>] [--crop x,y,w,h]
// Builds artworks/<artwork>/scene.ts (or a variation, artworks/<artwork>/<variation>.ts)
// with Paper.js, exports SVG, and rasterizes PNG previews with resvg for visual inspection.

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import { Resvg } from '@resvg/resvg-js'
import paper from 'paper'
import { createRandom, type Artwork } from './index.ts'

const { positionals, values } = parseArgs({ allowPositionals: true, options: { crop: { type: 'string' } } })
const name = positionals[0]
const scene = name && [join('artworks', name, 'scene.ts'), join('artworks', `${name}.ts`)].find((file) => existsSync(file))
if (!scene) {
  const available = readdirSync('artworks', { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap(({ name: dir }) =>
      readdirSync(join('artworks', dir))
        .filter((file) => file.endsWith('.ts'))
        .map((file) => (file === 'scene.ts' ? dir : `${dir}/${file.slice(0, -3)}`)),
    )
  console.error(`Usage: pnpm art:render <artwork>[/<variation>] [--crop x,y,w,h]\nArtworks: ${available.join(', ')}`)
  process.exit(1)
}

const art: Artwork = (await import(pathToFileURL(scene).href)).default
paper.setup(new paper.Size(art.width, art.height))
const root = createRandom(art.seed ?? 0)
art.draw({ width: art.width, height: art.height, random: (key) => root.fork(key) })
const warnings = check()
const structure = paper.project.layers.flatMap((layer) => tree(layer, 1))
const svg = exportRegion(paper.view.bounds)
const crop = values.crop && new paper.Rectangle(...(values.crop.split(',').map(Number) as [number, number, number, number]))

// The latest result sits at the top of output/<artwork>/. Each render also gets
// numbered copies in iterations/: a history to compare against, and fresh file
// names, so an image viewer that caches by path never shows a stale preview.
const out = join('output', name)
mkdirSync(join(out, 'iterations'), { recursive: true })
const done = readdirSync(join(out, 'iterations')).filter((file) => /^\d+\.png$/.test(file)).length
const iteration = `iterations/${String(done + 1).padStart(3, '0')}`
const preview = rasterize(svg, paper.view.bounds, 1024)
const files: [string, string][] = [
  ['preview', write(`${iteration}.png`, preview)],
  ['small', write(`${iteration}-small.png`, rasterize(svg, paper.view.bounds, 256))],
]
if (crop) files.push(['crop', write(`${iteration}-crop.png`, rasterize(exportRegion(crop), crop, 1024))])
files.push(['svg', write('illustration.svg', svg)])
write('preview.png', preview)

const shapes = svg.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b/g)?.length ?? 0
console.log(`Rendered ${name} (${iteration}): ${shapes} shapes, ${Math.round(svg.length / 1024)} KB of SVG`)
for (const [label, file] of files) console.log(`  ${label.padEnd(9)}${file}`)
console.log(`\nStructure\n${structure.join('\n')}`)
if (warnings.length) console.log(`\nWarnings\n${warnings.map((w) => `  ${w}`).join('\n')}`)

// Shapes entirely outside the region are invisible there, and resvg 2.6 panics
// on translucent ones far outside it, so they are dropped before exporting.
function exportRegion(region: paper.Rectangle): string {
  const shapes = paper.project.getItems({ match: (item: paper.Item) => !(item instanceof paper.Group) })
  for (const item of shapes) if (!item.clipMask && !item.strokeBounds.intersects(region)) item.remove()
  const groups = paper.project.getItems({ class: paper.Group }).reverse()
  for (const group of groups) if (!(group instanceof paper.Layer) && !group.hasChildren()) group.remove()
  return paper.project.exportSVG({ asString: true, bounds: region, precision: 2 }) as string
}

function rasterize(svg: string, region: paper.Rectangle, size: number): Buffer {
  const fitTo = region.width >= region.height ? { mode: 'width' as const, value: size } : { mode: 'height' as const, value: size }
  return new Resvg(svg, { fitTo, background: '#ffffff' }).render().asPng()
}

function write(file: string, data: string | Buffer): string {
  const path = join(out, file)
  writeFileSync(path, data)
  return path
}

// Lists named items, so the agent can check the scene's semantic structure.
function tree(item: paper.Item, depth: number): string[] {
  const indent = '  '.repeat(depth)
  const named = (item.children ?? []).filter((child) => child.name)
  const shown = named.slice(0, 8)
  const lines = [`${indent}${item.name || '(unnamed layer)'}${item.children ? `  ${item.getItems({ class: paper.Path }).length} paths` : ''}`]
  if (depth < 4) lines.push(...shown.flatMap((child) => tree(child, depth + 1)))
  if (named.length > shown.length) lines.push(`${indent}  … ${named.length - shown.length} more`)
  return lines
}

function check(): string[] {
  const warnings: string[] = []
  const all = paper.project.getItems({})
  const counts = new Map<string, number>()
  for (const item of all) if (item.name) counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
  const duplicates = [...counts].filter(([, n]) => n > 1).map(([n, c]) => `${n} ×${c}`)
  if (duplicates.length) warnings.push(`Duplicate names (SVG ids should be unique): ${duplicates.join(', ')}`)
  const outside = all.filter((item) => item.name && !item.bounds.isEmpty() && !item.bounds.intersects(paper.view.bounds))
  if (outside.length) warnings.push(`Entirely off-canvas: ${outside.map((item) => item.name).join(', ')}`)
  const broken = all.filter((item) => item instanceof paper.PathItem && item.pathData.includes('NaN'))
  if (broken.length) warnings.push(`NaN coordinates in: ${broken.map((item) => item.name || item.parent?.name || 'an unnamed path').join(', ')}`)
  if (!all.some((item) => !(item instanceof paper.Group))) warnings.push('The scene drew nothing.')
  return warnings
}
