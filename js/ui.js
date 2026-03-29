/**
 * UI MODULE
 * Handles screen synchronization, list rendering, and avatars.
 */

function go(id) {
  document
    .querySelectorAll(".screen")
    .forEach((s) => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  const nav = document.getElementById("app-nav");
  if (id === "s-login") {
    if (nav) nav.style.display = "none";
  } else {
    if (nav) nav.style.display = "flex";
    document
      .querySelectorAll(".nav-tab")
      .forEach((n) => n.classList.remove("active"));
    const tab = document.getElementById("n-" + id.replace("s-", ""));
    if (tab) tab.classList.add("active");
  }

  // Refresh data based on the target screen
  if (id === "s-dash") syncDash();
  if (id === "s-tasbih") syncTasbih();
  if (id === "s-history") syncHistory();
  if (id === "s-honor") syncHonor();
  if (id === "s-settings") syncProfile();
  if (id === "s-badges") syncBadges();
  syncAdmin();
}

function navTo(id) {
  go(id);
}

function getAvatarHTML(u, size = "70px") {
  if (u && u.avatar_url) {
    return `<div style="width:${size}; height:${size}; border-radius:50%; overflow:hidden; border:2px solid var(--primary);"><img src="${u.avatar_url}" style="width:100%; height:100%; object-fit:cover;"></div>`;
  }
  const name = u && u.name ? u.name : "؟";
  return `<div style="width:${size}; height:${size}; background:var(--primary-dark); border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid var(--primary); font-size:${parseInt(size) / 3
    }px; overflow:hidden;">${name.slice(0, 1)}</div>`;
}

function syncDash() {
  const h = document.getElementById("dash-header");
  if (!h) return;
  h.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
          <div style="flex-shrink:0;">${getAvatarHTML(
    state.currentUser,
    "48px"
  )}</div>
          <div>
              <div style="font-weight:700; display:flex; align-items:center; gap:5px;">
                  ${state.currentUser.name} 
                  ${state.pendingActions.length > 0
      ? '<span title="جاري المزامنة مع السحاب..." style="font-size:0.6rem; animation:rotate 2s linear infinite;">☁️</span>'
      : ""
    }
                  ${!navigator.onLine
      ? '<span title="وضع الأوفلاين" style="font-size:0.6rem; color:var(--danger);">📡</span>'
      : ""
    }
              </div>
              ${state.currentUser.is_admin
      ? `<button onclick="navTo('s-admin')" style="color:var(--primary); font-size:0.6rem; background:none; border:none; border-bottom:1px solid;">لوحة الإدارة</button>`
      : ""
    }
          </div>
      </div>
      <div class="pouch-gem">💎 ${ar(state.currentUser.gems || 0)}</div>
  `;

  // Daily Message
  const msgArea = document.getElementById("daily-msg-area");
  if (msgArea) {
    const azkarList = [
      '"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ" - الرعد ٢٨',
      '"مَن قالَ: سُبحانَ اللهِ وبحَمدِه في يَومٍ مائةَ مرَّةٍ حُطَّتْ خطاياه" - متفق عليه',
      '"سيد الاستغفار: اللهم أنت ربي لا إله إلا أنت" - البخاري',
      '"أقرب ما يكون العبد من ربه وهو ساجد فأكثروا الدعاء" - مسلم',
      '"لا حول ولا قوة إلا بالله كنز من كنوز الجنة" - متفق عليه',
      '"من لزم الاستغفار جعل الله له من كل ضيق مخرجاً" - أبو داود',
      '"إن الله يحب العبد التقي الغني الخفي" - مسلم',
      '"ذكر الله شفاء القلوب" - ابن القيم',
      '"أحب الكلام إلى الله: سبحان الله وبحمده" - مسلم',
      "استغفر الآن… فقد يكون فرجك في هذه اللحظة 🤍",
      "كل استغفار تمحو به ذنب وتفتح به باب رزق 🌿",
      "لا تؤجل الاستغفار… فربما تكون هذه فرصتك للنجاة",
      "الاستغفار يغيّر الأقدار بإذن الله… فاستمر ✨",
      "حين تضيق بك الدنيا… أكثر من الاستغفار 🤲",
      "استغفارك اليوم هو راحتك غدًا 💛",
      "باب التوبة مفتوح… فقط قل: أستغفر الله",
      "ربك يحب أن تغفر… فلا تتردد في العودة إليه ❤️",
      "كل مرة تقول أستغفر الله… أنت تقترب من الفرج",
      "الاستغفار حياة للقلب… لا تحرم نفسك منه 🌸",
      "استغفر ولو كنت تظن أن ذنبك كبير… فربك أكبر",
      "اجعل لسانك رطبًا بالاستغفار… تنعم بالسكينة ✨",
      "ربما دعاءك متوقف على استغفار صادق… جرّب الآن",
      "الاستغفار يمحو الماضي… ويصنع بداية جديدة 🔄",
      "أنت لا تعلم أي استغفار سيغير حياتك… فلا تتوقف 💫",
      '"من صلى عليّ صلاة واحدة صلى الله عليه بها عشراً" - مسلم',
    ];
    const todayIdx = Math.floor(Date.now() / 60000) % azkarList.length;
    const autoZikr = azkarList[todayIdx];
    let html = `<div class="daily-msg" style="margin-bottom:12px;"><div style="font-size:0.65rem; color:var(--text-dim); margin-bottom:4px;">📖 ذكر تحفيزي</div><div class="msg-text" style="font-size:1rem;">${autoZikr}</div></div>`;
    if (state.dailyMsg)
      html += `<div class="daily-msg"><div style="font-size:0.65rem; color:var(--fire); margin-bottom:4px;">📢 رسالة الإدارة مصطفي </div><div class="msg-text">${state.dailyMsg}</div></div>`;
    msgArea.innerHTML = html;
  }

  // Challenges Chips
  const userChallenges = state.challenges.filter((c) => {
    const isParticipant =
      c.participants &&
      Array.isArray(c.participants) &&
      c.participants.includes(state.currentUser.id);
    const hasProgress =
      state.progress && state.progress[`${state.currentUser.id}_${c.id}`] > 0;
    const canSee = isParticipant || hasProgress;
    return (
      canSee &&
      (c.is_active || state.currentUser.is_admin || !navigator.onLine)
    );
  });

  const chips = document.getElementById("dash-chips-area");
  if (chips) {
    if (userChallenges.length > 1) {
      chips.innerHTML = userChallenges
        .map(
          (c) => `
              <div onclick="switchChallenge('${c.id}')" style="flex-shrink:0; padding:6px 16px; border-radius:30px; border:1px solid ${c.id === state.currentChallengeId
              ? "var(--primary)"
              : "rgba(255,255,255,0.1)"
            }; background:${c.id === state.currentChallengeId
              ? "rgba(201,148,58,0.2)"
              : "rgba(255,255,255,0.05)"
            }; color:${c.id === state.currentChallengeId
              ? "var(--primary-light)"
              : "var(--text-muted)"
            }; cursor:pointer; font-size:0.8rem; white-space:nowrap; transition:0.3s;">
                  ${c.title} ${!c.is_active && state.currentUser.is_admin ? "🚫" : ""
            }
              </div>
          `
        )
        .join("");
      chips.style.display = "flex";
    } else {
      chips.innerHTML = "";
      chips.style.display = "none";
    }
  }

  // Active Challenge Hero Card
  const cur = state.challenges.find(
    (x) =>
      x.id === state.currentChallengeId &&
      ((x.participants &&
        Array.isArray(x.participants) &&
        x.participants.includes(state.currentUser.id)) ||
        state.currentUser.is_admin ||
        (state.progress &&
          state.progress[`${state.currentUser.id}_${x.id}`] > 0))
  );

  let activeChal =
    cur ||
    (state.currentUser.is_admin
      ? state.challenges.find((c) => c.is_active || state.currentUser.is_admin)
      : userChallenges[0]);

  if (!activeChal && !navigator.onLine && state.challenges.length > 0) {
    activeChal =
      state.challenges.find(
        (c) => state.progress && state.progress[`${state.currentUser.id}_${c.id}`] > 0
      ) || state.challenges[0];
  }

  const heroArea = document.getElementById("hero-card-v3-area");
  if (activeChal) {
    state.currentChallengeId = activeChal.id;
    const val = state.progress[`${state.currentUser.id}_${activeChal.id}`] || 0;
    const pct = Math.min(100, (val / activeChal.goal) * 100).toFixed(1);
    const rem = Math.max(0, activeChal.goal - val);
    heroArea.innerHTML = `
          <div class="hero-card-v3">
              <div class="hero-svg-box">
                  <svg class="hero-svg" viewBox="0 0 100 100"><circle class="hero-track" cx="50" cy="50" r="40"></circle><circle class="hero-progress" cx="50" cy="50" r="40" style="stroke-dashoffset: ${238 - (238 * pct) / 100
      };"></circle></svg>
                  <div class="hero-pct-text">${ar(Math.floor(pct))}%</div>
              </div>
              <div style="flex:1;">
                  <div style="font-weight:700; color:var(--primary-light); margin-bottom:5px;">${activeChal.title
      }</div>
                  <div class="hero-stat-row"><span class="hero-stat-lbl">إنجاز ✅</span><span class="hero-stat-val">${fmt(
        val
      )}</span></div>
                  <div class="hero-stat-row"><span class="hero-stat-lbl">متبقي ✨</span><span class="hero-stat-val" style="color:var(--text);">${fmt(
        rem
      )}</span></div>
              </div>
          </div>
          <div id="countdown-live"></div>
      `;
    if (activeChal.end_date) startLiveCountdown(activeChal.end_date);
    renderRanks(activeChal);
    document.getElementById("rank-title-ui").classList.remove("hidden");
  } else {
    heroArea.innerHTML = `
          <div class="card-master" style="text-align:center; padding:40px 20px;">
              <div style="font-size:3rem; margin-bottom:15px;">✨</div>
              <h3 style="color:var(--primary-light);">لا يوجد تحدي حالي</h3>
              <p style="color:var(--text-muted); font-size:0.9rem;">انتظر انضمامك لتحدي جديد من قبل الإدارة</p>
          </div>
      `;
    document.getElementById("rankings-area-ui").innerHTML = "";
    document.getElementById("rank-title-ui").classList.add("hidden");
  }
}

function renderRanks(chal) {
  const list = state.users
    .filter(
      (u) =>
        (chal.participants &&
          Array.isArray(chal.participants) &&
          chal.participants.includes(u.id)) ||
        u.id === state.currentUser.id
    )
    .filter((u) => {
      if (state.currentUser.is_admin) return true;
      if (u.id === state.currentUser.id) return true;
      return u.is_hidden !== true;
    })
    .map((u) => ({
      ...u,
      score: state.progress[`${u.id}_${chal.id}`] || 0,
    }))
    .sort((a, b) => b.score - a.score);

  const area = document.getElementById("rankings-area-ui");
  if (!area) return;

  if (list.length === 0) {
    area.innerHTML =
      '<p style="text-align:center; opacity:0.6; padding:10px;">لا يوجد منافسين متاحين للرؤية.</p>';
    return;
  }
  const maxScore = list[0].score;
  area.innerHTML = list
    .map((u, i) => {
      const isMe = u.id === state.currentUser.id;
      const isFirst = i === 0;
      const gap = maxScore - u.score;
      const hiddenTag =
        u.is_hidden && state.currentUser.is_admin
          ? '<span style="font-size:0.6rem; color:var(--diamond);">(مخفي)</span>'
          : "";
      return `
          <div class="ranking-row ${isMe ? "me" : ""}">
              <div class="rank-badge">${isFirst ? "🔥" : ar(i + 1)}</div>
              <div style="width:44px; height:44px; flex-shrink:0;">${getAvatarHTML(
        u,
        "44px"
      )}</div>
              <div style="flex:1;">
                  <div style="font-weight:700;">${u.name} ${hiddenTag}</div>
                  <div style="font-size:0.6rem; color:${isFirst ? "var(--accent)" : "var(--danger)"
        };">${isFirst ? "المتصدر" : "باقٍ لك " + fmt(gap)}</div>
              </div>
              <div style="text-align:left;">
                  <div style="font-family:'Scheherazade New'; font-size:1.5rem; color:var(--primary-light);">${fmt(
          u.score
        )}</div>
              </div>
          </div>`;
    })
    .join("");
}

function switchChallenge(id) {
  state.currentChallengeId = id;
  save();
  syncDash();
  if (document.getElementById("s-tasbih").classList.contains("active")) {
    syncTasbih();
  }
  toast("تم التبديل بنجاح 🔄");
}

function syncHistory(adminUserId = null) {
  const targetId = adminUserId || state.currentUser.id;
  const history = state.logs.filter((l) => l.userId === targetId).reverse();
  const area = document.getElementById("history-list-ui");
  if (!area) return;
  area.innerHTML = history.length
    ? history
      .map((l) => {
        const chal = state.challenges.find((c) => c.id === (l.challengeId || l.challenge_id));
        const chalName = chal ? chal.title : "تحدي عام";
        return `
          <div class="log-row ${l.type === "manual" ? "manual" : ""}">
              <div class="log-info">
                  <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px;">
                      <span class="log-type" style="margin:0;">${l.type === "manual" ? "💎 رصيد يدوي" : "📿 جلسة سبحة"
          }</span>
                      <span style="font-size:0.65rem; padding:2px 8px; background:rgba(255,255,255,0.05); border-radius:8px; color:var(--diamond);">${chalName}</span>
                  </div>
                  <div class="log-date">${l.date}</div>
              </div>
              <div class="log-amt">${fmt(l.amount)}</div>
          </div>
      `;
      })
      .join("")
    : '<p style="text-align:center; opacity:0.6;">لا توجد عمليات مسجلة بعد.</p>';
}

function syncBadges() {
  const bl = document.getElementById("all-badges-list-ui");
  if (!bl) return;

  const sorted = [...state.badges].sort((a, b) => a.target - b.target);
  const total = getTotal(state.currentUser.id);

  bl.innerHTML = sorted
    .map((b) => {
      const has = total >= b.target;
      const progress = Math.min(100, (total / b.target) * 100).toFixed(1);
      return `
              <div class="card-master" style="border: 1px solid ${has ? "var(--primary)" : "rgba(255,255,255,0.05)"
        }; background: ${has ? "rgba(201,148,58,0.05)" : "var(--card-bg)"
        };">
                  <div style="display:flex; align-items:center; gap:15px;">
                      <div style="font-size:2.5rem; opacity:${has ? 1 : 0.3
        }; filter:${has ? "" : "grayscale(1)"};">${b.icon}</div>
                      <div style="flex:1;">
                          <div style="font-weight:700; color:${has ? "var(--primary-light)" : "var(--text-muted)"
        };">${b.name}</div>
                          <div style="font-size:0.75rem; color:var(--text-dim);">الهدف: ${fmt(
          b.target
        )}</div>
                          ${!has
          ? `
                              <div style="margin-top:8px; height:4px; background:rgba(255,255,255,0.05); border-radius:2px; overflow:hidden;">
                                  <div style="width:${progress}%; height:100%; background:var(--primary); transition:0.5s;"></div>
                              </div>
                              <div style="font-size:0.6rem; text-align:left; margin-top:4px; color:var(--text-dim);">اكتمل ${ar(
            Math.floor(progress)
          )}%</div>
                          `
          : '<div style="font-size:0.7rem; color:var(--accent); margin-top:4px;">✓ تم الحصول عليه بنجاح</div>'
        }
                      </div>
                  </div>
              </div>
          `;
    })
    .join("");
}

function syncProfile() {
  const u = state.currentUser;
  const total = getTotal(u.id);
  const area = document.getElementById("profile-area-ui");
  if (!area) return;
  area.innerHTML = `
      <div style="position:relative; width:100%; max-width:120px; margin:0 auto 15px;">
          ${getAvatarHTML(u, "100px")}
          <button onclick="document.getElementById('avatar-input').click()" style="position:absolute; bottom:0; right:50%; transform:translateX(50px); background:var(--primary); border:none; border-radius:50%; width:32px; height:32px; cursor:pointer; font-size:1.2rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.5);">📷</button>
          <input type="file" id="avatar-input" class="hidden" accept="image/*" onchange="uploadAvatar(event)">
      </div>
      <h2 style="color:var(--primary-light);">${u.name}</h2>
      <div class="pouch-gem" style="width:fit-content; margin:15px auto;">💎 الماس: ${ar(
    u.gems || 0
  )}</div>
      <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:15px;">إجمالي الاستغفار: ${fmt(
    total
  )}</div>
      <h3 style="color:var(--primary-light); font-size:1rem; margin-bottom:10px;">الأوسمة 🏅</h3>
      <div class="badge-row">${renderBadgesHTML(u.id)}</div>
  `;
}

function renderBadgesHTML(uid) {
  const total = getTotal(uid);
  return state.badges
    .map((b) => {
      const earned = total >= b.target;
      return `
          <div class="badge-item ${earned ? "earned" : "locked"}">
              <span class="badge-icon">${b.icon}</span>
              <span class="badge-label">${b.name}<br>${fmt(b.target)}</span>
          </div>
      `;
    })
    .join("");
}

function syncHonor() {
  const sorted = state.users
    .filter((u) => !u.is_hidden)
    .map((u) => ({ ...u, score: getTotal(u.id) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
  const area = document.getElementById("honor-board-ui");
  if (!area) return;
  area.innerHTML =
    sorted
      .map((u, i) => {
        const total = getTotal(u.id);
        const earnedIcons = state.badges
          .filter((b) => total >= b.target)
          .map((b) => b.icon)
          .join(" ");
        return `
      <div class="ranking-row" style="background: rgba(255,255,255,0.02); border-right-color: ${i < 3 ? "var(--fire)" : "var(--primary)"
          };">
          <div class="rank-badge" style="font-size:1.4rem;">${i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : ar(i + 1)
          }</div>
          <div style="width:40px; height:40px; flex-shrink:0;">${getAvatarHTML(
            u,
            "40px"
          )}</div>
          <div style="flex:1;">
              <div style="font-weight:700; color:${i === 0 ? "var(--primary-light)" : "var(--text)"
          };">${u.name}</div>
              <div style="font-size:0.7rem; letter-spacing:2px;">${earnedIcons ||
          '<span style="color:var(--text-dim); font-size:0.6rem;">لا أوسمة بعد</span>'
          }</div>
          </div>
          <div style="font-family:'Scheherazade New', serif; font-size:1.4rem; color:var(--primary-light);">${fmt(
            u.score
          )}</div>
      </div>
  `;
      })
      .join("") || '<p style="text-align:center;">لا يوجد بيانات بعد.</p>';
}

function showSkeletons() {
  const currentScreen = document.querySelector(".screen.active")?.id;
  if (currentScreen !== "s-dash") return;

  const h = document.getElementById("dash-header");
  if (h)
    h.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; width:100%;">
          <div class="skeleton" style="width:48px; height:48px; border-radius:50%;"></div>
          <div style="flex:1;">
             <div class="skeleton" style="width:120px; height:16px; margin-bottom:8px;"></div>
             <div class="skeleton" style="width:60px; height:12px;"></div>
          </div>
          <div class="skeleton" style="width:80px; height:32px; border-radius:16px;"></div>
        </div>
      `;
  const hero = document.getElementById("hero-card-v3-area");
  if (hero)
    hero.innerHTML = `
        <div class="hero-card-v3" style="opacity:0.4;">
          <div class="skeleton" style="width:100px; height:100px; border-radius:50%;"></div>
          <div style="flex:1;">
             <div class="skeleton" style="width:150px; height:20px; margin-bottom:15px;"></div>
             <div class="skeleton" style="width:100%; height:14px; margin-bottom:10px;"></div>
             <div class="skeleton" style="width:80%; height:14px;"></div>
          </div>
        </div>
      `;
  const ranks = document.getElementById("rankings-area-ui");
  if (ranks)
    ranks.innerHTML = Array(3)
      .fill(0)
      .map(
        () => `
        <div class="ranking-row" style="opacity:0.3;">
          <div class="skeleton" style="width:44px; height:44px; border-radius:14px;"></div>
          <div class="skeleton" style="width:40px; height:40px; border-radius:50%;"></div>
          <div style="flex:1;">
             <div class="skeleton" style="width:100px; height:16px; margin-bottom:8px;"></div>
             <div class="skeleton" style="width:60px; height:10px;"></div>
          </div>
          <div class="skeleton" style="width:50px; height:20px;"></div>
        </div>
      `
      )
      .join("");
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "flex";
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = "none";
}
