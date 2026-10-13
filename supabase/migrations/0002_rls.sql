-- =====================================================================
-- Fastrack Tracker — Row Level Security
-- Helper functions are SECURITY DEFINER so policies can look up roles and
-- batch membership without recursing into RLS on the same tables.
-- =====================================================================

create or replace function public.app_role()
returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.app_role() in ('dean','admin'), false) $$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.app_role() = 'admin', false) $$;

-- Is the current user a faculty member actively assigned to this batch?
create or replace function public.faculty_has_batch(p_batch uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.faculty_batch_map m
     where m.faculty_id = auth.uid() and m.batch_id = p_batch and m.active
  )
$$;

-- Is this student in one of the current faculty user's batches?
create or replace function public.faculty_has_student(p_student uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
      from public.student_profiles sp
      join public.faculty_batch_map m on m.batch_id = sp.batch_id and m.active
     where sp.user_id = p_student and m.faculty_id = auth.uid()
  )
$$;

create or replace function public.application_student(p_app uuid)
returns uuid
language sql stable security definer set search_path = public
as $$ select student_id from public.drive_applications where id = p_app $$;

revoke all on function public.app_role() from public;
grant execute on function public.app_role(), public.is_staff(), public.is_admin(),
  public.faculty_has_batch(uuid), public.faculty_has_student(uuid),
  public.application_student(uuid) to authenticated;

alter table public.profiles             enable row level security;
alter table public.batches              enable row level security;
alter table public.student_profiles     enable row level security;
alter table public.faculty_batch_map    enable row level security;
alter table public.attendance           enable row level security;
alter table public.company_drives       enable row level security;
alter table public.drive_applications   enable row level security;
alter table public.interview_status_log enable row level security;

-- ---------------------------------------------------------------- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_staff()
    or (role = 'student' and public.faculty_has_student(id))  -- faculty need student names
  );

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------- batches
drop policy if exists batches_read on public.batches;
create policy batches_read on public.batches for select to authenticated
  using (true);

drop policy if exists batches_write on public.batches;
create policy batches_write on public.batches for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- -------------------------------------------------------- student_profiles
drop policy if exists sp_read on public.student_profiles;
create policy sp_read on public.student_profiles for select to authenticated
  using (
    user_id = auth.uid()
    or public.is_staff()
    or public.faculty_has_batch(batch_id)
  );

drop policy if exists sp_write on public.student_profiles;
create policy sp_write on public.student_profiles for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------- faculty_batch_map
drop policy if exists fbm_read on public.faculty_batch_map;
create policy fbm_read on public.faculty_batch_map for select to authenticated
  using (faculty_id = auth.uid() or public.is_staff());

drop policy if exists fbm_write on public.faculty_batch_map;
create policy fbm_write on public.faculty_batch_map for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- -------------------------------------------------------------- attendance
drop policy if exists att_read on public.attendance;
create policy att_read on public.attendance for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_staff()
    or public.faculty_has_student(student_id)
  );

drop policy if exists att_insert on public.attendance;
create policy att_insert on public.attendance for insert to authenticated
  with check (
    public.is_staff()
    or (public.app_role() = 'faculty'
        and faculty_id = auth.uid()
        and public.faculty_has_student(student_id))
  );

drop policy if exists att_update on public.attendance;
create policy att_update on public.attendance for update to authenticated
  using (public.is_staff() or public.faculty_has_student(student_id))
  with check (
    public.is_staff()
    or (faculty_id = auth.uid() and public.faculty_has_student(student_id))
  );

drop policy if exists att_delete on public.attendance;
create policy att_delete on public.attendance for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------------- company_drives
drop policy if exists drives_read on public.company_drives;
create policy drives_read on public.company_drives for select to authenticated
  using (true);

drop policy if exists drives_write on public.company_drives;
create policy drives_write on public.company_drives for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------ drive_applications
drop policy if exists apps_read on public.drive_applications;
create policy apps_read on public.drive_applications for select to authenticated
  using (
    student_id = auth.uid()
    or public.is_staff()
    or public.faculty_has_student(student_id)
  );

drop policy if exists apps_student_insert on public.drive_applications;
create policy apps_student_insert on public.drive_applications for insert to authenticated
  with check (
    (student_id = auth.uid() and public.app_role() = 'student'
      and coalesce(current_stage, 'applied') = 'applied')
    or public.is_staff()
  );

drop policy if exists apps_staff_write on public.drive_applications;
create policy apps_staff_write on public.drive_applications for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists apps_staff_delete on public.drive_applications;
create policy apps_staff_delete on public.drive_applications for delete to authenticated
  using (public.is_staff());

-- ---------------------------------------------------- interview_status_log
drop policy if exists isl_read on public.interview_status_log;
create policy isl_read on public.interview_status_log for select to authenticated
  using (
    public.application_student(application_id) = auth.uid()
    or public.is_staff()
    or public.faculty_has_student(public.application_student(application_id))
  );

drop policy if exists isl_insert on public.interview_status_log;
create policy isl_insert on public.interview_status_log for insert to authenticated
  with check (
    updated_by = auth.uid()
    and (
      public.is_staff()
      or (public.app_role() = 'faculty'
          and public.faculty_has_student(public.application_student(application_id)))
    )
  );
