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
    return `<div style="width:${size}; height:${size}; border-radius:50%; overflow:hidden; border:2px solid var(--primary); flex-shrink:0;"><img src="${u.avatar_url}" class="avatar-img"></div>`;
  }
  const name = u && u.name ? u.name : "؟";
  return `<div style="width:${size}; height:${size}; border-radius:50%; border:2px solid var(--primary); font-size:${parseInt(size) / 3}px; overflow:hidden; flex-shrink:0;" class="avatar-initials">${name.slice(0, 1)}</div>`;
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

  // Separate Active and Upcoming Challenges
  const now = new Date();
  const activeChallenges = state.challenges.filter((c) => {
    const isParticipant = c.participants?.includes(state.currentUser.id);
    const hasProgress = state.progress[`${state.currentUser.id}_${c.id}`] > 0;
    const canSee = (isParticipant || hasProgress) && c.is_active;
    const hasStarted = !c.start_date || new Date(c.start_date) <= now;
    return canSee && hasStarted;
  });

  const upcomingChallenges = state.challenges.filter((c) => {
    const isParticipant = c.participants?.includes(state.currentUser.id);
    const isFuture = c.start_date && new Date(c.start_date) > now;
    return isParticipant && c.is_active && isFuture;
  });

  const userChallenges = [...activeChallenges, ...upcomingChallenges];

  const chips = document.getElementById("dash-chips-area");
  if (chips) {
    if (userChallenges.length > 0) {
      chips.innerHTML = userChallenges
        .map(
          (c) => {
            const isUpcoming = c.start_date && new Date(c.start_date) > now;
            const isActive = c.id === state.currentChallengeId;
            return `
              <div onclick="switchChallenge('${c.id}')" style="flex-shrink:0; padding:8px 18px; border-radius:30px; border:1px solid ${isActive ? "var(--primary)" : "rgba(255,255,255,0.08)"}; background:${isActive ? "rgba(201,148,58,0.2)" : "rgba(255,255,255,0.03)"}; color:${isActive? "var(--primary-light)" : "var(--text-muted)"}; cursor:pointer; font-size:0.8rem; white-space:nowrap; transition:0.3s; display:flex; align-items:center; gap:6px;">
                  ${isUpcoming ? "⏳ " : ""}${c.title} ${!c.is_active && state.currentUser.is_admin ? "🚫" : ""}
              </div>
            `;
          }
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
    const now = new Date();
    const isUpcoming = activeChal.start_date && new Date(activeChal.start_date) > now;
    
    const showChecklist = activeChal.type === 'checklist' || activeChal.type === 'mixed';
    const showCounter = activeChal.type === 'count' || activeChal.type === 'mixed';
    
    if (isUpcoming) {
        heroArea.innerHTML = `
            <div class="card-master" style="padding: 30px; text-align: center; border: 1px solid var(--primary); background: linear-gradient(135deg, #0e0e1a, #12122b);">
                <div style="font-size: 3rem; margin-bottom: 15px;">⏳</div>
                <h3 style="color: var(--primary-light); margin-bottom: 10px;">${activeChal.title}</h3>
                <p style="color: var(--text-muted); margin-bottom: 20px;">هذا التحدي لم يبدأ بعد. استعد للتنافس!</p>
                <div id="upcoming-timer" style="background: rgba(201,148,58,0.1); padding: 15px; border-radius: 18px; border: 1px dashed var(--primary); display: inline-block;">
                    <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom:5px;">يفتح خلال:</span>
                    <span class="live-countdown-el" style="font-size: 1.1rem; font-weight: 800; color: var(--primary-light);">...</span>
                </div>
            </div>
        `;
        startLiveCountdown(activeChal.start_date, "يفتح خلال");
        return;
    }
    let checklistHtml = '';
    if (showChecklist) {
       const startTs = new Date(activeChal.start_date || activeChal.created_at || Date.now()).getTime();
       const dayMs = 86400000;
       const todayStart = new Date().setHours(0,0,0,0);
       
       const items = activeChal.checklist_data || [];
       const completedItems = state.checklistProgress.filter(p => p.challenge_id === activeChal.id && p.user_id === state.currentUser.id).map(p => p.item_id);
       
       checklistHtml = `<div id="checklist-container" style="margin-top:20px;">
          <h5 style="color:var(--text-muted); font-size:0.75rem; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <span>📋 المهام اليومية:</span>
            <span style="font-size:0.6rem; color:var(--accent);">تم إنجاز ${ar(completedItems.length)} من ${ar(items.length)}</span>
          </h5>
          ${items.map((item, idx) => {
            const itemDayTs = startTs + (idx * dayMs);
            const itemDate = new Date(itemDayTs);
            itemDate.setHours(0,0,0,0);
            
            const isFuture = itemDate.getTime() > todayStart;
            const isToday = itemDate.getTime() === todayStart;
            const isPast = itemDate.getTime() < todayStart;
            const isDone = completedItems.includes(item.id);
            const isEnabled = isToday; // Only allow editing for the current day as per request
            let statusLabel = '';
            let indicatorColor = 'rgba(255,255,255,0.05)';
            let statusIcon = '🔒';
            if (isFuture) { 
                statusLabel = 'قريباً (سيفتح ' + itemDate.toLocaleDateString("ar-EG", { weekday: 'long' }) + ')'; 
                statusIcon = '🕒';
            }
            else if (isToday) { 
                statusLabel = 'المهمة الحالية (متاحة الآن)'; 
                indicatorColor = 'var(--primary)'; 
                statusIcon = '✨';
            }
            else if (isPast && !isDone) { 
                statusLabel = 'لم تكتمل المهمة'; 
                indicatorColor = 'var(--danger)'; 
                statusIcon = '❌';
            }
            else if (isDone) { 
                statusLabel = 'تم الإنجاز بنجاح'; 
                indicatorColor = 'var(--accent)'; 
                statusIcon = '✅';
            }

            // Participants who done this item
            const othersDone = state.checklistProgress.filter(cp => cp.challenge_id === activeChal.id && cp.item_id === item.id);
            const othersAvatars = othersDone.slice(0, 3).map(p => {
               const u = state.users.find(ux => ux.id === p.user_id);
               return u ? `<div style="margin-left:-8px;">${getAvatarHTML(u, "24px")}</div>` : '';
            }).join('');

            let countdownHtml = '';
            if (isFuture) {
                const diff = itemDate.getTime() - Date.now();
                if (diff < 86400000) { // If less than 24h
                    const hours = Math.floor(diff / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    countdownHtml = `<div style="font-size:0.55rem; color:var(--primary); margin-top:2px; font-weight:800;">فتحه خلال: ${ar(hours)}س و ${ar(minutes)}د</div>`;
                }
            } else if (isToday && !isDone) {
                const tomorrow = new Date(todayStart + 86400000);
                const diff = tomorrow.getTime() - Date.now();
                const hours = Math.floor(diff / 3600000);
                const minutes = Math.floor((diff % 3600000) / 60000);
                countdownHtml = `<div style="font-size:0.55rem; color:var(--danger); margin-top:2px; font-weight:800; animation: pulse 2s infinite;">ينتهي خلال: ${ar(hours)}س و ${ar(minutes)}د ⏳</div>`;
            }

            return `
                <div class="checklist-item ${isFuture ? 'locked' : ''} ${isDone ? 'done' : ''}" 
                     style="display:flex; align-items:center; gap:12px; padding:18px; background:${isDone ? 'rgba(45,158,95,0.08)' : (isToday ? 'rgba(201,148,58,0.05)' : 'rgba(255,255,255,0.02)')}; border-radius:24px; margin-bottom:12px; border:1px solid ${isToday ? 'var(--primary)' : (isDone ? 'var(--accent)' : 'rgba(255,255,255,0.05)')}; transition:0.3s; position:relative;">
                
                <input type="checkbox" ${isDone ? 'checked' : ''} ${!isEnabled || !activeChal.is_active ? 'disabled' : ''} 
                       onchange="toggleChecklistItem('${activeChal.id}', ${item.id}, this.checked)" 
                       style="width:28px; height:28px; cursor:${isEnabled && activeChal.is_active ? 'pointer' : 'not-allowed'}; opacity:${isEnabled ? '1' : '0.3'}; z-index:2;">
                
                <div style="flex:1;">
                    <div style="font-size:0.95rem; font-weight:700; color:${isFuture ? 'var(--text-dim)' : 'var(--text)'};">${item.text}</div>
                    <div style="font-size:0.65rem; color: ${isPast && !isDone ? 'var(--danger)' : (isToday ? 'var(--primary-light)' : 'var(--text-dim)')}; margin-top:4px;">
                        ${statusIcon} ${statusLabel}
                    </div>
                    ${countdownHtml}
                </div>

                ${othersDone.length > 0 ? `
                <div onclick="openChecklistParticipants('${activeChal.id}', ${item.id})" style="display:flex; align-items:center; gap:8px; margin-right:auto; cursor:pointer; background:rgba(255,255,255,0.04); padding:6px 14px; border-radius:20px; border:1px solid rgba(255,255,255,0.06); box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                    <div style="display:flex; align-items:center;">${othersAvatars}</div>
                    <div style="display:flex; flex-direction:column; align-items:center; line-height:1;">
                       <span style="font-size:0.9rem; font-weight:900; color:var(--primary-light);">${ar(othersDone.length)}</span>
                       <span style="font-size:0.5rem; color:var(--text-dim); text-transform:uppercase;">أتمّوا</span>
                    </div>
                </div>
                ` : ''}
                </div>
            `;
          }).join('')}
       </div>`;
    }

    let counterHtml = '';
    if (showCounter) {
      const val = state.progress[`${state.currentUser.id}_${activeChal.id}`] || 0;
      const target = activeChal.goal || 10000;
      const pct = Math.min(100, (val / target) * 100).toFixed(1);
      const isExceeded = val >= target;
      const rem = Math.max(0, target - val);
      
      counterHtml = `
            <div class="hero-card-v3" style="margin-bottom:15px; background:rgba(255,255,255,0.03); border:1px solid ${isExceeded ? 'var(--accent)' : 'rgba(255,255,255,0.07)'}; padding:18px; border-radius:24px; box-shadow: ${isExceeded ? '0 0 20px rgba(76,175,80,0.2)' : '0 8px 32px rgba(0,0,0,0.2)'}; position:relative;">
                ${isExceeded ? '<div style="position:absolute; top:-10px; left:20px; background:var(--accent); color:black; font-size:0.6rem; padding:2px 10px; border-radius:10px; font-weight:900;">تم تخطي الهدف 🚀</div>' : ''}
                <div class="hero-svg-box" style="width: 90px; height: 90px;">
                    <svg class="hero-svg" viewBox="0 0 100 100"><circle class="hero-track" cx="50" cy="50" r="42"></circle><circle class="hero-progress" cx="50" cy="50" r="42" style="stroke-dashoffset: ${264 - (264 * pct) / 100
        }; stroke: ${isExceeded ? 'var(--accent)' : 'var(--primary)'}; stroke-width: 8;"></circle></svg>
                    <div class="hero-pct-text" style="font-size:1.1rem; font-weight:900; color:${isExceeded ? 'var(--accent)' : 'var(--primary-light)'}; text-shadow:0 0 10px rgba(0,0,0,0.5);">${ar(Math.floor(val/target * 100))}%</div>
                </div>
                <div style="flex:1;">
                    <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-bottom:5px; font-weight:600;">ذكر ${activeChal.phrase || 'الصلاة على النبي'}</span>
                    
                    <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
                        <div>
                            <div style="font-size:0.65rem; color:var(--text-muted);">الأذكار المسجلة:</div>
                            <div style="font-size:1.4rem; font-weight:900; color:${isExceeded ? 'var(--accent)' : 'var(--text)'};">${ar(val)}</div>
                        </div>
                        <div style="text-align:left;">
                            <div style="font-size:0.65rem; color:var(--primary-light);">المستهدف:</div>
                            <div style="font-size:0.95rem; font-weight:700; color:var(--primary-light);">${ar(target)}</div>
                        </div>
                    </div>

                    ${!isExceeded ? `
                    <div style="background:rgba(201,148,58,0.15); padding:10px 15px; border-radius:14px; border:1px dashed var(--primary); display:flex; justify-content:space-between; align-items:center;">
                      <span style="color:var(--primary-light); font-size:0.8rem; font-weight:bold;">المتبقي لك:</span>
                      <span style="color:var(--primary-light); font-size:1.7rem; font-weight:900; letter-spacing:1px;">${ar(rem)}</span>
                    </div>
                    ` : `
                    <div style="background:rgba(76,175,80,0.1); padding:10px 15px; border-radius:14px; border:1px solid var(--accent); color:var(--accent); text-align:center; font-size:0.8rem; font-weight:700;">
                        ✨ أنت الآن في مرحلة الزيادة والمنافسة! ✨
                    </div>
                    `}
                </div>
            </div>
      `;
    }

    heroArea.innerHTML = `
      <div class="card-master" style="padding: 22px; border: 1px solid rgba(201,148,58,0.3); background: linear-gradient(165deg, #0e0e1a, #06060c); position:relative; overflow:visible;">
        <div style="position:absolute; top:-12px; right:20px; background:var(--primary); color:#000; padding:4px 12px; border-radius:12px; font-size:0.65rem; font-weight:900; box-shadow:0 5px 15px rgba(201,148,58,0.3); z-index:5;">
            تحدي ${activeChal.type === 'mixed' ? 'مزدوج ✨' : (activeChal.type === 'checklist' ? 'مهام 📋' : 'عدّاد 📿')}
        </div>
        
        <h4 style="color:var(--primary-light); margin:5px 0 20px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:1.2rem; font-weight:900;">${activeChal.title}</span>
          <span style="font-size:0.6rem; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:4px 10px; border-radius:10px;">
            ${ar(activeChal.duration_days || 0)} أيام
          </span>
        </h4>

        ${counterHtml}
        ${checklistHtml}

        <div class="live-countdown-el" style="margin-top:15px;"></div>
      </div>
    `;
    if (activeChal.end_date) {
        startLiveCountdown(activeChal.end_date);
    } else {
        document.querySelectorAll(".live-countdown-el").forEach(el => el.innerHTML = "");
    }
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
  const filteredUsers = state.users.filter(
    (u) => {
      const isParticipant = chal.participants?.includes(u.id);
      const isMe = u.id === state.currentUser.id;
      if (!isParticipant && !isMe) return false;

      // Admin sees everyone. Others only see their own gender OR admins.
      if (state.currentUser.is_admin) return true;
      return u.is_admin || u.gender === state.currentUser.gender;
    }
  );

  const list = filteredUsers
    .filter((u) => {
      const isAdmin = state.currentUser.is_admin;
      if (isAdmin) return true;
      return u.is_hidden !== true;
    })
    .map((u) => {
      const score = state.progress[`${u.id}_${chal.id}`] || 0;
      const completedCount = state.checklistProgress.filter(cp => cp.challenge_id === chal.id && cp.user_id === u.id).length;
      return { ...u, score, completedCount };
    })
    .sort((a, b) => b.score - a.score);

  const area = document.getElementById("rankings-area-ui");
  if (!area) return;

  if (list.length === 0) {
    area.innerHTML = '<p style="text-align:center; opacity:0.6; padding:10px;">لا يوجد منافسين متاحين للرؤية.</p>';
    return;
  }

  const maxScore = list[0].score;
  const hasChecklist = chal.checklist_data && chal.checklist_data.length > 0;

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
      <button onclick="navTo('s-history')" style="background:rgba(255,255,255,0.05); color:var(--primary-light); border:1px solid rgba(255,255,255,0.1); padding:10px 20px; border-radius:12px; font-size:0.85rem; cursor:pointer; margin-bottom:20px; width:100%;">عرض سجل عملياتي بالكامل 📜</button>
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
  const isAdmin = state.currentUser?.is_admin || false;
  const userGender = state.currentUser?.gender || 'male';
  const filterEl = document.getElementById("honor-gender-filter");
  const adminFilter = (isAdmin && filterEl) ? filterEl.value : userGender;

  // Show/Hide admin filter
  const adminFilterUI = document.getElementById("admin-honor-filter");
  if (adminFilterUI) {
      if (isAdmin) adminFilterUI.classList.remove('hidden');
      else adminFilterUI.classList.add('hidden');
  }

  // 1. Logic for the Previous Challenge Winner
  const prevWinnerArea = document.getElementById("previous-winner-ui");
  if (prevWinnerArea) {
    // Find challenges that are not active
    const inactiveChallenges = state.challenges
      .filter((c) => {
          if (c.is_active) return false;
          // Gender filter for Normal User: must match gender. 
          // Admin filter: matches the dropdown.
          if (isAdmin) {
              if (adminFilter !== 'both' && c.target_gender !== adminFilter && c.target_gender !== 'both') return false;
          } else {
              if (c.target_gender !== 'both' && c.target_gender !== userGender) return false;
              // User must be a participant OR had progress in it to see it in THEIR archive
              const isParticipant = c.participants?.includes(state.currentUser.id);
              const hasProgress = state.progress[`${state.currentUser.id}_${c.id}`] > 0;
              if (!isParticipant && !hasProgress) return false;
          }
          return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));

    if (inactiveChallenges.length > 0) {
      const lastC = inactiveChallenges[0];
      // Find the winner for this specific challenge
      const participants = state.users
        .map((u) => ({
          ...u,
          score: state.progress[`${u.id}_${lastC.id}`] || 0,
        }))
        .filter((u) => u.score > 0)
        .sort((a, b) => b.score - a.score);

      if (participants.length > 0) {
        const winUser = participants[0];
        window._prevWinUserId = winUser.id; // Store globally for the ranking loop
        prevWinnerArea.innerHTML = `
          <div class="card-master" style="background: linear-gradient(135deg, rgba(201,148,58,0.2) 0%, rgba(14,14,26,1) 100%); border: 1px solid var(--primary); padding: 25px; text-align: center; position: relative; overflow: visible; margin-top: 15px;">
            <div style="position: absolute; top: -15px; left: 50%; transform: translateX(-50%); background: var(--primary); color: #000; padding: 6px 20px; border-radius: 20px; font-weight: 900; font-size: 0.8rem; box-shadow: 0 4px 15px var(--glow); white-space: nowrap; z-index: 10;">بطل التحدي السابق 🏆</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 15px; margin-top: 5px;">تحدي: ${lastC.title}</div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 15px;">
              <div style="position: relative;">
                ${getAvatarHTML(winUser, "70px")}
                <div style="position: absolute; bottom: -5px; right: -5px; font-size: 1.5rem;">👑</div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 800; font-size: 1.3rem; color: var(--primary-light);">${winUser.name}</div>
                <div style="font-family: 'Scheherazade New', serif; font-size: 1.6rem; color: var(--primary); line-height: 1.2;">
                  ${fmt(winUser.score)} <span style="font-size: 0.9rem;">ذكر</span>
                </div>
              </div>
            </div>
            <div style="background: rgba(45, 158, 95, 0.1); color: var(--accent); padding: 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
              ✨ بوركت جهوده وجعلها الله في ميزان حسناته ✨
            </div>
          </div>
        `;
      } else {
        prevWinnerArea.innerHTML = "";
        window._prevWinUserId = null;
      }
    } else {
      prevWinnerArea.innerHTML = "";
      window._prevWinUserId = null;
    }
  }

  // 2. Original Honor Board Logic (Global Rankings)
  const sorted = state.users
    .filter((u) => {
      if (u.is_hidden) return false;
      // Admin filter
      if (isAdmin) {
          if (adminFilter === 'both') return true;
          return u.gender === adminFilter || u.is_admin;
      }
      // Users only see their own gender OR admins
      return u.is_admin || u.gender === userGender;
    })
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
        const isPrevWinner = u.id === window._prevWinUserId;
        return `
      <div class="ranking-row" style="background: ${isPrevWinner ? "rgba(201,148,58,0.15)" : "rgba(255,255,255,0.02)"}; border-right-color: ${i < 3 ? "var(--fire)" : (isPrevWinner ? "var(--primary)" : "var(--primary-dark)")}; border: ${isPrevWinner ? "1px solid var(--primary-dark)" : ""};">
          <div class="rank-badge" style="font-size:1.4rem;">${i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : ar(i + 1)
          }</div>
          <div style="width:40px; height:40px; flex-shrink:0;">${getAvatarHTML(
            u,
            "40px"
          )}</div>
          <div style="flex:1;">
              <div style="font-weight:700; color:${i === 0 ? "var(--primary-light)" : "var(--text)"
          };">${u.name} ${isPrevWinner ? ' <span title="بطل التحدي السابق" style="cursor:help;">🏆</span>' : ""}</div>
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

  // 3. Challenge Archive logic
  const archiveArea = document.getElementById("challenge-archive-ui");
  if (archiveArea) {
    // Reuse the same logic for inactiveChallenges as above
    const inactiveChallenges = state.challenges
      .filter((c) => {
          if (c.is_active) return false;
          if (isAdmin) {
              if (adminFilter !== 'both' && c.target_gender !== adminFilter && c.target_gender !== 'both') return false;
          } else {
              if (c.target_gender !== 'both' && c.target_gender !== userGender) return false;
              const isParticipant = c.participants?.includes(state.currentUser.id);
              const hasProgress = state.progress[`${state.currentUser.id}_${c.id}`] > 0;
              if (!isParticipant && !hasProgress) return false;
          }
          return true;
      })
      .sort((a, b) => b.id.localeCompare(a.id));

    if (inactiveChallenges.length > 0) {
      archiveArea.innerHTML = `
        <h3 style="color: var(--primary-light); font-size: 1rem; margin-bottom: 15px; text-align: right; padding-right: 10px;">أرشيف التحديات 📜</h3>
        ${inactiveChallenges.map(c => {
        const participants = state.users
          .map((u) => ({ name: u.name, score: state.progress[`${u.id}_${c.id}`] || 0 }))
          .sort((a, b) => b.score - a.score);
        const winner = participants.length > 0 && participants[0].score > 0 ? participants[0].name : "لا يوجد";
        return `
          <div class="card-master" style="padding: 15px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border-radius: 18px; border: 1px solid rgba(255,255,255,0.05);">
            <div style="text-align: right;">
              <div style="font-weight: 700; color: var(--primary-light); font-size: 0.9rem;">${c.title}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">البطل: ${winner}</div>
            </div>
            <div style="text-align: left;">
              <div style="font-family: 'Scheherazade New', serif; color: var(--primary); font-size: 1.1rem; line-height: 1;">${fmt(c.goal)}</div>
              <div style="font-size: 0.5rem; color: var(--text-dim);">الهدف</div>
            </div>
          </div>
        `;
      }).join("")}
      `;
    } else {
      archiveArea.innerHTML = '<p style="text-align: center; opacity: 0.5; font-size: 0.8rem; padding: 20px;">لا يوجد تحديات مؤرشفة حالياً.</p>';
    }
  }
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
