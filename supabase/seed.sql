insert into public.categories (id, name, count, image, sort_order)
values
  ('new-arrivals', 'New Arrivals', 24, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85', 0),
  ('women', 'Women', 42, 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85', 1),
  ('men', 'Men', 31, 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1200&q=85', 2),
  ('footwear', 'Footwear', 18, 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85', 3),
  ('bags', 'Bags', 16, 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85', 4),
  ('accessories', 'Accessories', 28, 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1200&q=85', 5),
  ('beauty', 'Beauty', 12, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1200&q=85', 6),
  ('lifestyle', 'Lifestyle', 20, 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85', 7)
on conflict (id) do update set name = excluded.name, image = excluded.image, sort_order = excluded.sort_order;

insert into public.products (id, name, description, category_id, subcategory, price, compare_at_price, featured, newest, trending, installment_available, installment_amount, tags)
values
  ('sahara-sculpted-dress', 'Sahara Sculpted Dress', 'A fluid, sculpted silhouette cut in a softly structured crepe. Designed to hold its shape from first entrance to last light.', 'women', 'Dresses', 148000, 175000, true, true, true, true, 49333, array['new','occasion']),
  ('lagos-relaxed-shirt', 'Lagos Relaxed Shirt', 'An easy everyday layer with an architectural collar and a relaxed cut. Finished in a breathable cotton-linen blend.', 'men', 'Shirts', 68000, null, true, false, true, false, null, array['everyday','essential']),
  ('studio-leather-tote', 'Studio Leather Tote', 'A generous everyday tote in full-grain leather, made for a laptop, a second pair of shoes, and whatever the day asks of you.', 'bags', 'Totes', 95000, 112000, true, true, false, true, 31667, array['leather','work']),
  ('bloom-heeled-sandal', 'Bloom Heeled Sandal', 'A barely-there sandal with a considered curve and a softly squared toe. Made for late dinners and longer nights.', 'footwear', 'Heels', 72000, null, false, true, true, false, null, array['occasion','new']),
  ('linea-mini-hoops', 'Linea Mini Hoops', 'Light-catching sculptural hoops with a polished finish. An everyday signature with just enough presence.', 'accessories', 'Earrings', 32000, null, false, false, true, false, null, array['gift','essential']),
  ('after-hours-overshirt', 'After Hours Overshirt', 'A softly tailored overshirt for the space between dressed and undone. Cut to layer over a tee or a fine knit.', 'men', 'Outerwear', 118000, 135000, false, true, false, true, 39333, array['layering','limited']),
  ('muse-fragrance', 'Muse Eau de Parfum', 'A warm, skin-close scent built around iris, smoked woods, and a quiet trace of vanilla.', 'beauty', 'Fragrance', 55000, null, false, false, true, false, null, array['signature','gift']),
  ('forma-wide-trouser', 'Forma Wide Trouser', 'A long, elegant line with a high waist and a fluid drape. The pair that makes every top feel intentional.', 'women', 'Trousers', 89000, 104000, true, false, false, false, null, array['tailoring','new'])
on conflict (id) do update set name = excluded.name, description = excluded.description, category_id = excluded.category_id, subcategory = excluded.subcategory, price = excluded.price, compare_at_price = excluded.compare_at_price, featured = excluded.featured, newest = excluded.newest, trending = excluded.trending, installment_available = excluded.installment_available, installment_amount = excluded.installment_amount, tags = excluded.tags;

insert into public.product_images (product_id, url, sort_order)
values
  ('sahara-sculpted-dress','https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85',0),
  ('sahara-sculpted-dress','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',1),
  ('sahara-sculpted-dress','https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85',2),
  ('lagos-relaxed-shirt','https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=85',0),
  ('lagos-relaxed-shirt','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=1200&q=85',1),
  ('studio-leather-tote','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',0),
  ('studio-leather-tote','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=85',1),
  ('bloom-heeled-sandal','https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=85',0),
  ('bloom-heeled-sandal','https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=1200&q=85',1),
  ('linea-mini-hoops','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=85',0),
  ('after-hours-overshirt','https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=1200&q=85',0),
  ('after-hours-overshirt','https://images.unsplash.com/photo-1610652492500-ded49ceeb378?auto=format&fit=crop&w=1200&q=85',1),
  ('muse-fragrance','https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1200&q=85',0),
  ('forma-wide-trouser','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1200&q=85',0),
  ('forma-wide-trouser','https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',1)
on conflict (product_id, sort_order) do update set url = excluded.url;

insert into public.product_variants (product_id, size, color, sku)
select p.id, v.size, v.color, p.id || '-' || lower(replace(v.size || '-' || v.color, ' ', '-'))
from (values
  ('sahara-sculpted-dress','XS','Obsidian'),('sahara-sculpted-dress','S','Obsidian'),('sahara-sculpted-dress','M','Obsidian'),('sahara-sculpted-dress','L','Obsidian'),('sahara-sculpted-dress','XL','Obsidian'),('sahara-sculpted-dress','XS','Clay'),('sahara-sculpted-dress','S','Clay'),('sahara-sculpted-dress','M','Clay'),('sahara-sculpted-dress','L','Clay'),('sahara-sculpted-dress','XL','Clay'),
  ('lagos-relaxed-shirt','S','Ecru'),('lagos-relaxed-shirt','M','Ecru'),('lagos-relaxed-shirt','L','Ecru'),('lagos-relaxed-shirt','XL','Ecru'),('lagos-relaxed-shirt','XXL','Ecru'),('lagos-relaxed-shirt','S','Midnight'),('lagos-relaxed-shirt','M','Midnight'),('lagos-relaxed-shirt','L','Midnight'),('lagos-relaxed-shirt','XL','Midnight'),('lagos-relaxed-shirt','XXL','Midnight'),
  ('studio-leather-tote','One Size','Espresso'),('studio-leather-tote','One Size','Black'),
  ('bloom-heeled-sandal','36','Bone'),('bloom-heeled-sandal','37','Bone'),('bloom-heeled-sandal','38','Bone'),('bloom-heeled-sandal','39','Bone'),('bloom-heeled-sandal','40','Bone'),('bloom-heeled-sandal','41','Bone'),('bloom-heeled-sandal','36','Noir'),('bloom-heeled-sandal','37','Noir'),('bloom-heeled-sandal','38','Noir'),('bloom-heeled-sandal','39','Noir'),('bloom-heeled-sandal','40','Noir'),('bloom-heeled-sandal','41','Noir'),
  ('linea-mini-hoops','One Size','Gold'),('linea-mini-hoops','One Size','Silver'),
  ('after-hours-overshirt','S','Stone'),('after-hours-overshirt','M','Stone'),('after-hours-overshirt','L','Stone'),('after-hours-overshirt','XL','Stone'),('after-hours-overshirt','S','Olive'),('after-hours-overshirt','M','Olive'),('after-hours-overshirt','L','Olive'),('after-hours-overshirt','XL','Olive'),
  ('muse-fragrance','50ml','Original'),
  ('forma-wide-trouser','XS','Black'),('forma-wide-trouser','S','Black'),('forma-wide-trouser','M','Black'),('forma-wide-trouser','L','Black'),('forma-wide-trouser','XL','Black'),('forma-wide-trouser','XS','Sand'),('forma-wide-trouser','S','Sand'),('forma-wide-trouser','M','Sand'),('forma-wide-trouser','L','Sand'),('forma-wide-trouser','XL','Sand')
) as v(product_id, size, color)
join public.products p on p.id = v.product_id
on conflict (product_id, size, color) do update set sku = excluded.sku;

insert into public.inventory (product_variant_id, quantity)
select id, case product_id
  when 'sahara-sculpted-dress' then 8
  when 'lagos-relaxed-shirt' then 15
  when 'studio-leather-tote' then 5
  when 'bloom-heeled-sandal' then 11
  when 'linea-mini-hoops' then 24
  when 'after-hours-overshirt' then 4
  when 'muse-fragrance' then 19
  when 'forma-wide-trouser' then 9
  else 0
end
from public.product_variants
on conflict (product_variant_id) do update set quantity = excluded.quantity;