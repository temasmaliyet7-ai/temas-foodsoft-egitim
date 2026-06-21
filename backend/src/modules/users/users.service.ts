import { supabase } from '../../lib/supabase.js';
import { hashPassword } from '../../lib/password.js';
import { badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import type { AppRole } from '../../lib/jwt.js';

export interface PublicUser {
  id: string;
  username: string;
  role: AppRole;
  active: boolean;
  last_login_at: string | null;
  updated_at: string | null;
}

const USER_COLUMNS = 'id, username, role, active, last_login_at, updated_at';

export interface ListUsersFilter {
  search?: string;
  role?: AppRole;
  active?: boolean;
}

export async function listUsers(filter: ListUsersFilter): Promise<PublicUser[]> {
  let query = supabase.from('app_users').select(USER_COLUMNS).order('username', { ascending: true });
  if (filter.role) query = query.eq('role', filter.role);
  if (typeof filter.active === 'boolean') query = query.eq('active', filter.active);
  if (filter.search) query = query.ilike('username', `%${filter.search}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PublicUser[];
}

async function getById(id: string): Promise<PublicUser | null> {
  const { data, error } = await supabase
    .from('app_users')
    .select(USER_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as PublicUser) ?? null;
}

async function usernameTaken(username: string, exceptId?: string): Promise<boolean> {
  let query = supabase.from('app_users').select('id').ilike('username', username);
  if (exceptId) query = query.neq('id', exceptId);
  const { data, error } = await query.maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export interface CreateUserInput {
  username: string;
  password: string;
  role?: AppRole;
  active?: boolean;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const username = input.username.trim();
  if (!username) throw badRequest('Kullanıcı adı boş olamaz.');
  if (await usernameTaken(username)) throw conflict('Bu kullanıcı adı zaten var.');

  const password_hash = await hashPassword(input.password);
  const { data, error } = await supabase
    .from('app_users')
    .insert({
      username,
      password_hash,
      role: input.role ?? 'user',
      active: input.active ?? true,
    })
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as PublicUser;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
  role?: AppRole;
  active?: boolean;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
  const target = await getById(id);
  if (!target) throw notFound('Kullanıcı bulunamadı.');

  const patch: Record<string, unknown> = {};

  // Admin koruma kuralları (eski admin_* RPC'lerden taşındı)
  if (target.role === 'admin') {
    if (input.active === false) throw forbidden('Admin hesabı pasif yapılamaz.');
    if (input.role && input.role !== 'admin') throw forbidden('Admin rolü kullanıcıya çevrilemez.');
  } else {
    if (typeof input.active === 'boolean') patch.active = input.active;
    if (input.role) patch.role = input.role;
  }

  if (input.username) {
    const username = input.username.trim();
    if (!username) throw badRequest('Kullanıcı adı boş olamaz.');
    if (await usernameTaken(username, id)) throw conflict('Bu kullanıcı adı zaten var.');
    patch.username = username;
  }

  if (input.password && input.password.trim()) {
    patch.password_hash = await hashPassword(input.password);
  }

  if (Object.keys(patch).length === 0) return target;

  const { data, error } = await supabase
    .from('app_users')
    .update(patch)
    .eq('id', id)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as PublicUser;
}

export async function setUserActive(id: string, active: boolean): Promise<PublicUser> {
  const target = await getById(id);
  if (!target) throw notFound('Kullanıcı bulunamadı.');
  if (target.role === 'admin' && active === false) throw forbidden('Admin hesabı pasif yapılamaz.');
  const { data, error } = await supabase
    .from('app_users')
    .update({ active })
    .eq('id', id)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return data as PublicUser;
}

export async function deleteUser(id: string): Promise<void> {
  const target = await getById(id);
  if (!target) throw notFound('Kullanıcı bulunamadı.');
  if (target.role === 'admin') throw forbidden('Admin hesabı silinemez.');
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) throw error;
}
