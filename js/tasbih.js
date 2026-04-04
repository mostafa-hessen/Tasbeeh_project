/**
 * TASBIH MODULE
 * Logic for the subha counter and recording works.
 */

let sessCount = 0;

function syncTasbih() {
  let c = state.challenges.find(
    (x) =>
      x.id === state.currentChallengeId &&
      ((x.participants &&
        Array.isArray(x.participants) &&
        x.participants.includes(state.currentUser.id)) ||
        state.currentUser.is_admin ||
        (state.progress &&
          state.progress[`${state.currentUser.id}_${x.id}`] > 0))
  );

  const isActiveChallenge = c ? c.is_active : true;
  if (!c)
    c = state.challenges.filter(
      (x) =>
        ((x.participants &&
          Array.isArray(x.participants) &&
          x.participants.includes(state.currentUser.id)) ||
          state.currentUser.is_admin ||
          (state.progress &&
            state.progress[`${state.currentUser.id}_${x.id}`] > 0)) &&
        (x.is_active || state.currentUser.is_admin || !navigator.onLine)
    )[0];
  if (c) state.currentChallengeId = c.id;

  const titleEl = document.getElementById("t-chal-title-ui");
  if (titleEl)
    titleEl.textContent = c ? c.title : "تحدي عام (خارج المنافسة)";

  const sessV = document.getElementById("sess-v-ui");
  if (sessV) sessV.innerText = ar(sessCount);

  // Update Phrase Label
  const beadLbl = document.querySelector(".bead-core div:first-child");
  if (beadLbl) beadLbl.innerText = c && c.phrase ? c.phrase : "استغفر";

  const now = new Date();
  const isUpcoming = c && c.start_date && new Date(c.start_date) > now;

  // Lock UI if challenge is inactive OR hasn't started yet
  const saveWBtn = document.querySelector("button[onclick='saveW()']");
  const manualBtn = document.querySelector("button[onclick='openManualModal()']");
  const beadArea = document.querySelector(".bead-container-outer");
  const lockOverlay = document.getElementById("tasbih-lock-overlay");

  if (c && !state.currentUser.is_admin && (!c.is_active || isUpcoming)) {
      if (saveWBtn) {
          saveWBtn.disabled = true;
          saveWBtn.style.opacity = "0.5";
          saveWBtn.innerText = isUpcoming ? "التحدي لم يبدأ بعد ⏳" : "التحدي مغلق 🚫";
      }
      if (manualBtn) manualBtn.style.display = "none";
      if (beadArea) beadArea.style.opacity = "0.2";
      if (lockOverlay) {
          lockOverlay.style.display = "flex";
          const dateStr = isUpcoming ? new Date(c.start_date).toLocaleString("ar-EG") : "";
          lockOverlay.innerHTML = `
            <div style="background:rgba(20,20,40,0.95); padding:30px; border-radius:30px; text-align:center; border:1px solid ${isUpcoming ? 'var(--primary)' : 'var(--danger)'}; box-shadow:0 0 40px rgba(0,0,0,0.5);">
                <div style="font-size:3rem; margin-bottom:15px;">${isUpcoming ? "⏳" : "🔒"}</div>
                <h2 style="color:${isUpcoming ? 'var(--primary-light)' : 'var(--danger)'}; margin-bottom:10px;">
                    ${isUpcoming ? "استعد للبداية!" : "تم إغلاق هذا التحدي"}
                </h2>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:20px;">
                    ${isUpcoming ? `ينطلق التحدي يوم:<br><b>${dateStr}</b>` : "لا يمكن إضافة تسبيح جديد لهذا التحدي حالياً."}
                </p>
                <button onclick="go('s-dash')" class="btn-p" style="padding:10px 25px;">العودة للرئيسية 🏠</button>
            </div>
          `;
      }
  } else {
      if (saveWBtn) {
          saveWBtn.disabled = false;
          saveWBtn.style.opacity = "1";
          saveWBtn.innerText = "حفظ الرصيد الحالي ✅";
      }
      if (manualBtn) manualBtn.style.display = "block";
      if (beadArea) beadArea.style.opacity = "1";
      if (lockOverlay) lockOverlay.style.display = "none";
  }

  const tgV = document.getElementById("tg-v-ui");
  if (tgV) tgV.innerText = ar(state.subGoal);

  const pct =
    sessCount === 0
      ? 0
      : sessCount % state.subGoal === 0
      ? 100
      : ((sessCount % state.subGoal) / state.subGoal) * 100;

  const bar = document.getElementById("bead-progress-bar");
  if (bar) bar.style.strokeDashoffset = 754 - (754 * pct) / 100;

  const pctLbl = document.getElementById("bead-pct");
  if (pctLbl) pctLbl.innerText = ar(Math.floor(pct)) + "٪";

  document.querySelectorAll(".goal-btn").forEach((b) =>
    b.classList.toggle(
      "active",
      b.id === "g-" + state.subGoal ||
        (b.id === "g-custom" && ![33, 100, 1000].includes(state.subGoal))
    )
  );
}

function setG(v) {
  sessCount = 0;
  state.subGoal = v;
  save();
  autoSaveSess();
  syncTasbih();
}

function tapSubha() {
  const c = state.challenges.find(x => x.id === state.currentChallengeId);
  const now = new Date();
  const isUpcoming = c && c.start_date && new Date(c.start_date) > now;

  if (c && !state.currentUser.is_admin && (!c.is_active || isUpcoming)) {
      return toast(isUpcoming ? "التحدي لم يبدأ بعد، انتظر قليلاً! ⏳" : "هذا التحدي تم إغلاقه 🚫");
  }
  sessCount++;
  autoSaveSess();
  syncTasbih();
  spawnParticles();
  if (sessCount % state.subGoal === 0) {
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
    playSound("complete");
    toast("تم الوصول للورد! ✨");
  } else {
    if ("vibrate" in navigator) navigator.vibrate(30);
    playSound("tap");
  }
}

function resetSess() {
  if (sessCount > 0 && confirm("هل تريد تصفير العداد الحالي؟ لن يتم حفظه.")) {
    sessCount = 0;
    autoSaveSess();
    syncTasbih();
    toast("تم التصفير ↺");
  } else if (sessCount > 0 === false) {
    sessCount = 0;
    autoSaveSess();
    syncTasbih();
  }
}

async function saveW() {
  if (sessCount <= 0) return;
  const k = state.currentUser.id + "_" + state.currentChallengeId;
  const amount = sessCount;
  const dateText =
    new Date().toLocaleDateString("ar-EG") +
    " " +
    new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const oldScore = state.progress[k] || 0;
  const newScore = oldScore + amount;
  state.progress[k] = newScore;

  const nG = Math.floor(newScore / 500) - Math.floor(oldScore / 500);
  if (nG > 0) state.currentUser.gems = (state.currentUser.gems || 0) + nG;

  const actId = "act_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  state.logs.unshift({
    id: actId,
    userId: state.currentUser.id,
    challengeId: state.currentChallengeId,
    type: "subha",
    amount: amount,
    date: dateText,
    is_pending: true,
  });

  state.pendingActions.push({
    id: actId,
    type: "save",
    amount,
    cid: state.currentChallengeId,
    dateText,
    timestamp: Date.now(),
  });

  sessCount = 0;
  save();
  autoSaveSess();
  syncTasbih();
  syncDash();
  toast("تم الحفظ محلياً ✓ (سيتم الرفع لاحقاً)");

  if (navigator.onLine) syncPending();
}

function openManualModal() {
  document.getElementById("manual-step-input").classList.remove("hidden");
  document.getElementById("manual-step-confirm").classList.add("hidden");
  document.getElementById("manual-val").value = "";
  openModal("m-manual");
}

function showManualConfirm() {
  const v = parseInt(document.getElementById("manual-val").value);
  if (!v || v < 0) return;
  document.getElementById("confirm-num-display").innerText = fmt(v);
  document.getElementById("manual-step-input").classList.add("hidden");
  document.getElementById("manual-step-confirm").classList.remove("hidden");
}

async function submitManual() {
  const v = parseInt(document.getElementById("manual-val").value);
  if (!v || v < 0) return;
  const k = state.currentUser.id + "_" + state.currentChallengeId;
  const dateText =
    new Date().toLocaleDateString("ar-EG") +
    " " +
    new Date().toLocaleTimeString("ar-EG", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const oldScore = state.progress[k] || 0;
  state.progress[k] = oldScore + v;

  const actId = "act_" + Date.now() + "_" + Math.floor(Math.random() * 1000);

  state.logs.unshift({
    id: actId,
    userId: state.currentUser.id,
    challengeId: state.currentChallengeId,
    type: "manual",
    amount: v,
    date: dateText,
    is_pending: true,
  });

  state.pendingActions.push({
    id: actId,
    type: "manual",
    amount: v,
    cid: state.currentChallengeId,
    dateText,
    timestamp: Date.now(),
  });

  save();
  closeModal("m-manual");
  syncDash();
  syncTasbih();
  toast("تمت الإضافة محلياً ✅");

  if (navigator.onLine) syncPending();
}

function applyCustomGoal() {
  const v = parseInt(document.getElementById("custom-goal-val").value);
  if (!v || v < 1) return;
  setG(v);
  closeModal("m-custom-goal");
}
