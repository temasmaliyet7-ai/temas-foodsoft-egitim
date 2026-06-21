import { supabase } from '../../lib/supabase.js';
import { unauthorized } from '../../lib/errors.js';
import type { AppRole } from '../../lib/jwt.js';

export interface AuthUser {
  id: string;
  username: string;
  role: AppRole;
}

// Tek giriş noktası: admin de normal kullanıcı da buradan doğrulanır.
// Şifre doğrulaması Postgres'te (pgcrypto) yapılır — hash DB dışına çıkmaz.
export async function authenticate(username: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.rpc('app_authenticate', {
    p_username: username,
    p_password: password,
  });
  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    // Kullanıcı yok / şifre yanlış / pasif — hepsi aynı generic mesaj (enumeration yok)
    throw unauthorized('Kullanıcı adı veya şifre hatalı.');
  }
  return { id: row.id, username: row.username, role: row.role as AppRole };
}

// Refresh sırasında kullanıcıyı tazele (pasifleşmiş / rolü değişmiş olabilir).
export async function getActiveUserById(id: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, active')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.active !== true) {
    throw unauthorized('Oturum geçersiz. Lütfen tekrar giriş yapın.');
  }
  return { id: data.id, username: data.username, role: data.role as AppRole };
}
