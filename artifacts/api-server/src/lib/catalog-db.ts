import type { Category, Product } from "@workspace/api-zod";
import { createSupabaseClient } from "./supabase";

type CategoryRow = {
  id: string;
  name: string;
  count: number;
  image: string;
  sort_order: number;
};

type ProductRow = {
  id: string;
  name: string;
  description: string;
  category_id: string;
  subcategory: string;
  price: number | string;
  compare_at_price: number | string | null;
  featured: boolean;
  newest: boolean;
  trending: boolean;
  installment_available: boolean;
  installment_amount: number | string | null;
  tags: string[];
};

type ImageRow = {
  product_id: string;
  url: string;
  sort_order: number;
};

type VariantRow = {
  id: number;
  product_id: string;
  size: string;
  color: string;
};

type InventoryRow = {
  product_variant_id: number;
  quantity: number;
};

export type Catalog = {
  categories: Category[];
  products: Product[];
  variants: VariantRow[];
};

function numberValue(value: number | string | null): number | null {
  return value === null ? null : Number(value);
}

export async function loadCatalog(accessToken?: string): Promise<Catalog> {
  const client = createSupabaseClient(accessToken);
  const [categoriesResult, productsResult, imagesResult, variantsResult, inventoryResult] =
    await Promise.all([
      client.from("categories").select("id,name,count,image,sort_order").order("sort_order"),
      client.from("products").select(
        "id,name,description,category_id,subcategory,price,compare_at_price,featured,newest,trending,installment_available,installment_amount,tags",
      ),
      client.from("product_images").select("product_id,url,sort_order").order("sort_order"),
      client.from("product_variants").select("id,product_id,size,color"),
      client.from("inventory").select("product_variant_id,quantity"),
    ]);

  const firstError = [
    categoriesResult.error,
    productsResult.error,
    imagesResult.error,
    variantsResult.error,
    inventoryResult.error,
  ].find(Boolean);
  if (firstError) throw firstError;

  const categoryRows = (categoriesResult.data || []) as CategoryRow[];
  const productRows = (productsResult.data || []) as ProductRow[];
  const imageRows = (imagesResult.data || []) as ImageRow[];
  const variantRows = (variantsResult.data || []) as VariantRow[];
  const inventoryRows = (inventoryResult.data || []) as InventoryRow[];
  const categoryById = new Map(categoryRows.map((category) => [category.id, category]));
  const imagesByProduct = new Map<string, ImageRow[]>();
  for (const image of imageRows) {
    const images = imagesByProduct.get(image.product_id) || [];
    images.push(image);
    imagesByProduct.set(image.product_id, images);
  }
  const variantsByProduct = new Map<string, VariantRow[]>();
  for (const variant of variantRows) {
    const variants = variantsByProduct.get(variant.product_id) || [];
    variants.push(variant);
    variantsByProduct.set(variant.product_id, variants);
  }
  const inventoryByVariant = new Map(
    inventoryRows.map((item) => [item.product_variant_id, item.quantity]),
  );

  const categories: Category[] = categoryRows.map((category) => ({
    id: category.id,
    name: category.name,
    count: category.count,
    image: category.image,
  }));
  const products: Product[] = productRows.map((row) => {
    const images = (imagesByProduct.get(row.id) || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.url);
    const variants = variantsByProduct.get(row.id) || [];
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: category?.name || row.category_id,
      subcategory: row.subcategory,
      price: Number(row.price),
      compareAtPrice: numberValue(row.compare_at_price),
      image: images[0] || "",
      images,
      sizes: [...new Set(variants.map((variant) => variant.size))],
      colors: [...new Set(variants.map((variant) => variant.color))],
      stock: variants.reduce(
        (total, variant) => total + (inventoryByVariant.get(variant.id) || 0),
        0,
      ),
      tags: row.tags || [],
      featured: row.featured,
      newest: row.newest,
      trending: row.trending,
      installmentAvailable: row.installment_available,
      installmentAmount: numberValue(row.installment_amount),
    };
  });

  return { categories, products, variants: variantRows };
}

export async function findVariant(
  accessToken: string,
  productId: string,
  size: string,
  color: string,
): Promise<VariantRow | null> {
  const client = createSupabaseClient(accessToken);
  const exact = await client
    .from("product_variants")
    .select("id,product_id,size,color")
    .eq("product_id", productId)
    .eq("size", size)
    .eq("color", color)
    .maybeSingle();
  if (exact.error) throw exact.error;
  if (exact.data) return exact.data as VariantRow;

  const fallback = await client
    .from("product_variants")
    .select("id,product_id,size,color")
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();
  if (fallback.error) throw fallback.error;
  return (fallback.data as VariantRow | null) || null;
}