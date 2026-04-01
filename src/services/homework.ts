import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

export const homeworkService = {
  async getHomeworkByClass(classId: string) {
    const { data, error } = await supabase
      .from('homework')
      .select(`
        *,
        homework_submissions(count)
      `)
      .eq('class_id', classId)
      .order('due_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getSubmissions(homeworkId: string) {
    const { data, error } = await supabase
      .from('homework_submissions')
      .select('*, students(full_name)')
      .eq('homework_id', homeworkId);

    if (error) throw error;
    return data;
  },

  async createHomework(homework: Database['public']['Tables']['homework']['Insert']) {
    const { data, error } = await supabase
      .from('homework')
      .insert(homework)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async submitGrade(id: string, updates: Database['public']['Tables']['homework_submissions']['Update']) {
    const { data, error } = await supabase
      .from('homework_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
