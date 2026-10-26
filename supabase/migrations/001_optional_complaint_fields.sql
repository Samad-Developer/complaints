-- =====================================================================
-- Make every complaint field optional.
-- Run once in Supabase: Dashboard → SQL Editor → New query
-- (only needed for databases created from the original schema.sql)
-- =====================================================================

alter table public.complaints
  alter column name           drop not null,
  alter column tehsil         drop not null,
  alter column contact_number drop not null,
  alter column complaint_date drop not null,
  alter column complaint      drop not null,
  alter column location       drop not null,
  alter column department     drop not null,
  alter column complaint_date drop default;

-- Replace the minimum-length checks with max-length-only checks.
alter table public.complaints
  drop constraint if exists complaints_name_check,
  drop constraint if exists complaints_contact_number_check,
  drop constraint if exists complaints_complaint_check,
  drop constraint if exists complaints_location_check;

alter table public.complaints
  add constraint complaints_name_check           check (char_length(name) <= 120),
  add constraint complaints_contact_number_check check (char_length(contact_number) <= 20),
  add constraint complaints_complaint_check      check (char_length(complaint) <= 5000),
  add constraint complaints_location_check       check (char_length(location) <= 300);

-- Dashboard stats: skip complaints with no tehsil / department
-- (json_object_agg fails on a null key).
create or replace function public.complaint_stats()
returns json
language sql
stable
security invoker
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from complaints),
    'by_status', (
      select coalesce(json_object_agg(status, n), '{}'::json)
      from (select status, count(*) as n from complaints group by status) s
    ),
    'by_tehsil', (
      select coalesce(json_object_agg(tehsil, n), '{}'::json)
      from (select tehsil, count(*) as n from complaints where tehsil is not null group by tehsil) t
    ),
    'by_department', (
      select coalesce(json_object_agg(department, n), '{}'::json)
      from (select department, count(*) as n from complaints where department is not null group by department) d
    ),
    'daily', (
      select coalesce(json_agg(json_build_object('day', day, 'count', n) order by day), '[]'::json)
      from (
        select complaint_date as day, count(*) as n
        from complaints
        where complaint_date >= current_date - 29
        group by complaint_date
      ) x
    )
  );
$$;
