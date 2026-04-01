-- 1. Insert Demo Profiles (Password for all: 'password123')
-- Note: These should be created via Supabase Auth first if you want to log in, 
-- but you can manually link them in the profiles table for UI demonstration.

-- 2. Insert Classes
INSERT INTO public.classes (id, name, level, status, start_date, end_date, schedule)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'IELTS Foundation A', 'Foundation', 'Active', '2026-01-01', '2026-06-01', 'Mon/Wed/Fri 08:00-10:00'),
    ('c2222222-2222-2222-2222-222222222222', 'IELTS Intensive B', 'Intensive', 'Active', '2026-02-01', '2026-05-01', 'Tue/Thu 18:00-21:00');

-- 3. Insert Students
INSERT INTO public.students (id, full_name, email, current_band, target_band, status, class_id, start_date)
VALUES 
    (gen_random_uuid(), 'Alice Nguyen', 'alice@example.com', 5.5, 7.0, 'Active', 'c1111111-1111-1111-1111-111111111111', '2026-01-10'),
    (gen_random_uuid(), 'Bob Tran', 'bob@example.com', 6.0, 7.5, 'Active', 'c1111111-1111-1111-1111-111111111111', '2026-01-12'),
    (gen_random_uuid(), 'Charlie Le', 'charlie@example.com', 6.5, 8.0, 'Active', 'c2222222-2222-2222-2222-222222222222', '2026-02-15'),
    (gen_random_uuid(), 'Diana Pham', 'diana@example.com', 5.0, 6.5, 'Active', 'c2222222-2222-2222-2222-222222222222', '2026-02-18');

-- 4. Insert Attendance for the last 5 days
DO $$
DECLARE
    s_id UUID;
    c_id UUID;
    d DATE;
BEGIN
    FOR s_id, c_id IN SELECT id, class_id FROM public.students LOOP
        FOR i IN 0..4 LOOP
            d := CURRENT_DATE - i;
            INSERT INTO public.attendance (student_id, class_id, date, status)
            VALUES (s_id, c_id, d, (ARRAY['Present', 'Present', 'Present', 'Late', 'Absent'])[floor(random()*5)+1]::attendance_status);
        END LOOP;
    END LOOP;
END $$;

-- 5. Insert Homework
INSERT INTO public.homework (id, title, description, class_id, skill_category, due_date)
VALUES 
    ('h1111111-1111-1111-1111-111111111111', 'Listening Practice 01', 'Complete the mock test in Section 1 of the workbook.', 'c1111111-1111-1111-1111-111111111111', 'Listening', CURRENT_DATE + 3),
    ('h2222222-2222-2222-2222-222222222222', 'Writing Task 1 Essay', 'Describe the trends depicted in the provided bar chart.', 'c2222222-2222-2222-2222-222222222222', 'Writing', CURRENT_DATE + 5);

-- 6. Insert Test Results for Charts
DO $$
DECLARE
    s_id UUID;
    t_id UUID;
BEGIN
    -- Create a mock test
    INSERT INTO public.tests (id, title, class_id, date, skills_assessed)
    VALUES ('t1111111-1111-1111-1111-111111111111', 'Mid-term Mock Exam', 'c1111111-1111-1111-1111-111111111111', CURRENT_DATE - 7, ARRAY['Listening', 'Reading', 'Writing', 'Speaking']::skill_category[]);

    INSERT INTO public.tests (id, title, class_id, date, skills_assessed)
    VALUES ('t2222222-2222-2222-2222-222222222222', 'Mid-term Mock Exam', 'c2222222-2222-2222-2222-222222222222', CURRENT_DATE - 7, ARRAY['Listening', 'Reading', 'Writing', 'Speaking']::skill_category[]);

    -- Results for Class 1
    FOR s_id IN SELECT id FROM public.students WHERE class_id = 'c1111111-1111-1111-1111-111111111111' LOOP
        INSERT INTO public.test_results (test_id, student_id, listening, reading, writing, speaking, overall)
        VALUES ('t1111111-1111-1111-1111-111111111111', s_id, 6.5, 7.0, 6.0, 6.5, 6.5);
    END LOOP;

    -- Results for Class 2
    FOR s_id IN SELECT id FROM public.students WHERE class_id = 'c2222222-2222-2222-2222-222222222222' LOOP
        INSERT INTO public.test_results (test_id, student_id, listening, reading, writing, speaking, overall)
        VALUES ('t2222222-2222-2222-2222-222222222222', s_id, 5.5, 6.0, 5.0, 5.5, 5.5);
    END LOOP;
END $$;
