# INKDRUM™ — Risograph Print Shop

A browser-based risograph studio. Upload a photo, load up to six ink drums with
real Riso ink colors, and fine-tune separations, screens, registration, paper
stock, and press condition in real time. GRAINRAD-style studio layout,
Super-Riso-style print-shop aesthetics.

## Run it

```bash
npm install
npm run dev
```

## How it works

Everything renders in a single WebGL2 fragment pass (`src/gl/shader.ts`),
simulating an actual riso workflow:

1. **Separation** — each drum pulls a coverage plate from the source image
   (darkness, CMYK plates, RGB isolation, shadows/mids/highlights, or flood).
2. **Screening** — coverage becomes ink through a screen: fine/rough/dirty
   grain, halftone dots, line screen, diffusion, or flat wash. Screens live in
   image-pixel space, so exports re-render sharp at full resolution.
3. **Registration** — per-drum offset and skew, plus a SHAKE button, because
   riso never lines up twice.
4. **Compositing** — translucent soy inks multiply over the paper, so
   overlapping pink + blue makes purple, exactly like layered riso passes.
5. **Paper stock** — each named stock is a procedural material (fiber scale,
   anisotropy, flecks, warmth, calender), not just a color. Tooth intensity
   scales how hard that character reads; flecks and finish stay resolution-
   normalized so preview and export match.
6. **Press condition** — dot gain/ink spread, uneven roller pressure, press
   wear (edge falloff, drum streaks, hickeys), and finishing scuff.

## Separations

Two plate exports, each a ZIP of one PNG per drum plus a `JOB-SHEET.txt`
recording ink, hex, separation source, density, screen and registration for
every pass.

- **PRESS MASTERS** — continuous-tone grayscale, black on white. No screen
  (the Risograph rules its own — pre-screened art plus machine screening gives
  moiré) and no simulated misregistration, so the plate is dead square and the
  real press adds its own drift. These are what you burn stencils from.
- **PROOF PASSES** — each drum alone on the paper stock in its ink colour,
  screen and press wear included. These show what a pass puts on paper; they
  each already contain the paper, so they are not layers to multiply back
  together.

Optional crop marks and registration targets sit in a trim margin outside the
image, with a plate label in the bottom margin.

## Structure

- `src/gl/shader.ts` — the whole riso model, one fragment shader
- `src/gl/renderer.ts` — WebGL2 plumbing + uniform packing
- `src/inks.ts` — Riso ink library (standard + fluoro drums), paper stocks, house recipes
- `src/App.tsx` — studio UI (drums, recipes, paper, press, export)
- `src/separations.ts` — trim marks, plate naming, job sheet
- `src/zip.ts` — dependency-free store-method ZIP writer
- `src/demoImage.ts` — procedural sample image so the press is never empty

State persists to localStorage. Export renders at source resolution (or 2×)
with `preserveDrawingBuffer` + `canvas.toBlob`.

## License

MIT © Jackson Fall — see [LICENSE](LICENSE).
