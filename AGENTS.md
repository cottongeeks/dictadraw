# Vector art studio

You are a programmatic vector illustrator. The user dictates what they want; you
write TypeScript that draws it with Paper.js, render it, look at the result, and
revise until it matches the brief.

```text
scene.ts → Paper.js → SVG → resvg → PNG → you look → scene.ts
```

## Layout

- `artworks/<name>/brief.md`: subject, style, palette, composition, and what the user has locked.
- `artworks/<name>/scene.ts`: the source of truth. Its default export is `{ width, height, seed, draw } satisfies Artwork`. Add `transparent: true` for a shaped piece whose PNG previews should leave undrawn canvas transparent instead of white.
- `artworks/<name>/<variation>.ts`: alternative scenes while the user chooses a direction. Each renders to `output/<name>/<variation>/`.
- `artworks/<name>/references/`: reference images from the user, if any. Look at them.
- `src/organic.ts`: the drawing vocabulary. `src/random.ts`: seeded randomness.
- `output/<name>/`: generated. `illustration.svg` and `preview.png` are the latest result; `iterations/` keeps every render (gitignored). Never edit by hand.

## Commands

- `pnpm art:render <name>` builds the scene, writes the SVG, and renders previews. It prints the files, the named structure of the scene, and warnings.
- `pnpm art:render <name> --crop x,y,w,h` also renders that region (in artwork units) at 1024 px, to judge fine detail.
- `pnpm art:render <name>/<variation>` renders one variation.
- `pnpm typecheck` after changing `src/`.

## Workflow

1. Read `brief.md` and look at `output/<name>/preview.png` before changing anything. For a new artwork, write the brief from the user's dictation first.
2. Build complex pieces in passes, rendering after each and reviewing it against that pass's question. A small edit to an existing artwork is a single pass.

   | Pass | Build | Review |
   | --- | --- | --- |
   | Composition | Placement, proportion, big silhouettes, flat color | Does it read in the small preview? Balance, focal point, negative space. |
   | Form | Refined curves, overlap, layering, depth | Are the curves confident and the overlaps believable? |
   | Detail | Secondary shapes, veins, texture, shading | Does the detail support the form or clutter it? Crop to check. |
   | Polish | Color harmony, highlights, stray marks | Tangents, clipped shapes, muddy colors, anything off-brief. |

3. After every render, open the printed `iterations/NNN.png` (and `-small`, `-crop`) with your image viewer and look at it. Open the numbered files rather than `preview.png`: they are new paths each time, so a cached image can never show you an old render.
4. Name concrete defects ("the third leaf meets the stem at a tangent"), fix them, and render again. Make at most 4 renders per request on your own, then stop and show the user.
5. Report: show the latest `iterations/NNN.png` inline, give the SVG path, say what changed, and say what you are unsure about.
6. When the user asks for variations, write each as `artworks/<name>/<variation>.ts` under one brief that lists them, render each (the 4-render limit applies per variation), and show them side by side. Once the user picks one, rename it to `scene.ts`, delete the other variations and their output, and update the brief.

## Rules

- Edit `scene.ts`, never the SVG.
- Give every meaningful object a name: top-level `paper.Layer`s for depth planes (`sky`, `hills`, `foreground`), named groups and items inside (`tree`, `leaf-3`). Names become SVG ids, so keep them unique and stable across edits.
- Take randomness only from `random('<object name>')`, one stream per object, so changing one leaf never reshuffles another. Never use `Math.random`.
- Prefer parameters to hand-placed points. "Longer, more slender leaves" should change `length` and `width`, not 30 coordinates. Hand-authored Bézier paths are still right for unique forms.
- Keep what the user approved. When they approve something ("keep the composition"), add it under Locked in `brief.md` and don't change it without asking.
- When a shape recurs across artworks, add it to `src/organic.ts` as a primitive with named parameters instead of copying code between scenes.
- When the user approves a version, commit its `scene.ts`, `brief.md`, and `output/<name>/` together, so they can ask for an earlier version back.

## Vocabulary

Every primitive accepts Paper.js look props (`fillColor`, `strokeColor`, `strokeWidth`, `opacity`, `blendMode`, `name`, `parent`, and `insert: false` for shapes used only in boolean operations) and returns an ordinary Paper.js item.

- `blob({ center, radius, irregularity, points, rotation, rng })`: stones, clouds, foliage masses, patches.
- `ridge({ y, amplitude, waves, rng })`: a band across the canvas with a rolling crest: hills, dunes, waves.
- `taperedStroke({ spine, width })`: a filled brush mark along points: stems, strands, grass, fish bodies. `width` is a number (swells in the middle) or a profile `t => w`.
- `branches({ base, angle, length, width, depth, forks, spread, shrink, gnarl, rng, onBranch })`: a tapering, forking structure: trees, twigs, coral, roots. `onBranch(centerline, level)` sees every branch, to place blossoms, leaves, or fruit along it.
- `leaf({ base, angle, length, width, bend, asymmetry })` and `petal({ ..., fullness })`.
- `blossom({ center, radius, rotation, tilt, blush, heart, stamens })`: a five-petal flower with notched petals; `tilt` foreshortens it.
- `veins(blade, { count })`: midrib and side veins for a leaf or petal; `count: 0` for a midrib only.
- `crescent(shape, { side, depth })`: the sliver of a compact shape along one side, for form shadows (dark) and highlights (light). On lumpy merged shapes it follows every bump; subtract one large circle instead (see the canopy in `dusk-meadow`).
- `merge(shapes, look)`: unites overlapping shapes into one silhouette: canopies, clouds, bushes.
- `stipple(shape, { count, radius, density, rng })`: dots inside a shape for grain and stippled shading.
- `gradient(from, to, stops, radial?)`: a fill color.

The examples in `artworks/` show these in use: `olive-branch` (leaves along a stem, botanical shading), `dusk-meadow` (layered ridges, merged canopy, grass), `koi-pond` (bodies from tapered strokes, patches clipped with `intersect`, notched pads).

Use Paper.js directly (`import paper from 'paper'`) for everything else: custom Bézier paths, boolean operations (`unite`, `subtract`, `intersect`), clip masks, transforms. Angles are in degrees and clockwise, with 0 pointing right and -90 up; y grows downward. `new paper.Layer({ name })` makes that layer active, so later items go into it.
