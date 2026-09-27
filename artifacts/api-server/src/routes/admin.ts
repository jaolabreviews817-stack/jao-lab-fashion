import { Router, type IRouter } from "express";
import { loadCatalog } from "../lib/catalog-db";
import { createSupabaseClient, getRequestUser } from "../lib/supabase";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any) {
  const user = await getRequestUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  const token = req.header("authorization").slice(7);
  const result = await createSupabaseClient(token).from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (result.error) {
    res.status(500).json({ error: "Unable to verify admin access" });
    return null;
  }
  if (result.data?.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return null;
  }
  return { user, token, client: createSupabaseClient(token) };
}

function fail(res: any, error: unknown) {
  console.error(error);
  res.status(500).json({ error: "Unable to complete the admin request" });
}

router.get("/admin/products", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try { res.json((await loadCatalog(admin.token)).products); } catch (error) { fail(res, error); }
});

router.post("/admin/products", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const body = req.body as Record<string, any>;
    if (!body.id || !body.name || !body.categoryId || body.price === undefined) {
      res.status(400).json({ error: "id, name, categoryId, and price are required" }); return;
    }
    const product = await admin.client.from("products").upsert({
      id: body.id, name: body.name, description: body.description || "", category_id: body.categoryId,
      subcategory: body.subcategory || "", price: Number(body.price), compare_at_price: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      featured: Boolean(body.featured), newest: Boolean(body.newest), trending: Boolean(body.trending),
      installment_available: Boolean(body.installmentAvailable), installment_amount: body.installmentAmount ? Number(body.installmentAmount) : null,
      tags: Array.isArray(body.tags) ? body.tags : [],
    });
    if (product.error) throw product.error;
    await admin.client.from("product_images").delete().eq("product_id", body.id);
    await admin.client.from("product_variants").delete().eq("product_id", body.id);
    const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [];
    if (imageUrls.length) {
      const images = await admin.client.from("product_images").insert(imageUrls.map((url: string, index: number) => ({ product_id: body.id, url, sort_order: index })));
      if (images.error) throw images.error;
    }
    const sizes = Array.isArray(body.sizes) && body.sizes.length ? body.sizes : [""];
    const colors = Array.isArray(body.colors) && body.colors.length ? body.colors : [""];
    const variantRows = sizes.flatMap((size: string) => colors.map((color: string) => ({ product_id: body.id, size, color, sku: `${body.id}-${size}-${color}`.toLowerCase().replaceAll(" ", "-") })));
    const variants = await admin.client.from("product_variants").insert(variantRows).select("id");
    if (variants.error) throw variants.error;
    if (variants.data?.length) {
      const inventory = await admin.client.from("inventory").upsert(variants.data.map((variant: any, index: number) => ({ product_variant_id: variant.id, quantity: index === 0 ? Number(body.stock || 0) : 0 })));
      if (inventory.error) throw inventory.error;
    }
    res.status(201).json((await loadCatalog(admin.token)).products.find((item) => item.id === body.id));
  } catch (error) { fail(res, error); }
});

router.patch("/admin/products/:id", async (req, res) => {
  req.body.id = req.params.id;
  // Product writes are idempotent, so editing uses the same validated path as adding.
  const body = req.body;
  req.body = body;
  res.locals.forwardProduct = true;
  // Keep this route explicit for clients that use PATCH while avoiding a second mapping.
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const result = await admin.client.from("products").update({
      name: body.name, description: body.description || "", category_id: body.categoryId, subcategory: body.subcategory || "",
      price: Number(body.price), compare_at_price: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      featured: Boolean(body.featured), newest: Boolean(body.newest), trending: Boolean(body.trending),
      installment_available: Boolean(body.installmentAvailable), installment_amount: body.installmentAmount ? Number(body.installmentAmount) : null, tags: body.tags || [],
    }).eq("id", req.params.id);
    if (result.error) throw result.error;
    res.json((await loadCatalog(admin.token)).products.find((item) => item.id === req.params.id));
  } catch (error) { fail(res, error); }
});

router.delete("/admin/products/:id", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const result = await admin.client.from("products").delete().eq("id", req.params.id);
    if (result.error) throw result.error;
    res.status(204).send();
  } catch (error) { fail(res, error); }
});

router.get("/admin/orders", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const orders = await admin.client.from("orders").select("*, profiles:user_id(email,full_name,phone)");
    if (orders.error) throw orders.error;
    const ids = (orders.data || []).map((order: any) => order.id);
    const items = ids.length ? await admin.client.from("order_items").select("*").in("order_id", ids) : { data: [], error: null };
    if (items.error) throw items.error;
    res.json((orders.data || []).map((order: any) => ({
      ...order,
      items: (items.data || []).filter((item: any) => item.order_id === order.id),
      customer: order.profiles,
    })));
  } catch (error) { fail(res, error); }
});

router.patch("/admin/orders/:id", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const allowed = ["status", "tracking_code", "courier", "fulfillment_notes", "expected_delivery"];
    const payload = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const result = await admin.client.from("orders").update(payload).eq("id", req.params.id).select("*").single();
    if (result.error) throw result.error;
    res.json(result.data);
  } catch (error) { fail(res, error); }
});

router.get("/admin/customers", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const profiles = await admin.client.from("profiles").select("id,email,full_name,phone,state,city,address,created_at,role").order("created_at", { ascending: false });
    if (profiles.error) throw profiles.error;
    const orders = await admin.client.from("orders").select("user_id,total,paid,remaining,status,created_at");
    if (orders.error) throw orders.error;
    res.json((profiles.data || []).map((profile: any) => {
      const customerOrders = (orders.data || []).filter((order: any) => order.user_id === profile.id);
      return { ...profile, orders: customerOrders, orderCount: customerOrders.length, outstanding: customerOrders.reduce((sum: number, order: any) => sum + Number(order.remaining), 0) };
    }));
  } catch (error) { fail(res, error); }
});

router.get("/admin/payments", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const result = await admin.client.from("payment_records").select("*, orders(id,user_id,full_name,email,total,remaining)");
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch (error) { fail(res, error); }
});

router.patch("/admin/payments/:id", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const status = req.body.status;
    if (!["pending", "approved", "rejected"].includes(status)) { res.status(400).json({ error: "Invalid payment status" }); return; }
    const result = await admin.client.from("payment_records").update({ status, notes: req.body.notes || "", reviewed_by: admin.user.id, reviewed_at: new Date().toISOString() }).eq("id", req.params.id).select("*").single();
    if (result.error) throw result.error;
    if (status === "approved") {
      const payment = result.data as any;
      const order = await admin.client.from("orders").select("paid,total,payment_method").eq("id", payment.order_id).single();
      if (order.error) throw order.error;
      const paid = Number(order.data.paid) + Number(payment.amount);
      const remaining = Math.max(0, Number(order.data.total) - paid);
      await admin.client.from("orders").update({ paid, remaining, status: remaining === 0 ? "confirmed" : "payment-verification" }).eq("id", payment.order_id);
    }
    res.json(result.data);
  } catch (error) { fail(res, error); }
});

router.get("/admin/payment-methods", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const result = await admin.client.from("payment_methods").select("*").order("sort_order");
    if (result.error) throw result.error;
    res.json(result.data || []);
  } catch (error) { fail(res, error); }
});

router.patch("/admin/payment-methods/:id", async (req, res) => {
  const admin = await requireAdmin(req, res); if (!admin) return;
  try {
    const result = await admin.client.from("payment_methods").update({ enabled: Boolean(req.body.enabled), instructions: req.body.instructions || "", name: req.body.name || req.params.id }).eq("id", req.params.id).select("*").single();
    if (result.error) throw result.error;
    res.json(result.data);
  } catch (error) { fail(res, error); }
});

export default router;