-- 1. Initialize Enums
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'ta');
CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Excused');
CREATE TYPE class_status AS ENUM ('Active', 'Inactive');
CREATE TYPE student_status AS ENUM ('Active', 'Completed', 'Paused', 'Withdrawn');
CREATE TYPE homework_status AS ENUM ('Draft', 'Assigned', 'Closed');
CREATE TYPE submission_status AS ENUM ('Submitted', 'Missing', 'Late', 'Reviewed');
CREATE TYPE skill_category AS ENUM ('Listening', 'Reading', 'Writing', 'Speaking', 'General');

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'teacher',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    level TEXT,
    status class_status DEFAULT 'Active',
    start_date DATE,
    end_date DATE,
    schedule TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Join table for Teachers/TAs and Classes
CREATE TABLE IF NOT EXISTS public.class_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    assigned_role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, class_id)
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    current_band NUMERIC(2,1),
    target_band NUMERIC(2,1),
    status student_status DEFAULT 'Active',
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    notes TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tracking Tables
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status DEFAULT 'Present',
    marked_by_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    skill_category skill_category DEFAULT 'General',
    status homework_status DEFAULT 'Assigned',
    due_date TIMESTAMPTZ,
    assigned_by_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homework_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    homework_id UUID REFERENCES public.homework(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    status submission_status DEFAULT 'Submitted',
    score NUMERIC(5,2),
    band NUMERIC(2,1),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    marked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE,
    skills_assessed skill_category[] DEFAULT '{}',
    max_score NUMERIC(5,2) DEFAULT 100.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    listening NUMERIC(2,1),
    reading NUMERIC(2,1),
    writing NUMERIC(2,1),
    speaking NUMERIC(2,1),
    overall NUMERIC(2,1),
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Utility Functions and Triggers
-- Updated_at Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_classes_updated BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_students_updated BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auth to Profile Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'teacher'));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Row Level Security Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.has_class_access(target_class_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    ) OR (
        EXISTS (
            SELECT 1 FROM public.class_staff_assignments
            WHERE profile_id = auth.uid() AND class_id = target_class_id
        )
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

-- Profiles: Users can see all profiles (for tagging/assignment), but only admins can edit or create.
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins can edit profiles" ON public.profiles FOR UPDATE USING (public.get_user_role() = 'admin');

-- Classes: viewable if assigned or admin
CREATE POLICY "Classes viewable by assigned staff or admin" ON public.classes FOR SELECT
USING (public.has_class_access(id));
CREATE POLICY "Only admins can create/delete classes" ON public.classes FOR ALL
USING (public.get_user_role() = 'admin');

-- Assignments: only admins manage assignments
CREATE POLICY "Assignments viewable by authenticated users" ON public.class_staff_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Only admins manage assignments" ON public.class_staff_assignments FOR ALL USING (public.get_user_role() = 'admin');

-- Students: viewable/manageable if staff has access to their class
CREATE POLICY "Students access by class staff or admin" ON public.students FOR ALL
USING (public.has_class_access(class_id));

-- Attendance: access by class staff or admin
CREATE POLICY "Attendance access by class staff or admin" ON public.attendance FOR ALL
USING (public.has_class_access(class_id));

-- Homework: access by class staff or admin
CREATE POLICY "Homework access by class staff or admin" ON public.homework FOR ALL
USING (public.has_class_access(class_id));

-- Submissions: accessible via homework's class
CREATE POLICY "Submissions access by class staff or admin" ON public.homework_submissions FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id = homework_id AND public.has_class_access(h.class_id)
));

-- Tests and Results: same logic
CREATE POLICY "Tests access by class staff or admin" ON public.tests FOR ALL
USING (public.has_class_access(class_id));

CREATE POLICY "Test results access by class staff or admin" ON public.test_results FOR ALL
USING (EXISTS (
    SELECT 1 FROM public.tests t
    WHERE t.id = test_id AND public.has_class_access(t.class_id)
));

-- 8. Helper Views for Dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM students WHERE status = 'Active') as active_students,
    (SELECT COUNT(*) FROM classes WHERE status = 'Active') as active_classes,
    (SELECT AVG(overall) FROM test_results) as average_band_score;
