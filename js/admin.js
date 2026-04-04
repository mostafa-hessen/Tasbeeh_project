/**
 * ADMIN MODULE
 * Logic for the admin dashboard, user and challenge management.
 */

let editingUserId = null;
let editingChallengeId = null;

function switchAdminTab(tabId) {
  // Update buttons
  document.querySelectorAll(".admin-tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  const activeBtn = Array.from(
    document.querySelectorAll(".admin-tab-btn")
  ).find((b) => b.getAttribute("onclick")?.includes(`'${tabId}'`));
  if (activeBtn) activeBtn.classList.add("active");

  // Update panels
  document.querySelectorAll(".admin-tab-panel").forEach((panel) => {
    panel.classList.remove("active");
  });
  const target = document.getElementById("atab-" + tabId);
  if (target) target.classList.add("active");
}

// Global listener for dynamic form behavior
document.addEventListener("change", (e) => {
  if (e.target && e.target.id === "nc-type") {
    const area = document.getElementById("nc-checklist");
    if (area)
      area.style.display = (e.target.value === "checklist" || e.target.value === "mixed") ? "block" : "none";
  }
});

function filterUserCheckboxes() {
  const targetGenderEl = document.getElementById("nc-target-gender");
  if (!targetGenderEl) return;
  const targetGender = targetGenderEl.value;

  const cbContainer = document.getElementById("admin-user-checkboxes");
  if (!cbContainer) return;

  const users = state.users.filter(u => {
    // Admin always appears in both
    if (u.is_admin) return true;
    if (targetGender === "both") return true;
    return u.gender === targetGender;
  });

  cbContainer.innerHTML = users
    .map(
      (u) =>
        `<label style="display:flex; align-items:center; gap:8px; margin-bottom:5px;"><input type="checkbox" value="${u.id}" class="nu-p"> ${u.name} ${u.gender === 'female' ? '♀️' : '♂️'}</label>`
    )
    .join("");
}

function syncAdmin() {
  // Only sync if user is admin
  if (!state.currentUser?.is_admin) return;

  const cb = document.getElementById("admin-user-checkboxes");
  if (!cb) return;

  filterUserCheckboxes();

  // Badge list management
  const bl = document.getElementById("admin-badge-list-ui");
  if (bl) {
    bl.innerHTML = state.badges
      .map(
        (b) => `
          <div style="background:rgba(255,255,255,0.05); padding:5px 10px; border-radius:10px; font-size:0.75rem; display:flex; align-items:center; gap:5px; border:1px solid rgba(255,255,255,0.1);">
              <span>${b.icon} ${b.name} (${fmt(b.target)})</span>
              <button onclick="deleteBadge('${b.id}')" style="background:none; border:none; color:var(--danger); cursor:pointer;">×</button>
          </div>
      `
      )
      .join("");
  }

  // Challenges list
  const cl = document.getElementById("admin-challenge-list-ui");
  if (cl) {
    cl.innerHTML = state.challenges
      .map(
        (c) => `
      <div class="ranking-row" style="border-right-color: ${c.is_active ? "var(--diamond)" : "var(--danger)"
          };">
          <div style="flex:1;">
              <strong>${c.title}</strong> ${!c.is_active ? '<span style="color:var(--danger); font-size:0.6rem;">(غير نشط 🚫)</span>' : ""
          }
              <div style="font-size:0.6rem; color:var(--text-muted);">الهدف: ${fmt(
            c.goal
          )} | المشاركين: ${ar(c.participants?.length || 0)}</div>
          </div>
          <button onclick="editChallenge('${c.id
          }')" style="background:none; border:none; color:var(--primary); font-size:0.7rem; border-bottom:1px solid;">تعديل✏️</button>
          <button onclick="deleteChallenge('${c.id
          }')" style="background:none; border:none; color:var(--danger); font-size:0.7rem; margin-right:8px;">حذف🗑️</button>
      </div>`
      )
      .join("");
  }

  // User list
  const ulArea = document.getElementById("admin-user-list-ui");
  if (ulArea) {
    ulArea.innerHTML = state.users
      .map(
        (u, i) => `
      <div class="ranking-row">
          <div style="flex:1;">
              <strong>${u.name}</strong> ${u.is_hidden ? '<span style="font-size:0.6rem; color:var(--diamond);">(مخفي)</span>' : ""
          }
              <div style="font-size:0.6rem; color:var(--text-muted);">رصيد إجمالي: ${fmt(
            getTotal(u.id)
          )} | الماس: ${ar(u.gems || 0)}</div>
          </div>
          <div style="display:flex; gap:8px;">
              <button onclick="viewUserBehavior('${u.id}')" style="background:none; border:none; color:var(--primary); font-size:0.7rem; border-bottom:1px solid;">السلوك 🔍</button>
              <button onclick="openEditUser(${i})" style="color:var(--primary-light); background:none; border:none; border-bottom:1px solid; font-size:0.7rem;">تعديل✏️</button>
              <button onclick="deleteUser('${u.id}')" style="background:none; border:none; color:var(--danger); font-size:0.7rem;">حذف🗑️</button>
          </div>
      </div>`
      )
      .join("");
  }
}

async function addChallenge() {
  const t = document.getElementById("nc-title").value,
    g = parseInt(document.getElementById("nc-goal").value);
  const act = document.getElementById("nc-active").checked,
    days = parseInt(document.getElementById("nc-days").value) || 0;
  const phrase = document.getElementById("nc-phrase").value || "أستغفر الله";
  const type = document.getElementById("nc-type").value || "count";
  const target_gender = document.getElementById("nc-target-gender").value || "male";
  const checklist_text = document.getElementById("nc-checklist").value || "";
  const checklist_data = checklist_text.split(/\r?\n/).filter(line => line.trim() !== "").map((line, idx) => ({ id: idx + 1, text: line.trim() }));
  const startDate = document.getElementById("nc-start").value ? new Date(document.getElementById("nc-start").value).toISOString() : new Date().toISOString();

  const participants = Array.from(document.querySelectorAll(".nu-p:checked")).map(
    (cb) => cb.value
  );

  if (!t || !g) return alert("أكمل بيانات التحدي");

  const end =
    days > 0 ? new Date(new Date(startDate).getTime() + days * 86400000).toISOString() : null;
  const entry = {
    id: editingChallengeId || "c" + Date.now(),
    title: t,
    goal: g,
    is_active: act,
    duration_days: days,
    start_date: startDate,
    end_date: end,
    participants: participants,
    phrase: phrase,
    type: type,
    target_gender: target_gender,
    checklist_data: checklist_data
  };

  if (editingChallengeId) {
    const existing = state.challenges.find(c => c.id === editingChallengeId);
    if (existing) entry.created_at = existing.created_at;

    await db.from("challenges").update(entry).eq("id", entry.id);
    const idx = state.challenges.findIndex((x) => x.id === entry.id);
    state.challenges[idx] = { ...state.challenges[idx], ...entry };
    editingChallengeId = null;
    cancelEditChallenge();
  } else {
    entry.created_at = new Date().toISOString();
    await db.from("challenges").insert([entry]);
    state.challenges.push(entry);
  }

  save();
  syncAdmin();
  toast(editingChallengeId ? "تم تحديث التحدي" : "تم بدء التحدي بنجاح 🔥");
}

function editChallenge(id) {
  const c = state.challenges.find((x) => x.id === id);
  if (!c) return;
  editingChallengeId = id;
  document.getElementById("nc-title").value = c.title;
  document.getElementById("nc-goal").value = c.goal;
  document.getElementById("nc-active").checked = c.is_active || false;
  document.getElementById("nc-days").value = c.duration_days || "";
  document.getElementById("nc-start").value = c.start_date ? c.start_date.slice(0, 16) : "";
  document.getElementById("nc-phrase").value = c.phrase || "أستغفر الله";
  document.getElementById("nc-type").value = c.type || "count";
  document.getElementById("nc-target-gender").value = c.target_gender || "male";
  document.getElementById("nc-checklist").value = (c.checklist_data || []).map(item => item.text).join("\n");
  document.getElementById("nc-checklist").style.display = (c.type === "checklist" || c.type === "mixed") ? "block" : "none";
  
  filterUserCheckboxes();
  document
    .querySelectorAll(".nu-p")
    .forEach((cb) => (cb.checked = c.participants.includes(cb.value)));
  document.getElementById("admin-chal-form-title").innerText = "تعديل التحدي ✏️";
  document.getElementById("admin-chal-btn").innerText = "تحديث التحدي 💾";
  document.getElementById("admin-chal-cancel").classList.remove("hidden");
  document.getElementById("nc-title").focus();
}

function cancelEditChallenge() {
  editingChallengeId = null;
  document.getElementById("nc-title").value = "";
  document.getElementById("nc-goal").value = "";
  document.getElementById("nc-days").value = "";
  document.getElementById("nc-start").value = "";
  document.querySelectorAll(".nu-p").forEach((cb) => (cb.checked = false));
  document.getElementById("nc-phrase").value = "أستغفر الله";
  document.getElementById("nc-type").value = "count";
  document.getElementById("nc-target-gender").value = "male";
  document.getElementById("nc-checklist").value = "";
  document.getElementById("nc-checklist").style.display = "none";
  document.getElementById("nc-active").checked = true;
  filterUserCheckboxes();
  document.getElementById("admin-chal-form-title").innerText =
    "بدء تحدي جديد 🏆";
  document.getElementById("admin-chal-btn").innerText = "ابدأ التحدي 🔥";
  document.getElementById("admin-chal-cancel").classList.add("hidden");
}

async function deleteChallenge(id) {
  if (
    !confirm(
      "هل أنت متأكد من حذف هذا التحدي؟ سيتم حذف جميع السجلات المتعلقة به."
    )
  )
    return;
  await db.from("challenges").delete().eq("id", id);
  state.challenges = state.challenges.filter((c) => c.id !== id);
  save();
  syncAdmin();
  toast("تم حذف التحدي 🗑️");
}

function openEditUser(idx) {
  const u = state.users[idx];
  editingUserId = u.id;
  document.getElementById("edit-u-name").value = u.name;
  document.getElementById("edit-u-gems").value = u.gems || 0;
  document.getElementById("edit-u-gender").value = u.gender || "male";
  const passField = document.getElementById("edit-u-pass");
  if (passField) passField.value = "********"; // placeholder
  document.getElementById("edit-u-hidden").checked = u.is_hidden || false;

  const area = document.getElementById("edit-u-balances");
  area.innerHTML = state.challenges
    .filter((c) => c.participants?.includes(u.id))
    .map((c) => {
      const pid = u.id + "_" + c.id;
      const score = state.progress[pid] || 0;
      return `
      <div style="margin-bottom:10px;">
          <label style="font-size:0.75rem; color:var(--text-muted);">${c.title}</label>
          <input type="number" step="1" value="${score}" data-cid="${c.id}" class="input-field edit-prog-input" style="margin-bottom:0; padding:10px;">
      </div>`;
    })
    .join("");

  openModal("m-edit-user");
}

async function saveUserEdit() {
  const name = document.getElementById("edit-u-name").value.trim();
  const gems = parseInt(document.getElementById("edit-u-gems").value) || 0;
  const gender = document.getElementById("edit-u-gender").value;
  const isHidden = document.getElementById("edit-u-hidden").checked;

  if (!name) return toast("الاسم مطلوب ⚠️");
  toast("جاري حفظ التعديلات... ⏳");

  const { error: pErr } = await db
    .from("profiles")
    .update({ name, gems, gender, is_hidden: isHidden })
    .eq("id", editingUserId);

  if (pErr) return toast("خطأ في تحديث البيانات ❌");

  const progInputs = document.querySelectorAll(".edit-prog-input");
  for (const input of progInputs) {
    const cid = input.dataset.cid;
    const score = parseInt(input.value) || 0;
    const pid = editingUserId + "_" + cid;
    await db.from("progress").upsert({
      id: pid,
      user_id: editingUserId,
      challenge_id: cid,
      score: score,
    });
    state.progress[pid] = score;
  }

  toast("تم تحديث بيانات المستخدم بنجاح ✓");
  closeModal("m-edit-user");
  load();
}

async function addBadge() {
  const icon = document.getElementById("nb-icon").value;
  const title = document.getElementById("nb-title").value;
  const target = parseInt(document.getElementById("nb-target").value);
  if (!icon || !title || !target) return alert("أكمل بيانات الوسام");
  const newBadge = { id: "b" + Date.now(), name: title, icon: icon, target: target };

  await db.from("badges").insert([newBadge]);
  state.badges.push(newBadge);

  document.getElementById("nb-icon").value = "";
  document.getElementById("nb-title").value = "";
  document.getElementById("nb-target").value = "";
  save();
  syncAdmin();
  toast("تمت إضافة الوسام بنجاح 🏅");
}

async function deleteBadge(id) {
  if (!confirm("حذف الوسام؟")) return;
  await db.from("badges").delete().eq("id", id);
  state.badges = state.badges.filter((b) => b.id !== id);
  save();
  syncAdmin();
}

async function saveDailyMsg() {
  state.dailyMsg = document.getElementById("admin-daily-msg").value;
  await db
    .from("app_settings")
    .upsert({ key: "daily_msg", value: state.dailyMsg });
  save();
  toast("تم نشر الرسالة ");
  syncDash();
}

function viewUserBehavior(uid) {
  navTo("s-history");
  syncHistory(uid);
}

async function deleteUser(uid) {
  if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذه الخطوة.")) return;
  
  toast("جاري حذف المستخدم... ⏳");
  
  // Note: We only delete from the profiles table here. 
  // In a real app, you might also want to delete from auth.users (requires service role or admin).
  // But our schema has CASCADE on most tables, so this will clean up progress/logs/etc.
  const { error } = await db.from("profiles").delete().eq("id", uid);
  if (error) {
    console.error("Delete user error:", error);
    return toast("فشل حذف المستخدم ❌");
  }

  state.users = state.users.filter(u => u.id !== uid);
  save();
  syncAdmin();
  toast("تم حذف المستخدم بنجاح 🗑️");
}

async function toggleChecklistItem(cid, itemId, completed) {
  if (!state.currentUser) return;
  
  const chal = state.challenges.find(c => c.id === cid);
  if (!chal) return console.error("Challenge not found:", cid);
  const item = chal.checklist_data?.find(i => i.id === itemId);
  if (!item) return console.error("Item not found:", itemId);
  
  const uid = state.currentUser.id;
  const msgEl = document.getElementById("confirm-task-msg");
  const btnYes = document.getElementById("btn-confirm-task-yes");
  const modal = document.getElementById("m-confirm-task");

  if (completed) {
    // Show confirmation for CHECKING
    msgEl.innerHTML = `هل أكملت مهمة "<b>${item.text}</b>" لهذا اليوم؟`;
    btnYes.innerHTML = "نعم، أتممته بنجاح ✅";
    btnYes.style.background = "var(--accent)"; // Green/Success
    openModal("m-confirm-task");
    
    btnYes.onclick = async () => {
      closeModal("m-confirm-task");
      const { error } = await db.from("checklist_progress").insert([{
        user_id: uid,
        challenge_id: cid,
        item_id: itemId
      }]);
      if (!error) {
         state.checklistProgress.push({ user_id: uid, challenge_id: cid, item_id: itemId });
         toast("تم تأكيد الإنجاز بنجاح ✨");
         save();
         syncDash();
      } else {
        toast("حدث خطأ أثناء التأكيد ❌");
        syncDash();
      }
    };
  } else {
    // Show confirmation for UNCHECKING
    msgEl.innerHTML = `تم تأكيد هذه المهمة مسبقاً.<br>هل أنت متأكد أنك تريد <b>إلغاء</b> الإنجاز لـ "${item.text}"؟`;
    btnYes.innerHTML = "نعم، أريد إلغاء الإنجاز 🗑️";
    btnYes.style.background = "var(--danger)"; // Red/Danger
    openModal("m-confirm-task");

    btnYes.onclick = async () => {
      closeModal("m-confirm-task");
      const { error } = await db.from("checklist_progress").delete()
        .eq("user_id", uid)
        .eq("challenge_id", cid)
        .eq("item_id", itemId);
      if (!error) {
         state.checklistProgress = state.checklistProgress.filter(p => !(p.user_id === uid && p.challenge_id === cid && p.item_id === itemId));
         toast("تم إلغاء الإنجاز");
         save();
         syncDash();
      } else {
         toast("حدث خطأ أثناء الإلغاء ❌");
         syncDash();
      }
    };
  }

  // Common Observer for closing without confirming
  const observer = new MutationObserver(() => {
      if (modal.style.display === "none") {
          syncDash(); // Re-render to ensure checkbox matches state
          observer.disconnect();
      }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['style'] });
}
