/**
 * SPARK 26–27 · Fuse & Strike Animation Engine
 * Source of truth: "SPARK 26–27 · Fuse & Strike prototype.html"
 * All classes, ids, functions and variables are namespaced with sfx-
 */

const SFX_NS = 'http://www.w3.org/2000/svg';
const SFX_EV = 'cubic-bezier(.7,0,.2,1)';
const SFX_EO = 'cubic-bezier(.2,.8,.2,1)';

export const SFX_LINKS = [
  { n: 'Instagram', d: 'See it first', u: 'https://www.instagram.com/spark_iiitbhopal/' },
  { n: 'LinkedIn', d: 'Build with us', u: 'https://www.linkedin.com/company/spark-iiit-bhopal/' },
  { n: 'WhatsApp', d: 'Where the plans happen', u: 'https://chat.whatsapp.com/invite/spark-2026-firstyears' }
] as const;

let sfxPlaying = false;
let sfxRaf = 0;
let sfxActiveCard: HTMLElement | null = null;
let sfxActiveConn: HTMLElement | null = null;
let sfxCleanupListeners: (() => void) | null = null;

const sfxAn = (el: Element, kf: Keyframe[] | PropertyIndexedKeyframes, o?: KeyframeAnimationOptions) =>
  el.animate(kf, { fill: 'both', easing: SFX_EO, ...o });

const sfxMk = (s: string) =>
  [...s]
    .map(c => (c === ' ' ? '<span class="sfx-sp"></span>' : `<span class="sfx-m"><span class="sfx-ch">${c}</span></span>`))
    .join('');

function sfxCreateOverlay(regNo: string): HTMLElement {
  let conn = document.getElementById('sfx-conn');
  if (conn) {
    const chip = conn.querySelector('#sfx-chip');
    if (chip) chip.textContent = regNo;
    return conn;
  }

  conn = document.createElement('section');
  conn.id = 'sfx-conn';
  conn.className = 'sfx-conn';
  conn.style.display = 'none';
  conn.setAttribute('aria-live', 'polite');

  const dk = document.createElement('div');
  dk.className = 'sfx-dk';

  const ci = document.createElement('div');
  ci.className = 'sfx-ci';

  ci.innerHTML = `
    <div class="sfx-top sfx-up" data-d="850">
      <span class="sfx-k">SPARK 26–27 TEAM</span>
      <span class="sfx-chip" id="sfx-chip">${regNo}</span>
    </div>
    <h1 class="sfx-hl">
      <span class="sfx-l1" id="sfx-l1"></span>
      <span class="sfx-l2" id="sfx-l2"></span>
    </h1>
    <p class="sfx-sub sfx-up" data-d="1100">You're officially part of SPARK 26–27.</p>
    <p class="sfx-lab sfx-up" data-d="1250">Stay connected. Follow the journey.</p>
    <div id="sfx-rows"></div>
    <div class="sfx-ft sfx-up" data-d="2000">
      <span>Your response is saved. Keep your registration number.</span>
    </div>
  `;

  conn.append(dk, ci);
  document.body.append(conn);

  const l1 = ci.querySelector('#sfx-l1');
  const l2 = ci.querySelector('#sfx-l2');
  const rows = ci.querySelector('#sfx-rows');

  if (l1) l1.innerHTML = sfxMk('FEEL THE');
  if (l2) {
    l2.innerHTML =
      sfxMk('SP') +
      '<span class="sfx-m"><span class="sfx-ch"><svg class="sfx-bg" viewBox="0 0 24 32" aria-label="A"><polygon points="15,0 2,18 11,18 8,32 22,12 13,12" fill="currentColor"/></svg></span></span>' +
      sfxMk('RK.');
  }

  if (rows) {
    rows.innerHTML = SFX_LINKS.map(
      (l, i) =>
        `<a class="sfx-row sfx-up" data-d="${1400 + i * 180}" href="${l.u}" target="_blank" rel="noopener"><i class="sfx-rule" data-d="${1400 + i * 180}"></i><span>${l.n}<small>${l.d}</small></span><span class="sfx-ar">→</span></a>`
    ).join('');

    rows.querySelectorAll('.sfx-row').forEach(row => {
      const r = row as HTMLElement;
      const a = r.querySelector('.sfx-ar') as HTMLElement | null;
      if (!a) return;
      r.addEventListener('pointermove', e => {
        const b = r.getBoundingClientRect();
        a.style.transform = `translate(${((e.clientX - b.left) / b.width) * 16}px,${((e.clientY - b.top - b.height / 2) / 6)}px)`;
      });
      r.addEventListener('pointerleave', () => {
        a.style.transform = '';
      });
    });
  }

  return conn;
}

function sfxFuse(card: HTMLElement): Promise<SVGElement> {
  return new Promise(resolve => {
    card.style.position = 'relative';
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    const computed = window.getComputedStyle(card);
    const rx = parseFloat(computed.borderRadius) || 8;

    const svg = document.createElementNS(SFX_NS, 'svg') as unknown as SVGElement;
    svg.setAttribute('class', 'sfx-fz');
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    Object.assign(svg.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: `${w}px`,
      height: `${h}px`,
      pointerEvents: 'none',
      zIndex: '1000',
    });

    const R = (c: string, sw: number) => {
      const r = document.createElementNS(SFX_NS, 'rect');
      (
        [
          ['x', sw / 2],
          ['y', sw / 2],
          ['width', Math.max(0, w - sw)],
          ['height', Math.max(0, h - sw)],
          ['rx', Math.max(0, rx)],
          ['fill', 'none'],
          ['stroke', c],
          ['stroke-width', sw],
          ['pathLength', 1],
          ['stroke-dasharray', '1 1'],
          ['stroke-dashoffset', 1],
        ] as const
      ).forEach(([k, v]) => r.setAttribute(k, String(v)));
      svg.append(r);
      return r;
    };

    const a = R('var(--sfx-dark, #07061A)', 7);
    const b = R('var(--sfx-blue, #2F5BFF)', 3.5);
    const dot = document.createElementNS(SFX_NS, 'circle');
    dot.setAttribute('r', '7');
    dot.setAttribute('fill', 'var(--sfx-dark, #07061A)');
    dot.setAttribute('stroke', 'var(--sfx-blue, #2F5BFF)');
    dot.setAttribute('stroke-width', '3');
    dot.setAttribute('cx', String(rx + 3));
    dot.setAttribute('cy', '3');
    svg.append(dot);

    card.classList.add('sfx-charge');
    card.append(svg);

    let len = (w + h) * 2;
    try {
      if (b.getTotalLength) {
        len = b.getTotalLength();
        const pt0 = b.getPointAtLength(0);
        dot.setAttribute('cx', String(pt0.x));
        dot.setAttribute('cy', String(pt0.y));
      }
    } catch {
      // Fallback perimeter calculation
    }

    const t0 = performance.now();
    const fuseDuration = 1000; // 1 second smooth fuse trace

    function tick(now: number) {
      const p = Math.min(1, (now - t0) / fuseDuration);
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
      if (p < 1) {
        sfxRaf = requestAnimationFrame(tick);
      } else {
        resolve(svg);
      }
    }

    sfxRaf = requestAnimationFrame(tick);
  });
}

function sfxStrike(card: HTMLElement, regNo: string, svg: SVGElement) {
  const cr = card.getBoundingClientRect();
  const L = cr.left;
  const T = cr.top;
  const W = cr.width;
  const H = cr.height;

  svg.remove();
  card.classList.remove('sfx-charge');

  const clone = (clip: string) => {
    const c = card.cloneNode(true) as HTMLElement;
    c.removeAttribute('id');
    c.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
    c.classList.add('sfx-clone');
    Object.assign(c.style, {
      position: 'fixed',
      left: `${L}px`,
      top: `${T}px`,
      width: `${W}px`,
      height: `${H}px`,
      clipPath: clip,
      margin: '0',
      boxSizing: 'border-box',
    });
    document.body.append(c);
    return c;
  };

  const lc = clone('polygon(0 0,50% 0,44% 30%,56% 52%,45% 75%,50% 100%,0 100%)');
  const rc = clone('polygon(50% 0,100% 0,100% 100%,50% 100%,45% 75%,56% 52%,44% 30%)');

  card.style.visibility = 'hidden';

  const bolt = document.createElementNS(SFX_NS, 'svg') as unknown as SVGElement;
  bolt.setAttribute('class', 'sfx-bolt');
  bolt.setAttribute('viewBox', '0 0 100 100');
  bolt.setAttribute('preserveAspectRatio', 'none');
  Object.assign(bolt.style, {
    left: `${L}px`,
    top: `${T}px`,
    width: `${W}px`,
    height: `${H}px`,
    filter: 'drop-shadow(0 0 14px var(--sfx-glow, #FF3D9A))',
  });
  bolt.innerHTML =
    '<polyline points="50,-6 44,30 56,52 45,75 50,106" fill="none" stroke="var(--sfx-blue, #2F5BFF)" stroke-width="9" vector-effect="non-scaling-stroke"/><polyline points="50,-6 44,30 56,52 45,75 50,106" fill="none" stroke="#FFFFFF" stroke-width="2.5" vector-effect="non-scaling-stroke"/>';
  document.body.append(bolt);

  bolt.animate(
    [
      { opacity: 0 },
      { opacity: 1, offset: 0.2 },
      { opacity: 1, offset: 0.6 },
      { opacity: 0 }
    ],
    { duration: 550, fill: 'forwards' }
  ).onfinish = () => bolt.remove();

  (
    [
      [lc, -70, -4],
      [rc, 70, 4],
    ] as const
  ).forEach(([c, x, r]) => {
    c.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform: `translateX(${x}%) rotate(${r}deg)`, opacity: 0 },
      ],
      { duration: 650, delay: 120, easing: SFX_EV, fill: 'forwards' }
    ).onfinish = () => c.remove();
  });

  const conn = sfxCreateOverlay(regNo);
  sfxActiveConn = conn;
  conn.removeAttribute('hidden');
  conn.style.display = 'flex';
  conn.style.visibility = 'visible';

  sfxAn(conn, [{ clipPath: 'inset(0 50% 0 50%)' }, { clipPath: 'inset(0 0 0 0)' }], {
    duration: 600,
    delay: 80,
    easing: 'cubic-bezier(.3,0,.1,1)',
  });

  const dk = conn.querySelector('.sfx-dk');
  if (dk) {
    sfxAn(dk, [{ opacity: 0 }, { opacity: 1 }], { duration: 450, delay: 350, easing: 'linear' });
  }

  conn.querySelectorAll('.sfx-ch').forEach((e, i) =>
    sfxAn(e, [{ transform: 'translateY(108%)' }, { transform: 'none' }], { duration: 650, delay: 550 + i * 38 })
  );

  const bg = conn.querySelector('.sfx-bg');
  if (bg) {
    sfxAn(bg, [{ color: '#fff', transform: 'scale(1.22)' }, { color: 'var(--sfx-blue, #2F5BFF)', transform: 'none' }], {
      duration: 400,
      delay: 550 + 2 * 38 + 550,
      easing: 'ease-out',
    });
  }

  conn.querySelectorAll('.sfx-up').forEach(e => {
    const el = e as HTMLElement;
    sfxAn(el, [{ opacity: 0, transform: 'translateY(22px)' }, { opacity: 1, transform: 'none' }], {
      duration: 600,
      delay: Number(el.dataset.d) || 0,
    });
  });

  conn.querySelectorAll('.sfx-rule').forEach(e => {
    const el = e as HTMLElement;
    sfxAn(el, [{ transform: 'scaleX(0)' }, { transform: 'none' }], {
      duration: 650,
      delay: (Number(el.dataset.d) || 0) + 100,
    });
  });

  setTimeout(() => {
    if (sfxPlaying) {
      sfxPlaying = false;
      card.style.display = 'none';
      if (sfxCleanupListeners) {
        sfxCleanupListeners();
        sfxCleanupListeners = null;
      }
    }
  }, 3200);
}

export function sfxSkip() {
  if (!sfxPlaying && !sfxActiveConn) return;
  sfxPlaying = false;
  cancelAnimationFrame(sfxRaf);

  document.querySelectorAll('.sfx-clone, .sfx-bolt, .sfx-fz').forEach(e => e.remove());
  document.body.getAnimations({ subtree: true }).forEach(a => a.cancel());

  if (sfxActiveCard) {
    sfxActiveCard.classList.remove('sfx-charge');
    sfxActiveCard.style.display = 'none';
  }

  if (sfxActiveConn) {
    sfxActiveConn.removeAttribute('hidden');
    sfxActiveConn.style.display = 'flex';
    sfxActiveConn.style.visibility = 'visible';
    sfxActiveConn.style.clipPath = 'none';
    const dk = sfxActiveConn.querySelector('.sfx-dk') as HTMLElement | null;
    if (dk) dk.style.opacity = '1';
    sfxActiveConn.querySelectorAll<HTMLElement>('.sfx-ch, .sfx-up, .sfx-rule, .sfx-bg').forEach(el => {
      el.style.transform = 'none';
      el.style.opacity = '1';
      if (el.classList.contains('sfx-bg')) {
        el.style.color = 'var(--sfx-blue, #2F5BFF)';
      }
    });
  }

  if (sfxCleanupListeners) {
    sfxCleanupListeners();
    sfxCleanupListeners = null;
  }
}

/**
 * Main trigger function called after existing Save Response succeeds.
 */
export async function sfxPlayFuseAndStrike(cardEl: HTMLElement, regNo: string) {
  if (sfxPlaying) return;

  const RM = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sfxActiveCard = cardEl;
  const conn = sfxCreateOverlay(regNo);
  sfxActiveConn = conn;

  if (RM) {
    cardEl.style.display = 'none';
    conn.removeAttribute('hidden');
    conn.style.display = 'flex';
    conn.style.visibility = 'visible';
    return;
  }

  sfxPlaying = true;

  // Setup Skip listeners after 400ms debounce so the trigger click doesn't immediately skip
  const skipTimeout = setTimeout(() => {
    if (!sfxPlaying) return;
    const onPointerDown = (e: PointerEvent) => {
      // If clicking on a link inside overlay, let it navigate
      if ((e.target as HTMLElement)?.closest?.('a')) return;
      sfxSkip();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') sfxSkip();
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    sfxCleanupListeners = () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, 400);

  sfxCleanupListeners = () => {
    clearTimeout(skipTimeout);
  };

  try {
    const [svg] = await Promise.all([sfxFuse(cardEl), new Promise<void>(r => setTimeout(r, 600))]);
    if (sfxPlaying) {
      sfxStrike(cardEl, regNo, svg);
    }
  } catch (err) {
    console.error('[SFX Error]', err);
    sfxSkip();
  }
}
