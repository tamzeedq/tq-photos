// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: set to the production domain once hosting is decided.
export default defineConfig({
  site: 'https://tamzeedquazi.com',
  integrations: [sitemap()],
});
