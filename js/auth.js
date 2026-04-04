/**
 * AUTH MODULE
 * Handles authentication flows: login, signup, and logout.
 */

async function handleLogin() {
  if (!navigator.onLine) {
    return toast(
      "لا يمكن تسجيل الدخول بدون إنترنت 📡 حاول مرة أخرى عند الاتصال."
    );
  }
  const btn = document.getElementById("btn-login-action");
  const originalText = btn.innerText;

  try {
    btn.innerText = "جاري الدخول... ⏳";
    btn.disabled = true;

    const email = document.getElementById("login-id").value.trim();
    const password = document.getElementById("login-pass").value.trim();

    const { data, error } = await db.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toast(
        "خطأ: " +
          (error.message === "Invalid login credentials"
            ? "بيانات الدخول غير صحيحة ❌"
            : error.message)
      );
    } else {
      toast("تم تسجيل الدخول بنجاح ✓");
    }
  } catch (e) {
    toast("حدث خطأ لم نتوقعه ❌");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

async function handleLogout() {
  if (navigator.onLine) {
    await db.auth.signOut();
  }
  localStorage.removeItem("million_v19_offline");
  location.reload();
}

let isSignupMode = false;
function toggleAuthMode() {
  isSignupMode = !isSignupMode;
  
  const elements = {
    "signup-name": !isSignupMode,
    "signup-gender": !isSignupMode,
    "btn-login-action": isSignupMode,
    "btn-signup-action": !isSignupMode
  };

  for (const [id, shouldHide] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle("hidden", shouldHide);
    }
  }

  const toggleText = document.getElementById("toggle-auth-text");
  if (toggleText) {
    toggleText.innerText = isSignupMode
      ? "لديك حساب بالفعل؟ سجل دخول"
      : "ليس لديك حساب؟ سجل الآن";
  }

  const passInput = document.getElementById("login-pass");
  if (passInput) {
    passInput.autocomplete = isSignupMode ? "new-password" : "current-password";
  }
}

async function handleSignup() {
  const nameEl = document.getElementById("signup-name");
  const genderEl = document.getElementById("signup-gender");
  const emailEl = document.getElementById("login-id");
  const passEl = document.getElementById("login-pass");

  if (!nameEl || !genderEl || !emailEl || !passEl) {
    return toast("عذراً، فشل في الوصول لبعض البيانات. يرجى تحديث الصفحة 🔄");
  }

  const name = nameEl.value.trim();
  const gender = genderEl.value;
  const email = emailEl.value.trim();
  const password = passEl.value.trim();

  if (!name || !gender || !email || !password) return toast("يرجى ملء جميع الخانات واختيار الجنس ⚠️");

  const btn = document.getElementById("btn-signup-action");
  if (!btn) return;
  const originalText = btn.innerText;

  try {
    btn.innerText = "جاري إنشاء الحساب... ⏳";
    btn.disabled = true;

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name: name, gender: gender },
      },
    });

    if (error) {
      toast("خطأ: " + error.message);
    } else {
      toast(
        "تم إنشاء الحساب! افحص بريدك لتأكيد التسجيل (إذا تم تفعيل التأكيد)"
      );
      if (data.user) {
        toggleAuthMode();
      }
    }
  } catch (e) {
    toast("حدث خطأ ما ❌");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
}

/**
 * Special function for Admin to create a user:
 * It logs out, goes to login screen, and toggles signup mode ON.
 */
function adminInitiateSignup() {
  db.auth.signOut().then(() => {
    // Navigate to login screen
    if (typeof go === "function") go("s-login");
    // Reset state and force signup mode
    isSignupMode = false; 
    toggleAuthMode();
    alert("تم تسجيل خروج الإدارة. يمكنك الآن إدخال بيانات المستخدم الجديد لإنشاء حسابه.");
  });
}
