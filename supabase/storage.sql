insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true), ('payment-receipts', 'payment-receipts', false)
on conflict (id) do update set public = excluded.public;

create policy "admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

create policy "public can view product images"
on storage.objects for select to public
using (bucket_id = 'product-images');

create policy "customers can upload receipts"
on storage.objects for insert to authenticated
with check (bucket_id = 'payment-receipts' and owner_id = auth.uid()::text);

create policy "customers can view their receipts"
on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and owner_id = auth.uid()::text);

create policy "admins can review receipts"
on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin());