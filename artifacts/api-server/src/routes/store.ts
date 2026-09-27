import { Router, type IRouter } from "express";
import {
  AddWishlistItemParams,
  ClearCartResponse,
  CreateOrderBody,
  CreateOrderResponse,
  GetCartResponse,
  GetHomeResponse,
  GetOrderParams,
  GetOrderResponse,
  GetProductParams,
  GetProductResponse,
  GetProfileResponse,
  GetWishlistResponse,
  ListCategoriesResponse,
  ListOrdersResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  RemoveWishlistItemParams,
  ReplaceCartBody,
  ReplaceCartResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import type { CartLine, Order, Product } from "@workspace/api-zod";
import { loadCatalog, findVariant } from "../lib/catalog-db";
import { getRequestUser, createSupabaseClient } from "../lib/supabase";
import { makeTimeline } from "../lib/catalog";

const router: IRouter = Router();

async function requireUser(req: Parameters<IRouter["get"]>[1] extends never ? never : any, res: any) {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return user;
}

function sendServerError(res: any, error: unknown): void {
  console.error(error);
  res.status(500).json({ error: "Unable to complete the request" });
}

async function orderRows(accessToken: string, userId: string, id?: string) {
  const client = createSupabaseClient(accessToken);
  let query = client.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (id) query = query.eq("id", id);
  const ordersResult = await query;
  if (ordersResult.error) throw ordersResult.error;
  const rows = ordersResult.data || [];
  const ids = rows.map((row: any) => row.id);
  const itemsResult = ids.length
    ? await client.from("order_items").select("*").in("order_id", ids)
    : { data: [], error: null };
  if (itemsResult.error) throw itemsResult.error;
  const plansResult = ids.length
    ? await client.from("installment_plans").select("*").in("order_id", ids)
    : { data: [], error: null };
  if (plansResult.error) throw plansResult.error;
  const paymentHistoryResult = ids.length
    ? await client.from("payment_records").select("order_id,amount,status,reference,created_at").in("order_id", ids).order("created_at")
    : { data: [], error: null };
  if (paymentHistoryResult.error) throw paymentHistoryResult.error;
  return rows.map((row: any) => {
    const items = (itemsResult.data || [])
      .filter((item: any) => item.order_id === row.id)
      .map((item: any) => ({
        productId: item.product_id,
        productName: item.product_name,
        image: item.image,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        size: item.size,
        color: item.color,
      }));
    const status = row.status as Order["status"];
    const plan = (plansResult.data || []).find((item: any) => item.order_id === row.id) as any;
    return {
      id: row.id,
      items,
      total: Number(row.total),
      paid: Number(row.paid),
      remaining: Number(row.remaining),
      paymentMethod: row.payment_method,
      installmentFrequency: row.installment_frequency || null,
      status,
      createdAt: row.created_at,
      expectedDelivery: row.expected_delivery,
      address: `${row.address}, ${row.city}, ${row.state}`,
      nextPayment: plan?.next_payment_at || null,
      paymentHistory: (paymentHistoryResult.data || [])
        .filter((item: any) => item.order_id === row.id)
        .map((item: any) => ({ amount: Number(item.amount), date: item.created_at, status: item.status, reference: item.reference })),
      timeline: makeTimeline(status),
    } satisfies Order;
  });
}

async function readCart(accessToken: string, userId: string): Promise<{ items: CartLine[] }> {
  const client = createSupabaseClient(accessToken);
  let cartResult = await client.from("carts").select("id").eq("user_id", userId).maybeSingle();
  if (cartResult.error) throw cartResult.error;
  if (!cartResult.data) {
    cartResult = await client.from("carts").insert({ user_id: userId }).select("id").single();
    if (cartResult.error) throw cartResult.error;
  }
  const cartId = cartResult.data?.id;
  if (!cartId) throw new Error("Unable to create customer cart");
  const itemsResult = await client
    .from("cart_items")
    .select("product_variant_id,quantity")
    .eq("cart_id", cartId);
  if (itemsResult.error) throw itemsResult.error;
  const variantIds = (itemsResult.data || []).map((item: any) => item.product_variant_id);
  if (!variantIds.length) return { items: [] };
  const variantsResult = await client
    .from("product_variants")
    .select("id,product_id,size,color")
    .in("id", variantIds);
  if (variantsResult.error) throw variantsResult.error;
  const catalog = await loadCatalog(accessToken);
  const products = new Map(catalog.products.map((product) => [product.id, product]));
  const variants = new Map((variantsResult.data || []).map((variant: any) => [variant.id, variant]));
  return {
    items: (itemsResult.data || [])
      .map((item: any) => {
        const variant = variants.get(item.product_variant_id);
        const product = variant ? products.get(variant.product_id) : undefined;
        return product && variant
          ? { product, quantity: item.quantity, size: variant.size, color: variant.color }
          : null;
      })
      .filter(Boolean) as CartLine[],
  };
}

router.get("/home", async (_req, res): Promise<void> => {
  try {
    const catalog = await loadCatalog();
    res.json(GetHomeResponse.parse({
      featured: catalog.products.filter((product) => product.featured).slice(0, 4),
      newest: catalog.products.filter((product) => product.newest).slice(0, 4),
      categories: catalog.categories.slice(0, 6),
      announcement: "Complimentary delivery on orders over ₦150,000",
    }));
  } catch (error) { sendServerError(res, error); }
});

router.get("/categories", async (_req, res): Promise<void> => {
  try { res.json(ListCategoriesResponse.parse((await loadCatalog()).categories)); }
  catch (error) { sendServerError(res, error); }
});

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const { q, category, sort, minPrice, maxPrice } = parsed.data;
    const catalog = await loadCatalog();
    let result = catalog.products.filter((product) => {
      const matchesQuery = !q || [product.name, product.description, product.category, ...product.tags].join(" ").toLowerCase().includes(q.toLowerCase());
      const matchesCategory = !category || product.category.toLowerCase() === category.toLowerCase() || product.id === category.toLowerCase();
      return matchesQuery && matchesCategory && (minPrice === undefined || product.price >= minPrice) && (maxPrice === undefined || product.price <= maxPrice);
    });
    if (sort === "newest") result = result.sort((a, b) => Number(b.newest) - Number(a.newest));
    else if (sort === "price-low") result = result.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") result = result.sort((a, b) => b.price - a.price);
    else result = result.sort((a, b) => Number(b.featured) - Number(a.featured));
    res.json(ListProductsResponse.parse(result));
  } catch (error) { sendServerError(res, error); }
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const product = (await loadCatalog()).products.find((item) => item.id === parsed.data.id);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    res.json(GetProductResponse.parse(product));
  } catch (error) { sendServerError(res, error); }
});

router.get("/wishlist", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const client = createSupabaseClient(req.header("authorization")!.slice(7));
    const result = await client.from("wishlists").select("product_id").eq("user_id", user.id);
    if (result.error) throw result.error;
    const ids = new Set((result.data || []).map((item: any) => item.product_id));
    res.json(GetWishlistResponse.parse((await loadCatalog()).products.filter((product) => ids.has(product.id))));
  } catch (error) { sendServerError(res, error); }
});

router.post("/wishlist/:productId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = AddWishlistItemParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const product = (await loadCatalog()).products.find((item) => item.id === parsed.data.productId);
    if (!product) { res.status(404).json({ error: "Product not found" }); return; }
    const client = createSupabaseClient(req.header("authorization")!.slice(7));
    const result = await client.from("wishlists").upsert({ user_id: user.id, product_id: product.id });
    if (result.error) throw result.error;
    const wishlist = await client.from("wishlists").select("product_id").eq("user_id", user.id);
    if (wishlist.error) throw wishlist.error;
    const ids = new Set((wishlist.data || []).map((item: any) => item.product_id));
    res.json(GetWishlistResponse.parse((await loadCatalog()).products.filter((item) => ids.has(item.id))));
  } catch (error) { sendServerError(res, error); }
});

router.delete("/wishlist/:productId", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = RemoveWishlistItemParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const client = createSupabaseClient(req.header("authorization")!.slice(7));
    const result = await client.from("wishlists").delete().eq("user_id", user.id).eq("product_id", parsed.data.productId);
    if (result.error) throw result.error;
    const wishlist = await client.from("wishlists").select("product_id").eq("user_id", user.id);
    if (wishlist.error) throw wishlist.error;
    const ids = new Set((wishlist.data || []).map((item: any) => item.product_id));
    res.json(GetWishlistResponse.parse((await loadCatalog()).products.filter((item) => ids.has(item.id))));
  } catch (error) { sendServerError(res, error); }
});

router.get("/profile", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const client = createSupabaseClient(req.header("authorization")!.slice(7));
    const result = await client.from("profiles").select("id,email,full_name,phone,state,city,address").eq("id", user.id).single();
    if (result.error) throw result.error;
    res.json(GetProfileResponse.parse({ id: result.data.id, email: result.data.email, fullName: result.data.full_name, phone: result.data.phone, state: result.data.state, city: result.data.city, address: result.data.address }));
  } catch (error) { sendServerError(res, error); }
});

router.patch("/profile", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const client = createSupabaseClient(req.header("authorization")!.slice(7));
    const result = await client.from("profiles").update({
      full_name: parsed.data.fullName, phone: parsed.data.phone, state: parsed.data.state, city: parsed.data.city, address: parsed.data.address,
    }).eq("id", user.id).select("id,email,full_name,phone,state,city,address").single();
    if (result.error) throw result.error;
    res.json(UpdateProfileResponse.parse({ id: result.data.id, email: result.data.email, fullName: result.data.full_name, phone: result.data.phone, state: result.data.state, city: result.data.city, address: result.data.address }));
  } catch (error) { sendServerError(res, error); }
});

router.get("/cart", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try { res.json(GetCartResponse.parse(await readCart(req.header("authorization")!.slice(7), user.id))); }
  catch (error) { sendServerError(res, error); }
});

router.put("/cart", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = ReplaceCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const accessToken = req.header("authorization")!.slice(7);
    const client = createSupabaseClient(accessToken);
    let cart = await client.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    if (cart.error) throw cart.error;
    if (!cart.data) {
      cart = await client.from("carts").insert({ user_id: user.id }).select("id").single();
      if (cart.error) throw cart.error;
    }
    const cartId = cart.data?.id;
    if (!cartId) throw new Error("Unable to create customer cart");
    const variants = [];
    for (const item of parsed.data.items.filter((item) => item.quantity > 0)) {
      const variant = await findVariant(accessToken, item.productId, item.size, item.color);
      if (!variant) { res.status(400).json({ error: `Variant not found for ${item.productId}` }); return; }
      variants.push({ cart_id: cartId, product_variant_id: variant.id, quantity: item.quantity });
    }
    const cleared = await client.from("cart_items").delete().eq("cart_id", cartId);
    if (cleared.error) throw cleared.error;
    if (variants.length) {
      const inserted = await client.from("cart_items").insert(variants);
      if (inserted.error) throw inserted.error;
    }
    res.json(ReplaceCartResponse.parse(await readCart(accessToken, user.id)));
  } catch (error) { sendServerError(res, error); }
});

router.delete("/cart", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const accessToken = req.header("authorization")!.slice(7);
    const client = createSupabaseClient(accessToken);
    const cart = await client.from("carts").select("id").eq("user_id", user.id).maybeSingle();
    if (cart.error) throw cart.error;
    if (cart.data) {
      const result = await client.from("cart_items").delete().eq("cart_id", cart.data.id);
      if (result.error) throw result.error;
    }
    res.json(ClearCartResponse.parse({ items: [] }));
  } catch (error) { sendServerError(res, error); }
});

router.get("/orders", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try { res.json(ListOrdersResponse.parse(await orderRows(req.header("authorization")!.slice(7), user.id))); }
  catch (error) { sendServerError(res, error); }
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = GetOrderParams.safeParse(req.params);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const order = (await orderRows(req.header("authorization")!.slice(7), user.id, parsed.data.id))[0];
    if (!order) { res.status(404).json({ error: "Order not found" }); return; }
    res.json(GetOrderResponse.parse(order));
  } catch (error) { sendServerError(res, error); }
});

router.post("/orders", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  try {
    const accessToken = req.header("authorization")!.slice(7);
    const catalog = await loadCatalog(accessToken);
    const products = new Map(catalog.products.map((product) => [product.id, product]));
    const items = parsed.data.items.map((item) => {
      const product = products.get(item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      return { productId: product.id, productName: product.name, image: product.image, quantity: item.quantity, unitPrice: product.price, size: item.size, color: item.color };
    });
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const paymentMethod = parsed.data.paymentMethod;
    if (paymentMethod === "installment" && !parsed.data.installmentFrequency) {
      res.status(400).json({ error: "Choose a weekly or monthly installment schedule" });
      return;
    }
    const status: Order["status"] = paymentMethod === "bank-transfer" ? "payment-verification" : "pending";
    const id = `JLF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const nextPayment = paymentMethod === "installment"
      ? new Date(Date.now() + (parsed.data.installmentFrequency === "weekly" ? 7 : 30) * 24 * 60 * 60 * 1000)
      : null;
    const client = createSupabaseClient(accessToken);
    const created = await client.from("orders").insert({
      id, user_id: user.id, full_name: parsed.data.fullName, phone: parsed.data.phone, email: parsed.data.email,
      state: parsed.data.state, city: parsed.data.city, address: parsed.data.address, notes: parsed.data.notes,
      total, paid: 0, remaining: total, payment_method: paymentMethod, status,
      expected_delivery: paymentMethod === "installment" ? "After final payment" : "To be confirmed",
      installment_frequency: parsed.data.installmentFrequency,
      next_payment_at: nextPayment?.toISOString() || null,
    });
    if (created.error) throw created.error;
    const itemsResult = await client.from("order_items").insert(items.map((item) => ({
      order_id: id, product_id: item.productId, product_name: item.productName, image: item.image, quantity: item.quantity, unit_price: item.unitPrice, size: item.size, color: item.color,
    })));
    if (itemsResult.error) throw itemsResult.error;
    if (paymentMethod === "installment" && parsed.data.installmentFrequency) {
      const plan = await client.from("installment_plans").insert({
        order_id: id, frequency: parsed.data.installmentFrequency, total_amount: total, paid_amount: 0,
        remaining_amount: total, next_payment_at: nextPayment?.toISOString() || null, status: "active",
      }).select("id").single();
      if (plan.error) throw plan.error;
      const paymentAmount = Math.ceil(total / 3);
      const schedule = [0, 1, 2].map((index) => {
        const due = new Date(Date.now() + (parsed.data.installmentFrequency === "weekly" ? 7 : 30) * 24 * 60 * 60 * 1000 * (index + 1));
        return { plan_id: plan.data.id, amount: index === 2 ? total - paymentAmount * 2 : paymentAmount, due_at: due.toISOString(), status: "pending" };
      });
      const scheduleResult = await client.from("installment_payments").insert(schedule);
      if (scheduleResult.error) throw scheduleResult.error;
    }
    const order = (await orderRows(accessToken, user.id, id))[0];
    res.status(201).json(CreateOrderResponse.parse(order));
  } catch (error) { sendServerError(res, error); }
});

router.get("/admin/summary", async (req, res): Promise<void> => {
  const user = await requireUser(req, res); if (!user) return;
  try {
    const accessToken = req.header("authorization")!.slice(7);
    const client = createSupabaseClient(accessToken);
    const profile = await client.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile.error) throw profile.error;
    if (profile.data?.role !== "admin") { res.status(403).json({ error: "Admin access required" }); return; }
    const [ordersResult, profilesResult, catalog] = await Promise.all([
      client.from("orders").select("*").order("created_at", { ascending: false }),
      client.from("profiles").select("id"),
      loadCatalog(accessToken),
    ]);
    if (ordersResult.error) throw ordersResult.error;
    if (profilesResult.error) throw profilesResult.error;
    const orders = (ordersResult.data || []) as any[];
    const mapped = await Promise.all(orders.slice(0, 4).map((order) => orderRows(accessToken, order.user_id, order.id).then((items) => items[0])));
    const revenue = orders.reduce((sum, order) => sum + Number(order.paid), 0);
    res.json({
      revenue,
      revenueChange: 0,
      pendingOrders: orders.filter((order) => ["pending", "payment-verification"].includes(order.status)).length,
      customers: profilesResult.data?.length || 0,
      lowStock: catalog.products.filter((product) => product.stock <= 5).length,
      outstandingInstallments: orders.reduce((sum, order) => sum + Number(order.remaining), 0),
      recentOrders: mapped.filter(Boolean),
    });
  } catch (error) { sendServerError(res, error); }
});

export default router;