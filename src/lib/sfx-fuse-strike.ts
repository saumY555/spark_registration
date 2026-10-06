/**
 * SPARK 26–27 · Fuse & Strike Animation Engine
 * Source of truth: "SPARK 26–27 · Fuse & Strike prototype.html"
 * All classes, ids, functions and variables are namespaced with sfx-
 */

const SFX_NS = 'http://www.w3.org/2000/svg';
const SFX_EV = 'cubic-bezier(.7,0,.2,1)';
const SFX_EO = 'cubic-bezier(.2,.8,.2,1)';

export const SFX_LINKS = [
  { n: 'Instagram', d: 'See it first', u: 'https://www.instagram.com/spark_iiitb?stkn=ejR5eDJ6ZWlsa2to' },
  { n: 'LinkedIn', d: 'Build with us', u: 'https://www.linkedin.com/company/spark-iiitb/' },
  { n: 'WhatsApp', d: 'Where the plans happen', u: 'https://chat.whatsapp.com/D6J3KnMJgUkKyCiU4u54lr' }
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

const SFX_ICONS: Record<string, string> = {
  Instagram:
    '<svg class="sfx-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5.5" ry="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/></svg>',
  LinkedIn:
    '<svg class="sfx-ico" viewBox="0 0 24 24" fill="none"><rect width="20" height="20" x="2" y="2" rx="5" stroke="currentColor" stroke-width="2.2"/><circle cx="7.1" cy="7.3" r="1.3" fill="currentColor"/><path d="M5.9 10h2.4v7H5.9v-7zm4.2 0h2.3v1c.5-.7 1.4-1.2 2.6-1.2 2.1 0 3.1 1.4 3.1 3.5V17h-2.4v-3.3c0-.9-.3-1.4-1.2-1.4-.8 0-1.3.5-1.3 1.4V17h-2.4v-7h-.7z" fill="currentColor"/></svg>',
  WhatsApp:
    '<svg class="sfx-ico" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l5.08-1.34C8.54 21.5 10.22 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M17.05 14.38c-.28-.14-1.65-.81-1.9-.9-.26-.1-.44-.14-.63.14-.19.28-.73.9-.9 1.09-.16.19-.33.21-.61.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.4-1.66-1.56-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.33.42-.5.14-.16.19-.28.28-.47.1-.19.05-.35-.02-.5-.07-.14-.63-1.52-.86-2.08-.23-.55-.46-.47-.63-.48-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.35-.26.28-1 1-1 2.43s1.03 2.82 1.17 3.01c.14.19 2.02 3.12 4.9 4.38.69.3 1.22.48 1.64.61.69.22 1.32.19 1.81.12.55-.08 1.65-.67 1.88-1.33.23-.65.23-1.22.16-1.33-.07-.12-.25-.19-.53-.33z" fill="currentColor"/></svg>',
};

function buildOverlay(reg: string, links: typeof SFX_LINKS) {
  const el = document.createElement('div');
  el.className = 'sfx-conn';
  el.id = 'sfx-conn';
  el.hidden = true;
  el.setAttribute('aria-live', 'polite');

  const rows = links
    .map((l, i) => {
      const d = 820 + i * 90;
      const iconSvg = SFX_ICONS[l.n] || '';
      return (
        '<a class="sfx-row sfx-up" data-d="' +
        d +
        '" href="' +
        esc(l.u) +
        '" target="_blank" rel="noopener">' +
        '<i class="sfx-rule" data-d="' +
        d +
        '"></i>' +
        '<span class="sfx-row-left">' +
        iconSvg +
        '<span class="sfx-row-text">' +
        esc(l.n) +
        '<small>' +
        esc(l.d) +
        '</small></span>' +
        '</span><span class="sfx-ar">\u2192</span></a>'
      );
    })
    .join('');

  el.innerHTML =
    '<div class="sfx-dk"></div>' +
    '<div class="sfx-ci">' +
    '<div class="sfx-top sfx-up" data-d="560"><span class="sfx-k">SPARK 26\u201327 TEAM</span>' +
    (reg ? '<span class="sfx-chip">' + esc(reg) + '</span>' : '') +
    '</div>' +
    '<div class="sfx-hl" role="heading" aria-level="1">' +
    '<span class="sfx-l1">' +
    mk('FEEL THE') +
    '</span>' +
    '<span class="sfx-l2">' +
    mk('SP') +
    '<span class="sfx-m"><span class="sfx-ch"><svg class="sfx-bg" viewBox="0 0 24 32" aria-label="A">' +
    '<polygon points="15,0 2,18 11,18 8,32 22,12 13,12" fill="#ffd23f" stroke="#ff2d8f" stroke-width="2.5" stroke-linejoin="round"/></svg></span></span>' +
    mk('RK') +
    '<span class="sfx-m"><span class="sfx-ch sfx-dot">.</span></span>' +
    '</span>' +
    '</div>' +
    '<p class="sfx-sub sfx-up" data-d="680">You\u2019re officially part of SPARK 26\u201327.</p>' +
    '<p class="sfx-lab sfx-up" data-d="760">Stay connected. Follow the journey.</p>' +
    '<div class="sfx-rows">' +
    rows +
    '</div>' +
    '<div class="sfx-ft sfx-up" data-d="1120">Your response is saved. Keep your registration number.</div>' +
    '</div>';

  el.querySelectorAll<HTMLElement>('.sfx-row').forEach(r => {
    const a = r.querySelector<HTMLElement>('.sfx-ar');
    if (!a) return;
    r.addEventListener('pointermove', e => {
      const b = r.getBoundingClientRect();
      a.style.transform =
        'translate(' + ((e.clientX - b.left) / b.width) * 16 + 'px,' + (e.clientY - b.top - b.height / 2) / 6 + 'px)';
    });
    r.addEventListener('pointerleave', () => {
      a.style.transform = '';
    });
  });

  return el;
}

function an(el: Element, kf: Keyframe[] | PropertyIndexedKeyframes, o?: KeyframeAnimationOptions) {
  return el.animate(kf, Object.assign({ fill: 'backwards', easing: SFX_EO }, o));
}

export function sfxPlayFuseAndStrike(card: HTMLElement, regNo: string) {
  if (!card || playing || document.querySelector('.sfx-conn')) return;
  playing = true;

  // Prevent background page bounce/scrolling while overlay is active
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

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
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
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
      const b = R('#2F5BFF', 3.5);
      const dot = document.createElementNS(SFX_NS, 'circle');
      dot.setAttribute('r', '6');
      dot.setAttribute('fill', '#07061A');
      dot.setAttribute('stroke', '#2F5BFF');
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
    const cr = card.getBoundingClientRect();
    cleanupTemp();

    function clone(clip: string) {
      const c = card.cloneNode(true) as HTMLElement;
      c.removeAttribute('id');
      c.querySelectorAll('[id]').forEach(e => {
        e.removeAttribute('id');
      });
      c.classList.add('sfx-clone');
      Object.assign(c.style, {
        position: 'fixed',
        left: cr.left + 'px',
        top: cr.top + 'px',
        width: cr.width + 'px',
        height: cr.height + 'px',
        clipPath: clip,
        margin: '0',
        display: '',
        visibility: 'visible',
        zIndex: '2147482998',
      });
      document.body.appendChild(c);
      temp.push(c);
      return c;
    }

    const lc = clone('polygon(0 0,50% 0,44% 30%,56% 52%,45% 75%,50% 100%,0 100%)');
    const rc = clone('polygon(50% 0,100% 0,100% 100%,50% 100%,45% 75%,56% 52%,44% 30%)');
    card.style.visibility = 'hidden';

    // Show overlay immediately to compute exact geometric landing coordinates
    conn.hidden = false;
    conn.removeAttribute('hidden');
    conn.style.display = 'flex';
    conn.style.visibility = 'visible';
    conn.scrollTop = 0;

    const aEl = conn.querySelector<SVGElement>('.sfx-bg');
    if (!aEl) {
      finalize();
      return;
    }

    const ar = aEl.getBoundingClientRect();
    const u = ar.width / 24;
    const fw = 30 * u;
    const fh = 38 * u;
    const fl = ar.left - 3 * u;
    const ft = ar.top - 3 * u;
    const sh = Math.min(cr.height * 0.95, 440);
    const sc = sh / fh;
    const cdx = cr.left + cr.width / 2 - (fl + fw / 2);
    const cdy = cr.top + cr.height / 2 - (ft + fh / 2);

    const GLOW = 'drop-shadow(0 0 10px #2F5BFF) drop-shadow(0 0 26px #2F5BFF)';
    const NOGLOW = 'drop-shadow(0 0 0 rgba(47,91,255,0)) drop-shadow(0 0 0 rgba(47,91,255,0))';
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
      '" fill="#ffd23f" stroke="#ff2d8f" stroke-width="5" stroke-linejoin="round"/>' +
      '<polygon class="f" points="' +
      P +
      '" fill="#FFFFFF" stroke="none"/>';
    document.body.appendChild(fly);
    temp.push(fly);
    aEl.style.visibility = 'hidden';

    const T0 = 'translate(' + cdx + 'px,' + cdy + 'px)';

    // Seamless, fluid continuous flight trajectory from card directly into the letter "A"
    const flyAnim = fly.animate(
      [
        { opacity: 0, transform: T0 + ' scale(' + sc * 0.25 + ')', offset: 0, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc * 1.05 + ')', offset: 0.22, easing: 'ease-out' },
        { opacity: 1, transform: T0 + ' scale(' + sc + ')', offset: 0.28, easing: 'cubic-bezier(.35, 0, .15, 1)' },
        { opacity: 1, transform: 'translate(0px,0px) scale(1)', offset: 1 },
      ],
      { duration: 920, fill: 'forwards' }
    );

    // Smooth color and glow morph into the yellow/pink "A"
    const morph: KeyframeAnimationOptions = { duration: 640, delay: 280, fill: 'forwards', easing: 'ease-in-out' };
    const polyF = fly.querySelector('.f');
    const polyO = fly.querySelector('.o');
    if (polyF) polyF.animate([{ fill: '#FFFFFF' }, { fill: '#ffd23f' }], morph);
    if (polyO) polyO.animate([{ strokeWidth: '5' }, { strokeWidth: '2.5' }], morph);
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

    // Overlay smoothly opens from center
    an(conn, [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], {
      duration: 340,
      delay: 200,
      easing: 'cubic-bezier(.3,0,.1,1)',
    });

    // Kinetic typography and rows stagger
    conn.querySelectorAll('.sfx-ch').forEach((e, i) => {
      if (e.querySelector('.sfx-bg')) return; // The flying thunderbolt docks into this slot
      an(e, [{ transform: 'translateY(108%)' }, { transform: 'none' }], { duration: 520, delay: 280 + i * 26 });
    });

    conn.querySelectorAll('.sfx-up').forEach(e => {
      const el = e as HTMLElement;
      an(el, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }], {
        duration: 480,
        delay: +(el.dataset.d || 0),
      });
    });

    conn.querySelectorAll('.sfx-rule').forEach(e => {
      const el = e as HTMLElement;
      an(el, [{ transform: 'scaleX(0)' }, { transform: 'none' }], {
        duration: 520,
        delay: +(el.dataset.d || 0) + 80,
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
