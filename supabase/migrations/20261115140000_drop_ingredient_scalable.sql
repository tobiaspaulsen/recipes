-- Every amount scales; the editor no longer offers a fixed amount.
alter table public.ingredients drop column scalable;
