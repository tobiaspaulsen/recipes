alter table public.shopping_items
  add column recipe_id uuid references public.recipes (id) on delete set null;
