# dictadraw

Dictate an illustration in chat; a coding agent writes it as TypeScript, renders it, looks at the result, and revises. The output is an editable SVG with named layers and groups.

```text
scene.ts → Paper.js → SVG → resvg → PNG → agent looks → scene.ts
```

Everything runs headless in Node: Paper.js draws the geometry (with jsdom, which it needs for SVG export), resvg rasterizes previews. `AGENTS.md` is the agent's workflow and drawing vocabulary.

## Use

```sh
pnpm install
pnpm art:render olive-branch                     # SVG + previews in output/olive-branch/
pnpm art:render olive-branch --crop 330,620,360,360   # also a zoomed detail
```

To start a new piece, ask the agent for it, for example: "New artwork: a fox curled up asleep under falling maple leaves, warm autumn palette." It writes `artworks/<name>/brief.md` and `scene.ts`, renders, and iterates. Then give feedback the same way: "Make the leaves smaller and scatter more of them on the left; keep the fox as is."

## Examples

| Olive branch | Dusk meadow | Koi pond |
| --- | --- | --- |
| ![Olive branch](output/olive-branch/preview.png) | ![Dusk meadow](output/dusk-meadow/preview.png) | ![Koi pond](output/koi-pond/preview.png) |

## License

MIT, see `LICENSE`. Two glyph files keep their own terms: `artworks/cherry-blossom/sakura-glyph.svg` is outlined from the Yuji Syuku font and stays under the SIL Open Font License 1.1, and the seal-script SVGs are built from public-domain Wikimedia Commons glyphs. Each file names its source.
