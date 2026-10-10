# Tamzeed Quazi — Photography

Static portfolio site built with [Astro](https://astro.build) 5. Design spec: [`design_handoff_tq_portfolio/README.md`](design_handoff_tq_portfolio/README.md).

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview
npm run check     # type-check .astro / .ts
```

Requires Node 20+. (Astro 5 is pinned because Astro 6+ needs Node 22.)

## Adding photos

Photos are grouped by collection: the image lives in `src/assets/photos/<collection>/` and its metadata in `src/content/photos/<collection>/`. The filename (without extension) is the photo id, so keep ids unique across collections (the convention is `<collection>-<original filename>`, e.g. `japan-dscf9089`).

1. Export a JPEG with the long edge at 2400px and **metadata stripped** (phone photos carry GPS). Astro generates AVIF/WebP sizes from it, capped at 2000px.
2. Save it as `src/assets/photos/japan/japan-dscf9999.jpg` and add `src/content/photos/japan/japan-dscf9999.yaml`:

   ```yaml
   image: ../../../assets/photos/japan/japan-dscf9999.jpg
   title: "Title"
   location: "Kyoto"
   year: "2026"
   camera: "Fujifilm FinePix JX560"   # optional
   alt: "Full descriptive alt text"
   placeholder: "#3a4040"              # average colour, painted before load
   featured: 11                        # optional: position in Highlights
   ```

3. Add its id to `photos:` in `src/content/collections/<slug>.md`.

Counts, year ranges and numbering are derived. Never type them by hand.

## Adding a collection

Create `src/content/collections/<slug>.md`:

```md
---
title: Vancouver Island
where: British Columbia
cover: vancouver-island-dscf0001
photos: [vancouver-island-dscf0001, vancouver-island-dscf0002]
order: 4
---
One-paragraph blurb.
```

## Where things live

| Path | What |
| --- | --- |
| `src/styles/tokens.css` | Design tokens (colour, type, spacing, image treatment: `--rest-saturation`, `--dot-opacity`) |
| `src/styles/global.css` | Resets, utilities, ruled-grid helpers, photo treatment, reveal, reduced motion |
| `src/lib/content.ts` | Content queries + masonry distribution |
| `src/components/` | Nav, Footer, Hero, SectionHeader, Masonry, PhotoTile, PhotoImage, CollectionCard, CollectionRow, About, Contact, Lightbox |
| `src/scripts/` | Client scripts: `motion.ts` (reveal, parallax), `lightbox.ts` |

## Deploy

Netlify (see `netlify.toml`). The contact form uses Netlify Forms. Enable form notifications in the Netlify dashboard. Update `site` in `astro.config.mjs` and `public/robots.txt` to the real domain.

## To confirm with Tamzeed

- Copy with a dashed underline (`.placeholder-copy`): tagline, About text, collection blurbs (Japan, Korea, St. Marks Summit, 5040 Peak and Dumpy Dump blurbs were drafted from the photos)
- Panorama Ridge blurb says "two days", but the photos are all from 26 Sep 2026
- Locations marked `[confirm]` (`grep -r "confirm" src/content`)
- Japan: the Fujifilm camera clock was reset (EXIF says 2012); year set to 2026 from the Sony shots on the same trip
- Hero image (`p10`, "Grey water") isn't in any collection folder; pick a replacement or add it to Panorama Ridge
- About section lists only the Fujifilm; the collections were also shot on a Sony NEX-3N and an iPhone 13
- Portrait for About
- Production domain
