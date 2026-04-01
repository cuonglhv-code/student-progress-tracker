import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database';

type ClassRow = Database['public']['Tables']['classes']['Row'];

export const classService = {
  async getAllClasses() {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        class_staff_assignments(profile_id, assigned_role, profiles(full_name))
      `)
      .order('name');

    if (error) throw error;
    return data;
  },

  async getClassById(id: string) {
    const { data, error } = await supabase
      .from('classes')
      .select(`
        *,
        students(*),
        class_staff_assignments(profiles(*))
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async createClass(cls: Database['public']['Tables']['classes']['Insert']) {
    const { data, error } = await supabase
      .from('classes')
      .insert(cls)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateClass(id: string, updates: Database['public']['Tables']['classes']['Update']) {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
