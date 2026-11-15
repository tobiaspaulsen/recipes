-- Optional example recipes. Run in the Supabase SQL Editor after the recipes migration.

with r as (
  insert into public.recipes (title, language, servings, tags, prep_minutes, cook_minutes)
  values ('Weeknight chicken curry', 'en', 4, '{Kylling,Hverdag}', 10, 25)
  returning id
),
i as (
  insert into public.ingredients (recipe_id, position, quantity, unit, name, note)
  select r.id, v.* from r, (values
    (1, 600::numeric, 'g', 'chicken thighs', 'boneless'),
    (2, 2, 'stk', 'onions', 'sliced'),
    (3, 3, 'fedd', 'garlic', 'crushed'),
    (4, 1, 'ss', 'fresh ginger', 'grated'),
    (5, 2, 'ss', 'curry paste', null),
    (6, 1, 'boks', 'coconut milk', '400 ml'),
    (7, 1, 'boks', 'chopped tomatoes', null),
    (8, 1, 'ts', 'garam masala', null),
    (9, 4, 'dl', 'basmati rice', null),
    (10, null, null, 'salt', 'to taste')
  ) as v(position, quantity, unit, name, note)
)
insert into public.steps (recipe_id, position, text)
select r.id, v.* from r, (values
  (1, 'Fry the onions in a little oil over medium heat until soft, about 8 minutes.'),
  (2, 'Add garlic, ginger and curry paste. Cook for 1 minute until fragrant.'),
  (3, 'Add the chicken, coconut milk and tomatoes. Simmer for 20 minutes.'),
  (4, 'Stir in garam masala and season with salt. Serve with rice.')
) as v(position, text);

with r as (
  insert into public.recipes (title, language, servings, tags, prep_minutes, cook_minutes)
  values ('Tacokveld', 'no', 4, '{Kjøttdeig,Fredag}', 10, 15)
  returning id
),
i as (
  insert into public.ingredients (recipe_id, position, quantity, unit, name, note)
  select r.id, v.* from r, (values
    (1, 400::numeric, 'g', 'kjøttdeig', null),
    (2, 1, 'pakke', 'tacokrydder', null),
    (3, 1, 'pakke', 'tortillalefser', null),
    (4, 1, 'beger', 'rømme', null),
    (5, 2, 'stk', 'tomater', null),
    (6, 1, 'stk', 'agurk', null),
    (7, 150, 'g', 'revet ost', null)
  ) as v(position, quantity, unit, name, note)
)
insert into public.steps (recipe_id, position, text)
select r.id, v.* from r, (values
  (1, 'Brun kjøttdeigen i en stekepanne.'),
  (2, 'Tilsett tacokrydder og vann etter anvisning på pakken. La småkoke i 5 minutter.'),
  (3, 'Kutt tomater og agurk i terninger.'),
  (4, 'Varm lefsene og server med kjøttdeig, grønnsaker, ost og rømme.')
) as v(position, text);
