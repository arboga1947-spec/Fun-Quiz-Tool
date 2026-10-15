-- Run this script in Supabase SQL Editor
create extension if not exists pgcrypto;
create table if not exists public.test_batches (id uuid primary key default gen_random_uuid(), note text not null default '', created_at timestamptz not null default now());
create table if not exists public.test_codes (id uuid primary key default gen_random_uuid(), batch_id uuid references public.test_batches(id) on delete cascade, code text not null unique, used_count integer not null default 0 check (used_count between 0 and 3), created_at timestamptz not null default now());
create table if not exists public.test_results (id uuid primary key default gen_random_uuid(), code_id uuid references public.test_codes(id), result_type text not null, score jsonb not null default '{}'::jsonb, answers jsonb not null default '[]'::jsonb, created_at timestamptz not null default now());
alter table public.test_batches enable row level security; alter table public.test_codes enable row level security; alter table public.test_results enable row level security;
drop policy if exists public_read_codes on public.test_codes; create policy public_read_codes on public.test_codes for select to anon using (true);
drop policy if exists public_update_codes on public.test_codes; create policy public_update_codes on public.test_codes for update to anon using (true) with check (used_count between 0 and 3);
drop policy if exists public_insert_batches on public.test_batches; create policy public_insert_batches on public.test_batches for insert to anon with check (true);
drop policy if exists public_read_batches on public.test_batches; create policy public_read_batches on public.test_batches for select to anon using (true);
drop policy if exists public_insert_codes on public.test_codes; create policy public_insert_codes on public.test_codes for insert to anon with check (true);
