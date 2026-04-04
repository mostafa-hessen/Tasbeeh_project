/**
 * STATE MODULE
 * Handles localStorage, syncing data with Supabase, and core state operations.
 */

function save() {
  if (!state.currentUser) {
    localStorage.removeItem("million_v19_offline");
    return;
  }

  const myId = state.currentUser.id;

  // Filter progress for current user
  const myProgress = {};
  for (const k in state.progress) {
    if (k.startsWith(myId + "_")) {
      myProgress[k] = state.progress[k];
    }
  }

  // Filter logs for current user
  const myLogs = state.logs.filter(
    (l) => l.userId === myId || l.user_id === myId
  );

  const saveData = {
    currentUser: state.currentUser,
    currentChallengeId: state.currentChallengeId,
    subGoal: state.subGoal,
    soundOn: state.soundOn,
    pendingActions: state.pendingActions,
    progress: state.progress,
    myLogs: myLogs,
    challenges: state.challenges,
    users: state.users,
    badges: state.badges,
    checklistProgress: state.checklistProgress,
  };

  localStorage.setItem("million_v19_offline", JSON.stringify(saveData));
}

async function load() {
  // Offline-first: Load from local storage
  const localData = localStorage.getItem("million_v19_offline");
  if (localData) {
    try {
      const parsed = JSON.parse(localData);

      if (parsed.currentUser) {
        state.currentUser = parsed.currentUser;
        state.currentChallengeId = parsed.currentChallengeId || "";
        state.subGoal = parsed.subGoal || 33;
        state.soundOn = parsed.soundOn !== undefined ? parsed.soundOn : true;
        state.pendingActions = parsed.pendingActions || [];

        if (parsed.progress) {
          state.progress = { ...parsed.progress };
        } else if (parsed.myProgress) {
          state.progress = { ...parsed.myProgress };
        }

        if (parsed.myLogs) state.logs = parsed.myLogs;
        if (parsed.challenges) state.challenges = parsed.challenges;
        if (parsed.users) state.users = parsed.users;
        if (parsed.badges) state.badges = parsed.badges;
        if (parsed.checklistProgress) state.checklistProgress = parsed.checklistProgress;

        // UI immediate update from cache
        if (typeof syncDash === "function") syncDash();
        if (typeof syncTasbih === "function") syncTasbih();
        if (typeof syncHonor === "function") syncHonor();
        if (typeof syncProfile === "function") syncProfile();
        if (typeof syncBadges === "function") syncBadges();

        go("s-dash");
      }
    } catch (e) {
      console.error("Local load failed:", e);
    }
  }

  if (!navigator.onLine) {
    document.getElementById("offline-screen").style.display = "flex";
    return;
  }

  if (state.currentUser) {
    if (state.challenges.length === 0) {
      showSkeletons();
    } else {
      syncDash();
      syncTasbih();
    }
  }

  try {
    const {
      data: { session },
    } = await db.auth.getSession();
    const myId = session?.user?.id;

    let myProfile = null;
    if (myId) {
      const { data } = await db
        .from("profiles")
        .select("*")
        .eq("id", myId)
        .single();
      myProfile = data;
    }

    const isAdmin = myProfile?.is_admin || false;
    const profileCols = isAdmin ? "*" : "id, name, avatar_url, gender";

    const [u, c, p, b, settings, cp] = await Promise.all([
      db.from("profiles").select(profileCols),
      db
        .from("challenges")
        .select("id, title, goal, is_active, participants, start_date, end_date, phrase, type, checklist_data, created_at, target_gender"),
      db.from("progress").select("id, user_id, challenge_id, score"),
      db.from("badges").select("id, name, icon, target"),
      db.from("app_settings").select("key, value"),
      db.from("checklist_progress").select("user_id, challenge_id, item_id")
    ]);

    if (u.data) {
      if (myId && state.pendingActions.length > 0) {
        const localMe = state.users.find((ux) => ux.id === myId);
        if (localMe && myProfile) {
          myProfile.gems = localMe.gems;
        }
      }
      state.users = u.data;
      if (myProfile && !isAdmin) {
        const myIdx = state.users.findIndex((ux) => ux.id === myId);
        if (myIdx !== -1) {
          state.users[myIdx] = { ...state.users[myIdx], ...myProfile };
        } else {
          state.users.push(myProfile);
        }
      }
    }

    if (c.data) state.challenges = c.data;
    if (p.data) {
      p.data.forEach((item) => {
        const key = item.user_id + "_" + item.challenge_id;
        state.progress[key] = item.score;
        if (item.id && item.id !== key) state.progress[item.id] = item.score;
      });
    }

    if (myId) {
      state.pendingActions.forEach((act) => {
        const k = myId + "_" + act.cid;
        state.progress[k] = (state.progress[k] || 0) + act.amount;
      });
    }

    if (b.data) state.badges = b.data;
    if (settings.data) {
      const msg = settings.data.find((x) => x.key === "daily_msg");
      if (msg) state.dailyMsg = msg.value;
    }

    if (cp.data) {
      state.checklistProgress = cp.data;
    } else {
      state.checklistProgress = [];
    }

    if (session) {
      state.currentUser = state.users.find((ux) => ux.id === session.user.id);
      if (state.currentUser) {
        let logQuery = db
          .from("logs")
          .select("id, user_id, challenge_id, type, amount, date_text")
          .order("created_at", { ascending: false })
          .limit(100);
        if (!state.currentUser.is_admin)
          logQuery = logQuery.eq("user_id", state.currentUser.id);

        const { data: lData } = await logQuery;
        if (lData) {
          const serverLogs = lData.map((log) => ({
            ...log,
            id: log.id,
            userId: log.user_id,
            challengeId: log.challenge_id,
            type: log.type,
            amount: log.amount,
            date: log.date_text,
          }));
          const pendingLogs = state.logs.filter((l) => l.is_pending);
          state.logs = [...pendingLogs, ...serverLogs];
        }
        save();
        go("s-dash");
      } else {
        setTimeout(load, 2000);
      }
    } else {
      go("s-login");
    }
    setupRealtime();
  } catch (err) {
    console.error("Supabase failed:", err);
    if (!state.currentUser) toast("خطأ في الاتصال ❌");
  }
}

async function syncPending() {
  if (!navigator.onLine || state.pendingActions.length === 0) return;

  if (state.isSyncing || syncLockPromise) return syncLockPromise;

  syncLockPromise = (async () => {
    state.isSyncing = true;
    syncDash();

    try {
      while (state.pendingActions.length > 0) {
        const act = state.pendingActions[0];

        if (act.lastTry && Date.now() - act.lastTry < 5000) break;
        act.lastTry = Date.now();

        const k = state.currentUser.id + "_" + act.cid;

        await db.from("logs").insert([
          {
            user_id: state.currentUser.id,
            challenge_id: act.cid,
            type: act.type === "save" ? "subha" : "manual",
            amount: act.amount,
            date_text: act.dateText,
          },
        ]);

        const { data: currentSrv } = await db
          .from("progress")
          .select("score")
          .eq("id", k)
          .maybeSingle();
        const serverBase = currentSrv ? currentSrv.score : 0;
        const newTotal = serverBase + act.amount;

        await db.from("progress").upsert({
          id: k,
          user_id: state.currentUser.id,
          challenge_id: act.cid,
          score: newTotal,
        });

        state.progress[k] = newTotal;

        await db
          .from("profiles")
          .update({ gems: state.currentUser.gems })
          .eq("id", state.currentUser.id);

        const syncedActionId = state.pendingActions[0].id;
        const logItem = state.logs.find(
          (l) => l.is_pending && l.id === syncedActionId
        );
        if (logItem) delete logItem.is_pending;

        state.pendingActions.shift();
        save();
      }
    } catch (e) {
      console.error("Sync error:", e);
      if (state.pendingActions.length > 0) {
        const currentAct = state.pendingActions[0];
        currentAct.retryCount = (currentAct.retryCount || 0) + 1;
        if (currentAct.retryCount >= 3) {
          toast("فشل مزامنة بعض البيانات بعد 3 محاولات ⚠️");
          state.pendingActions.shift();
          save();
        } else {
          toast(
            `فشل المزامنة.. سنحاول مرة أخرى قريباً (محاولة ${currentAct.retryCount})`
          );
        }
      }
    } finally {
      state.isSyncing = false;
      syncDash();
    }
  })();

  try {
    await syncLockPromise;
  } finally {
    syncLockPromise = null;
  }
}

function autoSaveSess() {
  localStorage.setItem(
    "_autoSess",
    JSON.stringify({
      count: sessCount,
      chalId: state.currentChallengeId,
    })
  );
}

function restoreAutoSess() {
  const d = localStorage.getItem("_autoSess");
  if (d) {
    const o = JSON.parse(d);
    sessCount = o.count || 0;
    if (o.chalId) state.currentChallengeId = o.chalId;
  }
}

function getTotal(uid) {
  let t = 0;
  state.challenges.forEach((c) => {
    if (c.participants.includes(uid))
      t += state.progress[uid + "_" + c.id] || 0;
  });
  return t;
}
