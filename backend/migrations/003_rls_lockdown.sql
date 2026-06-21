-- ============================================================
-- 003_rls_lockdown.sql
-- Tüm erişim artık güvenli backend (service_role) üzerinden akıyor.
-- RLS açılır ve anon/authenticated rollerinin doğrudan erişimi kaldırılır.
-- service_role RLS'i bypass eder → sızdırılan anon key işe yaramaz.
-- ============================================================

alter table public.app_users      enable row level security;
alter table public.trainings      enable row level security;
alter table public.training_pages enable row level security;

-- anon / authenticated rolleri için hiçbir policy yok => sıfır satır görürler.
revoke all on public.app_users      from anon, authenticated;
revoke all on public.trainings      from anon, authenticated;
revoke all on public.training_pages from anon, authenticated;

-- Not: Eski admin_* RPC'leri (admin_check, admin_list_users, admin_create_user,
-- admin_update_user, admin_delete_user) ve app_login artık kullanılmıyor.
-- Cutover tamamlandıktan sonra aşağıdaki satırların yorumunu kaldırıp çalıştırarak
-- saldırı yüzeyini küçültebilirsin:
--
-- drop function if exists public.app_login(text, text);
-- drop function if exists public.admin_check(text, text);
-- drop function if exists public.admin_list_users(text, text);
-- drop function if exists public.admin_create_user(text, text, text, text, text, boolean);
-- drop function if exists public.admin_update_user(text, text, text, text, text, text, boolean);
-- drop function if exists public.admin_delete_user(text, text, text);
