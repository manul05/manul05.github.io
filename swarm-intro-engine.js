/**
 * Custom Smooth Swarm Intro Engine (MIT-based enhancement of swarm-intro)
 *
 * Key scroll & smoothness improvements over fixed-layer scroll sync:
 * 1. Document-anchored overlay (.swarm-intro-layer positioned in document space):
 *    Chromium's compositor scrolls all cursors, drag boxes, and badges at 1:1
 *    native frame lockstep with page content during wheel/trackpad/scrollbar scrolling
 *    — zero JS scroll-event frame lag or trembling.
 * 2. Viewport-priority target scheduler:
 *    When a user manually scrolls down or up during assembly, cursors immediately
 *    prioritize visible in-viewport elements top-to-bottom rather than staying stuck
 *    on offscreen cards above the fold.
 * 3. Smooth compositor-only reveals + VSync RAF typing:
 *    Replaces heavy multi-pass CSS blur(6px) animations with GPU opacity/transform,
 *    isolates layout via CSS containment, and paces drag boxes & typing on VSync.
 */

const DEFAULT_TARGETS = 'h1,h2,h3,h4,h5,h6,p,span,a,button,img,svg,video,canvas,li,label,input,textarea,select';
const TEXT_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'LI', 'LABEL', 'A', 'BUTTON']);
const PENDING_ATTR = 'data-swarm-intro-pending';
const STYLE_ID = 'swarm-intro-styles';

const ENGINE_CSS = `
[${PENDING_ATTR}]{opacity:0!important}
.swarm-intro-rest{color:transparent!important}
.swarm-intro-caret{display:inline-block;width:2px;height:.9em;margin-right:-2px;vertical-align:-.1em;animation:swarm-intro-blink .9s steps(1) infinite}
@keyframes swarm-intro-blink{50%{opacity:0}}
.swarm-intro-layer{position:absolute;top:0;left:0;width:100%;min-height:100vh;z-index:2147483000;overflow:hidden;pointer-events:none;transition:opacity .5s;contain:layout style}
.swarm-intro-layer.is-leaving{opacity:0}
.swarm-intro-world{position:absolute;inset:0;contain:layout style}
.swarm-intro-cursor{position:absolute;top:0;left:0;margin:-2px 0 0 -2px;filter:drop-shadow(0 1px 2px rgb(0 0 0/.28));will-change:transform;backface-visibility:hidden}
.swarm-intro-box{position:absolute;box-sizing:border-box;border:1.5px solid var(--swarm-intro-fg);border-radius:2px;pointer-events:none;contain:layout style;transition:opacity .35s}
.swarm-intro-box.is-done,.swarm-intro-logo.is-done{opacity:0}
.swarm-intro-badge{position:absolute;box-sizing:border-box;top:100%;left:50%;margin-top:6px;transform:translateX(-50%);padding:1px 6px;border-radius:3px;background:var(--swarm-intro-fg);color:var(--swarm-intro-bg);font:500 10px/16px ui-monospace,SFMono-Regular,Menlo,monospace;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.15);font-feature-settings:"tnum";font-variant-numeric:tabular-nums}
.swarm-intro-logo{position:absolute;display:flex;width:48px;height:48px;margin:-24px 0 0 -24px;align-items:center;justify-content:center;border-radius:9999px;background:color-mix(in srgb,var(--swarm-intro-fg) 25%,transparent);color:var(--swarm-intro-fg);font:600 14px ui-monospace,SFMono-Regular,Menlo,monospace;transition:opacity .35s}
.swarm-intro-skip{position:fixed;right:16px;bottom:16px;padding:6px 12px;border:1px solid color-mix(in srgb,var(--swarm-intro-fg) 20%,transparent);border-radius:9999px;background:color-mix(in srgb,var(--swarm-intro-bg) 85%,transparent);backdrop-filter:blur(8px);color:var(--swarm-intro-fg);opacity:.78;font:500 11px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;white-space:pre;pointer-events:auto;cursor:pointer;z-index:2147483001}
.swarm-intro-skip:hover{opacity:1}
`;

const CURSOR_SVG = '<svg width="18" height="20" viewBox="0 0 18 20" fill="none" aria-hidden="true"><path d="M1.5 1.5 L16 9.2 L9.4 10.9 L6.2 17.6 Z" fill="var(--swarm-intro-fg)" stroke="var(--swarm-intro-bg)" stroke-width="1.2" stroke-linejoin="round"/></svg>';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (val, min, max) => Math.min(max, Math.max(min, val));
const isTransparent = (color) => color === 'transparent' || /,\s*0\)$/.test(color);

function detectThemeColors() {
  const bodyStyle = getComputedStyle(document.body);
  const htmlStyle = getComputedStyle(document.documentElement);
  const bg = [bodyStyle.backgroundColor, htmlStyle.backgroundColor].find((c) => !isTransparent(c)) ?? '#ffffff';
  return { fg: bodyStyle.color || '#000000', bg };
}

function injectStyles() {
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = ENGINE_CSS;
}

export function swarmIntro(options = {}) {
  const htmlEl = document.documentElement;
  const clearPreload = () => {
    htmlEl.removeAttribute('data-swarm-intro');
    document.getElementById('swarm-intro-preload')?.remove();
  };

  let resolveDone;
  const donePromise = new Promise((resolve) => {
    resolveDone = resolve;
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ((options.respectReducedMotion ?? true) && reducedMotion) {
    clearPreload();
    options.onComplete?.();
    resolveDone();
    return { skip() {}, destroy() {}, done: donePromise };
  }

  injectStyles();

  const isMobile = window.innerWidth < 768;
  const speedScale = 1 / clamp(options.speed ?? 1, 0.25, 4);
  const maxCursors = options.maxCursors ?? (isMobile ? 12 : 20);
  const theme = detectThemeColors();
  const fgColor = options.color ?? theme.fg;
  const bgColor = options.background ?? theme.bg;

  let stopped = false;
  const rootEl = typeof options.root === 'string'
    ? document.querySelector(options.root)
    : options.root ?? document.body;

  const matched = (rootEl ? Array.from(rootEl.querySelectorAll(options.targets ?? DEFAULT_TARGETS)) : [])
    .filter((el) => {
      if (el.closest('.swarm-intro-layer')) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

  // Keep outermost distinct targets only
  const targets = matched.filter((el) => !matched.some((other) => other !== el && other.contains(el)));
  targets.forEach((el) => el.setAttribute(PENDING_ATTR, ''));
  let remaining = targets.length;
  clearPreload();

  // Document-anchored layer: scrolls natively on GPU compositor with #app
  const layerEl = document.createElement('div');
  layerEl.className = 'swarm-intro-layer';
  layerEl.setAttribute('aria-hidden', 'true');
  layerEl.style.setProperty('--swarm-intro-fg', fgColor);
  layerEl.style.setProperty('--swarm-intro-bg', bgColor);

  const worldEl = document.createElement('div');
  worldEl.className = 'swarm-intro-world';
  layerEl.appendChild(worldEl);
  document.body.appendChild(layerEl);

  const syncLayerHeight = () => {
    const rootBottom = rootEl ? rootEl.getBoundingClientRect().bottom + window.scrollY : document.body.scrollHeight;
    const docH = Math.max(rootBottom, window.innerHeight);
    layerEl.style.height = `${docH}px`;
  };
  syncLayerHeight();

  const resizeObserver = new ResizeObserver(() => syncLayerHeight());
  resizeObserver.observe(rootEl || document.body);
  window.addEventListener('resize', syncLayerHeight, { passive: true });

  const skipLabel = options.skipButton ?? true;
  if (skipLabel) {
    const skipBtn = document.createElement('button');
    skipBtn.type = 'button';
    skipBtn.className = 'swarm-intro-skip';
    skipBtn.textContent = typeof skipLabel === 'string' ? skipLabel : 'Skip intro  Esc';
    skipBtn.addEventListener('click', () => triggerSkip());
    layerEl.appendChild(skipBtn);
  }

  const cursors = [];
  const spawnCursor = (x, y) => {
    const el = document.createElement('div');
    el.className = 'swarm-intro-cursor';
    el.innerHTML = CURSOR_SVG;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    worldEl.appendChild(el);
    const cursor = { el, x, y, idleUntil: 0 };
    cursors.push(cursor);
    return cursor;
  };

  const queue = [];
  const speedMultiplier = () => clamp(1 + queue.length / 10, 1, 3);

  const moveCursor = (cursor, targetX, targetY, explicitDuration) => {
    const dist = Math.hypot(targetX - cursor.x, targetY - cursor.y);
    const duration = explicitDuration ?? (clamp(dist * 0.9, 220, 760) * speedScale / speedMultiplier());
    cursor.x = targetX;
    cursor.y = targetY;
    cursor.el.style.transition = `transform ${duration}ms cubic-bezier(.45,.05,.25,1)`;
    cursor.el.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
    return wait(duration);
  };

  // Smoothly relocate a distant cursor just outside the current viewport before flying in
  const relocateNearViewport = (cursor, targetX, targetY) => {
    const vh = window.innerHeight;
    if (Math.abs(cursor.y - targetY) > vh * 1.25) {
      const fromAbove = cursor.y < targetY;
      const entryY = clamp(
        fromAbove ? window.scrollY - 24 : window.scrollY + vh + 24,
        0,
        Math.max(document.documentElement.scrollHeight, vh)
      );
      const entryX = clamp(targetX + rand(-80, 80), 20, window.innerWidth - 20);
      cursor.el.style.transition = 'none';
      cursor.x = entryX;
      cursor.y = entryY;
      cursor.el.style.transform = `translate3d(${entryX}px, ${entryY}px, 0)`;
      // Force single style flush for clean entry transition
      void cursor.el.offsetWidth;
    }
  };

  const getDocRect = (el) => {
    const r = el.getBoundingClientRect();
    return {
      x: r.left + window.scrollX,
      y: r.top + window.scrollY,
      w: r.width,
      h: r.height,
      viewTop: r.top,
      viewBottom: r.bottom
    };
  };

  const revealTargetAttr = (el) => {
    if (el.hasAttribute(PENDING_ATTR)) {
      el.removeAttribute(PENDING_ATTR);
      remaining--;
    }
  };

  // Pure GPU compositor opacity reveal (zero blur rasterization or transform conflicts during manual scroll)
  const animateReveal = (el) => {
    revealTargetAttr(el);
    el.animate(
      [
        { opacity: 0 },
        { opacity: 1 }
      ],
      { duration: 360, easing: 'cubic-bezier(.22,1,.36,1)' }
    );
  };

  const isTypewriterTarget = (el) => {
    if (!TEXT_TAGS.has(el.tagName)) return false;
    const len = (el.textContent ?? '').trim().length;
    return len > 0 && len <= 400 && !isTransparent(getComputedStyle(el).color);
  };

  const typeReveal = (cursor, el) => new Promise((resolve) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const segments = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.data.trim()) continue;
      const rest = document.createElement('span');
      rest.className = 'swarm-intro-rest';
      rest.textContent = node.data;
      segments.push({ node, full: node.data, rest, len: node.data.length });
    }

    if (!segments.length) {
      animateReveal(el);
      return resolve();
    }

    segments.forEach(({ node, rest }) => {
      node.after(rest);
      node.data = '';
    });

    const caret = document.createElement('span');
    caret.className = 'swarm-intro-caret';
    caret.style.background = fgColor;
    revealTargetAttr(el);

    const totalChars = segments.reduce((sum, seg) => sum + seg.len, 0);
    const duration = clamp(totalChars * 14, 180, 900) * speedScale / speedMultiplier();
    const startTime = performance.now();
    let segIdx = 0;
    let segStartChar = 0;
    let lastCaretSync = 0;

    segments[0].rest.before(caret);

    const tick = (now) => {
      if (stopped) {
        segments.forEach(({ node, full, rest }) => {
          node.data = full;
          rest.remove();
        });
        caret.remove();
        return resolve();
      }

      const progress = clamp((now - startTime) / duration, 0, 1);
      const targetChars = Math.floor(totalChars * progress);

      // Fill any completed previous segments
      while (segIdx < segments.length - 1 && targetChars >= segStartChar + segments[segIdx].len) {
        const seg = segments[segIdx];
        seg.node.data = seg.full;
        seg.rest.remove();
        segStartChar += seg.len;
        segIdx++;
        segments[segIdx].rest.before(caret);
      }

      const activeSeg = segments[segIdx];
      if (activeSeg) {
        const localCount = clamp(targetChars - segStartChar, 0, activeSeg.len);
        activeSeg.node.data = activeSeg.full.slice(0, localCount);
        activeSeg.rest.textContent = activeSeg.full.slice(localCount);
      }

      if (progress < 1) {
        if (now - lastCaretSync > 65) {
          lastCaretSync = now;
          const cr = caret.getBoundingClientRect();
          if (cr.width >= 0 && cr.height > 0) {
            moveCursor(cursor, cr.right + window.scrollX + 2, cr.top + window.scrollY + cr.height * 0.35, 85);
          }
        }
        requestAnimationFrame(tick);
      } else {
        segments.forEach(({ node, full, rest }) => {
          node.data = full;
          rest.remove();
        });
        caret.remove();
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });

  const buildElement = async (cursor, el) => {
    const isStickyHeader = Boolean(el.closest('header.picto-header'));
    let rect = getDocRect(el);
    relocateNearViewport(cursor, rect.x, rect.y);

    await moveCursor(cursor, rect.x, rect.y);
    if (stopped) return;

    if (isStickyHeader) {
      rect = getDocRect(el);
    }

    const box = document.createElement('div');
    box.className = 'swarm-intro-box';
    box.style.left = `${rect.x}px`;
    box.style.top = `${rect.y}px`;

    const badge = document.createElement('span');
    badge.className = 'swarm-intro-badge';
    box.appendChild(badge);
    worldEl.appendChild(box);

    const boxDuration = clamp(Math.hypot(rect.w, rect.h) * 1.0, 220, 620) * speedScale / speedMultiplier();
    const startTime = performance.now();

    const animateBox = () => {
      if (stopped) return;
      const t = clamp((performance.now() - startTime) / boxDuration, 0, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      if (isStickyHeader) {
        rect = getDocRect(el);
        box.style.left = `${rect.x}px`;
        box.style.top = `${rect.y}px`;
      }
      box.style.width = `${rect.w * ease}px`;
      box.style.height = `${rect.h * ease}px`;
      badge.textContent = `${Math.round(rect.w * ease)} × ${Math.round(rect.h * ease)}`;
      if (t < 1) {
        requestAnimationFrame(animateBox);
      }
    };

    requestAnimationFrame(animateBox);
    await moveCursor(cursor, rect.x + rect.w, rect.y + rect.h, boxDuration);
    if (stopped) {
      box.remove();
      return;
    }

    if (isTypewriterTarget(el)) {
      await typeReveal(cursor, el);
    } else {
      animateReveal(el);
      await wait(240 * speedScale / speedMultiplier());
    }

    box.classList.add('is-done');
    setTimeout(() => box.remove(), 380);
  };

  // Strictly on-screen observation: never queue elements that haven't entered the visible viewport yet
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          queue.push(entry.target);
        }
      });

      while (queue.length > cursors.length * 2 && cursors.length < maxCursors) {
        const entryX = window.scrollX + rand(0, window.innerWidth);
        const entryY = Math.max(0, window.scrollY - 24);
        runWorker(spawnCursor(entryX, entryY));
      }
    },
    { rootMargin: '0px 0px -16px 0px', threshold: 0 }
  );

  // Strict on-screen scheduler: never build elements still below the viewport fold
  const pickNextTarget = () => {
    if (!queue.length) return null;
    const vh = window.innerHeight;
    let bestIdx = -1;
    let bestScore = Infinity;

    for (let i = queue.length - 1; i >= 0; i--) {
      const el = queue[i];
      const r = el.getBoundingClientRect();

      // Skip and re-observe any element not yet visible below the bottom edge of the screen
      if (r.top >= vh - 8 && !el.closest('header.picto-header')) {
        queue.splice(i, 1);
        io.observe(el);
        continue;
      }

      let score;
      if (el.closest('header.picto-header')) {
        // Sticky navbar components get highest initial priority
        score = -100000 + r.left;
      } else if (r.bottom > 0 && r.top < vh) {
        // Currently visible inside viewport: strictly top-to-bottom
        score = r.top;
      } else {
        // Items already scrolled past above top edge: finish cleanly after visible items
        score = 50000 + Math.abs(r.bottom);
      }

      if (score < bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1) return null;
    return queue.splice(bestIdx, 1)[0];
  };

  const idleCursor = async (cursor) => {
    if (performance.now() >= cursor.idleUntil) {
      const dur = rand(650, 1200);
      cursor.idleUntil = performance.now() + dur;
      const idleX = window.scrollX + rand(40, Math.max(80, window.innerWidth - 40));
      const idleY = window.scrollY + rand(80, Math.max(120, window.innerHeight - 40));
      moveCursor(cursor, idleX, idleY, dur);
    }
    await wait(90);
  };

  async function runWorker(cursor) {
    while (!stopped) {
      const target = pickNextTarget();
      if (target) {
        cursor.idleUntil = 0;
        await buildElement(cursor, target);
      } else {
        if (remaining <= 0) return finishIntro(false);
        await idleCursor(cursor);
      }
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Escape') triggerSkip();
  };
  window.addEventListener('keydown', onKeyDown);

  let finishing = false;
  function finishIntro(immediate) {
    if (finishing) return;
    finishing = true;
    setTimeout(() => {
      stopped = true;
      layerEl.classList.add('is-leaving');
      setTimeout(cleanup, 480);
    }, immediate ? 0 : 1800 * speedScale);
  }

  let cleaned = false;
  function cleanup() {
    if (cleaned) return;
    cleaned = true;
    stopped = true;
    io.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('resize', syncLayerHeight);
    window.removeEventListener('keydown', onKeyDown);
    targets.forEach(revealTargetAttr);
    layerEl.remove();
    options.onComplete?.();
    resolveDone();
  }

  function triggerSkip(fromDestroy = false) {
    stopped = true;
    targets.forEach(revealTargetAttr);
    document.querySelectorAll('.swarm-intro-caret').forEach((c) => c.remove());
    if (!fromDestroy) options.onSkip?.();
    finishIntro(true);
  }

  (async () => {
    const initialCount = options.cursors ?? (isMobile ? 8 : 14);
    const centerX = window.scrollX + window.innerWidth / 2;
    const centerY = window.scrollY + window.innerHeight / 2;

    for (let i = 0; i < initialCount; i++) {
      const side = i % 4;
      const startX = window.scrollX + (side === 1 ? window.innerWidth + 20 : side === 3 ? -20 : rand(0, window.innerWidth));
      const startY = window.scrollY + (side === 0 ? -20 : side === 2 ? window.innerHeight + 20 : rand(0, window.innerHeight));
      spawnCursor(startX, startY);
    }

    if (options.logo !== false) {
      const logoEl = document.createElement('div');
      logoEl.className = 'swarm-intro-logo';
      logoEl.textContent = options.logo ?? '';
      logoEl.style.left = `${centerX}px`;
      logoEl.style.top = `${centerY}px`;
      worldEl.appendChild(logoEl);

      for (let step = 0; step < 3 && !stopped; step++) {
        cursors.forEach((cursor, idx) => {
          const angle = (idx / cursors.length) * Math.PI * 2 + step * 1.3 + rand(-0.4, 0.4);
          const radius = rand(48, 110);
          moveCursor(cursor, centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, rand(500, 720) * speedScale);
        });
        await wait(660 * speedScale);
      }

      logoEl.classList.add('is-done');
      setTimeout(() => logoEl.remove(), 380);
    }

    if (!stopped) {
      if (!targets.length) return finishIntro(false);
      targets.forEach((el) => io.observe(el));
      cursors.forEach((c) => runWorker(c));
    }
  })();

  return {
    skip: triggerSkip,
    destroy() {
      triggerSkip(true);
      cleanup();
    },
    done: donePromise
  };
}

export default swarmIntro;
