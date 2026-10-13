create table if not exists public.test_batches (
  id uuid primary key default gen_random_uuid(),
  note text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.test_codes (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.test_batches(id) on delete cascade,
  code text not null unique,
  used_count integer not null default 0 check (used_count between 0 and 3),
  created_at timestamptz not null default now()
);
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references public.test_codes(id),
  result_type text not null,
  score jsonb not null default '{}'::jsonb,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.test_batches enable row level security;
alter table public.test_codes enable row level security;
alter table public.test_results enable row level security;
