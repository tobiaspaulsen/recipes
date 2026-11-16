create table public.dinner_suggestions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null unique references public.recipes (id) on delete cascade,
  suggested_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.dinner_suggestions enable row level security;

-- Sign-ups are disabled, so "authenticated" means one of the accounts created by hand.
create policy "logged in users share dinner suggestions" on public.dinner_suggestions
  for all to authenticated using (true) with check (true);

alter publication supabase_realtime add table public.dinner_suggestions;
