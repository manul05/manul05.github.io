/**
 * Paired Role Cursors Guided Tour Module
 *
 * Walks sequentially through Work Process (4 cards, sorted 1->4) -> Portfolio (6 cards)
 * -> What I do? (3 cards), deploying two role-distinct swarm cursors ("Architect" and
 * "Ops & Proof") that inspect each card and stream detailed dual comment bubbles.
 */

export const TOUR_STEPS = [
  // 1-4: Work Process (#process)
  {
    section: 'Work Process',
    title: '1. Architecture & Guardrail Docs',
    architectNote: 'Structures prompt and context architectures with CLAUDE.md, CONTEXT.md, repeat guards, and Do-Not-Break security rules before code generation.',
    opsNote: 'Prevents prompt drift, token waste, and agent regressions before workflows ever reach production voice or GPU rendering pipelines.'
  },
  {
    section: 'Work Process',
    title: '2. Agentic Delivery',
    architectNote: 'Directs Claude Code, OpenAI Codex, and Google Antigravity for spec-driven 0-to-1 scaffolding across Supabase, Pusher, Cloudflare, and Railway.',
    opsNote: 'Replaces multi-developer handoff bottlenecks with single-operator orchestration while enforcing modular boundaries and regression checks.'
  },
  {
    section: 'Work Process',
    title: '3. RunPod GPU Cluster Ops',
    architectNote: 'Packages self-hosted MuseTalk and LatentSync inference pipelines into Docker containers backed by async queues and worker callbacks.',
    opsNote: 'Optimizes RunPod GPU unit economics and monitors cluster health live through a dedicated Render Ops console with Telegram alerts.'
  },
  {
    section: 'Work Process',
    title: '4. Security & QA Governance',
    architectNote: 'Enforces least-privilege RBAC, Cloudflare R2 presigned URLs, and multi-tenant isolation boundaries across AI-generated codebases.',
    opsNote: 'Audits AI builds for IDORs and session-revocation gaps before launch and gates Railway deployments with Playwright and Jest QA suites.'
  },

  // 5-10: Portfolio (#portfolio)
  {
    section: 'Portfolio',
    title: 'Ai-Mind / EduMind',
    architectNote: 'AI video course studio powered by Gemini and Claude generating structured curricula, TextFit slides, narration, and lip-synced lessons.',
    opsNote: 'Orchestrates self-hosted MuseTalk & LatentSync on RunPod GPUs for strong unit economics, tracked via a Render Ops console with Telegram alerts.'
  },
  {
    section: 'Portfolio',
    title: '"Meera" AI Voice Tutor',
    architectNote: 'Full-duplex conversational English tutor built on Google Gemini Flash Live API, Chirp3-HD, Indian-English prompts, and repeat-guard memory.',
    opsNote: 'Automated Sarvam AI streaming TTS fallbacks sustain sub-second (<1s) spoken response latency without conversational turn collisions.'
  },
  {
    section: 'Portfolio',
    title: 'Hitarthi-Main (LMS & Affiliate Platform)',
    architectNote: 'Agent-driven modernization of a commercial EdTech LMS serving thousands of students with Razorpay payments and multi-tier affiliate tracking.',
    opsNote: 'Secures course video streaming with Cloudflare R2 presigned URLs, verifies differential payouts, and enforces Playwright/Jest Railway QA gates.'
  },
  {
    section: 'Portfolio',
    title: 'Hitarthi-Typing Platform',
    architectNote: 'Multi-tenant typing platform with Student, Teacher, and Admin portals, Stripe billing, Pusher multiplayer, PostHog analytics, and an AI adaptive coach.',
    opsNote: 'Built using structured CONTEXT.md / Do-Not-Break security guardrails and audited for multi-tenant IDORs and session-revocation gaps.'
  },
  {
    section: 'Portfolio',
    title: 'Cloud SOC Incident Automation',
    architectNote: 'Event-driven security orchestration pipeline piping Wazuh XDR webhook alerts into Shuffle SOAR workflows and TheHive case queues.',
    opsNote: 'Automatically enriches SHA256 hashes & C2 IPs via VirusTotal and alerts analysts in seconds — packaged reproducibly in Docker.'
  },
  {
    section: 'Portfolio',
    title: 'Active Directory Splunk Lab',
    architectNote: 'Windows Server 2022 Active Directory simulation lab streaming deep endpoint process events via Sysmon into custom Splunk SPL dashboards.',
    opsNote: 'Validates Kerberoasting & RDP brute-force detections via Atomic Red Team, applying SIEM tuning practices that cut false positives by 25%.'
  },

  // 11-13: What I do? (#services)
  {
    section: 'What I do?',
    title: 'AI Orchestration & Product Building',
    architectNote: 'End-to-end 0-to-1 system architecture orchestrating Claude Code, OpenAI Codex, and Antigravity under CLAUDE.md and CONTEXT.md guardrails.',
    opsNote: 'Ships commercial AI platforms rapidly with solo accountability, Playwright/Jest QA verification, and zero multi-developer drag.'
  },
  {
    section: 'What I do?',
    title: 'Multimodal & RunPod GPU Ops',
    architectNote: 'Production inference pipelines combining self-hosted MuseTalk/LatentSync lip-sync with Gemini Live API, Chirp3-HD, and Sarvam AI voice loops.',
    opsNote: 'Optimizes RunPod GPU unit economics and uptime with containerized deployments, Render Ops consoles, and live Telegram monitoring alerts.'
  },
  {
    section: 'What I do?',
    title: 'AI Security Auditing & Cloud Ops',
    architectNote: 'Combines AI build auditing (IDORs, RBAC, session revocation), OWASP VAPT (Burp Suite, Nmap), and Cloudflare R2 / AWS IAM hardening.',
    opsNote: 'Ensures fast-moving AI releases stay production-safe across AWS, Cloudflare Workers & Pages, and Railway with automated QA gates.'
  }
];

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

function getCursorSvg(color) {
  return `<svg width="20" height="22" viewBox="0 0 18 20" fill="none" aria-hidden="true">
    <path d="M1.5 1.5 L16 9.2 L9.4 10.9 L6.2 17.6 Z" fill="${color}" stroke="#ffffff" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
}

/**
 * Collects all 13 cards in the exact walkthrough sequence:
 * Work Process (sorted numerically 1..4) -> Portfolio (6) -> What I do? (3).
 */
export function collectTourTargets() {
  const processCards = Array.from(document.querySelectorAll('#process .process-card'))
    .sort((a, b) => {
      const numA = parseInt(a.querySelector('h4')?.textContent || '0', 10) || 0;
      const numB = parseInt(b.querySelector('h4')?.textContent || '0', 10) || 0;
      return numA - numB;
    });

  const portfolioCards = Array.from(document.querySelectorAll('#portfolio .picto-project-card'));
  const serviceCards = Array.from(document.querySelectorAll('#services .horizontal-service-card'));

  const orderedElements = [...processCards, ...portfolioCards, ...serviceCards];

  return orderedElements.map((element, index) => {
    const meta = TOUR_STEPS[index] || {
      section: 'Overview',
      title: element.querySelector('h3, h4')?.textContent?.trim() || `Item ${index + 1}`,
      architectNote: 'Engineered with modular separation and clean API contracts.',
      opsNote: 'Verified for reliability, performance, and cost efficiency.'
    };
    return {
      element,
      index,
      ...meta
    };
  });
}

let activeTourState = null;
let returnScrollCleanup = null;

function cancelReturnScroll() {
  if (returnScrollCleanup) {
    const cleanup = returnScrollCleanup;
    returnScrollCleanup = null;
    cleanup();
  }
}

function quickScrollToTop(durationMs = 700) {
  cancelReturnScroll();
  const startY = window.scrollY;
  if (startY <= 4) {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    return;
  }

  let rafId = null;
  let cancelled = false;
  let lastExpectedY = startY;
  const startTime = performance.now();
  document.documentElement.style.scrollBehavior = 'auto';

  const stopReturn = () => {
    if (cancelled) return;
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener('wheel', onManualAbort);
    window.removeEventListener('touchstart', onManualAbort);
    window.removeEventListener('keydown', onManualAbort);
    document.documentElement.style.scrollBehavior = '';
    if (returnScrollCleanup === stopReturn) returnScrollCleanup = null;
  };

  const onManualAbort = () => stopReturn();
  returnScrollCleanup = stopReturn;

  window.addEventListener('wheel', onManualAbort, { passive: true });
  window.addEventListener('touchstart', onManualAbort, { passive: true });
  window.addEventListener('keydown', onManualAbort, { passive: true });

  function step(now) {
    if (cancelled) return;
    if (Math.abs(window.scrollY - lastExpectedY) > 12) {
      stopReturn();
      return;
    }
    const t = clamp((now - startTime) / durationMs, 0, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const nextY = startY * (1 - ease);
    window.scrollTo(0, nextY);
    lastExpectedY = window.scrollY;

    if (t < 1) {
      rafId = requestAnimationFrame(step);
    } else {
      stopReturn();
    }
  }

  rafId = requestAnimationFrame(step);
}

export function isTourActive() {
  return Boolean(activeTourState);
}

export function stopPairedTour(restoreFocus = false) {
  cancelReturnScroll();
  if (!activeTourState) return;
  const state = activeTourState;
  activeTourState = null;

  state.destroyed = true;
  state.stepToken++;
  if (state.dwellTimer) clearTimeout(state.dwellTimer);
  if (state.waitScrollRaf) cancelAnimationFrame(state.waitScrollRaf);
  if (state.clearScrollGuardTimer) clearTimeout(state.clearScrollGuardTimer);
  if (state.onStopCallback) state.onStopCallback();

  window.removeEventListener('keydown', state.onKeyDown);
  window.removeEventListener('wheel', state.onWheel);
  window.removeEventListener('touchstart', state.onTouchStart);
  window.removeEventListener('scroll', state.onScroll);
  window.removeEventListener('resize', state.onResize);

  document.body.classList.remove('tour-active');
  document.querySelectorAll('.tour-card-focused').forEach((el) => el.classList.remove('tour-card-focused'));
  document.documentElement.style.scrollBehavior = '';

  state.overlayEl?.remove();
  if (restoreFocus) {
    document.getElementById('tourBtn')?.focus({ preventScroll: true });
  }
}

export function startPairedTour(options = {}) {
  stopPairedTour();

  const items = collectTourTargets();
  if (!items.length) return;

  const stepDurationMs = options.stepDurationMs ?? 7600;

  const overlayEl = document.createElement('div');
  overlayEl.className = 'tour-overlay';
  overlayEl.setAttribute('role', 'region');
  overlayEl.setAttribute('aria-label', 'Guided AI Swarm Explanation Tour');

  const architectCursorEl = document.createElement('div');
  architectCursorEl.className = 'tour-cursor-agent tour-cursor-agent--architect';
  architectCursorEl.innerHTML = `${getCursorSvg('#6c5ce7')}<span class="tour-role-tag">Architect</span>`;

  const opsCursorEl = document.createElement('div');
  opsCursorEl.className = 'tour-cursor-agent tour-cursor-agent--ops';
  opsCursorEl.innerHTML = `${getCursorSvg('#ff7675')}<span class="tour-role-tag">Ops &amp; Proof</span>`;

  const architectBubbleEl = document.createElement('div');
  architectBubbleEl.className = 'tour-comment-bubble tour-comment-bubble--architect';
  architectBubbleEl.innerHTML = `
    <div class="tour-bubble-header">
      <span class="tour-bubble-dot"></span>
      <span class="tour-bubble-role">Architect</span>
      <span class="tour-bubble-topic"></span>
    </div>
    <p class="tour-bubble-text"></p>
  `;

  const opsBubbleEl = document.createElement('div');
  opsBubbleEl.className = 'tour-comment-bubble tour-comment-bubble--ops';
  opsBubbleEl.innerHTML = `
    <div class="tour-bubble-header">
      <span class="tour-bubble-dot"></span>
      <span class="tour-bubble-role">Ops &amp; Proof</span>
      <span class="tour-bubble-topic">Production Impact</span>
    </div>
    <p class="tour-bubble-text"></p>
  `;

  const controlPillEl = document.createElement('div');
  controlPillEl.className = 'tour-control-pill';
  controlPillEl.innerHTML = `
    <span class="tour-pill-status"></span>
    <div class="tour-pill-actions">
      <button type="button" class="tour-pill-btn" data-tour-action="prev" title="Previous card">← Prev</button>
      <button type="button" class="tour-pill-btn" data-tour-action="pause" title="Pause / Resume tour">Pause</button>
      <button type="button" class="tour-pill-btn" data-tour-action="next" title="Next card">Next →</button>
      <button type="button" class="tour-pill-btn tour-pill-btn--exit" data-tour-action="exit" title="Exit tour (Esc)">Exit</button>
    </div>
  `;

  overlayEl.appendChild(architectBubbleEl);
  overlayEl.appendChild(opsBubbleEl);
  overlayEl.appendChild(architectCursorEl);
  overlayEl.appendChild(opsCursorEl);
  overlayEl.appendChild(controlPillEl);
  document.body.appendChild(overlayEl);
  document.body.classList.add('tour-active');

  // Seed initial cursor coordinates near the Tour button so they sweep down cleanly onto Card 1
  const btnRect = document.getElementById('tourBtn')?.getBoundingClientRect();
  const seedX = btnRect ? btnRect.left + btnRect.width / 2 : window.innerWidth - 220;
  const seedY = btnRect ? btnRect.bottom : 64;
  architectCursorEl.style.transition = 'none';
  opsCursorEl.style.transition = 'none';
  architectCursorEl.style.transform = `translate3d(${seedX - 18}px, ${seedY}px, 0)`;
  opsCursorEl.style.transform = `translate3d(${seedX + 18}px, ${seedY}px, 0)`;
  void overlayEl.offsetWidth;
  architectCursorEl.style.transition = '';
  opsCursorEl.style.transition = '';

  const state = {
    destroyed: false,
    currentIndex: 0,
    paused: false,
    phase: 'idle',
    stepToken: 0,
    isProgrammaticScroll: false,
    settledScrollY: window.scrollY,
    dwellTimer: null,
    waitScrollRaf: null,
    clearScrollGuardTimer: null,
    overlayEl,
    onStopCallback: options.onStop || null,
    onKeyDown: null,
    onWheel: null,
    onTouchStart: null,
    onScroll: null,
    onResize: null
  };
  activeTourState = state;

  const statusEl = controlPillEl.querySelector('.tour-pill-status');
  const prevBtn = controlPillEl.querySelector('[data-tour-action="prev"]');
  const pauseBtn = controlPillEl.querySelector('[data-tour-action="pause"]');
  const nextBtn = controlPillEl.querySelector('[data-tour-action="next"]');
  const exitBtn = controlPillEl.querySelector('[data-tour-action="exit"]');

  const archTopicEl = architectBubbleEl.querySelector('.tour-bubble-topic');
  const archTextEl = architectBubbleEl.querySelector('.tour-bubble-text');
  const opsTextEl = opsBubbleEl.querySelector('.tour-bubble-text');

  function streamText(targetEl, fullText, durationMs, token) {
    return new Promise((resolve) => {
      let elapsed = 0;
      let prevNow = performance.now();
      targetEl.textContent = '';

      function tick(now) {
        if (state.destroyed || state.stepToken !== token) return resolve(false);
        const dt = now - prevNow;
        prevNow = now;
        if (!state.paused) {
          elapsed += dt;
        }
        const progress = clamp(elapsed / durationMs, 0, 1);
        const count = Math.floor(fullText.length * progress);
        targetEl.textContent = fullText.slice(0, count);
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          targetEl.textContent = fullText;
          resolve(true);
        }
      }

      requestAnimationFrame(tick);
    });
  }

  function scrollToCardSmoothly(cardEl, token) {
    return new Promise((resolve) => {
      if (state.waitScrollRaf) {
        cancelAnimationFrame(state.waitScrollRaf);
        state.waitScrollRaf = null;
      }
      if (state.clearScrollGuardTimer) {
        clearTimeout(state.clearScrollGuardTimer);
        state.clearScrollGuardTimer = null;
      }

      const rect = cardEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const headerOffset = 108;
      const pillReserve = (controlPillEl.offsetHeight || 56) + 28;
      const usableH = Math.max(220, vh - headerOffset - pillReserve);
      const idealViewportTop = Math.max(headerOffset, headerOffset + (usableH - Math.min(rect.height, usableH)) / 2);
      const targetScrollY = clamp(
        rect.top + window.scrollY - idealViewportTop,
        0,
        Math.max(0, document.documentElement.scrollHeight - vh)
      );

      const startY = window.scrollY;
      const diff = targetScrollY - startY;

      if (Math.abs(diff) < 6) {
        state.settledScrollY = window.scrollY;
        return resolve(true);
      }

      state.isProgrammaticScroll = true;
      document.documentElement.style.scrollBehavior = 'auto';
      const duration = clamp(Math.abs(diff) * 0.55, 420, 950);
      const startTime = performance.now();

      function stepScroll(now) {
        if (state.destroyed || state.stepToken !== token) {
          return resolve(false);
        }
        const t = clamp((now - startTime) / duration, 0, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        window.scrollTo(0, startY + diff * ease);

        if (t < 1) {
          state.waitScrollRaf = requestAnimationFrame(stepScroll);
        } else {
          state.waitScrollRaf = null;
          state.settledScrollY = window.scrollY;
          document.documentElement.style.scrollBehavior = '';
          state.clearScrollGuardTimer = setTimeout(() => {
            if (!state.destroyed && state.stepToken === token) {
              state.isProgrammaticScroll = false;
            }
          }, 80);
          resolve(true);
        }
      }

      state.waitScrollRaf = requestAnimationFrame(stepScroll);
    });
  }

  function positionCursorsAndBubbles(item) {
    const cr = item.element.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bubbleW = vw < 660 ? Math.min(315, vw - 24) : Math.min(305, Math.floor((vw - 44) / 2), vw - 24);

    architectBubbleEl.style.width = `${bubbleW}px`;
    opsBubbleEl.style.width = `${bubbleW}px`;

    // Temporarily populate full notes to compute true wrapped bubble heights safely during resize
    const savedArch = archTextEl.textContent;
    const savedOps = opsTextEl.textContent;
    archTopicEl.textContent = item.title;
    archTextEl.textContent = item.architectNote;
    opsTextEl.textContent = item.opsNote;

    // Anchor pointers inside meaningful regions of the focused card
    const archPtrX = clamp(cr.left + Math.min(46, cr.width * 0.22), 16, vw - 110);
    const archPtrY = clamp(cr.top + Math.min(42, cr.height * 0.24), 106, vh - 110);

    const opsPtrX = clamp(cr.left + Math.max(cr.width * 0.72, cr.width - 54), 24, vw - 120);
    const opsPtrY = clamp(cr.top + Math.min(cr.height - 28, cr.height * 0.74), 118, vh - 96);

    architectCursorEl.style.transform = `translate3d(${archPtrX}px, ${archPtrY}px, 0)`;
    opsCursorEl.style.transform = `translate3d(${opsPtrX}px, ${opsPtrY}px, 0)`;

    const rightSpace = vw - cr.right;
    const leftSpace = cr.left;
    const cardCenterX = cr.left + cr.width / 2;

    let bubbleX;
    if (cardCenterX < vw * 0.5 && rightSpace >= bubbleW + 24) {
      bubbleX = cr.right + 18;
    } else if (leftSpace >= bubbleW + 24) {
      bubbleX = cr.left - bubbleW - 18;
    } else if (rightSpace >= bubbleW + 24) {
      bubbleX = cr.right + 18;
    } else {
      bubbleX = clamp(vw - bubbleW - 16, 12, vw - bubbleW - 12);
    }
    bubbleX = clamp(bubbleX, 12, vw - bubbleW - 12);

    const pillH = controlPillEl.offsetHeight || 56;
    const maxBottom = vh - pillH - 22;
    const minTop = 104;

    const estArchH = architectBubbleEl.offsetHeight || 110;
    const estOpsH = opsBubbleEl.offsetHeight || 110;
    const gap = 10;
    const combinedH = estArchH + gap + estOpsH;

    let archX = bubbleX;
    let opsX = bubbleX;
    let archTop;
    let opsTop;

    if (combinedH <= maxBottom - minTop) {
      archTop = clamp(cr.top + 8, minTop, Math.max(minTop, maxBottom - combinedH));
      opsTop = archTop + estArchH + gap;
    } else if (vw >= 660) {
      // Short viewport fallback (e.g. split screen or laptop landscape): place bubbles side-by-side cleanly
      archX = clamp(cr.left - bubbleW - 14, 12, vw - bubbleW * 2 - 28);
      opsX = clamp(archX + bubbleW + 14, bubbleW + 24, vw - bubbleW - 12);
      archTop = clamp(cr.top + 8, minTop, Math.max(minTop, maxBottom - estArchH));
      opsTop = clamp(cr.top + 8, minTop, Math.max(minTop, maxBottom - estOpsH));
    } else {
      archTop = minTop;
      opsTop = Math.max(minTop + estArchH + 6, maxBottom - estOpsH);
    }

    architectBubbleEl.style.left = `${archX}px`;
    architectBubbleEl.style.top = `${archTop}px`;
    opsBubbleEl.style.left = `${opsX}px`;
    opsBubbleEl.style.top = `${opsTop}px`;

    archTextEl.textContent = savedArch;
    opsTextEl.textContent = savedOps;
  }

  function finishTour() {
    stopPairedTour(true);
    quickScrollToTop(700);
  }

  function scheduleAdvance(token, delayMs) {
    if (state.dwellTimer) clearTimeout(state.dwellTimer);
    if (state.paused || state.destroyed || state.stepToken !== token) return;

    state.dwellTimer = setTimeout(() => {
      if (state.destroyed || state.stepToken !== token || state.paused) return;
      if (state.currentIndex < items.length - 1) {
        runStep(state.currentIndex + 1);
      } else {
        finishTour();
      }
    }, delayMs);
  }

  async function runStep(index) {
    if (state.destroyed) return;
    state.stepToken++;
    const token = state.stepToken;
    state.phase = 'scrolling';
    if (state.dwellTimer) clearTimeout(state.dwellTimer);
    if (state.waitScrollRaf) {
      cancelAnimationFrame(state.waitScrollRaf);
      state.waitScrollRaf = null;
    }
    if (state.clearScrollGuardTimer) {
      clearTimeout(state.clearScrollGuardTimer);
      state.clearScrollGuardTimer = null;
    }

    state.currentIndex = clamp(index, 0, items.length - 1);
    const item = items[state.currentIndex];

    // Update UI indicators
    statusEl.textContent = `${state.currentIndex + 1} / ${items.length} · ${item.section}`;
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.textContent = state.currentIndex === items.length - 1 ? 'Finish ✓' : 'Next →';
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';

    // Apply card spotlight
    document.querySelectorAll('.tour-card-focused').forEach((el) => el.classList.remove('tour-card-focused'));
    item.element.classList.add('tour-card-focused');

    // Fade bubbles out cleanly without flashing next card's static text prematurely
    architectBubbleEl.classList.remove('is-visible');
    opsBubbleEl.classList.remove('is-visible');

    const scrolledCleanly = await scrollToCardSmoothly(item.element, token);
    if (!scrolledCleanly || state.destroyed || state.stepToken !== token) return;

    // Snap hidden bubbles directly into target position before revealing
    archTextEl.textContent = '';
    opsTextEl.textContent = '';
    positionCursorsAndBubbles(item);
    void overlayEl.offsetWidth;

    state.phase = 'streaming';
    architectBubbleEl.classList.add('is-visible');
    const archDone = await streamText(archTextEl, item.architectNote, 2100, token);
    if (!archDone || state.destroyed || state.stepToken !== token) return;

    opsBubbleEl.classList.add('is-visible');
    const opsDone = await streamText(opsTextEl, item.opsNote, 2100, token);
    if (!opsDone || state.destroyed || state.stepToken !== token) return;

    state.phase = 'dwelling';
    const remainingReadMs = Math.max(1800, stepDurationMs - 4200);
    scheduleAdvance(token, remainingReadMs);
  }

  prevBtn.addEventListener('click', () => {
    if (state.currentIndex > 0) runStep(state.currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (state.currentIndex < items.length - 1) {
      runStep(state.currentIndex + 1);
    } else {
      finishTour();
    }
  });

  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
    if (state.paused) {
      if (state.dwellTimer) clearTimeout(state.dwellTimer);
    } else if (state.phase === 'dwelling') {
      scheduleAdvance(state.stepToken, 2400);
    }
  });

  exitBtn.addEventListener('click', () => stopPairedTour(true));

  state.onKeyDown = (e) => {
    if (e.key === 'Escape') {
      stopPairedTour(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (state.currentIndex < items.length - 1) runStep(state.currentIndex + 1);
      else finishTour();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (state.currentIndex > 0) runStep(state.currentIndex - 1);
    } else if (['PageDown', 'PageUp', 'Home', 'End', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      stopPairedTour();
    } else if ((e.key === ' ' || e.code === 'Space') && !e.target?.closest?.('.tour-control-pill')) {
      stopPairedTour();
    }
  };

  state.onWheel = (e) => {
    if (e.target?.closest?.('.tour-control-pill')) return;
    if (!state.isProgrammaticScroll && Math.abs(e.deltaY) > 16) {
      stopPairedTour();
    }
  };

  state.onTouchStart = (e) => {
    if (e.target?.closest?.('.tour-control-pill')) return;
    if (!state.isProgrammaticScroll) stopPairedTour();
  };

  state.onScroll = () => {
    if (!state.isProgrammaticScroll && Math.abs(window.scrollY - state.settledScrollY) > 36) {
      stopPairedTour();
    }
  };

  state.onResize = () => {
    if (!state.destroyed && items[state.currentIndex]) {
      positionCursorsAndBubbles(items[state.currentIndex]);
    }
  };

  window.addEventListener('keydown', state.onKeyDown);
  window.addEventListener('wheel', state.onWheel, { passive: true });
  window.addEventListener('touchstart', state.onTouchStart, { passive: true });
  window.addEventListener('scroll', state.onScroll, { passive: true });
  window.addEventListener('resize', state.onResize, { passive: true });

  pauseBtn.focus({ preventScroll: true });
  runStep(0);
}
