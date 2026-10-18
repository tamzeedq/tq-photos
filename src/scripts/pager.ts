/**
 * Client-side paging for <Masonry pageSize>. Each breakpoint layout
 * (`[data-paged]` set) holds its pages pre-laid-out at build time; this shows
 * one page per set and drives the Previous/Next controls.
 *
 * - State is the index of the first photo on the current page, shared by all
 *   sets, so crossing a breakpoint (5 per page ↔ 10 per page) keeps the same
 *   photos in view.
 * - It's saved in `history.state` (no URL clutter), so reload and Back/Forward
 *   return to the same page. On Back via the ClientRouter it's applied to the
 *   incoming document in `astro:before-swap`, before Astro restores scroll.
 * - Paging keeps the scroll position unless the grid's top has scrolled out of
 *   view above, in which case the grid's top is brought back into view.
 * - Independent of the lightbox: closing it leaves the page and scroll as-is.
 */

const KEY = 'tqGalleryFirst';
type Saved = { path: string; first: number };

let ac: AbortController | null = null;

function savedFirst(path: string, state: unknown = history.state): number {
  const s = (state as Record<string, Saved> | null)?.[KEY];
  return s && s.path === path ? s.first : 0;
}

function pagesOf(set: HTMLElement) {
  return Array.from(set.querySelectorAll<HTMLElement>(':scope > .masonry'));
}

/** Show the page containing photo `first` in every set; returns nothing. */
function render(root: ParentNode, first: number) {
  for (const set of root.querySelectorAll<HTMLElement>('[data-paged]')) {
    const size = Number(set.dataset.pageSize) || 10;
    const pages = pagesOf(set);
    const p = Math.min(Math.floor(first / size), pages.length - 1);
    pages.forEach((el, i) => el.classList.toggle('is-current', i === p));
    const prev = set.querySelector<HTMLButtonElement>('[data-pager-prev]');
    const next = set.querySelector<HTMLButtonElement>('[data-pager-next]');
    const status = set.querySelector<HTMLElement>('[data-pager-status]');
    if (prev) prev.disabled = p <= 0;
    if (next) next.disabled = p >= pages.length - 1;
    if (status) status.textContent = `Page ${p + 1} / ${pages.length}`;
  }
}

function setup() {
  ac?.abort();
  ac = null;
  const sets = Array.from(document.querySelectorAll<HTMLElement>('[data-paged]'));
  if (!sets.length) return;

  ac = new AbortController();
  const { signal } = ac;
  const path = location.pathname;
  let first = savedFirst(path);
  render(document, first);

  function go(set: HTMLElement, dir: -1 | 1, fromKeyboard: boolean) {
    const size = Number(set.dataset.pageSize) || 10;
    const n = pagesOf(set).length;
    const p = Math.floor(first / size) + dir;
    if (p < 0 || p >= n) return;
    first = p * size;
    render(document, first);
    history.replaceState({ ...history.state, [KEY]: { path, first } satisfies Saved }, '');

    if (set.getBoundingClientRect().top < 0) set.scrollIntoView({ block: 'start' });
    if (fromKeyboard) {
      set
        .querySelector<HTMLElement>(':scope > .masonry.is-current [data-lb-group]')
        ?.focus({ preventScroll: true });
    }
  }

  for (const set of sets) {
    // `detail === 0` means the button was activated from the keyboard.
    set
      .querySelector('[data-pager-prev]')
      ?.addEventListener('click', (e) => go(set, -1, (e as MouseEvent).detail === 0), { signal });
    set
      .querySelector('[data-pager-next]')
      ?.addEventListener('click', (e) => go(set, 1, (e as MouseEvent).detail === 0), { signal });
  }
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', (e) => {
  ac?.abort();
  ac = null;
  // Back/Forward: lay out the saved page on the incoming document before the
  // router restores the scroll position, so it lands where it was.
  if (e.navigationType === 'traverse') render(e.newDocument, savedFirst(e.to.pathname));
});

export {};
