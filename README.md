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

1. Drop the original into `src/assets/photos/` (long edge ≥ 2000px is ideal; Astro generates AVIF/WebP sizes, capped at 2000px).
2. Add `src/content/photos/<id>.yaml`:

   ```yaml
   image: ../../assets/photos/p13.jpg
   title: "Title"
   location: "Place"
   year: "2026"
   camera: "Fujifilm FinePix JX560"   # optional
   alt: "Full descriptive alt text"
   placeholder: "#3a4040"              # average colour, painted before load
   featured: 11                        # optional: position in Highlights
   ```

3. To put it in a collection, add its id to `photos:` in `src/content/collections/<slug>.md`.

Counts, year ranges and numbering are derived. Never type them by hand.

## Adding a collection

Create `src/content/collections/<slug>.md`:

```md
---
title: Vancouver Island
where: British Columbia
cover: p13
photos: [p13, p14]
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

- Copy with a dashed underline (`.placeholder-copy`): tagline, About text, collection blurbs
- p03, p04, p05 locations (marked `[confirm]`)
- Camera for p01, p02, p06, p12 (shows "Camera unknown")
- More photos for Tokyo and Seoul (2 each)
- Portrait for About
- Original high-res files (current ones are 1800px)
- Production domain
