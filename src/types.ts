export type UserRole = 'Admin' | 'Teacher' | 'TA';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  assignedClassIds: string[];
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  teacherId: string;
  taId: string;
  currentBand: number;
  targetBand: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Paused' | 'Withdrawn';
  notes: string;
}

export interface Class {
  id: string;
  name: string;
  level: string;
  teacherId: string;
  taId: string;
  startDate: string;
  endDate: string;
  schedule: string;
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  session: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  markedById: string;
  notes: string;
}

export interface Homework {
  id: string;
  title: string;
  description: string;
  classId: string;
  assignedById: string;
  assignedDate: string;
  dueDate: string;
  skillCategory: string;
  status: 'Draft' | 'Assigned' | 'Closed';
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  status: 'Submitted' | 'Missing' | 'Late' | 'Reviewed';
  score?: number;
  band?: number;
  feedback?: string;
  submissionDate?: string;
  markedDate?: string;
}

export interface Test {
  id: string;
  title: string;
  type: string;
  classId: string;
  assignedById: string;
  date: string;
  skillsAssessed: string[];
  maxScore: number;
  notes: string;
}

export interface TestResult {
  id: string;
  testId: string;
  studentId: string;
  writing: number;
  speaking: number;
  listening: number;
  reading: number;
  overall: number;
  comments: string;
  markedDate: string;
}

export interface AppData {
  currentUser: User;
  users: User[];
  students: Student[];
  classes: Class[];
  attendance: Attendance[];
  homework: Homework[];
  homeworkSubmissions: HomeworkSubmission[];
  tests: Test[];
  testResults: TestResult[];
  config?: {
    hasGoogleSheets: boolean;
    sheetTitle: string | null;
  };
}
