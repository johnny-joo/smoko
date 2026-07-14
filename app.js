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
  bubble:  { name: '오늘의 특선',     desc: '미스터리한 선택. 오늘 하루도 고생했어.',           color: '#f39c12' },
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

// ── Button Click Sound ─────────────────────────
let audioCtx = null;
function playClickSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } catch (err) {
    // Web Audio 미지원 브라우저는 조용히 무시
  }
}

document.addEventListener('click', (e) => {
  if (e.target.closest('button')) playClickSound();
});

// ── Scene Sound Effects ────────────────────────
const SFX = {
  elevatorEnter:  new Audio('sounds/elevator.mp3'),
  elevatorRide:   new Audio('sounds/elevator-noise.mp3'),
  rooftopAmbient: new Audio('sounds/building-rooftops-ambient.mp3'),
  walking:        new Audio('sounds/walking-sound-effect.mp3'),
  lighterFlame:   new Audio('sounds/lighter-smoke.mp3'),
  bubbleLight:    new Audio('sounds/light-bubble.mp3'),
  bubbleStrong:   new Audio('sounds/strong-bubble.mp3'),
};
SFX.elevatorEnter.volume  = 0.7;
SFX.elevatorRide.volume   = 0.5;
SFX.rooftopAmbient.volume = 0.35;
SFX.walking.volume        = 0.6;
SFX.lighterFlame.volume   = 0.8;
SFX.bubbleLight.volume    = 0.55;
SFX.bubbleStrong.volume   = 0.8;
// 이 세기 이상이면 "세게 불었다"로 보고 strong-bubble 사운드를 튼다 (triggerExhale의 intensity 기준)
const BUBBLE_STRONG_THRESHOLD = 1.2;

function playSfx(audio) {
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (err) { /* 오디오 미지원 브라우저는 조용히 무시 */ }
}
function playLoop(audio) {
  audio.loop = true;
  playSfx(audio);
}
function stopSfx(audio) {
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (err) { /* no-op */ }
}
function stopAllSfx() {
  Object.values(SFX).forEach(stopSfx);
}

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

  playSfx(SFX.elevatorEnter);
  playLoop(SFX.elevatorRide);

  // floor countdown: 11 → 77 (rooftop)
  const floorNum = $('#floor-num');
  const floorIndicator = $('#floor-indicator');
  const floorSequence = [11, 22, 33, 44, 55, 66, 77];
  let idx = 0;
  floorNum.textContent = floorSequence[0];

  const floorTimer = setInterval(() => {
    idx++;
    if (idx < floorSequence.length) {
      floorNum.textContent = floorSequence[idx];
      if (floorSequence[idx] === 77) {
        floorIndicator.textContent = '●';
        floorIndicator.style.animation = 'none';
        clearInterval(floorTimer);
        stopSfx(SFX.elevatorRide);
        // doors open, then transition
        setTimeout(() => {
          doorL.classList.add('open');
          doorR.classList.add('open');
          playSfx(SFX.walking);
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
  const bubbleMode = isBubbleMode();

  playLoop(SFX.rooftopAmbient);

  // set brand text on the cigarette
  $('#cig-brand-display').textContent = cig.name.toUpperCase();

  // swap the cigarette for a bubble wand when the "bubble" pack is selected
  const wand = $('#bubble-wand');
  $('#cig-stick-normal').style.display = bubbleMode ? 'none' : 'flex';
  wand.style.display = bubbleMode ? 'flex' : 'none';
  wand.classList.remove('ready');

  // reset state
  const tip      = $('#cig-tip');
  const flame    = $('#lighter-flame');
  const litMsg   = $('#lit-message');
  const hint     = $('#lighter-hint');
  tip.classList.remove('lit');
  flame.classList.remove('burning');
  litMsg.classList.remove('show');
  hint.style.display = '';
  hint.textContent = bubbleMode
    ? '막대를 클릭해서 비눗물에 담가보세요!'
    : '라이터를 클릭해서 불을 붙여보세요!';

  let isLit = false;

  const lighter = $('#lighter');
  lighter.classList.toggle('bubble-mode', bubbleMode);
  lighter.title = bubbleMode ? '비눗물에 담가보세요!' : '라이터를 클릭하세요!';
  $('#lighter-grip-icon').textContent = bubbleMode ? '🧴' : '🔥';
  $('#lighter-spark').textContent = bubbleMode ? '💧' : '✧';

  function lightCigarette() {
    if (isLit) return;

    // show flame
    flame.classList.add('burning');
    playSfx(SFX.lighterFlame);

    // tip glows after a short delay
    setTimeout(() => {
      tip.classList.add('lit');
      wand.classList.add('ready');
      if (navigator.vibrate) navigator.vibrate([50, 30, 80]);
    }, 400);

    // show lit message
    setTimeout(() => {
      flame.classList.remove('burning');
      litMsg.classList.add('show');
      hint.style.display = 'none';
      $('#lit-headline').textContent = bubbleMode ? '퐁 — 🫧' : '딸깍 — 🔥';
      $('#lit-sub-text').textContent = bubbleMode ? `${cig.name} — 준비됐어요` : `${cig.name} — 불 붙었어요`;
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
  stopMic();
  const bubbleMode = isBubbleMode();
  state.timerRemaining = state.timerDuration;
  state.exhaleCount = 0;
  state.timerStarted = false;
  state.startTime = Date.now();
  smokeParticles = [];

  // setup canvas
  const canvas = $('#smoke-canvas');
  const ctx    = canvas.getContext('2d');
  resizeCanvas(canvas);

  // swap the burning cigarette for the bubble wand when relevant
  $('#cig-burning').style.display = bubbleMode ? 'none' : 'flex';
  $('#bubble-wand-burning').style.display = bubbleMode ? 'flex' : 'none';

  // reset cigarette visual
  $('#cig-burn-body').style.width = '120px';
  $('#cig-ash').style.width = '0px';

  // exhale button / hint copy
  const copy = exhaleCopy();
  $('#exhale-icon').textContent = copy.icon;
  $('#exhale-label').textContent = copy.label;
  $('#exhale-hint').textContent = copy.hint;
  $('#btn-exhale').setAttribute('aria-label', bubbleMode ? '비눗방울 불기' : '연기 내뱉기');
  $('#btn-skip-timer').textContent = bubbleMode ? '다 불었어요 ✓' : '다 피웠어요 ✓';

  // update timer display
  updateTimerDisplay(state.timerRemaining);
  updateTimerRing(state.timerRemaining);

  // start timer
  if (state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerDisplay(state.timerRemaining);
    updateTimerRing(state.timerRemaining);
    if (!bubbleMode) updateCigBurn();

    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      $('#timer-label').textContent = bubbleMode ? '다 불었어요! 🫧' : '다 피웠어요! 🚬';
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
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width  = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
  canvas.style.width  = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

// ── Smoke / Bubble Particle System ─────────────
function isBubbleMode() {
  return state.selectedCig === 'bubble';
}

function exhaleCopy() {
  return isBubbleMode()
    ? { icon: '🫧', label: '후~ 불기',   hint: '클릭할 때마다 비눗방울을 불어요' }
    : { icon: '💨', label: '후~ 내뱉기', hint: '클릭할 때마다 연기를 내뱉어요' };
}

function createSmokeParticle(canvas, burst = false, intensity = 1) {
  const w = canvas.clientWidth  || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  const spread = (burst ? 80 : 20) * intensity;
  const x = w / 2 + (Math.random() - 0.5) * spread;
  const y = h * 0.62;
  const bubble = isBubbleMode();

  return {
    x, y, bubble,
    vx: (Math.random() - 0.5) * (burst ? 3 : 1.2) * (bubble ? 1.3 : 1),
    vy: -(Math.random() * (burst ? 4 : 2) * intensity + (bubble ? 1 : 1.5)),
    radius: (Math.random() * (burst ? 22 : 12) * Math.max(0.5, intensity) + (burst ? 8 : 4)) * (bubble ? 0.85 : 1),
    alpha: (burst ? 0.55 : 0.35) * Math.min(1.4, Math.max(0.5, intensity)),
    life: 1,
    decay: (Math.random() * 0.006 + (burst ? 0.012 : 0.005)) * (bubble ? 0.85 : 1),
    wobble: Math.random() * Math.PI * 2,
  };
}

function renderSmoke(canvas, ctx) {
  const w = canvas.clientWidth  || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;

  // auto-emit particles from burning ember / wand
  if (Math.random() < 0.3) {
    smokeParticles.push(createSmokeParticle(canvas, false));
  }

  ctx.clearRect(0, 0, w, h);

  smokeParticles = smokeParticles.filter(p => p.life > 0);
  smokeParticles.forEach(p => {
    p.wobble += 0.04;
    p.x  += p.vx + Math.sin(p.wobble) * (p.bubble ? 0.7 : 0.4);
    p.y  += p.vy;
    p.vy *= 0.995;
    p.radius += p.bubble ? 0.12 : 0.18;
    p.life   -= p.decay;
    p.alpha   = p.life * (p.bubble ? 0.5 : 0.4);

    ctx.beginPath();
    if (p.bubble) {
      const grad = ctx.createRadialGradient(
        p.x - p.radius * 0.3, p.y - p.radius * 0.35, 0,
        p.x, p.y, p.radius
      );
      grad.addColorStop(0,   `rgba(255,255,255,${Math.min(0.85, p.alpha * 1.6)})`);
      grad.addColorStop(0.4, `rgba(190,225,240,${p.alpha * 0.7})`);
      grad.addColorStop(1,   `rgba(150,190,220,0)`);
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,255,255,${p.alpha * 0.8})`;
      ctx.stroke();
    } else {
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
      grad.addColorStop(0, `rgba(200,220,200,${p.alpha})`);
      grad.addColorStop(1, `rgba(150,180,150,0)`);
      ctx.fillStyle = grad;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  animFrame = requestAnimationFrame(() => {
    if (currentScene === 'scene-smoke') renderSmoke(canvas, ctx);
  });
}

// ── Exhale / Blow Interaction ──────────────────
// intensity: 1 = 기본 버튼 세기. 마이크 감지 시 숨 세기에 따라 0.4~1.8 범위로 전달됨.
function triggerExhale(intensity = 1) {
  state.exhaleCount++;
  if (navigator.vibrate) navigator.vibrate(Math.round(40 * Math.min(1.5, intensity)));

  if (isBubbleMode()) {
    playSfx(intensity >= BUBBLE_STRONG_THRESHOLD ? SFX.bubbleStrong : SFX.bubbleLight);
  }

  const canvas = $('#smoke-canvas');
  const count  = Math.round(18 * Math.min(1.6, Math.max(0.5, intensity)));
  for (let i = 0; i < count; i++) {
    smokeParticles.push(createSmokeParticle(canvas, true, intensity));
  }

  // button animation
  const btn = $('#btn-exhale');
  btn.style.transform = `scale(${0.92 - Math.min(0.1, intensity * 0.03)})`;
  setTimeout(() => { btn.style.transform = ''; }, 120);

  showThought();
}

$('#btn-exhale').addEventListener('click', () => triggerExhale(1));

// ── Mic Blow Detection ─────────────────────────
// 마이크로 숨 세기를 측정해서 세게 불수록 연기를 더 세게/많이 뱉도록 연결.
let micStream = null;
let micAnalyser = null;
let micActive = false;
let micRAF = null;
let lastBlowTrigger = 0;
const MIC_THRESHOLD = 0.045; // 이 RMS 이상이어야 "숨을 불었다"로 인식 (주변 소음 무시)
const MIC_COOLDOWN = 220;    // 같은 숨으로 여러 번 트리거되지 않도록 최소 간격(ms)

async function toggleMic() {
  if (micActive) { stopMic(); return; }

  const btn = $('#btn-mic');
  const hint = $('#exhale-hint');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    hint.textContent = '이 브라우저는 마이크 입력을 지원하지 않아요.';
    return;
  }

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    hint.textContent = '마이크 권한이 없어서 버튼으로만 내뱉을 수 있어요.';
    return;
  }

  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  const micSource = audioCtx.createMediaStreamSource(micStream);
  micAnalyser = audioCtx.createAnalyser();
  micAnalyser.fftSize = 512;
  micSource.connect(micAnalyser);

  micActive = true;
  btn.classList.add('active');
  btn.textContent = '🎤 마이크 끄기';
  btn.setAttribute('aria-pressed', 'true');
  hint.textContent = '마이크에 대고 후~ 불어보세요';

  monitorMic();
}

function stopMic() {
  micActive = false;
  cancelAnimationFrame(micRAF);
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  micStream = null;
  micAnalyser = null;

  const btn = $('#btn-mic');
  if (btn) {
    btn.classList.remove('active');
    btn.textContent = '🎤 마이크로 불기';
    btn.setAttribute('aria-pressed', 'false');
  }
  const hint = $('#exhale-hint');
  if (hint) hint.textContent = exhaleCopy().hint;
}

function monitorMic() {
  if (!micActive || currentScene !== 'scene-smoke') { stopMic(); return; }

  const data = new Uint8Array(micAnalyser.fftSize);
  micAnalyser.getByteTimeDomainData(data);

  let sumSquares = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sumSquares += v * v;
  }
  const rms = Math.sqrt(sumSquares / data.length);

  const now = performance.now();
  if (rms > MIC_THRESHOLD && now - lastBlowTrigger > MIC_COOLDOWN) {
    lastBlowTrigger = now;
    // 숨 세기(rms)를 intensity 0.4~1.8 범위로 매핑
    const intensity = Math.min(1.8, Math.max(0.4, 0.4 + ((rms - MIC_THRESHOLD) / 0.35) * 1.4));
    triggerExhale(intensity);
  }

  micRAF = requestAnimationFrame(monitorMic);
}

$('#btn-mic').addEventListener('click', toggleMic);

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
  stopMic();
  stopAllSfx();

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
// PWA: service worker registration
// ────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

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
