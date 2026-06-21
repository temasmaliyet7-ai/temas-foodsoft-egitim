import { api } from './client';
import type { Role, User } from '../types';

export interface UserFilter {
  search?: string;
  active?: 'true' | 'false';
}

export async function fetchUsers(filter: UserFilter = {}): Promise<User[]> {
  const res = await api.get('/users', { params: filter });
  return res.data.users as User[];
}

export async function createUser(input: {
  username: string;
  password: string;
  role: Role;
  active?: boolean;
}): Promise<void> {
  await api.post('/users', input);
}

export async function updateUser(
  id: string,
  input: { username?: string; password?: string; role?: Role; active?: boolean },
): Promise<void> {
  await api.patch(`/users/${id}`, input);
}

export async function setUserActive(id: string, active: boolean): Promise<void> {
  await api.patch(`/users/${id}/active`, { active });
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
