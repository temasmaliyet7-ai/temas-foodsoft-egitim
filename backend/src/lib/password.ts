import { supabase } from './supabase.js';
import { badRequest } from './errors.js';

// Basit şifre politikası (savunma derinliği).
export function validatePassword(password: string): void {
  if (typeof password !== 'string' || password.length < 4) {
    throw badRequest('Şifre en az 4 karakter olmalı.');
  }
  if (password.length > 200) {
    throw badRequest('Şifre çok uzun.');
  }
}

// Şifreyi Postgres tarafında bcrypt'ler (pgcrypto). Hash mantığı tek yerde (DB) kalır.
export async function hashPassword(password: string): Promise<string> {
  validatePassword(password);
  const { data, error } = await supabase.rpc('hash_password', { p_password: password });
  if (error) throw error;
  if (typeof data !== 'string' || !data) {
    throw new Error('Şifre hashlenemedi.');
  }
  return data;
}
