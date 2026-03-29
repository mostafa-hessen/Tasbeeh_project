/**
 * MAIN MODULE
 * Entry point of the application. Registers service workers and initializes data.
 */

function setupRealtime() {
  if (realtimeChannel) return;
  realtimeChannel = db
    .channel("public:all")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "progress" },
      (payload) => {
        if (payload.new) {
          state.progress[payload.new.id] = payload.new.score;
          if (document.getElementById("s-dash").classList.contains("active"))
            syncDash();
          if (document.getElementById("s-honor").classList.contains("active"))
            syncHonor();
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      (payload) => {
        if (payload.new && payload.new.key === "daily_msg") {
          state.dailyMsg = payload.new.value;
          if (document.getElementById("s-dash").classList.contains("active"))
            syncDash();
        }
      }
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "challenges" },
      () => {
        load();
      }
    )
    .subscribe();
}

// Initial authentication setup
db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") {
    load().then(() => {
      if (navigator.onLine) syncPending();
    });
  }
  if (event === "SIGNED_OUT") {
    state.currentUser = null;
    go("s-login");
  }
});

// Event Listeners for Keyboard
document.addEventListener("keydown", (e) => {
  if (
    (e.code === "Space" || e.code === "Enter") &&
    document.getElementById("s-tasbih")?.classList.contains("active")
  ) {
    e.preventDefault();
    tapSubha();
  }
});

// Watch Network connectivity
window.addEventListener("online", () => {
  const offlineScreen = document.getElementById("offline-screen");
  if (offlineScreen) offlineScreen.style.display = "none";
  toast("تم استعادة الاتصال 📶");
  syncPending();
});

window.addEventListener("offline", () => {
  const offlineScreen = document.getElementById("offline-screen");
  if (offlineScreen) offlineScreen.style.display = "flex";
  toast("انقطع الاتصال.. يجب الاتصال بالإنترنت 📡");
});

// App installation logic
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.style.display = "block";
});

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;
  const btn = document.getElementById("pwa-install-btn");
  if (btn) btn.style.display = "none";
}

// Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => console.log("SW Registered"))
      .catch((err) => console.log("SW Failed"));
  });
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  if (state.soundOn === undefined) state.soundOn = true;
  restoreAutoSess();

  // IOS instructions
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  if (isIOS && !isStandalone) {
    const msg = document.getElementById("ios-install-msg");
    if (msg) msg.style.display = "block";
  }

  load().then(() => {
    if (navigator.onLine) syncPending();
  });
});
