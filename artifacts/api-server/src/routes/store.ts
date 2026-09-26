import { Router, type IRouter } from "express";
import {
  AddWishlistItemParams,
  CreateOrderBody,
  GetProductParams,
  GetProductResponse,
  GetHomeResponse,
  GetWishlistResponse,
  ListCategoriesResponse,
  ListOrdersResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  GetOrderParams,
  GetOrderResponse,
  RemoveWishlistItemParams,
  GetAdminSummaryResponse,
  CreateOrderResponse,
} from "@workspace/api-zod";
import {
  categories,
  makeTimeline,
  orders,
  products,
  wishlistIds,
} from "../lib/catalog";
import type { Order } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/home", (_req, res): void => {
  const data = {
    featured: products.filter((product) => product.featured).slice(0, 4),
    newest: products.filter((product) => product.newest).slice(0, 4),
    categories: categories.slice(0, 6),
    announcement: "Complimentary delivery on orders over ₦150,000",
  };
  res.json(GetHomeResponse.parse(data));
});

router.get("/categories", (_req, res): void => {
  res.json(ListCategoriesResponse.parse(categories));
});

router.get("/products", (req, res): void => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, category, sort, minPrice, maxPrice } = parsed.data;
  let result = products.filter((product) => {
    const matchesQuery =
      !q ||
      [product.name, product.description, product.category, ...product.tags]
        .join(" ")
        .toLowerCase()
        .includes(q.toLowerCase());
    const matchesCategory =
      !category ||
      product.category.toLowerCase() === category.toLowerCase() ||
      product.id === category.toLowerCase();
    const matchesMin = minPrice === undefined || product.price >= minPrice;
    const matchesMax = maxPrice === undefined || product.price <= maxPrice;
    return matchesQuery && matchesCategory && matchesMin && matchesMax;
  });

  if (sort === "newest") {
    result = result.sort((a, b) => Number(b.newest) - Number(a.newest));
  } else if (sort === "price-low") {
    result = result.sort((a, b) => a.price - b.price);
  } else if (sort === "price-high") {
    result = result.sort((a, b) => b.price - a.price);
  } else {
    result = result.sort((a, b) => Number(b.featured) - Number(a.featured));
  }

  res.json(ListProductsResponse.parse(result));
});

router.get("/products/:id", (req, res): void => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = products.find((item) => item.id === parsed.data.id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(GetProductResponse.parse(product));
});

router.get("/wishlist", (_req, res): void => {
  const wishlist = products.filter((product) => wishlistIds.has(product.id));
  res.json(GetWishlistResponse.parse(wishlist));
});

router.post("/wishlist/:productId", (req, res): void => {
  const parsed = AddWishlistItemParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const product = products.find((item) => item.id === parsed.data.productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  wishlistIds.add(product.id);
  res.json(GetWishlistResponse.parse(products.filter((item) => wishlistIds.has(item.id))));
});

router.delete("/wishlist/:productId", (req, res): void => {
  const parsed = RemoveWishlistItemParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  wishlistIds.delete(parsed.data.productId);
  res.json(GetWishlistResponse.parse(products.filter((item) => wishlistIds.has(item.id))));
});

router.get("/orders", (_req, res): void => {
  res.json(ListOrdersResponse.parse(orders));
});

router.get("/orders/:id", (req, res): void => {
  const parsed = GetOrderParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const order = orders.find((item) => item.id === parsed.data.id);
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(GetOrderResponse.parse(order));
});

router.post("/orders", (req, res): void => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const total = parsed.data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0,
  );
  const paymentMethod = parsed.data.paymentMethod;
  const paid = paymentMethod === "installment" ? Math.ceil(total / 3) : 0;
  const status: Order["status"] =
    paymentMethod === "bank-transfer" ? "payment-verification" : "pending";
  const order: Order = {
    id: `JLF-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${String(orders.length + 1).padStart(2, "0")}`,
    items: parsed.data.items,
    total,
    paid,
    remaining: total - paid,
    paymentMethod,
    status,
    createdAt: "Sep 26, 2026",
    expectedDelivery: paymentMethod === "installment" ? "After final payment" : "Oct 1–2, 2026",
    address: `${parsed.data.address}, ${parsed.data.city}, ${parsed.data.state}`,
    timeline: makeTimeline(status),
  };
  orders.unshift(order);
  res.status(201).json(CreateOrderResponse.parse(order));
});

router.get("/admin/summary", (_req, res): void => {
  const data = {
    revenue: 4256000,
    revenueChange: 18.4,
    pendingOrders: orders.filter((order) =>
      ["pending", "payment-verification"].includes(order.status),
    ).length,
    customers: 286,
    lowStock: products.filter((product) => product.stock <= 5).length,
    outstandingInstallments: orders.reduce(
      (sum, order) => sum + order.remaining,
      0,
    ),
    recentOrders: orders.slice(0, 4),
  };
  res.json(GetAdminSummaryResponse.parse(data));
});

export default router;