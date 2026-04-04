-- ==========================================
-- مشروع "مليون استغفار" - التنسيق النهائي لقاعدة البيانات (V19)
-- إعداد: Antigravity AI
-- يجمع هذا الملف: الجداول، الدوال، وسياسات الحماية (RLS) لمنع التكرار اللانهائي
-- ==========================================

-- 1. جدول الحسابات الشخصية (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    gems INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. جدول التحديات (Challenges)
CREATE TABLE IF NOT EXISTS public.challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    goal BIGINT NOT NULL,
    phrase TEXT DEFAULT 'أستغفر الله',
    type TEXT DEFAULT 'count', -- count or checklist
    checklist_data JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    target_gender TEXT DEFAULT 'both' CHECK (target_gender IN ('male', 'female', 'both')),
    duration_days INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    timezone TEXT DEFAULT 'Africa/Cairo',
    participants UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول التقدم التقليدي (Progress)
CREATE TABLE IF NOT EXISTS public.progress (
    id TEXT PRIMARY KEY, -- user_id_challenge_id
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE,
    score BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 4. جدول تقدم المهام (Checklist Progress)
CREATE TABLE IF NOT EXISTS public.checklist_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول السجلات (Logs)
CREATE TABLE IF NOT EXISTS public.logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id TEXT REFERENCES public.challenges(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- manual or subha
    amount INTEGER NOT NULL,
    date_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. جدول الأوسمة (Badges)
CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    target BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. إعدادات التطبيق
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- ==========================================
-- الدوال المساعدة (Helper Functions)
-- ==========================================

-- دالة التحقق من الأدمن (Security Definer لتجنب التكرار)
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة الحصول على جنس المستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_my_gender()
RETURNS text AS $$
BEGIN
  RETURN (SELECT gender FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة التعامل مع المستخدم الجديد عند التسجيل
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, gender, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'gender', 'male'),
    COALESCE((new.raw_user_meta_data->>'is_admin')::boolean, (SELECT count(*) = 0 FROM public.profiles))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- تفعيل التريجر
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- سياسات الحماية (Row Level Security - RLS)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- 1. سياسات Profiles
DROP POLICY IF EXISTS "رؤية الملفات الشخصية حسب الجنس" ON profiles;
CREATE POLICY "رؤية الملفات الشخصية حسب الجنس" ON public.profiles FOR SELECT 
USING ( id = auth.uid() OR is_admin = true OR public.check_is_admin() OR gender = public.get_my_gender() );

DROP POLICY IF EXISTS "تعديل الملف الشخصي" ON profiles;
CREATE POLICY "تعديل الملف الشخصي" ON public.profiles FOR UPDATE 
USING ( id = auth.uid() OR public.check_is_admin() );

DROP POLICY IF EXISTS "حذف الملف الشخصي" ON profiles;
CREATE POLICY "حذف الملف الشخصي" ON public.profiles FOR DELETE 
USING ( public.check_is_admin() );

-- 2. سياسات Challenges
DROP POLICY IF EXISTS "رؤية التحديات حسب الجنس" ON challenges;
CREATE POLICY "رؤية التحديات حسب الجنس" ON challenges FOR SELECT 
USING ( public.check_is_admin() OR target_gender = 'both' OR target_gender = public.get_my_gender() );

DROP POLICY IF EXISTS "المدير فقط يتحكم بالتحديات" ON challenges;
CREATE POLICY "المدير فقط يتحكم بالتحديات" ON challenges FOR ALL 
USING ( public.check_is_admin() );

-- 3. سياسات Progress
DROP POLICY IF EXISTS "رؤية التقدم حسب الجنس" ON progress;
CREATE POLICY "رؤية التقدم حسب الجنس" ON progress FOR SELECT
USING ( user_id = auth.uid() OR public.check_is_admin() OR (SELECT gender FROM profiles WHERE id = user_id) = public.get_my_gender() );

DROP POLICY IF EXISTS "المستخدم والمدير يعدلون التقدم" ON progress;
CREATE POLICY "المستخدم والمدير يعدلون التقدم" ON progress FOR ALL
USING ( auth.uid() = user_id OR public.check_is_admin() );

-- 4. سياسات Logs
DROP POLICY IF EXISTS "رؤية السجلات" ON logs;
CREATE POLICY "رؤية السجلات" ON logs FOR SELECT USING ( auth.uid() = user_id OR public.check_is_admin() );

DROP POLICY IF EXISTS "المستخدم يضيف لنفسه والمدير للكل" ON logs;
CREATE POLICY "المستخدم يضيف لنفسه والمدير للكل" ON logs FOR INSERT WITH CHECK ( auth.uid() = user_id OR public.check_is_admin() );

-- 5. سياسات Checklist Progress
DROP POLICY IF EXISTS "المدير يرى كل المهام" ON checklist_progress;
CREATE POLICY "المدير يرى كل المهام" ON checklist_progress FOR ALL USING ( public.check_is_admin() );

DROP POLICY IF EXISTS "المستخدم يسجل مهامه" ON checklist_progress;
CREATE POLICY "المستخدم يسجل مهامه" ON checklist_progress FOR INSERT WITH CHECK ( auth.uid() = user_id OR public.check_is_admin() );

DROP POLICY IF EXISTS "المستخدم يعدل مهامه" ON checklist_progress;
CREATE POLICY "المستخدم يعدل مهامه" ON checklist_progress FOR DELETE USING ( auth.uid() = user_id OR public.check_is_admin() );

-- 6. سياسات Badges & Settings
CREATE POLICY "الجميع يرى الأوسمة" ON badges FOR SELECT USING (true);
CREATE POLICY "المدير يدير الأوسمة" ON badges FOR ALL USING ( public.check_is_admin() );

CREATE POLICY "الجميع يرى الإعدادات" ON app_settings FOR SELECT USING (true);
CREATE POLICY "المدير يغير الإعدادات" ON app_settings FOR ALL USING ( public.check_is_admin() );

-- ==========================================
-- إعدادات التخزين (Storage)
-- ==========================================

-- ملاحظة: يجب إنشاء bucket باسم 'avatars' يدوياً من لوحة التحكم أو بالكود
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "الصور العامة للجميع" ON storage.objects;
CREATE POLICY "الصور العامة للجميع" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "المستخدم يرفع صورته الخاصة" ON storage.objects;
CREATE POLICY "المستخدم يرفع صورته الخاصة" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );

DROP POLICY IF EXISTS "المستخدم يمسح صورته القديمة" ON storage.objects;
CREATE POLICY "المستخدم يمسح صورته القديمة" ON storage.objects FOR DELETE USING ( bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text );
