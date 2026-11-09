-- Run once in the Supabase SQL Editor.

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.shopping_items enable row level security;

-- Sign-ups are disabled, so "authenticated" means one of the accounts created by hand.
create policy "logged in users share the list" on public.shopping_items
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.shopping_items;
