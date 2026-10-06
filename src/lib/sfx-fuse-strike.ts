/**
 * SPARK 26–27 · Fuse & Strike Animation Engine
 * Source of truth: SPARK 26–27 Technical Fest Design System
 * All classes, ids, functions and variables are namespaced with sfx-
 */

const SFX_NS = 'http://www.w3.org/2000/svg';
const SFX_EV = 'cubic-bezier(.7,0,.2,1)';
const SFX_EO = 'cubic-bezier(.2,.8,.2,1)';

export const SFX_LINKS = [
  {
    n: 'Instagram',
    d: 'See it first · Announcements & Highlights',
    u: 'https://www.instagram.com/spark_iiitbhopal/',
    k: 'ig',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
  },
  {
    n: 'LinkedIn',
    d: 'Build with us · Projects & Networking',
    u: 'https://www.linkedin.com/company/spark-iiit-bhopal/',
    k: 'li',
    svg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FFFFFF"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.91 0-1.64.73-1.64 1.64s.73 1.64 1.64 1.64 1.64-.73 1.64-1.64-.73-1.64-1.64-1.64Z"/></svg>`,
  },
  {
    n: 'WhatsApp',
    d: 'Where the plans happen · First-Year Group',
    u: 'https://chat.whatsapp.com/invite/spark-2026-firstyears',
    k: 'wa',
    svg: `<svg viewBox="0 0 24 24" width="22" height="22" fill="#FFFFFF"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 15 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.11 7.44C8.94 7.44 8.68 7.5 8.46 7.74C8.24 7.98 7.63 8.55 7.63 9.71C7.63 10.87 8.48 11.98 8.6 12.14C8.72 12.3 10.27 14.69 12.63 15.71C13.2 15.95 13.63 16.1 13.98 16.21C14.54 16.39 15.06 16.36 15.46 16.3C15.91 16.23 16.84 15.73 17.03 15.2C17.22 14.67 17.22 14.22 17.16 14.12C17.1 14.02 16.94 13.96 16.7 13.84C16.46 13.72 15.27 13.14 15.05 13.06C14.83 12.97 14.67 12.93 14.51 13.17C14.35 13.41 13.89 13.96 13.75 14.12C13.61 14.28 13.47 14.3 13.23 14.18C12.99 14.06 12.22 13.81 11.3 12.99C10.59 12.36 10.11 11.58 9.97 11.34C9.83 11.1 9.96 10.97 10.08 10.85C10.19 10.74 10.33 10.56 10.45 10.42C10.57 10.28 10.61 10.18 10.69 10.02C10.77 9.86 10.73 9.72 10.67 9.6C10.61 9.48 10.15 8.35 9.96 7.89C9.77 7.44 9.58 7.5 9.44 7.49C9.31 7.48 9.16 7.44 9.11 7.44Z"/></svg>`,
  },
] as const;

let playing = false;

function esc(t: string) {
  return String(t).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] || c));
}

function mk(s: string) {
  return Array.from(s)
    .map(c => (c === ' ' ? '<span class="sfx-sp"></span>' : '<span class="sfx-m"><span class="sfx-ch">' + c + '</span></span>'))
    .join('');
}

function buildOverlay(reg: string, links: typeof SFX_LINKS) {
  const el = document.createElement('div');
  el.className = 'sfx-conn';
  el.id = 'sfx-conn';
  el.hidden = true;
  el.setAttribute('aria-live', 'polite');

  const rows = links
    .map((l, i) => {
      const d = 780 + i * 85;
      return (
        `<a class="sfx-row sfx-row-${l.k} sfx-up" data-d="${d}" href="${esc(l.u)}" target="_blank" rel="noopener">` +
        `<div class="sfx-row-left">` +
        `<div class="sfx-icon-badge">${l.svg}</div>` +
        `<div class="sfx-row-info">` +
        `<span class="sfx-row-name">${esc(l.n)}</span>` +
        `<span class="sfx-row-desc">${esc(l.d)}</span>` +
        `</div>` +
        `</div>` +
        `<div class="sfx-row-right">` +
        `<div class="sfx-ar-circle">→</div>` +
        `</div>` +
        `</a>`
      );
    })
    .join('');

  el.innerHTML =
    '<div class="sfx-dk"></div>' +
    '<div class="sfx-grid"></div>' +
    '<div class="sfx-ci">' +
    '<div class="sfx-top sfx-up" data-d="520">' +
    '<span class="sfx-k">SPARK 26–27 RECRUITMENT</span>' +
    (reg ? '<span class="sfx-chip">' + esc(reg) + '</span>' : '') +
    '</div>' +
    '<div class="sfx-hl" role="heading" aria-level="1">' +
    '<span class="sfx-l1">' +
    mk('FEEL THE') +
    '</span>' +
    '<span class="sfx-l2">' +
    mk('SP') +
    '<span class="sfx-m"><span class="sfx-ch"><svg class="sfx-bg" viewBox="0 0 24 32" aria-label="A">' +
    '<polygon points="15,0 2,18 11,18 8,32 22,12 13,12" fill="#FFFFFF"/></svg></span></span>' +
    mk('RK.') +
    '</span>' +
    '</div>' +
    '<p class="sfx-sub sfx-up" data-d="640">You’re officially part of SPARK 26–27.</p>' +
    '<div class="sfx-div-wrap sfx-up" data-d="720">' +
    '<div class="sfx-lab"><span>Stay connected</span><span>Official Channels</span></div>' +
    '<div class="sfx-div-line"></div>' +
    '</div>' +
    '<div class="sfx-rows">' +
    rows +
    '</div>' +
    '<div class="sfx-ft sfx-up" data-d="1050">' +
    '<span>Registration saved & synced with organizing committee.</span>' +
    '<span>SPARK · IIIT BHOPAL</span>' +
    '</div>' +
    '</div>';

  return el;
}

function an(el: Element, kf: Keyframe[] | PropertyIndexedKeyframes, o?: KeyframeAnimationOptions) {
  return el.animate(kf, Object.assign({ fill: 'backwards', easing: SFX_EO }, o));
}

export function sfxPlayFuseAndStrike(card: HTMLElement, regNo: string) {
  if (!card || playing || document.querySelector('.sfx-conn')) return;
  playing = true;

  const conn = buildOverlay(regNo, SFX_LINKS);
  document.body.appendChild(conn);

  let raf = 0;
  let safety = 0;
  let endTimer = 0;
  let restorePos: string | null = null;
  let temp: (HTMLElement | SVGElement)[] = [];

  function cleanupTemp() {
    temp.forEach(n => {
      if (n && n.parentNode) n.parentNode.removeChild(n);
    });
    temp = [];
    card.classList.remove('sfx-charge');
    if (restorePos !== null) {
      card.style.position = restorePos;
      restorePos = null;
    }
  }

  function finalize() {
    if (!playing && !conn.hidden) return;
    playing = false;
    cancelAnimationFrame(raf);
    clearTimeout(safety);
    clearTimeout(endTimer);
    cleanupTemp();
    const ae = conn.querySelector<SVGElement>('.sfx-bg');
    if (ae) ae.style.visibility = '';
    conn.getAnimations({ subtree: true }).forEach(a => {
      a.cancel();
    });
    card.style.visibility = '';
    card.style.display = 'none';
    conn.removeAttribute('hidden');
    conn.hidden = false;
    conn.style.display = 'flex';
    conn.style.visibility = 'visible';
    document.removeEventListener('pointerdown', skip, true);
    document.removeEventListener('keydown', onKey, true);
  }

  function skip() {
    if (playing) finalize();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') skip();
  }

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finalize();
    return;
  }

  setTimeout(() => {
    document.addEventListener('pointerdown', skip, true);
    document.addEventListener('keydown', onKey, true);
  }, 250);

  safety = window.setTimeout(finalize, 3500);

  /* ---------- 1. FUSE (450ms) ---------- */
  function fuse(): Promise<SVGElement> {
    return new Promise(res => {
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      if (getComputedStyle(card).position === 'static') {
        restorePos = card.style.position;
        card.style.position = 'relative';
      }
      const rx = parseFloat(getComputedStyle(card).borderTopLeftRadius) || 8;
      const svg = document.createElementNS(SFX_NS, 'svg') as unknown as SVGElement;
      svg.setAttribute('class', 'sfx-fz');
      svg.setAttribute('width', String(w));
      svg.setAttribute('height', String(h));
      svg.style.left = -card.clientLeft + 'px';
      svg.style.top = -card.clientTop + 'px';

      function R(c: string, sw: number) {
        const r = document.createElementNS(SFX_NS, 'rect');
        (
          [
            ['width', w],
            ['height', h],
            ['rx', rx],
            ['fill', 'none'],
            ['stroke', c],
            ['stroke-width', sw],
            ['pathLength', 1],
            ['stroke-dasharray', '1 1'],
            ['stroke-dashoffset', 1],
          ] as const
        ).forEach(p => {
          r.setAttribute(p[0], String(p[1]));
        });
        svg.appendChild(r);
        return r;
      }

      const a = R('#050714', 7);
      const b = R('#38BDF8', 3.5);
      const dot = document.createElementNS(SFX_NS, 'circle');
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#050714');
      dot.setAttribute('stroke', '#38BDF8');
      dot.setAttribute('stroke-width', '2.5');
      svg.appendChild(dot);
      card.appendChild(svg);
      temp.push(svg);
      card.classList.add('sfx-charge');

      let len = (w + h) * 2;
      try {
        if (b.getTotalLength) len = b.getTotalLength();
      } catch {
        // Fallback
      }

      const t0 = performance.now();
      (function tick(now) {
        const p = Math.min(1, (now - t0) / 450);
        const q = 1 - (1 - p) * (1 - p);
        a.setAttribute('stroke-dashoffset', String(1 - q));
        b.setAttribute('stroke-dashoffset', String(1 - q));
        try {
          if (b.getPointAtLength) {
            const pt = b.getPointAtLength(q * len);
            dot.setAttribute('cx', String(pt.x));
            dot.setAttribute('cy', String(pt.y));
          }
        } catch {
          // Fallback
        }
        if (p < 1) raf = requestAnimationFrame(tick);
        else res(svg);
      })(t0);
    });
  }

  /* ---------- 2. STRIKE & LUMINOUS THUNDERBOLT FLIGHT ---------- */
  function strike() {
    const parent = card.parentNode;
    const L = card.offsetLeft;
    const T = card.offsetTop;
    const W = card.offsetWidth;
    const H = card.offsetHeight;
    cleanupTemp();

    function clone(clip: string) {
      const c = card.cloneNode(true) as HTMLElement;
      c.removeAttribute('id');
      c.querySelectorAll('[id]').forEach(e => {
        e.removeAttribute('id');
      });
      c.classList.add('sfx-clone');
      Object.assign(c.style, {
        position: 'absolute',
        left: L + 'px',
        top: T + 'px',
        width: W + 'px',
        height: H + 'px',
        clipPath: clip,
        margin: '0',
        display: '',
        visibility: 'visible',
      });
      if (parent) parent.appendChild(c);
      temp.push(c);
      return c;
    }

    const lc = clone('polygon(0 0,50% 0,44% 30%,56% 52%,45% 75%,50% 100%,0 100%)');
    const rc = clone('polygon(50% 0,100% 0,100% 100%,50% 100%,45% 75%,56% 52%,44% 30%)');
    card.style.visibility = 'hidden';

    // Show overlay immediately to compute geometric landing coordinates
    conn.hidden = false;
    conn.removeAttribute('hidden');
    conn.style.display = 'flex';
    conn.style.visibility = 'visible';

    const aEl = conn.querySelector<SVGElement>('.sfx-bg');
    if (!aEl) {
      finalize();
      return;
    }

    const ar = aEl.getBoundingClientRect();
    const cr = card.getBoundingClientRect();
    const u = ar.width / 24;
    const fw = 30 * u;
    const fh = 38 * u;
    const fl = ar.left - 3 * u;
    const ft = ar.top - 3 * u;
    const sh = Math.min(cr.height * 0.95, 440);
    const sc = sh / fh;
    const cdx = cr.left + cr.width / 2 - (fl + fw / 2);
    const cdy = cr.top + cr.height / 2 - (ft + fh / 2);

    const GLOW = 'drop-shadow(0 0 10px #FFFFFF) drop-shadow(0 0 24px #38BDF8) drop-shadow(0 0 45px #2F82FF)';
    const FINAL_GLOW = 'drop-shadow(0 0 8px #FFFFFF) drop-shadow(0 0 22px #38BDF8) drop-shadow(0 0 45px #2F82FF)';
    const P = '15,0 2,18 11,18 8,32 22,12 13,12';

    const fly = document.createElementNS(SFX_NS, 'svg') as unknown as SVGElement;
    fly.setAttribute('viewBox', '-3 -3 30 38');
    Object.assign(fly.style, {
      position: 'fixed',
      left: fl + 'px',
      top: ft + 'px',
      width: fw + 'px',
      height: fh + 'px',
      zIndex: '2147483600',
      pointerEvents: 'none',
      overflow: 'visible',
      transformOrigin: '50% 50%',
      filter: GLOW,
    });
    fly.innerHTML =
      '<polygon class="o" points="' +
      P +
      '" fill="#38BDF8" stroke="#38BDF8" stroke-width="4" stroke-linejoin="round"/>' +
      '<polygon class="f" points="' +
      P +
      '" fill="#FFFFFF" stroke="none"/>';
    document.body.appendChild(fly);
    temp.push(fly);
    aEl.style.visibility = 'hidden';

    const T0 = 'translate(' + cdx + 'px,' + cdy + 'px)';

    // Seamless continuous flight trajectory directly to the letter 'A'
    const flyAnim = fly.animate(
      [
        { opacity: 0, transform: T0 + ' scale(' + sc * 0.25 + ')', offset: 0, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc * 1.05 + ')', offset: 0.22, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc + ')', offset: 0.28, easing: 'cubic-bezier(.35, 0, .15, 1)' },
        { opacity: 1, transform: 'translate(0px,0px) scale(1)', offset: 1 },
      ],
      { duration: 920, fill: 'forwards' }
    );

    // Smooth outline thins out, retaining the bright white geometric core
    const morph: KeyframeAnimationOptions = { duration: 640, delay: 280, fill: 'forwards', easing: 'ease-in-out' };
    const polyO = fly.querySelector('.o');
    if (polyO) polyO.animate([{ strokeWidth: '4' }, { strokeWidth: '0' }], morph);
    fly.animate([{ filter: GLOW }, { filter: FINAL_GLOW }], morph);

    flyAnim.onfinish = () => {
      if (!playing) return;
      aEl.style.visibility = '';
      aEl.animate([{ transform: 'scale(1.05)' }, { transform: 'none' }], { duration: 180, easing: 'ease-out' });
      if (fly.parentNode) fly.parentNode.removeChild(fly);
    };

    // Split card halves slide away
    [
      [lc, -64, -3],
      [rc, 64, 3],
    ].forEach(x => {
      (x[0] as HTMLElement).animate(
        [
          { transform: 'none', opacity: 1 },
          { transform: 'translateX(' + x[1] + '%) rotate(' + x[2] + 'deg)', opacity: 0 },
        ],
        { duration: 360, delay: 200, easing: SFX_EV, fill: 'forwards' }
      );
    });

    // Overlay center wipe reveal
    an(conn, [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: 340,
      delay: 200,
      easing: 'cubic-bezier(.3,0,.1,1)',
    });

    // Kinetic typography stagger
    conn.querySelectorAll('.sfx-ch').forEach((e, i) => {
      if (e.querySelector('.sfx-bg')) return;
      an(e, [{ transform: 'translateY(108%)' }, { transform: 'none' }], { duration: 520, delay: 280 + i * 26 });
    });

    conn.querySelectorAll('.sfx-up').forEach(e => {
      const el = e as HTMLElement;
      an(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], {
        duration: 480,
        delay: +(el.dataset.d || 0),
      });
    });

    endTimer = window.setTimeout(finalize, 2100);
  }

  Promise.all([
    fuse(),
    new Promise<void>(r => {
      setTimeout(r, 300);
    }),
  ]).then(() => {
    if (playing) strike();
  });
}
