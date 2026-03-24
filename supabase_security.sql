-- 1. تفعيل نظام RLS لكل الجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 2. سياسة الأمان لجداول التحديات (Challenges)
-- الجميع يمكنهم القراءة
CREATE POLICY "الجميع يمكنهم رؤية التحديات" ON challenges FOR SELECT USING (true);
-- المدير فقط يمكنه التحكم الكامل
CREATE POLICY "المدير فقط يتحكم بالتحديات" ON challenges FOR ALL 
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );


-- الجميع يرى الملفات العامة (الاسم والأفاتار) للأعضاء غير المخفيين
CREATE POLICY "رؤية الملفات الشخصية" ON profiles FOR SELECT 
USING (
    is_hidden = false OR 
    auth.uid() = id OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
-- المستخدم يعدل بياناته أو المدير يعدل للكل
CREATE POLICY "تعديل الملف الشخصي" ON profiles FOR UPDATE
USING ( auth.uid() = id OR (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );
-- المدير فقط يمكنه الحذف
CREATE POLICY "المدير يحذف الحسابات" ON profiles FOR DELETE
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );


-- 4. سياسة الأمان للسجلات (Logs)
-- المستخدم يرى سجلاته فقط، والمدير يرى كل شيء للمتابعة
CREATE POLICY "رؤية السجلات" ON logs FOR SELECT 
USING ( 
    auth.uid() = user_id OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
);

CREATE POLICY "المستخدم يضيف لنفسه والمدير للكل" ON logs FOR INSERT 
WITH CHECK ( 
    auth.uid() = user_id OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
);


-- 5. سياسة الأمان للتقدم (Progress)
CREATE POLICY "الجميع يرى التقدم" ON progress FOR SELECT USING (true);
CREATE POLICY "المستخدم والمدير يعدلون التقدم" ON progress FOR ALL
USING ( 
    auth.uid() = user_id OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
);


-- 6. سياسة الأمان للإعدادات (Settings)
CREATE POLICY "الجميع يرى الإعدادات" ON app_settings FOR SELECT USING (true);
CREATE POLICY "المدير فقط يغير الإعدادات" ON app_settings FOR ALL 
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );

-- 7. سياسة الأمان للأوسمة (Badges)
CREATE POLICY "الجميع يرى الأوسمة" ON badges FOR SELECT USING (true);
CREATE POLICY "المدير فقط يدير الأوسمة" ON badges FOR ALL 
USING ( (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true );

-- 8. سياسة الأمان لتخزين الصور (Storage / avatars bucket)
-- ملاحظة: يجب إنشاء bucket باسم avatars أولاً
CREATE POLICY "الصور العامة للجميع"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

CREATE POLICY "المستخدم يرفع صورته الخاصة"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "المستخدم يمسح صورته القديمة"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);
