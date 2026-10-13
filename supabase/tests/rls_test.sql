-- RLS scenario tests. Raises an exception on the first failed expectation.
\set ON_ERROR_STOP 1

-- ---------- fixtures (as superuser) ----------
insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@x.edu',  '{"role":"admin"}',   '{"full_name":"Admin"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dean@x.edu',   '{"role":"dean"}',    '{"full_name":"Dean"}'),
  ('00000000-0000-0000-0000-0000000000f1', 'fac1@x.edu',   '{"role":"faculty"}', '{"full_name":"Fac One"}'),
  ('00000000-0000-0000-0000-0000000000f2', 'fac2@x.edu',   '{"role":"faculty"}', '{"full_name":"Fac Two"}'),
  ('00000000-0000-0000-0000-0000000000a1', 's1@x.edu',     '{}',                 '{"full_name":"Stu A1"}'),
  ('00000000-0000-0000-0000-0000000000b1', 's2@x.edu',     '{}',                 '{"full_name":"Stu B1"}'),
  ('00000000-0000-0000-0000-0000000000e1', 'evil@x.edu',   '{}',                 '{"full_name":"Evil","role":"admin"}');

do $$ begin
  assert (select role from profiles where id = '00000000-0000-0000-0000-00000000000a') = 'admin', 'trigger: admin role';
  assert (select role from profiles where id = '00000000-0000-0000-0000-0000000000e1') = 'student', 'trigger: user_metadata role ignored';
end $$;

insert into batches (id, name, department, year) values
  ('10000000-0000-0000-0000-00000000000a', '2026 CSE-A', 'CSE', 2026),
  ('10000000-0000-0000-0000-00000000000b', '2026 CSE-B', 'CSE', 2026);
insert into student_profiles values
  ('00000000-0000-0000-0000-0000000000a1', 'CSE001', 'CSE', '10000000-0000-0000-0000-00000000000a', true),
  ('00000000-0000-0000-0000-0000000000b1', 'CSE101', 'CSE', '10000000-0000-0000-0000-00000000000b', true);
insert into faculty_batch_map (faculty_id, batch_id) values
  ('00000000-0000-0000-0000-0000000000f1', '10000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-0000000000f2', '10000000-0000-0000-0000-00000000000b');
insert into company_drives (id, company_name, role_offered) values
  ('20000000-0000-0000-0000-000000000001', 'Acme', 'SDE');

create or replace function pg_temp.act_as(uid text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, false);
  execute 'set role authenticated';
end $$;

-- ---------- student A1 ----------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1') \g /dev/null
do $$ begin
  assert (select count(*) from profiles) = 1, 'student sees only own profile';
  assert (select count(*) from student_profiles) = 1, 'student sees only own student_profile';
  assert (select count(*) from company_drives) = 1, 'student reads drives';
end $$;
insert into drive_applications (drive_id, student_id)
  values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1');
do $$ begin
  begin
    insert into drive_applications (drive_id, student_id)
      values ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1');
    raise exception 'student applied on behalf of another student';
  exception when insufficient_privilege then null; end;
  begin
    insert into attendance (student_id, faculty_id, date, status)
      values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', current_date, 'present');
    raise exception 'student marked own attendance';
  exception when insufficient_privilege then null; end;
  begin
    insert into company_drives (company_name, role_offered) values ('Fake', 'x');
    raise exception 'student created drive';
  exception when insufficient_privilege then null; end;
  update profiles set role = 'admin' where id = auth.uid();
  assert (select role from profiles where id = auth.uid()) = 'student', 'student escalated own role';
end $$;
reset role;

-- ---------- faculty F1 (batch A) ----------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000f1') \g /dev/null
insert into attendance (student_id, faculty_id, date, status)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', current_date, 'present')
  on conflict (student_id, date) do update set status = excluded.status;
insert into attendance (student_id, faculty_id, date, status)
  values ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000f1', current_date, 'leave')
  on conflict (student_id, date) do update set status = excluded.status;
do $$ begin
  assert (select status from attendance where student_id = '00000000-0000-0000-0000-0000000000a1') = 'leave', 'faculty upsert';
  assert (select count(*) from student_profiles) = 1, 'faculty sees only own batch students';
  assert (select count(*) from profiles where role = 'student') = 1, 'faculty sees own students names only';
  assert (select count(*) from drive_applications) = 1, 'faculty sees own batch applications';
  begin
    insert into attendance (student_id, faculty_id, date, status)
      values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000f1', current_date, 'present');
    raise exception 'faculty marked attendance outside batch';
  exception when insufficient_privilege then null; end;
end $$;
insert into interview_status_log (application_id, updated_by, stage)
  select id, '00000000-0000-0000-0000-0000000000f1', 'round1_completed' from drive_applications;
do $$ begin
  assert (select current_stage from drive_applications) = 'round1_completed', 'stage trigger syncs';
  assert (select count(*) from batch_attendance_summary where total_marked > 0) = 1, 'view respects RLS';
end $$;
reset role;

-- ---------- faculty F2 (batch B) cannot touch batch A ----------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000f2') \g /dev/null
do $$ begin
  assert (select count(*) from attendance) = 0, 'F2 cannot see batch A attendance';
  assert (select count(*) from drive_applications) = 0, 'F2 cannot see batch A applications';
  begin
    insert into interview_status_log (application_id, updated_by, stage)
      select id, '00000000-0000-0000-0000-0000000000f2', 'offered' from drive_applications;
    -- (select returns nothing under RLS; force the id)
    insert into interview_status_log (application_id, updated_by, stage)
      values ((select id from public.drive_applications limit 1), '00000000-0000-0000-0000-0000000000f2', 'offered');
  exception when insufficient_privilege or not_null_violation then null; end;
end $$;
reset role;
do $$ begin
  assert (select current_stage from drive_applications) = 'round1_completed', 'F2 changed stage';
end $$;

-- ---------- student sees own timeline ----------
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1') \g /dev/null
do $$ begin
  assert (select count(*) from interview_status_log) = 1, 'student reads own log';
  assert (select count(*) from attendance) = 1, 'student reads own attendance';
end $$;
reset role;

-- ---------- dean ----------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000d') \g /dev/null
insert into company_drives (company_name, role_offered) values ('Globex', 'Analyst');
do $$ begin
  assert (select count(*) from profiles) = 7, 'dean reads all profiles';
  assert (select count(*) from batch_attendance_summary) = 2, 'dean sees all batches in analytics';
  update profiles set role = 'admin' where id = auth.uid();
  assert (select role from profiles where id = auth.uid()) = 'dean', 'dean cannot change roles';
end $$;
reset role;

-- ---------- admin ----------
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a') \g /dev/null
update profiles set role = 'faculty' where id = '00000000-0000-0000-0000-0000000000e1';
do $$ begin
  assert (select role from profiles where id = '00000000-0000-0000-0000-0000000000e1') = 'faculty', 'admin changes roles';
end $$;
reset role;

select 'ALL RLS TESTS PASSED' as result;
