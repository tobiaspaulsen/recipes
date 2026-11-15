-- Public so photos load by URL and can be cached; file names are random uuids, so a photo can't be found without its link.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', true, 1048576, array['image/jpeg']);

-- Removing a file needs select as well as delete.
create policy "logged in users read recipe photos" on storage.objects
  for select to authenticated using (bucket_id = 'recipe-photos');
create policy "logged in users add recipe photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'recipe-photos');
create policy "logged in users remove recipe photos" on storage.objects
  for delete to authenticated using (bucket_id = 'recipe-photos');
