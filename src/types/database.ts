export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'teacher' | 'ta'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'admin' | 'teacher' | 'ta'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'teacher' | 'ta'
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          level: string | null
          status: 'Active' | 'Inactive'
          start_date: string | null
          end_date: string | null
          schedule: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          level?: string | null
          status?: 'Active' | 'Inactive'
          start_date?: string | null
          end_date?: string | null
          schedule?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          level?: string | null
          status?: 'Active' | 'Inactive'
          start_date?: string | null
          end_date?: string | null
          schedule?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      class_staff_assignments: {
        Row: {
          id: string
          profile_id: string
          class_id: string
          assigned_role: 'admin' | 'teacher' | 'ta'
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          class_id: string
          assigned_role: 'admin' | 'teacher' | 'ta'
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          class_id?: string
          assigned_role?: 'admin' | 'teacher' | 'ta'
          created_at?: string
        }
      }
      students: {
        Row: {
          id: string
          full_name: string
          email: string | null
          current_band: number | null
          target_band: number | null
          status: 'Active' | 'Completed' | 'Paused' | 'Withdrawn'
          class_id: string | null
          notes: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email?: string | null
          current_band?: number | null
          target_band?: number | null
          status?: 'Active' | 'Completed' | 'Paused' | 'Withdrawn'
          class_id?: string | null
          notes?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string | null
          current_band?: number | null
          target_band?: number | null
          status?: 'Active' | 'Completed' | 'Paused' | 'Withdrawn'
          class_id?: string | null
          notes?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string
          class_id: string
          date: string
          status: 'Present' | 'Absent' | 'Late' | 'Excused'
          marked_by_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          class_id: string
          date: string
          status?: 'Present' | 'Absent' | 'Late' | 'Excused'
          marked_by_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          class_id?: string
          date?: string
          status?: 'Present' | 'Absent' | 'Late' | 'Excused'
          marked_by_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      homework: {
        Row: {
          id: string
          title: string
          description: string | null
          class_id: string
          skill_category: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'General'
          status: 'Draft' | 'Assigned' | 'Closed'
          due_date: string | null
          assigned_by_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          class_id: string
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'General'
          status?: 'Draft' | 'Assigned' | 'Closed'
          due_date?: string | null
          assigned_by_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          class_id?: string
          skill_category?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'General'
          status?: 'Draft' | 'Assigned' | 'Closed'
          due_date?: string | null
          assigned_by_id?: string | null
          created_at?: string
        }
      }
      homework_submissions: {
        Row: {
          id: string
          homework_id: string
          student_id: string
          status: 'Submitted' | 'Missing' | 'Late' | 'Reviewed'
          score: number | null
          band: number | null
          feedback: string | null
          submitted_at: string
          marked_at: string | null
        }
        Insert: {
          id?: string
          homework_id: string
          student_id: string
          status?: 'Submitted' | 'Missing' | 'Late' | 'Reviewed'
          score?: number | null
          band?: number | null
          feedback?: string | null
          submitted_at?: string
          marked_at?: string | null
        }
        Update: {
          id?: string
          homework_id?: string
          student_id?: string
          status?: 'Submitted' | 'Missing' | 'Late' | 'Reviewed'
          score?: number | null
          band?: number | null
          feedback?: string | null
          submitted_at?: string
          marked_at?: string | null
        }
      }
      tests: {
        Row: {
          id: string
          title: string
          class_id: string
          date: string | null
          skills_assessed: string[]
          max_score: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          class_id: string
          date?: string | null
          skills_assessed?: string[]
          max_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          class_id?: string
          date?: string | null
          skills_assessed?: string[]
          max_score?: number
          created_at?: string
        }
      }
      test_results: {
        Row: {
          id: string
          test_id: string
          student_id: string
          listening: number | null
          reading: number | null
          writing: number | null
          speaking: number | null
          overall: number | null
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          student_id: string
          listening?: number | null
          reading?: number | null
          writing?: number | null
          speaking?: number | null
          overall?: number | null
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          student_id?: string
          listening?: number | null
          reading?: number | null
          writing?: number | null
          speaking?: number | null
          overall?: number | null
          comments?: string | null
          created_at?: string
        }
      }
    }
  }
}
