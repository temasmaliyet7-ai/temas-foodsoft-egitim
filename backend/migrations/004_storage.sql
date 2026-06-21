-- ============================================================
-- 004_storage.sql
-- Eğitim sayfa görselleri için 'training-pages' bucket'ı.
-- Eğitim içerikleri hassas değil → public-read (görseller cache'lenebilir,
-- görüntüleyici basit kalır). Yazma/silme yalnızca service_role ile.
--
-- NOT: Dilersen bunu Supabase Dashboard > Storage'dan da yapabilirsin:
--   - "New bucket" → adı: training-pages, Public bucket: ON
-- Aşağıdaki SQL aynı işi yapar.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('training-pages', 'training-pages', true)
on conflict (id) do update set public = true;

-- Public okuma (sadece bu bucket)
drop policy if exists "training_pages_public_read" on storage.objects;
create policy "training_pages_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'training-pages');

-- Yazma/güncelleme/silme: service_role bu policy'leri zaten bypass eder.
-- anon/authenticated için insert/update/delete policy'si TANIMLANMAZ → engellenir.
