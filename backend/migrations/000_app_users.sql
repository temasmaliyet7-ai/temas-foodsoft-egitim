-- ============================================================
-- 000_app_users.sql
-- Sıfırdan kurulum için kullanıcı tablosu. Eğer projende app_users
-- tablosu ZATEN varsa (eski sistemden) bu dosyayı atlayabilirsin —
-- "if not exists" sayesinde çalıştırsan da mevcut veriyi bozmaz.
-- İlk admin: kullanıcı adı "admin", şifre "1234" (giriş sonrası DEĞİŞTİR).
-- Supabase > SQL Editor'da çalıştır.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  password_hash text not null,
  role          text not null default 'user' check (role in ('admin', 'user')),
  active        boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- updated_at trigger (001'deki fonksiyonu kullanır; bu dosya önce çalışırsa diye burada da tanımlı)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_app_users_updated on public.app_users;
create trigger trg_app_users_updated
  before update on public.app_users
  for each row execute function public.set_updated_at();

-- İlk admin hesabı (yoksa ekle)
insert into public.app_users (username, password_hash, role, active)
select 'admin', crypt('1234', gen_salt('bf')), 'admin', true
where not exists (select 1 from public.app_users where username = 'admin');
