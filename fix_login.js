const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.html');

try {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Add Name and Gender inputs right after <section id="s-login">
  const sLoginTag = '<section id="s-login" class="screen active" style="padding-top: 60px">';
  const newInputs = `
          <input type="text" id="signup-name" class="input-field hidden" placeholder="الاسم الكريم / اللقب" />
          <select id="signup-gender" class="input-field hidden" style="margin-top: 15px; margin-bottom: 15px; height: 55px; width: 100%; background: rgba(255,255,255,0.05); color: white; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 0 15px;">
            <option value="" style="color: black">اختر الجنس...</option>
            <option value="male" style="color: black">ذكر</option>
            <option value="female" style="color: black">أنثى</option>
          </select>`;
          
  if (content.includes(sLoginTag) && !content.includes('id="signup-name"')) {
    content = content.replace(sLoginTag, sLoginTag + newInputs);
  }

  // Fix 2: Fix the broken closing tag and add the toggle and button
  const brokenTag = '</section>handleSignup()"';
  const fixedTag = `          <div id="toggle-auth-text" onclick="toggleAuthMode()" style="color:var(--primary); cursor:pointer; margin: 20px 0; font-size: 0.95rem; text-align:center; font-weight: bold; text-decoration: underline;">ليس لديك حساب؟ سجل الآن</div>
          <button id="btn-signup-action" class="btn-royal hidden" onclick="handleSignup()">`;

  if (content.includes(brokenTag)) {
    content = content.replace(brokenTag, fixedTag);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log("✅ تم إصلاح صفحة إنشاء الحساب بنجاح! يمكنك الآن تجربة المشروع.");
} catch (e) {
  console.error("❌ حدث خطأ أثناء تعديل الملف:", e);
}
