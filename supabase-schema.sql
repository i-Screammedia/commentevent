create table if not exists public.event_comments (
  id bigint generated always as identity primary key,
  school_name text not null,
  school_region text not null,
  contact text not null,
  nickname text not null,
  message text not null,
  agree boolean not null default true,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.event_comments enable row level security;

drop policy if exists "allow_insert_comments" on public.event_comments;
create policy "allow_insert_comments"
on public.event_comments
for insert
to anon, authenticated
with check (true);
