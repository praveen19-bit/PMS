-- =====================================================================
-- Fastrack Tracker — analytics views
-- security_invoker = true makes the views respect the caller's RLS, so a
-- dean sees every batch while a faculty member sees only their own.
-- Aggregating in SQL also avoids PostgREST's row cap on large tables.
-- =====================================================================

create or replace view public.batch_attendance_summary
with (security_invoker = true) as
select
  b.id                                            as batch_id,
  b.name                                          as batch_name,
  b.department,
  b.year,
  count(distinct sp.user_id)                      as student_count,
  count(a.id)                                     as total_marked,
  count(a.id) filter (where a.status = 'present') as present_count,
  count(a.id) filter (where a.status = 'absent')  as absent_count,
  count(a.id) filter (where a.status = 'leave')   as leave_count,
  case when count(a.id) = 0 then 0
       else round(100.0 * count(a.id) filter (where a.status = 'present') / count(a.id), 1)
  end                                             as attendance_pct
from public.batches b
left join public.student_profiles sp on sp.batch_id = b.id
left join public.attendance a on a.student_id = sp.user_id
group by b.id, b.name, b.department, b.year;

create or replace view public.student_attendance_summary
with (security_invoker = true) as
select
  a.student_id,
  count(*)                                     as total_marked,
  count(*) filter (where a.status = 'present') as present_count,
  count(*) filter (where a.status = 'absent')  as absent_count,
  count(*) filter (where a.status = 'leave')   as leave_count,
  round(100.0 * count(*) filter (where a.status = 'present') / nullif(count(*), 0), 1)
                                               as attendance_pct
from public.attendance a
group by a.student_id;

create or replace view public.application_stage_counts
with (security_invoker = true) as
select current_stage as stage, count(*) as count
from public.drive_applications
group by current_stage;

create or replace view public.drive_application_counts
with (security_invoker = true) as
select drive_id, count(*) as application_count
from public.drive_applications
group by drive_id;

grant select on public.batch_attendance_summary,
                public.student_attendance_summary,
                public.application_stage_counts,
                public.drive_application_counts to authenticated;
