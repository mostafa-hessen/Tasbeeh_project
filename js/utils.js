/**
 * UTILS MODULE
 * Contains helper functions for formatting, sounds, particles, and countdown.
 */

// Arabic formatting
function ar(n) {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
}

function fmt(n) {
  return ar((n || 0).toLocaleString("en-US"));
}

// Toast notification
function toast(m) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = m;
  t.style.transform = "translateX(-50%) translateY(0)";
  setTimeout(
    () => (t.style.transform = "translateX(-50%) translateY(-120%)"),
    3000,
  );
}

// Audio System
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playSound(type) {
  if (typeof state !== 'undefined' && !state.soundOn) return;
  ensureAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  if (type === "tap") {
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.08,
    );
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
  } else {
    osc.frequency.value = 523;
    osc.type = "triangle";
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    osc.frequency.setValueAtTime(659, audioCtx.currentTime + 0.15);
    osc.frequency.setValueAtTime(784, audioCtx.currentTime + 0.3);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.5,
    );
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  }
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  save();
  document.getElementById("sound-toggle-btn").textContent = state.soundOn
    ? "🔊"
    : "🔇";
  toast(state.soundOn ? "الصوت مفعل" : "الصوت موقف");
}

// Particles effect
function spawnParticles() {
  const btn = document.querySelector(".bead-core");
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const cx = rect.left + rect.width / 2,
    cy = rect.top + rect.height / 2;
  for (let i = 0; i < 6; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const angle = Math.random() * Math.PI * 2,
      dist = 40 + Math.random() * 60;
    const color = ["#ffd700", "#c9943a", "#f5dfa0", "#ff6b35"][
      Math.floor(Math.random() * 4)
    ];
    const size = 4 + Math.random() * 4;
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;background:${color};--px:${Math.cos(angle) * dist}px;--py:${Math.sin(angle) * dist}px;`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1000);
  }
}

// Countdown logic
let countdownInterval = null;
function startLiveCountdown(endDateStr) {
  if (countdownInterval) clearInterval(countdownInterval);
  function update() {
    const el = document.getElementById("countdown-live");
    if (!el) {
      clearInterval(countdownInterval);
      return;
    }
    const diff = new Date(endDateStr) - new Date();
    if (diff <= 0) {
      el.innerHTML =
        '<div class="countdown-bar"><span style="color:var(--danger); font-size:0.85rem;">⏰ انتهى الوقت!</span></div>';
      clearInterval(countdownInterval);
      return;
    }
    const d = Math.floor(diff / 86400000),
      h = Math.floor((diff % 86400000) / 3600000),
      m = Math.floor((diff % 3600000) / 60000),
      s = Math.floor((diff % 60000) / 1000);
    el.innerHTML = `<div class="countdown-bar"><span style="font-size:0.8rem; color:var(--text-muted);">⏳ الوقت المتبقي</span><span class="countdown-val">${ar(d)} يوم ${ar(h)} ساعة ${ar(m)} دقيقة ${ar(s)} ثانية</span></div>`;
  }
  update();
  countdownInterval = setInterval(update, 1000);
}
