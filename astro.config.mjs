// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Served at https://tamzeedq.com/photography by a Cloudflare Worker that
// handles only the /photography* route (see wrangler.jsonc), so the root
// domain stays free for another site.
//
// Pages are written to dist/photography/ so the asset paths on disk match the
// URL paths (the Worker serves ./dist as-is). Build internal links with
// `url()` from src/lib/url.ts so they carry the base path.
export default defineConfig({
  site: 'https://tamzeedq.com',
  base: '/photography',
  trailingSlash: 'always',
  outDir: './dist/photography',
  integrations: [sitemap()],
});
