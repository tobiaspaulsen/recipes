-- Run once in the Supabase SQL Editor.

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  language text not null default 'no' check (language in ('no', 'en')),
  servings integer not null check (servings > 0),
  source_url text,
  image_path text,
  tags text[] not null default '{}',
  notes text,
  prep_minutes integer check (prep_minutes >= 0),
  cook_minutes integer check (cook_minutes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  section text,
  quantity numeric check (quantity > 0),
  unit text,
  name text not null check (length(trim(name)) > 0),
  note text,
  scalable boolean not null default true
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  text text not null check (length(trim(text)) > 0)
);

create index on public.ingredients (recipe_id, position);
create index on public.steps (recipe_id, position);

alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.steps enable row level security;

-- Sign-ups are disabled, so "authenticated" means one of the accounts created by hand.
create policy "logged in users share recipes" on public.recipes
  for all to authenticated using (true) with check (true);
create policy "logged in users share ingredients" on public.ingredients
  for all to authenticated using (true) with check (true);
create policy "logged in users share steps" on public.steps
  for all to authenticated using (true) with check (true);
