-- ============================================================
-- 001_trainings_schema.sql
-- Eğitim (sunum) tabloları. Eğitimler artık koda gömülü değil,
-- veritabanından yönetilir. Sayfa görselleri Supabase Storage'da
-- 'training-pages' bucket'ında tutulur.
-- Supabase > SQL Editor içinde 1 kere çalıştır.
-- ============================================================

create extension if not exists pgcrypto;

-- Genel updated_at trigger fonksiyonu
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- trainings: bir eğitim/sunum başlığı
-- ------------------------------------------------------------
create table if not exists public.trainings (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  subtitle    text,
  sort_order  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_trainings_updated on public.trainings;
create trigger trg_trainings_updated
  before update on public.trainings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- training_pages: bir eğitime ait sıralı sayfa görselleri
-- ------------------------------------------------------------
create table if not exists public.training_pages (
  id            uuid primary key default gen_random_uuid(),
  training_id   uuid not null references public.trainings(id) on delete cascade,
  page_number   integer not null,
  storage_path  text not null,
  image_url     text not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (training_id, page_number)
);

drop trigger if exists trg_training_pages_updated on public.training_pages;
create trigger trg_training_pages_updated
  before update on public.training_pages
  for each row execute function public.set_updated_at();

create index if not exists idx_training_pages_training
  on public.training_pages (training_id, page_number);
create index if not exists idx_trainings_sort
  on public.trainings (sort_order, created_at);
