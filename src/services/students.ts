import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

export const studentService = {
  async getStudentsByClass(classId: string) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('full_name');

    if (error) throw error;
    return data;
  },

  async getAllStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(name)')
      .order('full_name');

    if (error) throw error;
    return data;
  },

  async createStudent(student: Database['public']['Tables']['students']['Insert']) {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStudent(id: string, updates: Database['public']['Tables']['students']['Update']) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
