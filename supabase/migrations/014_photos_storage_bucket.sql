-- PhotoCapture uploads to a `photos` storage bucket that never existed, so every
-- upload failed over to a base64 data URL stored inside the photos row: heavy
-- rows, a heavy pull, and a large photo risks failing the write and living on
-- one device only. Create the bucket with the same anon policies the documents
-- bucket already uses.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

create policy "photos_public_read" on storage.objects
  for select using (bucket_id = 'photos');

create policy "photos_anon_insert" on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "photos_anon_update" on storage.objects
  for update using (bucket_id = 'photos');

create policy "photos_anon_delete" on storage.objects
  for delete using (bucket_id = 'photos');
