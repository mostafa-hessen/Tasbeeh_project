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
  document
    .getElementById("signup-name")
    .classList.toggle("hidden", !isSignupMode);
  document
    .getElementById("btn-login-action")
    .classList.toggle("hidden", isSignupMode);
  document
    .getElementById("btn-signup-action")
    .classList.toggle("hidden", !isSignupMode);
  document.getElementById("toggle-auth-text").innerText = isSignupMode
    ? "لديك حساب بالفعل؟ سجل دخول"
    : "ليس لديك حساب؟ سجل الآن";

  const passInput = document.getElementById("login-pass");
  passInput.autocomplete = isSignupMode ? "new-password" : "current-password";
}

async function handleSignup() {
  const name = document.getElementById("signup-name").value.trim();
  const email = document.getElementById("login-id").value.trim();
  const password = document.getElementById("login-pass").value.trim();

  if (!name || !email || !password) return toast("يرجى ملء جميع الخانات");

  const btn = document.getElementById("btn-signup-action");
  const originalText = btn.innerText;

  try {
    btn.innerText = "جاري إنشاء الحساب... ⏳";
    btn.disabled = true;

    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: {
        data: { name: name },
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
