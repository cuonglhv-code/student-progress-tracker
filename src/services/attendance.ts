import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

export const attendanceService = {
  async getAttendanceByClass(classId: string, date: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(full_name)')
      .eq('class_id', classId)
      .eq('date', date);

    if (error) throw error;
    return data;
  },

  async markAttendance(records: Database['public']['Tables']['attendance']['Insert'][]) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id, class_id, date' })
      .select();

    if (error) throw error;
    return data;
  },

  async getStudentStats(studentId: string) {
    const { data, error } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId);

    if (error) throw error;
    
    const stats = {
      Present: 0,
      Absent: 0,
      Late: 0,
      Excused: 0
    };

    data.forEach(r => stats[r.status]++);
    return stats;
  }
};
