-- =====================================================================
-- Optional bootstrap: promote your first user to admin.
--
-- 1. Supabase Dashboard → Authentication → Users → "Add user" (auto-confirm).
-- 2. Replace the email below and run this in the SQL editor.
-- After that, create every other user from the Admin → Users screen.
-- =====================================================================

update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
 where email = 'admin@example.edu';

insert into public.profiles (id, full_name, role)
select id, 'Placement Admin', 'admin' from auth.users where email = 'admin@example.edu'
on conflict (id) do update set role = 'admin';
