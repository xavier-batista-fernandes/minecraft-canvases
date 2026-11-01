# Minecraft Canvases

Turn a Minecraft painting into a paint-by-numbers chart, so you can paint it in real life.

Pick one of the 50 Java Edition paintings (or load your own PNG) and the app shows every pixel as a numbered square, plus a palette with the hex and RGB code of each paint and how many squares need it.

## Features

- **Painting picker** with all Java Edition 1.21 paintings, grouped by size in blocks like the [Minecraft Wiki's Painting page](https://minecraft.wiki/w/Painting), with search.
- **Numbered chart** with spreadsheet-style coordinates (A, B, C… across, 1, 2, 3… down), a heavier line every 16 pixels (one block), and adjustable cell size.
- **Color simplification:** reduce a painting to 2–64 paints (or keep every exact color) with a deterministic weighted k-means. Paints are numbered dark → light, which is handy for layering.
- **Highlight a paint:** click a palette row to dim everything else and see only the squares that need it.
- **Copy the color list** as tab-separated text for a spreadsheet or notes app.
- **Your own images:** upload, drag-and-drop or paste a PNG (e.g. from a resource pack). A crop tool picks one painting out of a sheet like Bedrock's `kz.png`.
- Light and dark themes; remembers the last painting you picked.

## Getting started

Requires Node.js 20.19+ (see `.nvmrc`).

```sh
npm install
npm run dev        # start the dev server at http://localhost:5173
```

| Script              | What it does                                    |
| ------------------- | ----------------------------------------------- |
| `npm run dev`       | Dev server with hot reload                      |
| `npm run build`     | Type-check and build the static site to `dist/` |
| `npm run preview`   | Serve the built `dist/` locally                 |
| `npm test`          | Run the unit tests (Vitest)                     |
| `npm run typecheck` | Type-check without building                     |
| `npm run check`     | Type-check and test                             |

The build is a plain static site with relative paths, so `dist/` can be hosted anywhere (GitHub Pages, Netlify, a folder on a server). CI runs type-check, tests and build on every pull request.

## Project structure

```
index.html                 Page markup (Vite entry)
public/paintings/          One PNG per painting, named by its Minecraft texture id
src/
  main.ts                  App state and event wiring
  styles.css               Theme tokens and layout
  data/
    paintings.json         Painting manifest: id, wiki name, size in pixels
    paintings.ts           Typed access, image URLs, grouping and search
  lib/                     Framework-free logic, unit tested
    quantize.ts            Pixels → chart: unique colors, k-means reduction, numbering
    render.ts              Draws a chart onto a <canvas>
    crop.ts                Crop rectangle clamping
    color.ts               Hex, luminance, column labels
    export.ts              Palette → copyable text
    image.ts               Decode an image URL or file into pixels
  ui/                      Small DOM renderers: picker, palette list, summary line
tests/                     Vitest tests, including a check that every manifest entry has a matching PNG
```

The stack is deliberately small: **Vite + TypeScript**, no UI framework. The chart logic in `src/lib/` is plain functions over pixel arrays, so it can be tested in Node and reused if the UI ever moves to a framework.

## Adding or updating a painting

1. Put the texture PNG in `public/paintings/`, named after its Minecraft id (for example `public/paintings/wanderer.png`). Java textures live in the game jar under `assets/minecraft/textures/painting/`.
2. Add an entry to `src/data/paintings.json`:
   ```json
   { "id": "wanderer", "name": "Wanderer", "width": 16, "height": 32 }
   ```
   `width` and `height` are in texture pixels (16 per block).
3. Run `npm test`. It fails if a PNG is missing, unlisted, or a different size than the manifest says.

## Credits and legal

Painting artwork © Mojang Studios and Kristoffer Zetterstrand / the original artists. Painting names follow the Minecraft Wiki.

NOT AN OFFICIAL MINECRAFT PRODUCT. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.
