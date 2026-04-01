import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

export const testService = {
  async getTestsByClass(classId: string) {
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .eq('class_id', classId)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTestResults(testId: string) {
    const { data, error } = await supabase
      .from('test_results')
      .select('*, students(full_name)')
      .eq('test_id', testId);

    if (error) throw error;
    return data;
  },

  async createTest(test: Database['public']['Tables']['tests']['Insert']) {
    const { data, error } = await supabase
      .from('tests')
      .insert(test)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async enterResult(result: Database['public']['Tables']['test_results']['Insert']) {
    const { data, error } = await supabase
      .from('test_results')
      .upsert(result, { onConflict: 'test_id, student_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
