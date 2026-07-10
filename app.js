/* ================================================
   SMOKE BREAK POMODORO — app.js
   ================================================ */
'use strict';

// ── State ──────────────────────────────────────
const state = {
  selectedCig: null,
  timerDuration: 10 * 60, // 10분 (초)
  timerRemaining: 10 * 60,
  timerInterval: null,
  timerStarted: false,
  exhaleCount: 0,
  startTime: null,
  endTime: null,
};

// ── Cigarette Data ─────────────────────────────
const CIG_DATA = {
  esse:    { name: '에쎄 체인지',     desc: '부드럽고 시원한 멘솔. 회사에서 이 정도면 충분해.', color: '#2ecc71' },
  marlboro:{ name: '말보로 레드',     desc: '진한 풀바디. 스트레스받은 날엔 역시 이거지.',     color: '#e74c3c' },
  raison:  { name: '레종 블루',       desc: '연하고 담백한 맛. 점심 식후엔 이게 최고.',         color: '#3498db' },
  tobplus: { name: '토브플러스 아이스',desc: '강한 아이스로 머리가 맑아지는 느낌.',             color: '#00bcd4' },
  lm:      { name: 'L&M 실버',        desc: '가볍고 깔끔한 흡연감. 부담 없이 즐기기 딱.',       color: '#aaa'    },
  special: { name: '오늘의 특선',     desc: '미스터리한 선택. 오늘 하루도 고생했어.',           color: '#f39c12' },
};

// ── Thoughts (연기 뱉을 때 나오는 생각들) ──────
const THOUGHTS = [
  '오늘 회의는 왜 이렇게 길었던 거야...',
  '퇴근하면 뭐 먹을까 🍜',
  '그 업무 내일까지 할 수 있겠지?',
  '날씨 좋다. 조금 더 있다 들어가도 되지 않나.',
  '팀장님은 왜 항상 저런 말을...',
  '주말에 진짜 아무것도 안 해야지.',
  '연봉협상 언제 하는 거지?',
  '이직 준비 슬슬 해볼까...',
  '커피 마시고 올걸 그랬나.',
  '이 시간만큼은 나의 것 ☁',
  '다음 담배는 언제 피우러 오지.',
  '아 배고파.',
  '인생 뭐 있어 하하.',
  '잠깐이지만 이게 행복이지.',
  '연기가 올라가듯 스트레스도 날아가라.',
];

// ── DOM Helpers ────────────────────────────────
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ── Scene Management ───────────────────────────
const SCENES = ['scene-intro', 'scene-store', 'scene-elevator', 'scene-garden', 'scene-smoke', 'scene-ending'];
let currentScene = 'scene-intro';

function goToScene(nextId) {
  const overlay = $('#transition-overlay');
  overlay.classList.add('fade-in');

  setTimeout(() => {
    const current = $(`.scene.active`);
    if (current) {
      current.classList.add('exit');
      current.classList.remove('active');
      setTimeout(() => current.classList.remove('exit'), 600);
    }

    const next = $(`#${nextId}`);
    next.classList.add('active');
    currentScene = nextId;

    overlay.classList.remove('fade-in');
    onSceneEnter(nextId);
  }, 350);
}

// ── Scene Enter Callbacks ──────────────────────
function onSceneEnter(sceneId) {
  switch (sceneId) {
    case 'scene-store':    initStore();    break;
    case 'scene-elevator': initElevator(); break;
    case 'scene-garden':   initGarden();   break;
    case 'scene-smoke':    initSmoke();    break;
    case 'scene-ending':   initEnding();   break;
  }
}

// ────────────────────────────────────────────────
// SCENE 0: INTRO
// ────────────────────────────────────────────────
$('#btn-start').addEventListener('click', () => goToScene('scene-store'));

// ────────────────────────────────────────────────
// SCENE 1: STORE — cigarette selection
// ────────────────────────────────────────────────
function initStore() {
  // reset selection
  $$('.cig-card').forEach(card => card.classList.remove('selected'));
  state.selectedCig = null;
  $('#btn-buy').disabled = true;
  $('#counter-display').innerHTML = '<span class="counter-prompt">← 담배를 골라보세요</span>';
}

$$('.cig-card').forEach(card => {
  card.addEventListener('click', () => {
    $$('.cig-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    const cigId   = card.dataset.cig;
    const cigName = card.dataset.name;
    const cigDesc = card.dataset.desc;
    state.selectedCig = cigId;

    $('#counter-display').innerHTML = `
      <span class="cig-selected-name">${cigName}</span>
      <span class="cig-selected-desc">${cigDesc}</span>
    `;
    $('#btn-buy').disabled = false;

    // micro haptic if supported
    if (navigator.vibrate) navigator.vibrate(30);
  });
});

$('#btn-buy').addEventListener('click', () => {
  if (!state.selectedCig) return;
  goToScene('scene-elevator');
});

// ────────────────────────────────────────────────
// SCENE 2: ELEVATOR
// ────────────────────────────────────────────────
function initElevator() {
  const cig = CIG_DATA[state.selectedCig];

  // show cig preview
  const preview = $('#cig-preview-elev');
  preview.style.background = `linear-gradient(135deg, ${cig.color}cc, ${cig.color})`;
  $('#cig-name-elev').textContent = cig.name;

  // reset doors to closed
  const doorL = $('#door-left');
  const doorR = $('#door-right');
  doorL.classList.remove('open');
  doorR.classList.remove('open');

  // floor countdown: 11 → B1
  const floorNum = $('#floor-num');
  const floorIndicator = $('#floor-indicator');
  const floorSequence = [11, 9, 7, 5, 3, 1, 'B1'];
  let idx = 0;
  floorNum.textContent = floorSequence[0];

  const floorTimer = setInterval(() => {
    idx++;
    if (idx < floorSequence.length) {
      floorNum.textContent = floorSequence[idx];
      if (floorSequence[idx] === 'B1') {
        floorIndicator.textContent = '●';
        floorIndicator.style.animation = 'none';
        clearInterval(floorTimer);
        // doors open, then transition
        setTimeout(() => {
          doorL.classList.add('open');
          doorR.classList.add('open');
          setTimeout(() => goToScene('scene-garden'), 1800);
        }, 700);
      }
    }
  }, 800);
}

// ────────────────────────────────────────────────
// SCENE 3: GARDEN — light the cigarette
// ────────────────────────────────────────────────
function initGarden() {
  const cig = CIG_DATA[state.selectedCig];

  // set brand text on the cigarette
  $('#cig-brand-display').textContent = cig.name.toUpperCase();

  // reset state
  const tip      = $('#cig-tip');
  const flame    = $('#lighter-flame');
  const litMsg   = $('#lit-message');
  const hint     = $('#lighter-hint');
  tip.classList.remove('lit');
  flame.classList.remove('burning');
  litMsg.classList.remove('show');
  hint.style.display = '';

  let isLit = false;

  const lighter = $('#lighter');
  function lightCigarette() {
    if (isLit) return;

    // show flame
    flame.classList.add('burning');

    // tip glows after a short delay
    setTimeout(() => {
      tip.classList.add('lit');
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    }, 400);

    // show lit message
    setTimeout(() => {
      flame.classList.remove('burning');
      litMsg.classList.add('show');
      hint.style.display = 'none';
      $('#lit-sub-text').textContent = `${cig.name} — 불 붙었어요`;
      isLit = true;
    }, 1000);

    // move to smoke scene
    setTimeout(() => goToScene('scene-smoke'), 2800);
  }

  // remove old listeners by cloning
  const newLighter = lighter.cloneNode(true);
  lighter.parentNode.replaceChild(newLighter, lighter);
  newLighter.addEventListener('click', lightCigarette);
  // touch support
  newLighter.addEventListener('touchend', (e) => { e.preventDefault(); lightCigarette(); });
}

// ────────────────────────────────────────────────
// SCENE 4: SMOKE — timer + interactions
// ────────────────────────────────────────────────
let smokeParticles = [];
let animFrame = null;
let thoughtTimeout = null;

function initSmoke() {
  // reset state
  state.timerRemaining = state.timerDuration;
  state.exhaleCount = 0;
  state.timerStarted = false;
  state.startTime = Date.now();
  smokeParticles = [];

  // setup canvas
  const canvas = $('#smoke-canvas');
  const ctx    = canvas.getContext('2d');
  resizeCanvas(canvas);

  // reset cigarette visual
  $('#cig-burn-body').style.width = '120px';
  $('#cig-ash').style.width = '0px';

  // update timer display
  updateTimerDisplay(state.timerRemaining);
  updateTimerRing(state.timerRemaining);

  // start timer
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerDisplay(state.timerRemaining);
    updateTimerRing(state.timerRemaining);
    updateCigBurn();

    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      $('#timer-label').textContent = '다 피웠어요! 🚬';
      setTimeout(() => goToScene('scene-ending'), 2000);
    }
  }, 1000);

  // render loop
  cancelAnimationFrame(animFrame);
  renderSmoke(canvas, ctx);

  // show first thought
  scheduleThought();
}

function resizeCanvas(canvas) {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

function updateTimerDisplay(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  $('#timer-min').textContent = m;
  $('#timer-sec').textContent = s;

  const circle = $('#timer-circle');
  const pct    = secs <= 60 ? 'var(--accent2)' : secs <= 180 ? '#e8b020' : 'var(--accent)';
  circle.style.stroke = pct;
}

function updateTimerRing(secs) {
  const TOTAL   = 553; // circumference
  const elapsed = state.timerDuration - secs;
  const offset  = (elapsed / state.timerDuration) * TOTAL;
  $('#timer-circle').style.strokeDashoffset = offset;
}

function updateCigBurn() {
  const elapsed = state.timerDuration - state.timerRemaining;
  const pct     = elapsed / state.timerDuration;
  const maxBody = 120;
  const maxAsh  = 40;
  const bodyWidth = Math.max(0, maxBody - pct * (maxBody + maxAsh));
  const ashWidth  = Math.min(maxAsh, pct * (maxBody + maxAsh));
  $('#cig-burn-body').style.width = bodyWidth + 'px';
  $('#cig-ash').style.width = ashWidth + 'px';
}

// ── Smoke Particle System ──────────────────────
function createSmokeParticle(canvas, burst = false) {
  const x = canvas.width / 2 + (Math.random() - 0.5) * (burst ? 80 : 20);
  const y = canvas.height * 0.62;
  return {
    x, y,
    vx: (Math.random() - 0.5) * (burst ? 3 : 1.2),
    vy: -(Math.random() * (burst ? 4 : 2) + 1.5),
    radius: Math.random() * (burst ? 22 : 12) + (burst ? 8 : 4),
    alpha: burst ? 0.55 : 0.35,
    life: 1,
    decay: Math.random() * 0.006 + (burst ? 0.012 : 0.005),
    wobble: Math.random() * Math.PI * 2,
  };
}

function renderSmoke(canvas, ctx) {
  // auto-emit particles from burning ember
  if (Math.random() < 0.3) {
    smokeParticles.push(createSmokeParticle(canvas, false));
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  smokeParticles = smokeParticles.filter(p => p.life > 0);
  smokeParticles.forEach(p => {
    p.wobble += 0.04;
    p.x  += p.vx + Math.sin(p.wobble) * 0.4;
    p.y  += p.vy;
    p.vy *= 0.995;
    p.radius += 0.18;
    p.life   -= p.decay;
    p.alpha   = p.life * 0.4;

    ctx.beginPath();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
    grad.addColorStop(0, `rgba(200,220,200,${p.alpha})`);
    grad.addColorStop(1, `rgba(150,180,150,0)`);
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  animFrame = requestAnimationFrame(() => {
    if (currentScene === 'scene-smoke') renderSmoke(canvas, ctx);
  });
}

// ── Exhale Button ──────────────────────────────
$('#btn-exhale').addEventListener('click', () => {
  state.exhaleCount++;
  if (navigator.vibrate) navigator.vibrate(40);

  // burst particles
  const canvas = $('#smoke-canvas');
  for (let i = 0; i < 18; i++) {
    smokeParticles.push(createSmokeParticle(canvas, true));
  }

  // button animation
  const btn = $('#btn-exhale');
  btn.style.transform = 'scale(0.92)';
  setTimeout(() => { btn.style.transform = ''; }, 120);

  // show random thought
  showThought();
});

// ── Thought Bubbles ────────────────────────────
let usedThoughts = [];

function showThought() {
  const remaining = THOUGHTS.filter((_, i) => !usedThoughts.includes(i));
  if (remaining.length === 0) usedThoughts = [];

  const available = THOUGHTS.map((t, i) => ({ t, i })).filter(x => !usedThoughts.includes(x.i));
  const pick = available[Math.floor(Math.random() * available.length)];
  usedThoughts.push(pick.i);

  const bubble = $('#thought-bubble');
  const text   = $('#thought-text');
  bubble.style.opacity = '0';
  setTimeout(() => {
    text.textContent = pick.t;
    bubble.style.opacity = '1';
  }, 200);

  clearTimeout(thoughtTimeout);
  scheduleThought();
}

function scheduleThought() {
  const delay = 8000 + Math.random() * 12000;
  thoughtTimeout = setTimeout(() => {
    if (currentScene === 'scene-smoke') showThought();
  }, delay);
}

// ── Skip Timer ─────────────────────────────────
$('#btn-skip-timer').addEventListener('click', () => {
  if (state.timerInterval) clearInterval(state.timerInterval);
  clearTimeout(thoughtTimeout);
  goToScene('scene-ending');
});

// ────────────────────────────────────────────────
// SCENE 5: ENDING
// ────────────────────────────────────────────────
function initEnding() {
  state.endTime = Date.now();
  cancelAnimationFrame(animFrame);
  clearTimeout(thoughtTimeout);

  const cig       = CIG_DATA[state.selectedCig] || { name: '???' };
  const elapsed   = state.timerDuration - Math.max(0, state.timerRemaining);
  const mins      = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const secs      = (elapsed % 60).toString().padStart(2, '0');

  $('#stat-exhale').textContent = state.exhaleCount;
  $('#stat-time').textContent   = `${mins}:${secs}`;
  $('#stat-cig').textContent    = cig.name;

  // dynamic ending message
  let sub = '';
  if (state.exhaleCount >= 15)       sub = '연기를 엄청나게 내뱉었네요. 완전한 해방감 🌬️';
  else if (state.exhaleCount >= 8)   sub = '적당히 즐기셨군요. 좋아요 ☁';
  else if (state.exhaleCount >= 3)   sub = '잠깐이지만 충분한 휴식이었을 거예요.';
  else                               sub = '조용히 홀로 피우셨군요. 그것도 나쁘지 않아요.';
  $('#ending-sub').textContent = sub;
}

$('#btn-restart').addEventListener('click', () => {
  if (state.timerInterval) clearInterval(state.timerInterval);
  cancelAnimationFrame(animFrame);
  clearTimeout(thoughtTimeout);
  state.selectedCig = null;
  goToScene('scene-intro');
});

$('#btn-back-work').addEventListener('click', () => {
  // just close / go to blank tab behavior — minimal
  window.location.reload();
});

// ────────────────────────────────────────────────
// GLOBAL: resize canvas on window resize
// ────────────────────────────────────────────────
window.addEventListener('resize', () => {
  const canvas = $('#smoke-canvas');
  if (canvas) resizeCanvas(canvas);
});

// ────────────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && currentScene === 'scene-smoke') {
    e.preventDefault();
    $('#btn-exhale').click();
  }
});

// ────────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────────
// Make sure intro is visible
$('#scene-intro').classList.add('active');
