-- 1. جدول الحسابات الشخصية (Profiles)
-- مرتبط بجدول auth.users الخاص بـ Supabase
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    gems INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- دالة (Trigger) لإنشاء ملف شخصي تلقائياً عند تسجيل مستخدم جديد في Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, is_admin)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 
        NEW.email,
        NOT EXISTS (SELECT 1 FROM public.profiles) -- جعل أول حساب يسجل هو المدير تلقائياً
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. جدول التحديات (Challenges)
CREATE TABLE challenges (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    goal BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    duration_days INTEGER DEFAULT 0,
    end_date TIMESTAMPTZ,
    participants UUID[] DEFAULT '{}', -- مصفوفة من ID المستخدمين (UUID)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. جدول التقدم (Progress)
CREATE TABLE progress (
    id TEXT PRIMARY KEY, -- التنسيق: user_id_challenge_id
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id TEXT REFERENCES challenges(id) ON DELETE CASCADE,
    score BIGINT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

-- 4. جدول السجلات (Logs)
CREATE TABLE logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id TEXT REFERENCES challenges(id),
    type TEXT NOT NULL, -- manual or subha
    amount INTEGER NOT NULL,
    date_text TEXT, -- التاريخ كـ نص للتوافق مع العرض الحالي
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. جدول الأوسمة (Badges)
CREATE TABLE badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    target BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. إعدادات التطبيق (رسالة اليوم)
CREATE TABLE app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- إضافة بيانات افتراضية للبدء
INSERT INTO app_settings (key, value) VALUES ('daily_msg', 'أهلاً بك في تطبيق مليون استغفار');

