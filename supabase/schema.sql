-- =====================================================================
-- Deputy Commissioner Complaint Cell — database schema
-- Run this whole file once in Supabase: Dashboard → SQL Editor → New query
-- =====================================================================

-- ---------- Types ----------
do $$ begin
  create type public.complaint_status as enum ('pending', 'in_process', 'complete');
exception when duplicate_object then null; end $$;

-- ---------- Complaints table ----------
create table if not exists public.complaints (
  id              bigint generated always as identity primary key,
  -- All complaint details are optional; blanks are stored as null.
  name            text check (char_length(name) <= 120),
  tehsil          text check (tehsil in ('Topi', 'Swabi', 'Lahor', 'Razzar')),
  contact_number  text check (char_length(contact_number) <= 20),
  complaint_date  date,
  complaint       text check (char_length(complaint) <= 5000),
  location        text check (char_length(location) <= 300),
  remarks         text check (char_length(remarks) <= 2000),
  department      text,
  status          public.complaint_status not null default 'pending',
  attachments     jsonb not null default '[]'::jsonb,
  created_by      uuid references auth.users (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists complaints_status_idx      on public.complaints (status);
create index if not exists complaints_tehsil_idx      on public.complaints (tehsil);
create index if not exists complaints_department_idx  on public.complaints (department);
create index if not exists complaints_date_idx        on public.complaints (complaint_date desc);
create index if not exists complaints_created_at_idx  on public.complaints (created_at desc);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists complaints_set_updated_at on public.complaints;
create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ----------
-- Only signed-in complaint-cell staff can read or write complaints.
alter table public.complaints enable row level security;

drop policy if exists "staff can read complaints"   on public.complaints;
drop policy if exists "staff can create complaints" on public.complaints;
drop policy if exists "staff can update complaints" on public.complaints;
drop policy if exists "staff can delete complaints" on public.complaints;

create policy "staff can read complaints"   on public.complaints for select to authenticated using (true);
create policy "staff can create complaints" on public.complaints for insert to authenticated with check (true);
create policy "staff can update complaints" on public.complaints for update to authenticated using (true) with check (true);
create policy "staff can delete complaints" on public.complaints for delete to authenticated using (true);

-- ---------- Dashboard statistics ----------
-- Aggregates are computed in the database so the dashboard stays accurate
-- regardless of how many complaints exist.
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

grant execute on function public.complaint_stats() to authenticated;

-- ---------- Storage bucket for attachments ----------
-- Private bucket, 5 MB per file, images and PDFs only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-attachments',
  'complaint-attachments',
  false,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "staff can upload attachments" on storage.objects;
drop policy if exists "staff can read attachments"   on storage.objects;
drop policy if exists "staff can delete attachments" on storage.objects;

create policy "staff can upload attachments" on storage.objects
  for insert to authenticated with check (bucket_id = 'complaint-attachments');
create policy "staff can read attachments" on storage.objects
  for select to authenticated using (bucket_id = 'complaint-attachments');
create policy "staff can delete attachments" on storage.objects
  for delete to authenticated using (bucket_id = 'complaint-attachments');
