import { supabase } from '../config/supabase';

export async function createUserIfNotExists(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!data) {
    await supabase.from('users').insert({
      user_id: userId,
      base_currency: 'USD',
      favorites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
}

export async function getUser(userId: string) {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  return data;
}

export async function updateUser(userId: string, payload: any) {
  await supabase
    .from('users')
    .update({
      ...payload,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);
}
