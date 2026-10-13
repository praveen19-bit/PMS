-- =====================================================================
-- Fastrack Tracker — core schema
-- Run in the Supabase SQL editor (or `supabase db push`) before 0002.
-- =====================================================================

create extension if not exists pgcrypto;

-- Users are managed by Supabase Auth (auth.users). Extend with a profiles table.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('student','faculty','dean','admin')),
  created_at timestamptz default now()
);

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,               -- e.g. "2026 CSE-A"
  department text not null,
  year int not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.student_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  roll_no text unique not null,
  department text not null,
  batch_id uuid references public.batches(id) on delete set null,
  is_fastrack boolean default true
);

create table if not exists public.faculty_batch_map (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid references public.profiles(id) on delete cascade,
  batch_id uuid references public.batches(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz default now(),
  active boolean default true
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  faculty_id uuid references public.profiles(id),
  date date not null,
  status text not null check (status in ('present','absent','leave')),
  remarks text,
  created_at timestamptz default now(),
  unique(student_id, date)
);

create table if not exists public.company_drives (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  role_offered text not null,
  ctc text,
  eligibility_criteria text,
  -- Additive: structured eligibility used to filter "drives matching me".
  -- Empty array = open to every department.
  eligible_departments text[] not null default '{}',
  drive_date date,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.drive_applications (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid references public.company_drives(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  applied_at timestamptz default now(),
  current_stage text default 'applied',
  unique(drive_id, student_id)       -- a student applies to a drive once
);

create table if not exists public.interview_status_log (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.drive_applications(id) on delete cascade,
  updated_by uuid references public.profiles(id),
  stage text not null,          -- e.g. 'round1_completed', 'offered', 'rejected'
  remarks text,
  updated_at timestamptz default now()
);

-- Indexes for the hot RLS / lookup paths
create index if not exists idx_student_profiles_batch on public.student_profiles(batch_id);
create index if not exists idx_fbm_faculty on public.faculty_batch_map(faculty_id) where active;
create index if not exists idx_fbm_batch on public.faculty_batch_map(batch_id) where active;
create unique index if not exists uq_fbm_active_pair
  on public.faculty_batch_map(faculty_id, batch_id) where active;
create index if not exists idx_attendance_date on public.attendance(date);
create index if not exists idx_applications_student on public.drive_applications(student_id);
create index if not exists idx_status_log_app on public.interview_status_log(application_id, updated_at);

-- ---------------------------------------------------------------------
-- Auto-create a profile when an auth user is created.
-- Role comes from app_metadata (only settable with the service key),
-- never from user_metadata (which any user can write at sign-up).
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(new.raw_app_meta_data->>'role', 'student');
begin
  if v_role not in ('student','faculty','dean','admin') then
    v_role := 'student';
  end if;
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    v_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Keep drive_applications.current_stage in sync with the latest log row.
-- Security definer so faculty don't need UPDATE on drive_applications.
-- ---------------------------------------------------------------------
create or replace function public.sync_application_stage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.drive_applications
     set current_stage = new.stage
   where id = new.application_id;
  return new;
end;
$$;

drop trigger if exists on_status_logged on public.interview_status_log;
create trigger on_status_logged
  after insert on public.interview_status_log
  for each row execute function public.sync_application_stage();
