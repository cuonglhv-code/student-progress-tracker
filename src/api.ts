import { AppData, Student, Attendance, Homework, Test, TestResult, HomeworkSubmission, Class, User } from './types';
import { supabase } from './lib/supabaseClient';
import { classService } from './services/classes';
import { studentService } from './services/students';
import { attendanceService } from './services/attendance';
import { homeworkService } from './services/homework';
import { testService } from './services/tests';
import { dashboardService } from './services/dashboard';

/**
 * Backward compatibility wrapper for existing UI components.
 * New code should prefer using specific services or hooks.
 */
export const api = {
  async getData(): Promise<AppData> {
    const [
      { data: profiles },
      students,
      classes,
      stats
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      studentService.getAllStudents(),
      classService.getAllClasses(),
      dashboardService.getStats()
    ]);

    // Fetch tracking data (potentially large, ideally this should be paginated/filtered in UI)
    const [attendance, homework, submissions, tests, testResults] = await Promise.all([
      supabase.from('attendance').select('*'),
      supabase.from('homework').select('*'),
      supabase.from('homework_submissions').select('*'),
      supabase.from('tests').select('*'),
      supabase.from('test_results').select('*')
    ]);

    const session = await supabase.auth.getSession();
    const currentUserProfile = profiles?.find(p => p.id === session.data.session?.user.id);

    return {
      currentUser: currentUserProfile as unknown as User,
      users: (profiles || []) as unknown as User[],
      students: students as unknown as Student[],
      classes: classes as unknown as Class[],
      attendance: (attendance.data || []) as unknown as Attendance[],
      homework: (homework.data || []) as unknown as Homework[],
      homeworkSubmissions: (submissions.data || []) as unknown as HomeworkSubmission[],
      tests: (tests.data || []) as unknown as Test[],
      testResults: (testResults.data || []) as unknown as TestResult[],
      config: {
        hasGoogleSheets: false,
        sheetTitle: 'Supabase Production'
      }
    };
  },

  async addStudent(student: Omit<Student, 'id'>) {
    return studentService.createStudent(student as any);
  },

  async addClass(cls: Omit<Class, 'id'>) {
    return classService.createClass(cls as any);
  },

  async markAttendance(records: any) {
    return attendanceService.markAttendance(Array.isArray(records) ? records : [records]);
  },

  async assignHomework(homework: any) {
    return homeworkService.createHomework(homework);
  },

  async markHomework(submission: any) {
    return homeworkService.submitGrade(submission.id, submission);
  },

  async assignTest(test: any) {
    return testService.createTest(test);
  },

  async enterTestResult(result: any) {
    return testService.enterResult(result);
  }
};
