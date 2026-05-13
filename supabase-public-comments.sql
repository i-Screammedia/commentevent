create table if not exists public.public_comments (
  id bigint generated always as identity primary key,
  display_name text not null,
  message text not null,
  dedupe_key text not null unique,
  created_at timestamptz not null default now()
);

alter table public.public_comments enable row level security;

-- 누구나 읽기/쓰기 가능 (정적 사이트에서 공용 댓글용)
-- 금칙어/중복 방지는 프론트 + unique(dedupe_key)로 처리
drop policy if exists "public_comments_select" on public.public_comments;
create policy "public_comments_select"
on public.public_comments
for select
to anon, authenticated
using (true);

drop policy if exists "public_comments_insert" on public.public_comments;
create policy "public_comments_insert"
on public.public_comments
for insert
to anon, authenticated
with check (true);
