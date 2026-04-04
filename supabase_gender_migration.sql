-- إضافة الأعمدة الجديدة للجداول
-- 1. إضافة جنس المستخدم في جدول البروفايلات
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female'));
-- 2. إضافة الفئة المستهدفة في جدول التحديات
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_gender TEXT DEFAULT 'both' CHECK (target_gender IN ('male', 'female', 'both'));

-- تحديث دالة التعامل مع المستخدم الجديد لتخزين الجنس من الـ Metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() -- تم تصحيح هذا السطر بإضافة CREATE
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url, gender, is_admin)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'gender', 'male'), -- جلب الجنس من الميتا داتا
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, false) -- جلب حالة الأدمين
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف السياسات القديمة التي تسبب تكرار (Infinite Recursion)
DROP POLICY IF EXISTS "رؤية الملفات الشخصية حسب الجنس" ON profiles;
DROP POLICY IF EXISTS "تحديث الملف الشخصي للنفس أو الأدمين" ON profiles;
DROP POLICY IF EXISTS "رؤية التحديات حسب الجنس" ON challenges;

-- تفعيل الأمان (RLS) للجداول
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- 1. سياسة رؤية الملفات الشخصية (تعتمد على الميتا داتا لتجنب التكرار)
CREATE POLICY "رؤية الملفات الشخصية حسب الجنس" ON profiles FOR SELECT 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR -- الأدمين يرى الكل
    gender = (auth.jwt() -> 'user_metadata' ->> 'gender') OR      -- رؤية نفس الجنس
    id = auth.uid() OR                                            -- رؤية ملفي الشخصي
    is_admin = true                                               -- رؤية ملفات الأدمنز
);

-- 2. سياسة تحديث الملف الشخصي
CREATE POLICY "تحديث الملف الشخصي للنفس أو الأدمين" ON profiles FOR UPDATE
USING (
    id = auth.uid() OR 
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
);

-- 3. سياسة رؤية التحديات (خاصة بالجنس المختار)
CREATE POLICY "رؤية التحديات حسب الجنس" ON challenges FOR SELECT 
USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR 
    target_gender = 'both' OR 
    target_gender = (auth.jwt() -> 'user_metadata' ->> 'gender')
);

-- 4. سياسة رؤية التقدم (Progress) - تتبع رؤية التحدي والبروفايل
DROP POLICY IF EXISTS "رؤية التقدم حسب التحدي والجنس" ON progress;
CREATE POLICY "رؤية التقدم حسب التحدي والجنس" ON progress FOR SELECT
USING (
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true OR
    EXISTS (
        SELECT 1 FROM challenges WHERE id = challenge_id
    )
);
