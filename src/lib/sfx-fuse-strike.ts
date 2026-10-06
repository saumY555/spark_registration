/**
 * SPARK 26–27 · Fuse & Strike Animation Engine
 * Source of truth: SPARK Stage Visual Identity layout
 * All classes, ids, functions and variables are namespaced with sfx-
 */

const SFX_NS = 'http://www.w3.org/2000/svg';
const SFX_EV = 'cubic-bezier(.7,0,.2,1)';
const SFX_EO = 'cubic-bezier(.2,.8,.2,1)';

export const SFX_LINKS = [
  {
    id: 'ig',
    n: 'INSTAGRAM',
    d: 'See it first',
    u: 'https://www.instagram.com/spark_iiitbhopal/',
    cls: 'sfx-card-ig',
    iconCls: 'sfx-brand-icon-ig',
    svg: '<svg class="sfx-brand-icon sfx-brand-icon-ig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>',
  },
  {
    id: 'li',
    n: 'LINKEDIN',
    d: 'Build with us',
    u: 'https://www.linkedin.com/company/spark-iiit-bhopal/',
    cls: 'sfx-card-li',
    iconCls: 'sfx-brand-icon-li',
    svg: '<svg class="sfx-brand-icon sfx-brand-icon-li" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.78a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>',
  },
  {
    id: 'wa',
    n: 'WHATSAPP',
    d: 'Where the plans happen',
    u: 'https://chat.whatsapp.com/invite/spark-2026-firstyears',
    cls: 'sfx-card-wa',
    iconCls: 'sfx-brand-icon-wa',
    svg: '<svg class="sfx-brand-icon sfx-brand-icon-wa" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.03-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.23.89 2.42 1.02 2.59.13.17 1.76 2.69 4.27 3.77.6.26 1.06.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.23-.17-.48-.29z"/></svg>',
  },
] as const;

let playing = false;

function esc(t: string) {
  return String(t).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
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

  const cardsHtml = links
    .map((l, i) => {
      const d = 820 + i * 90;
      return (
        '<a class="sfx-card-link ' +
        l.cls +
        ' sfx-up" data-d="' +
        d +
        '" href="' +
        esc(l.u) +
        '" target="_blank" rel="noopener">' +
        '<div class="sfx-card-body">' +
        '<h3>' +
        esc(l.n) +
        '</h3>' +
        '<p>' +
        esc(l.d) +
        '</p>' +
        '</div>' +
        '<div class="sfx-card-action">' +
        l.svg +
        '<span class="sfx-card-arrow">\u2192</span>' +
        '</div>' +
        '</a>'
      );
    })
    .join('');

  el.innerHTML =
    '<div class="sfx-ci">' +
    '<div class="sfx-top sfx-up" data-d="520">' +
    '<span class="sfx-k">SPARK 26\u201327 TEAM</span>' +
    (reg ? '<span class="sfx-chip">' + esc(reg) + '</span>' : '') +
    '</div>' +
    '<div class="sfx-eyebrow sfx-up" data-d="560">YOU ARE OFFICIALLY IN!</div>' +
    '<div class="sfx-hl" role="heading" aria-level="1">' +
    '<span class="sfx-l1">' +
    mk('FEEL THE') +
    '</span>' +
    '<span class="sfx-l2">' +
    mk('SP') +
    '<span class="sfx-m"><span class="sfx-ch"><svg class="sfx-bg" viewBox="0 0 24 32" aria-label="A">' +
    '<polygon points="15,0 2,18 11,18 8,32 22,12 13,12" fill="currentColor"/></svg></span></span>' +
    mk('RK.') +
    '</span>' +
    '</div>' +
    '<p class="sfx-sub sfx-up" data-d="680">You\u2019re officially part of SPARK 26\u201327.</p>' +
    '<div class="sfx-sec-head sfx-up" data-d="760">' +
    '<span class="sfx-sec-title">STAY CONNECTED. FOLLOW THE JOURNEY.</span>' +
    '<div class="sfx-sec-line"></div>' +
    '</div>' +
    '<div class="sfx-cards">' +
    cardsHtml +
    '</div>' +
    '<div class="sfx-ft sfx-up" data-d="1120">Your response is saved. Keep your registration number.</div>' +
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

      const a = R('#07061A', 7);
      const b = R('#38BDF8', 3.5);
      const dot = document.createElementNS(SFX_NS, 'circle');
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#07061A');
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

  /* ---------- 2. STRIKE & SMOOTH THUNDERBOLT FLIGHT ---------- */
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

    // Measure exact geometric landing coordinates inside the overlay
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

    const GLOW = 'drop-shadow(0 0 10px #38BDF8) drop-shadow(0 0 28px #38BDF8)';
    const NOGLOW = 'drop-shadow(0 0 0 rgba(56,189,248,0)) drop-shadow(0 0 0 rgba(56,189,248,0))';
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

    // Seamless, fluid continuous flight trajectory into letter 'A'
    const flyAnim = fly.animate(
      [
        { opacity: 0, transform: T0 + ' scale(' + sc * 0.25 + ')', offset: 0, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc * 1.05 + ')', offset: 0.22, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc + ')', offset: 0.28, easing: 'cubic-bezier(.35, 0, .15, 1)' },
        { opacity: 1, transform: 'translate(0px,0px) scale(1)', offset: 1 },
      ],
      { duration: 920, fill: 'forwards' }
    );

    // Color morph to electric cyan 'A'
    const morph: KeyframeAnimationOptions = { duration: 640, delay: 280, fill: 'forwards', easing: 'ease-in-out' };
    const polyF = fly.querySelector('.f');
    const polyO = fly.querySelector('.o');
    if (polyF) polyF.animate([{ fill: '#FFFFFF' }, { fill: '#38BDF8' }], morph);
    if (polyO) polyO.animate([{ strokeWidth: '4' }, { strokeWidth: '0' }], morph);
    fly.animate([{ filter: GLOW }, { filter: NOGLOW }], morph);

    flyAnim.onfinish = () => {
      if (!playing) return;
      aEl.style.visibility = '';
      aEl.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 200, easing: 'ease-out' });
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

    // Overlay opens from center
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
