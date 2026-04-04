-- 1. إضافة حقل الجنس للملفات الشخصية
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female'));

-- 2. إضافة حقل الفئة المستهدفة للتحديات
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS target_gender TEXT DEFAULT 'male' CHECK (target_gender IN ('male', 'female', 'both'));

-- 3. تحديث سياسات الأمان (RLS) لضمان الفصل التام

-- حذف السياسات القديمة لإعادة تعريفها
DROP POLICY IF EXISTS "رؤية الملفات الشخصية" ON profiles;
DROP POLICY IF EXISTS "الجميع يمكنهم رؤية التحديات" ON challenges;
DROP POLICY IF EXISTS "الجميع يرى التقدم" ON progress;

-- سياسة رؤية الملفات الشخصية:
-- المستخدم يرى فقط من هم من نفس جنسه، أو إذا كان هو المدير يرى الكل، أو يرى ملفه الشخصي الخاص.
CREATE POLICY "رؤية الملفات الشخصية حسب الجنس" ON profiles FOR SELECT 
USING (
    auth.uid() = id OR 
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true OR
    (is_hidden = false AND gender = (SELECT gender FROM profiles WHERE id = auth.uid()))
);

-- سياسة رؤية التحديات:
-- المستخدم يرى التحديات الموجهة لجنسه أو الموجهة للكل، والمدير يرى كل التحديات.
CREATE POLICY "رؤية التحديات حسب الجنس" ON challenges FOR SELECT 
USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true OR
    target_gender = 'both' OR 
    target_gender = (SELECT gender FROM profiles WHERE id = auth.uid())
);

-- سياسة رؤية التقدم في التحديات:
-- المستخدم يرى تقدم الآخرين فقط إذا كانوا من نفس جنسه أو إذا كان هو المدير.
CREATE POLICY "رؤية التقدم حسب الجنس" ON progress FOR SELECT 
USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true OR
    user_id = auth.uid() OR
    (SELECT gender FROM profiles WHERE id = user_id) = (SELECT gender FROM profiles WHERE id = auth.uid())
);

-- 4. تعديل دالة إنشاء الملف الشخصي للتعامل مع الجنس عند التسجيل (إذا تم تمريره في metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, is_admin, gender)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
        NEW.email,
        NOT EXISTS (SELECT 1 FROM public.profiles), -- جعل أول حساب يسجل هو المدير تلقائياً
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male') -- افتراض الذكور إذا لم يحدد، أو يمكن تركها للمستخدم ليعدلها لاحقاً
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
