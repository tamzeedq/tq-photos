# Handoff: Tamzeed Quazi — Photography Portfolio

## Overview
A personal photography portfolio for Tamzeed Quazi, a hobbyist landscape/travel/street photographer based in Vancouver, BC. The site is a quiet, gallery-like exhibition space: a full-bleed hero, a masonry "Highlights" grid, collections (Panorama Ridge, Tokyo, Seoul), an About section, and a contact block. The visual language is Swiss/modernist: one sans-serif (Archivo), near-black ink on off-white, a single red accent, zero corner radius, and **strong 2px ink rules that form a visible, fully-connected grid**.

Photos sit muted (desaturated + a fine halftone dot screen) at rest and clear to full colour on hover.

## About the Design Files
The files in `prototype/` are **design references built in HTML** — a working prototype showing intended look and behaviour, not production code to copy. Recreate the design in a real codebase. No codebase exists yet; the recommended stack is below.

Open `prototype/Portfolio.dc.html` directly in a browser to see it running (it needs the sibling `support.js`, `_ds/` and `photos/` folders). Template markup is at the top of the file; the behaviour (data, layout maths, lightbox, transitions) is in the `class Component` block at the bottom.

## Fidelity
**High-fidelity.** Colours, type, spacing, rules and interactions are final. Recreate pixel-accurately. Copy marked with a dashed underline in the prototype is **placeholder** written on Tamzeed's behalf — keep it but flag it for him to confirm. Data marked `[confirm]` or `[Camera]` is unverified.

---

## Suggested Website Architecture

### Stack
- **Astro** (static output) — content-first, ships near-zero JS, excellent image pipeline. Small interactive islands (lightbox, hover state) in vanilla TS or Preact.
- **Astro Content Collections** for photos and collections (Markdown/YAML + Zod schema), so Tamzeed can add photos by dropping a file and a YAML entry — no CMS required. If he later wants a UI, add a git-based CMS (Decap/Keystatic) on top of the same files.
- **`astro:assets` / `<Picture>`** for responsive AVIF/WebP, `srcset`, lazy-loading, and blur/colour placeholders.
- **Hosting:** Netlify or Vercel (static). Contact form via **Netlify Forms** or **Formspree** (no backend).
- Plain CSS with custom properties (tokens below) + CSS Modules or scoped `<style>` in Astro components. No Tailwind needed; the design is small and token-driven.

### Routes
| Route | Page | Notes |
|---|---|---|
| `/` | Home | Hero → Highlights → Collections (first 3) → About → Contact |
| `/collections` | Collections index | Full list of all collections as ruled rows |
| `/collections/[slug]` | Collection gallery | Header, 2-col masonry, "Next collection" link |
| `/#highlights`, `/#about`, `/#contact` | Anchors on home | Nav items scroll to these |
| `/404` | Not found | Same chrome; simple "Back to home" |

The prototype is a single page that swaps views in state; in production these are real routes. Use Astro **View Transitions** (`<ClientRouter />`) to reproduce the 320ms page fade.

The lightbox should be **URL-addressable** (`/collections/tokyo?photo=p02` or `#p02`) so photos are shareable and Back closes it.

### Folder structure
```
src/
  content/
    config.ts                 # Zod schemas for photos + collections
    photos/                   # one YAML per photo, or a single photos.yaml
      p01.yaml …
    collections/
      panorama-ridge.md       # frontmatter + blurb
      tokyo.md
      seoul.md
  assets/photos/              # originals (long edge ≥ 2400px); Astro generates sizes
  components/
    Nav.astro
    Hero.astro
    SectionHeader.astro       # big title (3/4) + ruled info cell (1/4)
    Masonry.astro             # shortest-column-first distribution
    PhotoTile.astro           # muted/halftone → clear on hover
    CollectionCard.astro      # home grid card
    CollectionRow.astro       # /collections index row
    About.astro
    Contact.astro             # form + red panel
    Footer.astro
    Lightbox.ts               # island: keyboard, swipe, focus trap
  layouts/Base.astro          # <head>, fonts, nav, footer, view transitions
  pages/
    index.astro
    collections/index.astro
    collections/[slug].astro
    404.astro
  styles/
    tokens.css                # design tokens below
    global.css                # resets, reduced-motion, focus ring
public/
  favicon.svg, og/…           # per-collection OG images
```

### Content schema (`src/content/config.ts`)
```ts
photo: {
  id: string,              // "p08"
  image: ImageMetadata,    // src/assets/photos/p08.jpg
  title: string,           // "Two lakes under cloud"
  location: string,        // "Panorama Ridge, BC"
  year: string,            // "2025"
  camera?: string,         // "Fujifilm FinePix JX560"
  alt: string,             // full descriptive alt text (required)
  placeholder: string,     // hex average colour, e.g. "#3a4040" (can be auto-computed at build)
  featured?: number,       // order in Highlights; omit if not featured
}
collection: {
  slug: string, title: string, where: string,
  cover: reference('photos'),
  photos: reference('photos')[],   // display order
  order: number,
  body: markdown                   // the blurb
}
```
"Years" on the collections index is derived from the min–max `year` of the collection's photos. Counts are derived, never hand-typed.

### Performance & protection
- Serve sizes 640/1080/1600/2000w; never ship originals. Cap at ~2000px long edge for casual copy protection.
- Paint `placeholder` colour as the tile background before the image loads; set `aspect-ratio` from intrinsic size to prevent layout shift.
- Hero image: `fetchpriority="high"`, preloaded, not lazy.
- Disable image drag (`draggable="false"`, `-webkit-user-drag:none`) and the context menu on `<img>` only.
- Target Lighthouse ≥ 95 across the board.

### SEO / sharing
Per-page `<title>`/description; Open Graph image = collection cover; `ImageObject` JSON-LD for photos; sitemap via `@astrojs/sitemap`.

---

## Design Tokens
From the Modernist design system (`prototype/_ds/…/styles.css`).

**Colour**
| Token | Hex | Use |
|---|---|---|
| `--color-bg` | `#f3f2f2` | Page ground |
| `--color-text` | `#201e1d` | Ink: text **and all 2px rules** |
| `--color-accent` | `#ec3013` | Contact panel fill, nav brand square |
| `--color-accent-600` | `#dd2b0f` | Primary button hover |
| `--color-accent-700` | `#ae1800` | Small accent text (numbers, "Open collection →") — use this, not 500, for text |
| `--color-accent-900` | `#4d170e` | Link hover |
| `--color-neutral-200` | `#eae7e7` | Hover fill on nav items, cards, rows |
| `--color-neutral-300` | `#d7d3d3` | Lightbox secondary text |
| `--color-neutral-500` | `#9b9797` | Dashed placeholder underline |
| `--color-neutral-800` | `#444141` | Lightbox rules |
| `--color-neutral-900` | `#2d2b2b` | Hero fallback bg |

**Type** — Archivo (Google Fonts, weights 400/600/800). Headings 800.
| Role | Size | Line-height | Tracking | Case |
|---|---|---|---|---|
| Hero name | `clamp(64px,13vw,220px)` | .84 | -0.045em | upper |
| Gallery / index H1 | `clamp(56px,10vw,168px)` | .85 | -0.045em | upper |
| Section H2 | `clamp(40px,6vw,96px)` | .9 | -0.04em | upper |
| Contact headline | `clamp(44px,6.5vw,104px)` | .88 | -0.045em | upper |
| Card H3 | `clamp(28px,3vw,44px)` | .95 | -0.03em | upper |
| Body large (About) | 19px / 400 | 1.5 | — | — |
| Body | 15px | 1.55 | — | — |
| Label / meta | 11px / 600 | — | 0.16em | upper |
| Nav brand | 15px / 800 | — | 0.02em | upper |

**Spacing** — gutter `clamp(16px,2.5vw,32px)` everywhere (cell padding and masonry gap). Section-title top padding `clamp(48px,7vw,96px)`, bottom 24px. Scale: 4/8/12/16/24/32.

**Radius** — 0 everywhere. **Shadows** — none.

**Rules** — `2px solid var(--color-text)`. Every rule must meet another rule or the viewport edge; no line may stop short. Technique used in the prototype: cells in a row get `border-left` + `margin-left:-2px` inside an `overflow:hidden` parent (so the first cell's left rule falls off-screen); stacked cells use `border-top` + `margin-top:-2px`. Column containers use `align-items:stretch` so vertical rules run full height. Info cells beside headings are `display:flex; flex-direction:column; justify-content:flex-end` (not `align-self:end`) so their left rule spans the full row.

**Image treatment (at rest)**
```css
img      { filter: saturate(.45) contrast(1.06) brightness(.98); transition: filter .5s ease; }
.dots    { position:absolute; inset:0; pointer-events:none;
           background-image: radial-gradient(circle, rgba(32,30,29,.26) 30%, transparent 32%);
           background-size: 3px 3px; mix-blend-mode: multiply; transition: opacity .5s ease; }
:hover img { filter:none; }  :hover .dots { opacity:0; }
```
Resting saturation (0.45) and the dot screen should be configurable constants. Hero is always muted + dotted (no hover). On viewports < 760px (touch), tiles show full colour with no dots.

---

## Screens / Views

### Global: Nav (sticky, top:0, z 20)
4-col grid, bg `--color-bg`, `border-bottom` 2px ink.
- Cols 1–2: brand link — 12×12 red square + "TAMZEED QUAZI", padding `16px gutter`.
- Cols 3–4: `border-left` 2px; four equal flex links **Highlights · Collections · About · Contact** (11px/600/0.16em upper, padding 16px 14px, hover bg neutral-200).
- Highlights/About/Contact → scroll to home anchors (navigate home first if elsewhere; offset 40px for sticky nav). **Collections → `/collections`.** Brand → home top.

### Global: Footer
4-col grid, `border-top` 2px. Cols 1–2 "© 2026 Tamzeed Quazi"; cols 3–4 (border-left) "Vancouver, BC". 11px label style, padding 16px gutter. Ensure it doesn't double a rule with a preceding border-bottom (prototype uses `margin-top:-2px`).

### Home `/`
1. **Hero** — height `calc(100svh - 52px)`, min 540px, `border-bottom` 2px. Image `p10.jpg` (Grey water), cover, muted + dots, parallax `translateY(scrollY*0.3)` (disabled under reduced motion). Bottom gradient `rgba(32,30,29,.7)` → transparent at 55%. Bottom-anchored 4-col grid, text `--color-bg`:
   - Row 1 (full width): "TAMZEED<br>QUAZI" hero type, padding `0 gutter 28px`.
   - Row 2: cols 1–2 tagline "Mountains, cities, and the weather between them." (15px/600) with 2px `--color-bg` top rule; cols 3–4 top + left 2px bg rules, "VANCOUVER, BC" left and "SCROLL" + 1×36px animated line right (scaleY .4↔1, 2.4s ease-in-out infinite).
2. **Highlights** (`#highlights`) — `SectionHeader`: H2 "HIGHLIGHTS" spanning 3 of 4 cols; right info cell (border-left) "10 PHOTOGRAPHS / 2023–2025 / Colour on hover" (last line accent-700). Then masonry: 3 cols ≥1100px, 2 cols 760–1099, 1 col <760. Distribute by shortest-column-first using aspect ratio. Columns separated by full-height 2px rules; each column has gutter padding and gutter gap. Each tile: top meta row "01" … location/year (meta fades in on hover), image at intrinsic ratio, caption title 15px/600 below (fades in on hover; always visible on mobile). Hover: image `scale(1.035)` over .8s `cubic-bezier(.2,.7,.2,1)` + clear filter. Click → lightbox over the Highlights list. Order: p02, p06, p03, p10, p12, p01, p07, p04, p11, p05.
3. **Collections** (`#collections`) — `SectionHeader`: H2 "COLLECTIONS" (3 cols); info cell "3 COLLECTIONS / 11 PHOTOGRAPHS" + `.btn-secondary` full-width, flush-left label "All collections →" → `/collections`. Then a 3-col grid (1 col <760) of the first 3 collections, cards ruled with border-left/top (-2px margins, parent overflow hidden). Card: padding gutter, gap 16px; meta row "01" (accent-700) ↔ "7 photographs"; cover 4:5 muted+dots; H3 title; `where` 14px; "Open collection →" accent-700 label. Hover: bg neutral-200, image scale 1.04 + clear. Click → `/collections/[slug]`.
4. **About** (`#about`) — grid `5fr 7fr` (1 col <760), `border-bottom` 2px. Left: portrait slot 4:5, max-width 520px (**needs Tamzeed's portrait**). Right (border-left): H2 "ABOUT"; two 19px paragraphs (second is 600 weight), max-width 640px; bottom stat row (border-top, 3 equal cells with border-left between): Based in / Vancouver, BC · Camera / Fujifilm FinePix JX560 · Shoots / Landscape, street, travel (h6 label 13px upper + 600 value).
5. **Contact** (`#contact`) — grid `5fr 7fr`. Left: red panel (`--color-accent`, text `--color-bg`), padding `clamp(48px,7vw,96px) gutter`, gap 32px: headline "PRINTS AVAILABLE ON REQUEST."; links tamzeed.q@gmail.com (mailto) and "Instagram — @izuaq" (17px/600); note "For licensing, tell me which photograph and where it will be used." (14px). Right: form, max-width 640px, gap 20px — H3 "SEND A MESSAGE"; Name, Email, Message (5 rows) using `.field`/`.input`; `.btn-primary` full-width, label left "Send message", arrow right. Success replaces form with "THANK YOU. I'LL WRITE BACK SOON." (24px/800).

### Collections index `/collections`
- Header: 4-col grid, border-bottom. H1 "COLLECTIONS" (3 cols, gallery H1 size); info cell (border-left, content bottom-aligned): "INDEX" (accent-700) / "3 collections" / "11 photographs".
- One **row per collection**, `border-bottom` 2px, grid `1fr 5fr 2fr 4fr` (stacks to 1 col <760, using border-top instead of border-left between cells). Cells, each padding gutter, separated by 2px border-left:
  1. Number "01" (11px label, accent-700)
  2. H2 title (section H2 size) + `where` 15px/600; blurb 15px/1.5 max 46ch at bottom (space-between)
  3. "7 PHOTOGRAPHS / 2025" top, "Open collection →" (accent-700) bottom
  4. Cover image 4:3, muted + dots
- Hover: row bg neutral-200, cover clears and scales 1.04. Whole row is a link to `/collections/[slug]` (use a real `<a>`).

### Collection gallery `/collections/[slug]`
- Header 4-col grid, border-bottom: full-width "← ALL COLLECTIONS" bar (padding 14px gutter, border-bottom, hover neutral-200) → `/collections`; H1 title (3 cols); info cell (border-left, bottom-aligned) "01 / 7 photographs / Garibaldi Provincial Park, British Columbia"; full-width blurb row (border-top, 17px, max 70ch).
- Masonry 2 cols (1 <760), same tile and rule rules as Highlights; caption row: title ↔ year (14px/600), fades in on hover.
- "Next collection" — big link: next title (section H2) left, "NEXT COLLECTION →" accent-700 right; hover neutral-200. Wraps around.

### Lightbox (overlay on any grid)
Fixed, full-screen, bg `--color-text`, text `--color-bg`, fade .3s. Top bar: counter "3 / 7" | "Close ×" (border-left neutral-800). Centre: image `object-fit:contain`, padding `clamp(12px,3vw,40px)`; left/right 25%-width invisible click zones (w-resize/e-resize cursors). Bottom 4-col bar (border-top neutral-800): title (cols 1–2, 800 upper) · "location, year" · camera (neutral-300). Arrow glyphs ← → at bottom corners.
- Keys: ← / → step (wraps), Esc closes. Touch: horizontal swipe > 50px steps.
- Step animation: fade out 240ms with 24px slide in direction, swap, slide back in (.4s `cubic-bezier(.2,.7,.2,1)`). Preload next image.
- Lock body scroll while open; trap focus; return focus to the clicked tile on close; `role="dialog" aria-modal="true"`.

## Interactions & Behaviour
- **Reveal on scroll:** `[data-reveal]` elements start `opacity:0; translateY(28px)`, animate to rest when 8% visible (IntersectionObserver, rootMargin bottom -8%): opacity 1s, transform 1.1s, `cubic-bezier(.2,.7,.2,1)`, staggered 0/90/180ms in groups of 3.
- **Page transitions:** fade the page to 0 over 300ms, swap, scroll to top, fade in.
- **Reduced motion:** disable parallax, reveals, zooms, transitions, and smooth scroll.
- **Tiles are keyboard-operable:** focusable, Enter/Space opens the lightbox; focus ring `2px solid var(--color-accent)`, offset 2px.
- **Breakpoints:** <760 (mobile: 1 col, captions always visible, colour on), 760–1099 (Highlights 2 cols), ≥1100 (Highlights 3 cols).
- **Form:** HTML5 required + email validation. Submit to Netlify Forms/Formspree; show success state; on error show inline message under the button in accent-700 and keep field values. Add a honeypot field.

## State (per page; minimal in Astro)
- Lightbox island: `list: string[]`, `index`, `open`, `animating`, `direction`. Sync `index` to URL hash.
- Tile hover is pure CSS (`:hover`, `:focus-visible`) in production — the prototype used JS state only for convenience.
- Contact island: `status: 'idle' | 'sending' | 'sent' | 'error'`.

## Assets
`prototype/photos/p01–p12.jpg` — Tamzeed's own photos, resized to 1800px long edge. Get originals from him for the build. Metadata (title, location, year, camera, alt, placeholder colour) is in the `P = { … }` object in the prototype's logic block — port it to the content collection.

**To confirm with Tamzeed:**
- p03 location (Nagoya Castle?), p04 location (red barn), p05 location (sunset)
- Camera for p01, p02, p06, p12
- Tokyo and Seoul only have 2 photos each — more needed
- Portrait for About
- All dashed-underline copy (tagline, About text, collection blurbs)
- Contact form provider

Icons: none beyond text arrows (→ ← ×). If icons are added, use Lucide.

## Files
- `prototype/Portfolio.dc.html` — the full prototype (all views + lightbox + logic)
- `prototype/_ds/modernist-…/styles.css` — design tokens and component classes (`.btn`, `.field`, `.input`)
- `prototype/photos/` — image assets
- `prototype/support.js`, `image-slot.js`, `_ds_bundle.js` — prototype runtime only; not needed in production
