/**
 * Lightbox client logic. Bundled once by Astro; (re)initialised on every
 * `astro:page-load` and torn down on `astro:before-swap` (ClientRouter).
 *
 * URL / history model:
 * - Opening from a tile pushes one entry `#<photoId>` (through Astro's
 *   `navigate()` so the router knows about the hash and treats Back/Forward
 *   between the two entries as an in-page hash move, not a page reload).
 * - Stepping uses `history.replaceState` (no extra entries).
 * - Closing via UI calls `history.back()` if we pushed, else strips the hash
 *   with `replaceState`. A `popstate` whose hash is not a photo id closes it,
 *   so the browser Back button closes the viewer; Forward re-opens it.
 * - On page load, a hash matching a photo id on this page opens that photo.
 */
import { navigate } from 'astro:transitions/client';

interface Item {
  id: string;
  src: string;
  srcset: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  location: string;
  year: string;
  camera?: string;
}

const OUT_MS = 240;
const SLIDE_PX = 24;
const SWIPE_PX = 50;

let teardown: (() => void) | null = null;

function setup() {
  teardown?.();
  teardown = null;

  const root = document.querySelector<HTMLElement>('[data-lightbox]');
  const dataEl = root?.querySelector('script[data-lb-data]');
  if (!root || !dataEl) return;

  let items: Item[];
  try {
    items = JSON.parse(dataEl.textContent || '[]');
  } catch {
    return;
  }
  if (!items.length) return;

  const group = root.dataset.lightbox!;
  const img = root.querySelector<HTMLImageElement>('[data-lb-img]')!;
  const counter = root.querySelector<HTMLElement>('[data-lb-counter]')!;
  const titleEl = root.querySelector<HTMLElement>('[data-lb-title]')!;
  const locEl = root.querySelector<HTMLElement>('[data-lb-loc]')!;
  const camEl = root.querySelector<HTMLElement>('[data-lb-cam]')!;
  const closeBtn = root.querySelector<HTMLButtonElement>('[data-lb-close]')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('[data-lb-next]')!;

  const pagePath = location.pathname + location.search;
  const reducedMq = matchMedia('(prefers-reduced-motion: reduce)');
  const ac = new AbortController();
  const { signal } = ac;
  const timers = new Set<number>();
  const n = items.length;

  let open = false;
  let index = 0;
  let openerIndex = 0;
  let animating = false;
  let pushed = false; // we added the current #photo history entry
  let token = 0; // invalidates in-flight step animations
  let touchX: number | null = null;
  let touchY = 0;
  let savedStyles: { htmlOverflow: string; bodyOverflow: string; bodyPadding: string } | null = null;

  const wrap = (i: number) => ((i % n) + n) % n;
  const indexOfHash = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    return id ? items.findIndex((it) => it.id === id) : -1;
  };
  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };

  const preload = (i: number) => {
    const it = items[wrap(i)];
    const pre = new Image();
    pre.sizes = '100vw';
    pre.srcset = it.srcset;
    pre.src = it.src;
  };

  function render(i: number) {
    const it = items[i];
    img.removeAttribute('src');
    img.srcset = it.srcset;
    img.sizes = '100vw';
    img.width = it.width;
    img.height = it.height;
    img.src = it.src;
    img.alt = it.alt;
    counter.textContent = `${i + 1} / ${n}`;
    titleEl.textContent = it.title;
    locEl.textContent = `${it.location}, ${it.year}`;
    camEl.textContent = it.camera || 'Camera unknown';
  }

  function resetImg() {
    img.style.transition = 'none';
    img.style.opacity = '1';
    img.style.transform = 'translateX(0)';
    void img.offsetWidth;
    img.style.transition = '';
  }

  // ── Scroll lock ────────────────────────────────────────────────────────
  function lockScroll() {
    if (savedStyles) return;
    const html = document.documentElement;
    const body = document.body;
    const sbw = window.innerWidth - html.clientWidth;
    savedStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPadding: body.style.paddingRight,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (sbw > 0) {
      const pad = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${pad + sbw}px`;
    }
  }
  function unlockScroll() {
    if (!savedStyles) return;
    document.documentElement.style.overflow = savedStyles.htmlOverflow;
    document.body.style.overflow = savedStyles.bodyOverflow;
    document.body.style.paddingRight = savedStyles.bodyPadding;
    savedStyles = null;
  }

  // ── Open / close ───────────────────────────────────────────────────────
  function show(i: number) {
    token++;
    animating = false;
    index = wrap(i);
    render(index);
    resetImg();
    preload(index + 1);
    preload(index - 1);
  }

  function doOpen(i: number) {
    show(i);
    if (open) return;
    open = true;
    openerIndex = index;
    lockScroll();
    root!.inert = false;
    root!.removeAttribute('aria-hidden');
    root!.classList.add('is-open');
    closeBtn.focus({ preventScroll: true });
  }

  function findTrigger(i: number): HTMLElement | null {
    const all = document.querySelectorAll<HTMLElement>(
      `[data-lb-group="${CSS.escape(group)}"][data-lb-index="${i}"]`,
    );
    for (const el of all) if (el.getClientRects().length) return el;
    return all[0] ?? null;
  }

  function doClose() {
    if (!open) return;
    open = false;
    token++;
    animating = false;
    root!.classList.remove('is-open');
    root!.setAttribute('aria-hidden', 'true');
    root!.inert = true;
    unlockScroll();
    findTrigger(openerIndex)?.focus({ preventScroll: true });
  }

  /** Open from a tile: one new history entry. */
  function openFromUser(i: number) {
    doOpen(i);
    const id = items[index].id;
    if (decodeURIComponent(location.hash.slice(1)) === id) return;
    const hash = `#${encodeURIComponent(id)}`;
    // Astro pushes `scrollX/Y: 0` for the new entry; record the real position
    // so Back/Forward don't jump the page behind the viewer.
    const keepScroll = () => {
      if (history.state && location.hash === hash) {
        history.replaceState({ ...history.state, scrollX, scrollY }, '');
      }
    };
    try {
      // Astro's router pushes the entry synchronously (same-page hash move)
      // and records the hash as its current location, so a later Back is
      // treated as an in-page hash change rather than a page reload.
      navigate(hash).then(keepScroll, () => {});
    } catch {
      /* fall through */
    }
    if (location.hash !== hash) history.pushState(history.state, '', hash);
    keepScroll();
    pushed = true;
  }

  /** Close from the UI (button / Esc). */
  function closeFromUser() {
    if (!open) return;
    doClose();
    if (pushed) {
      pushed = false;
      history.back();
    } else if (indexOfHash() >= 0) {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
  }

  function syncHash() {
    history.replaceState(history.state, '', `#${encodeURIComponent(items[index].id)}`);
  }

  // ── Stepping ───────────────────────────────────────────────────────────
  function step(d: 1 | -1) {
    if (!open || n < 2 || animating) return;
    const next = wrap(index + d);

    if (reducedMq.matches) {
      show(next);
      preload(next + d);
      syncHash();
      return;
    }

    animating = true;
    const my = ++token;
    img.style.opacity = '0';
    img.style.transform = `translateX(${-d * SLIDE_PX}px)`;

    later(() => {
      if (my !== token) return;
      index = next;
      render(index);
      syncHash();
      preload(index + d);
      // Jump to the opposite side without animating, then slide back in.
      img.style.transition = 'none';
      img.style.transform = `translateX(${d * SLIDE_PX}px)`;
      void img.offsetWidth;
      img.style.transition = '';
      const reveal = () => {
        if (my !== token) return;
        requestAnimationFrame(() => {
          if (my !== token) return;
          img.style.opacity = '1';
          img.style.transform = 'translateX(0)';
          animating = false;
        });
      };
      // Give the new image a moment to decode so it doesn't pop in late.
      let done = false;
      const once = () => {
        if (!done) {
          done = true;
          reveal();
        }
      };
      img.decode().then(once, once);
      later(once, 350);
    }, OUT_MS);
  }

  // ── Listeners ──────────────────────────────────────────────────────────
  document.addEventListener(
    'click',
    (e) => {
      const t = (e.target as Element | null)?.closest?.<HTMLElement>('[data-lb-group]');
      if (!t || t.dataset.lbGroup !== group || root!.contains(t)) return;
      const i = Number(t.dataset.lbIndex);
      if (!Number.isInteger(i) || i < 0 || i >= n) return;
      e.preventDefault();
      openFromUser(i);
    },
    { signal },
  );

  closeBtn.addEventListener('click', closeFromUser, { signal });
  prevBtn.addEventListener('click', () => step(-1), { signal });
  nextBtn.addEventListener('click', () => step(1), { signal });

  document.addEventListener(
    'keydown',
    (e) => {
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFromUser();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Tab') {
        const f = [closeBtn, prevBtn, nextBtn];
        const cur = f.indexOf(document.activeElement as HTMLButtonElement);
        e.preventDefault();
        const nextI = cur < 0 ? 0 : (cur + (e.shiftKey ? -1 : 1) + f.length) % f.length;
        f[nextI].focus();
      }
    },
    { signal },
  );

  // Keep focus inside while open (e.g. focus moved by AT or a click outside).
  document.addEventListener(
    'focusin',
    (e) => {
      if (open && !root!.contains(e.target as Node)) closeBtn.focus({ preventScroll: true });
    },
    { signal },
  );

  root.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 1) {
        touchX = null;
        return;
      }
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    },
    { signal, passive: true },
  );
  root.addEventListener(
    'touchend',
    (e) => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      const dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    },
    { signal, passive: true },
  );

  window.addEventListener(
    'popstate',
    () => {
      // A cross-page traversal: Astro handles it; never open on the old page.
      if (location.pathname + location.search !== pagePath) return;
      const i = indexOfHash();
      if (i >= 0) {
        if (open && i === index) return;
        if (open) show(i);
        else doOpen(i);
        pushed = true; // the entry before this one is the hash-less page
      } else if (open || pushed) {
        pushed = false;
        doClose();
      }
    },
    { signal },
  );

  // Deep link on load.
  const initial = indexOfHash();
  if (initial >= 0) {
    pushed = false;
    doOpen(initial);
  }

  teardown = () => {
    ac.abort();
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    token++;
    open = false;
    unlockScroll();
  };
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => {
  teardown?.();
  teardown = null;
});
