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
- `README.md` is for people using dictadraw. Document repository infrastructure (CI, workflows, upgrade automation, GitHub setup, tooling internals) in `AGENTS.md` instead, and keep it out of the README.

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

## CI and dependency upgrades

| Workflow             | Trigger                    | Effect                                                                   |
| -------------------- | -------------------------- | ------------------------------------------------------------------------ |
| CI                   | Every PR and push to `main` | `nix flake check`, type-check, re-render every artwork against `output/` |
| Dependency Upgrades  | Mondays                    | npm PRs: within-major (`deps/upgrades`) and majors (`deps/npm-majors`)   |
| Toolchain Upgrades   | Wednesdays                 | `nix flake update` PR (`deps/toolchains`): Node 26, pnpm, CI tools       |
| Dependabot Auto-merge | Dependabot PRs            | Enables auto-merge on non-major updates                                  |

CI installs its tools from the flake's `ci` package, the same versions `nix develop` uses. Renders are deterministic, so CI fails when any committed file in `output/` would change. When a change to `src/` or a dependency alters a render, re-render the affected artworks and commit their `output/` with that change; an upgrade PR that alters an approved artwork waits for that on its branch.

| Source                                   | Auto-merges | Notes                                                        |
| ---------------------------------------- | ----------- | ------------------------------------------------------------ |
| `deps/upgrades` (npm within major)       | Yes         | Versions must be 3 days old; see `.github/scripts/ncurc.cjs` |
| `deps/toolchains` (flake inputs)         | Yes         | Moving to a new Node major is a manual edit in `flake.nix`   |
| Dependabot GitHub Actions and security   | Non-major   | Actions are grouped weekly on Thursdays with a 3-day cooldown |
| `deps/npm-majors`                        | No          | Opened even when the build breaks; fix on the branch, then merge |

Dependabot opens only security PRs for npm, since Dependency Upgrades owns routine bumps. A PR that fails CI stays open, and the next weekly run updates the same branch.

### One-time repository setup

Upgrade PRs are opened and merged with a GitHub App token, because PRs made with `GITHUB_TOKEN` trigger no workflows, so CI would never run on them.

1. Create a GitHub App owned by `cottongeeks` with webhooks off and repository permissions Contents, Pull requests, and Workflows set to read and write. Install it on this repository, and generate a private key.
2. Store its client ID and key as both Actions and Dependabot secrets. Workflows that Dependabot triggers can read only Dependabot secrets.

   ```sh
   for app in actions dependabot; do
     gh secret set DEPS_APP_CLIENT_ID -R cottongeeks/dictadraw --app "$app" --body "<client id>"
     gh secret set DEPS_APP_PRIVATE_KEY -R cottongeeks/dictadraw --app "$app" < path/to/private-key.pem
   done
   ```

3. Allow auto-merge and delete merged branches:

   ```sh
   gh repo edit cottongeeks/dictadraw --enable-auto-merge --delete-branch-on-merge
   ```

4. Once CI has run on `main`, require its `checks` job on `main`. Repository admins bypass the rule, so direct pushes still work. Without a required check, auto-merge would merge before CI finishes.

   ```sh
   gh api repos/cottongeeks/dictadraw/rulesets --method POST --input - <<'JSON'
   {
     "name": "require-ci",
     "target": "branch",
     "enforcement": "active",
     "conditions": { "ref_name": { "include": ["~DEFAULT_BRANCH"], "exclude": [] } },
     "bypass_actors": [{ "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" }],
     "rules": [{
       "type": "required_status_checks",
       "parameters": {
         "strict_required_status_checks_policy": false,
         "required_status_checks": [{ "context": "checks", "integration_id": 15368 }]
       }
     }]
   }
   JSON
   ```
