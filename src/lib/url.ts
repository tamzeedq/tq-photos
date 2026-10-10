/**
 * The site is served under a base path (`base` in astro.config.mjs, e.g.
 * "/photography"). Build every internal link with `url()` so it carries it.
 *
 * Page paths get a trailing slash (`trailingSlash: 'always'`), matching how
 * the host serves `dir/index.html`, so links never take a redirect hop.
 *
 *   url('/')                 → "/photography/"
 *   url('/collections')      → "/photography/collections/"
 *   url('/#about')           → "/photography/#about"
 *   url('/favicon.svg')      → "/photography/favicon.svg"
 */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  if (path === '/' || path === '') return `${BASE}/`;
  if (path.startsWith('/#')) return `${BASE}/${path.slice(1)}`;
  const p = path.startsWith('/') ? path : `/${path}`;
  const isFile = /\.[a-z0-9]+$/i.test(p);
  return `${BASE}${p}${isFile || p.endsWith('/') ? '' : '/'}`;
}

/** Strip the base path from a pathname ("/photography/collections" → "/collections"). */
export function unbase(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}
