-- =====================================================================
-- Fastrack Tracker — review ratings, staff directory, trend views
-- =====================================================================

-- Optional 1–5 performance rating that faculty can give with each logged
-- interview stage. Students see it on their application as a review card.
alter table public.interview_status_log
  add column if not exists rating smallint check (rating between 1 and 5);

-- Staff names (faculty / dean / admin) are visible to every signed-in user,
-- so a student can see who wrote their interview feedback. Student profiles
-- keep the original, narrower rules.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_staff()
    or role in ('faculty', 'dean', 'admin')
    or (role = 'student' and public.faculty_has_student(id))
  );

-- Daily rollups for "this week vs last week" trend metrics.
-- security_invoker keeps them under the caller's RLS.
create or replace view public.daily_attendance
with (security_invoker = true) as
select a.date                                        as day,
       count(*)                                      as total,
       count(*) filter (where a.status = 'present')  as present
from public.attendance a
group by a.date;

create or replace view public.daily_applications
with (security_invoker = true) as
select (d.applied_at at time zone 'utc')::date as day, count(*) as applications
from public.drive_applications d
group by 1;

create or replace view public.daily_offers
with (security_invoker = true) as
select (l.updated_at at time zone 'utc')::date as day, count(*) as offers
from public.interview_status_log l
where l.stage = 'offered'
group by 1;

grant select on public.daily_attendance, public.daily_applications, public.daily_offers to authenticated;
