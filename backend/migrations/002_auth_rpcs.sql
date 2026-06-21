-- ============================================================
-- 002_auth_rpcs.sql
-- Modern backend için kimlik doğrulama RPC'leri.
-- - app_authenticate: rol filtresiz (admin DE girebilir) tek giriş noktası.
--   Şifre doğrulaması Postgres içinde pgcrypto crypt ile yapılır;
--   hash hiçbir zaman DB dışına çıkmaz.
-- - hash_password: kullanıcı oluşturma/güncellemede şifreyi bcrypt'ler.
-- Her ikisi de SADECE service_role tarafından çağrılabilir.
-- ============================================================

create extension if not exists pgcrypto;

-- app_users tablosunda last_login_at kolonu yoksa ekle (eski şemayla uyum)
alter table public.app_users
  add column if not exists last_login_at timestamptz;

-- ------------------------------------------------------------
-- app_authenticate: aktif kullanıcıyı (rol fark etmeksizin) doğrular
-- ------------------------------------------------------------
create or replace function public.app_authenticate(
  p_username text,
  p_password text
)
returns table (
  id uuid,
  username text,
  role text,
  active boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  update public.app_users u
  set last_login_at = now(),
      updated_at = now()
  where u.username = p_username
    and u.password_hash = crypt(p_password, u.password_hash)
    and u.active = true
  returning u.id, u.username, u.role, u.active;
end;
$$;

revoke all on function public.app_authenticate(text, text) from public;
revoke all on function public.app_authenticate(text, text) from anon;
revoke all on function public.app_authenticate(text, text) from authenticated;
grant execute on function public.app_authenticate(text, text) to service_role;

-- ------------------------------------------------------------
-- hash_password: şifreyi bcrypt'ler (kullanıcı CRUD'da kullanılır)
-- ------------------------------------------------------------
create or replace function public.hash_password(p_password text)
returns text
language sql
security definer
set search_path = public, extensions
as $$
  select crypt(p_password, gen_salt('bf'));
$$;

revoke all on function public.hash_password(text) from public;
revoke all on function public.hash_password(text) from anon;
revoke all on function public.hash_password(text) from authenticated;
grant execute on function public.hash_password(text) to service_role;
