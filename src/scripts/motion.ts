/**
 * Reveal on scroll, hero parallax and the image context-menu guard.
 * Bundled once; (re)initialised on every `astro:page-load` (ClientRouter)
 * and cleaned up on `astro:before-swap`.
 *
 * Reveal note: `[data-reveal]` tiles inside a display:none masonry layout
 * have an empty box and never intersect, but they stay observed. When a
 * resize displays that layout, IntersectionObserver re-evaluates them on the
 * next frame and reports the ones in view, so they reveal normally. Ones that
 * become displayed *above* the viewport are revealed instantly on resize.
 */

let cleanup: (() => void) | null = null;

/** Reveal without playing the transition (already scrolled past). */
function revealInstantly(el: HTMLElement) {
  el.style.transition = 'none';
  el.classList.add('is-revealed');
  void el.offsetWidth;
  el.style.transition = '';
}

function setup() {
  cleanup?.();
  cleanup = null;

  document.documentElement.classList.add('js');

  const ac = new AbortController();
  const { signal } = ac;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)'));
  let io: IntersectionObserver | null = null;
  let raf = 0;

  // ── Reveal ─────────────────────────────────────────────────────────────
  if (reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-revealed'));
  } else {
    const pending = new Set<HTMLElement>();
    io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (!en.isIntersecting) continue;
          en.target.classList.add('is-revealed');
          io!.unobserve(en.target);
          pending.delete(en.target as HTMLElement);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const revealAbove = () => {
      for (const el of pending) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.top < 0) {
          revealInstantly(el);
          io!.unobserve(el);
          pending.delete(el);
        }
      }
    };
    for (const el of els) {
      pending.add(el);
      io.observe(el);
    }
    // Elements already scrolled past (e.g. arriving via #hash) show at once.
    revealAbove();
    // …and again once any hash / scroll restoration has settled.
    let resizeT = window.setTimeout(revealAbove, 120);
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(resizeT);
        resizeT = window.setTimeout(revealAbove, 150);
      },
      { signal },
    );
    signal.addEventListener('abort', () => clearTimeout(resizeT));
  }

  // ── Parallax ───────────────────────────────────────────────────────────
  const par = document.querySelector<HTMLElement>('[data-parallax]');
  if (par && !reduced) {
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) par.style.transform = `translate3d(0, ${y * 0.3}px, 0)`;
    };
    window.addEventListener(
      'scroll',
      () => {
        if (!raf) raf = requestAnimationFrame(update);
      },
      { passive: true, signal },
    );
    update();
  }

  // ── Context-menu guard (images only) ───────────────────────────────────
  document.addEventListener(
    'contextmenu',
    (e) => {
      if ((e.target as Element | null)?.tagName === 'IMG') e.preventDefault();
    },
    { signal },
  );

  cleanup = () => {
    ac.abort();
    io?.disconnect();
    if (raf) cancelAnimationFrame(raf);
  };
}

document.addEventListener('astro:page-load', setup);
document.addEventListener('astro:before-swap', () => {
  cleanup?.();
  cleanup = null;
});
