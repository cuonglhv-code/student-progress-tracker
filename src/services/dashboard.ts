import { supabase } from '../lib/supabaseClient';

export const dashboardService = {
  async getStats() {
    const { data, error } = await supabase
      .from('dashboard_stats')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async getRecentActivity() {
    // Fetch recent attendance, homework, and test results for a timeline
    const [attendance, homework, results] = await Promise.all([
      supabase.from('attendance').select('*, students(full_name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('homework').select('*, classes(name)').order('created_at', { ascending: false }).limit(5),
      supabase.from('test_results').select('*, students(full_name), tests(title)').order('created_at', { ascending: false }).limit(5)
    ]);

    return {
      attendance: attendance.data || [],
      homework: homework.data || [],
      testResults: results.data || []
    };
  }
};
