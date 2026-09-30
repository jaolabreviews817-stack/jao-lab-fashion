import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  Heart,
  Home as HomeIcon,
  Loader2,
  LogIn,
  Menu,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  X,
  Check,
  SlidersHorizontal,
  WalletCards,
  ShieldCheck,
  Star,
  Tag,
  Clock3,
  MapPin,
  CreditCard,
  Gift,
} from "lucide-react";

import {
  useGetHome,
  useGetProduct,
  useGetWishlist,
  useAddWishlistItem,
  useRemoveWishlistItem,
  useListCategories,
  useListProducts,
  useListOrders,
  useCreateOrder,
} from "@workspace/api-client-react";

import type {
  Product,
  Category,
} from "@workspace/api-client-react";

import {
  Link,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from "wouter";

import { useAuth, AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import {
  AccountPage,
  ContactPage,
  LoginPage,
} from "@/components/customer-pages";

import { AdminPage } from "@/components/admin-page";

import { contactConfig } from "@/config/contact";

import "./index.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://jao-lab-fashion-api.onrender.com";

const money = (value: number) =>
  `₦${Math.round(Number(value || 0)).toLocaleString("en-NG")}`;

const fallbackImages = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1000&q=85",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1000&q=85",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=85",
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1000&q=85",
];

const getImage = (item: any, index = 0) =>
  item?.image ||
  item?.imageUrl ||
  item?.images?.[0] ||
  fallbackImages[index % fallbackImages.length];

function useNotice() {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return { notice, setNotice };
}

function Loading() {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin opacity-60" />
    </div>
  );
}

function Empty({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-10 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <Package className="mx-auto mb-4 h-10 w-10 opacity-40" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-60">{text}</p>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  link,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
}) {
  return (
    <div className="mb-7 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] opacity-50">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>

      {link && (
        <Link
          href={link}
          className="flex items-center gap-1 text-sm font-semibold opacity-70 hover:opacity-100"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function Shell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [location, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [menu, setMenu] = useState(false);

  const { user } = useAuth();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const value = search.trim();
    if (!value) return;
    navigate(`/shop?search=${encodeURIComponent(value)}`);
    setMenu(false);
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#111] dark:bg-[#090909] dark:text-white">
      <div className="bg-black px-4 py-2 text-center text-[11px] font-medium text-white dark:bg-white dark:text-black">
        Free Lagos delivery on orders over ₦150,000 • JAO LAB
      </div>

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f7f7f5]/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#090909]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <Link href="/" className="shrink-0">
            <div className="text-xl font-black tracking-tight">
              JAO<span className="opacity-40">LAB</span>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/" className="opacity-70 hover:opacity-100">
              Home
            </Link>
            <Link href="/shop" className="opacity-70 hover:opacity-100">
              Shop
            </Link>
            <Link href="/categories" className="opacity-70 hover:opacity-100">
              Categories
            </Link>
            <Link href="/contact" className="opacity-70 hover:opacity-100">
              Contact
            </Link>
          </nav>

          <form
            onSubmit={submitSearch}
            className="ml-auto hidden max-w-sm flex-1 items-center rounded-full border border-black/10 bg-white px-4 dark:border-white/10 dark:bg-white/[0.05] md:flex"
          >
            <Search className="h-4 w-4 opacity-50" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fashion, accessories..."
              className="w-full bg-transparent px-3 py-2 text-sm outline-none"
            />
          </form>

          <Link
            href={user ? "/account" : "/login"}
            className="hidden rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 md:block"
          >
            {user ? (
              <CircleUserRound className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
          </Link>

          <Link
            href="/wishlist"
            className="hidden rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10 md:block"
          >
            <Heart className="h-5 w-5" />
          </Link>

          <Link
            href="/cart"
            className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setMenu(!menu)}
            className="rounded-full p-2 md:hidden"
          >
            {menu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {menu && (
          <div className="border-t border-black/10 p-4 dark:border-white/10 md:hidden">
            <form onSubmit={submitSearch} className="mb-4 flex items-center rounded-2xl border px-4">
              <Search className="h-4 w-4 opacity-50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent px-3 py-3 outline-none"
              />
            </form>

            <div className="grid gap-1">
              {[
                ["/", "Home"],
                ["/shop", "Shop"],
                ["/categories", "Categories"],
                ["/wishlist", "Wishlist"],
                ["/orders", "Orders"],
                ["/account", "Account"],
                ["/contact", "Contact"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenu(false)}
                  className="rounded-xl px-3 py-3 font-medium hover:bg-black/5 dark:hover:bg-white/5"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-5 md:px-6 md:pb-12">
        {children}
      </main>

      <footer className="border-t border-black/10 dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <div className="text-xl font-black">
              JAO<span className="opacity-40">LAB</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-6 opacity-60">
              Fashion, accessories and everyday style. Discover pieces that
              fit your story.
            </p>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold">Explore</p>
            <div className="grid gap-2 text-sm opacity-65">
              <Link href="/shop">Shop</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/orders">Orders</Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold">Support</p>
            <div className="grid gap-2 text-sm opacity-65">
              <Link href="/contact">Contact</Link>
              <Link href="/account">My Account</Link>
              <span>Nationwide delivery</span>
              <span>Secure payments</span>
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-bold">Contact</p>
            <div className="grid gap-3 text-sm opacity-65">
              <span>📱 WhatsApp</span>
              <span>☎️ Call</span>
              <span>✉️ {contactConfig?.email || "Jao Lab Fashion & Styles"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 px-4 py-5 text-center text-xs opacity-50 dark:border-white/10">
          © {new Date().getFullYear()} Jao Lab Fashion & Styles. All rights
          reserved.
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-black/10 bg-[#f7f7f5]/95 px-4 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#090909]/95 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link href="/" className="flex flex-col items-center gap-1 p-2 text-[10px]">
            <HomeIcon className="h-5 w-5" />
            Home
          </Link>
          <Link href="/shop" className="flex flex-col items-center gap-1 p-2 text-[10px]">
            <Search className="h-5 w-5" />
            Shop
          </Link>
          <Link href="/wishlist" className="flex flex-col items-center gap-1 p-2 text-[10px]">
            <Heart className="h-5 w-5" />
            Saved
          </Link>
          <Link href="/orders" className="flex flex-col items-center gap-1 p-2 text-[10px]">
            <Package className="h-5 w-5" />
            Orders
          </Link>
          <Link href="/account" className="flex flex-col items-center gap-1 p-2 text-[10px]">
            <UserRound className="h-5 w-5" />
            Account
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { user } = useAuth();
  const { data: wishlist } = useGetWishlist({
    query: { enabled: !!user },
  } as any);

  const addWishlist = useAddWishlistItem();
  const removeWishlist = useRemoveWishlistItem();

  const [liked, setLiked] = useState(false);

  const productId = (product as any).id;

  useEffect(() => {
    const items = (wishlist as any)?.items || [];
    setLiked(
      items.some(
        (item: any) =>
          item.productId === productId || item.product?.id === productId
      )
    );
  }, [wishlist, productId]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    try {
      if (liked) {
        await (removeWishlist as any).mutateAsync({
          productId,
        });
        setLiked(false);
      } else {
        await (addWishlist as any).mutateAsync({
          productId,
        });
        setLiked(true);
      }
    } catch {
      // Keep UI stable if backend rejects duplicate requests.
    }
  }

  const price = Number(
    (product as any).price ||
      (product as any).salePrice ||
      (product as any).amount ||
      0
  );

  const oldPrice = Number(
    (product as any).compareAtPrice ||
      (product as any).originalPrice ||
      0
  );

  const discount =
    oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <Link href={`/product/${productId}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-black/[0.04] dark:bg-white/[0.04]">
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={getImage(product, index)}
            alt={(product as any).name || "Jao Lab product"}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-black px-2.5 py-1 text-[10px] font-bold text-white dark:bg-white dark:text-black">
            -{discount}%
          </span>
        )}

        <button
          onClick={toggleWishlist}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-black shadow-sm backdrop-blur dark:bg-black/80 dark:text-white"
        >
          <Heart
            className={`h-4 w-4 ${liked ? "fill-current" : ""}`}
          />
        </button>
      </div>

      <div className="px-1 pt-3">
        <h3 className="line-clamp-1 text-sm font-semibold">
          {(product as any).name || "Jao Lab Product"}
        </h3>

        <div className="mt-1 flex items-center gap-2">
          <span className="font-bold">{money(price)}</span>

          {oldPrice > price && (
            <span className="text-xs line-through opacity-40">
              {money(oldPrice)}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-1 text-[11px] opacity-55">
          <Star className="h-3 w-3 fill-current" />
          <span>{(product as any).rating || "New"}</span>
        </div>
      </div>
    </Link>
  );
}

function Home() {
  const { data, isLoading } = useGetHome();

  if (isLoading) return <Loading />;

  const home: any = data || {};
  const featured: Product[] =
    home.featuredProducts ||
    home.featured ||
    home.products ||
    [];

  const newest: Product[] =
    home.newestProducts ||
    home.newest ||
    [];

  const categories: Category[] =
    home.categories || [];

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] bg-black text-white">
        <div className="absolute inset-0">
          <img
            src={fallbackImages[0]}
            className="h-full w-full object-cover opacity-45"
            alt=""
          />
        </div>

        <div className="relative grid min-h-[520px] items-end p-7 md:min-h-[600px] md:p-12">
          <div className="max-w-2xl">
            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-75">
              <Sparkles className="h-4 w-4" />
              Jao Lab Fashion & Styles
            </div>

            <h1 className="text-5xl font-black leading-[0.9] tracking-[-0.05em] md:text-8xl">
              Wear
              <br />
              your story.
            </h1>

            <p className="mt-6 max-w-md text-sm leading-6 text-white/70 md:text-base">
              Discover fashion and accessories selected for people who want
              their everyday style to stand out.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-full bg-white px-6 py-3 text-sm font-bold text-black"
              >
                Shop now
              </Link>

              <Link
                href="/categories"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold"
              >
                Explore categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <Truck className="mb-4 h-5 w-5" />
          <h3 className="font-bold">Nationwide delivery</h3>
          <p className="mt-1 text-xs opacity-55">
            Get your order delivered to your location.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <WalletCards className="mb-4 h-5 w-5" />
          <h3 className="font-bold">Flexible payment</h3>
          <p className="mt-1 text-xs opacity-55">
            Pay in full or choose an available JAO Plan.
          </p>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <ShieldCheck className="mb-4 h-5 w-5" />
          <h3 className="font-bold">Secure shopping</h3>
          <p className="mt-1 text-xs opacity-55">
            Your account and orders stay protected.
          </p>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="mt-16">
          <SectionTitle
            eyebrow="Browse"
            title="Shop by category"
            link="/categories"
          />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {categories.slice(0, 8).map((category: any, index) => (
              <Link
                key={category.id || index}
                href={`/shop?category=${encodeURIComponent(
                  category.slug || category.name || ""
                )}`}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-black"
              >
                <img
                  src={getImage(category, index)}
                  alt={category.name}
                  className="h-full w-full object-cover opacity-70 transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 to-transparent p-4">
                  <span className="font-bold text-white">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-16">
          <SectionTitle
            eyebrow="Trending"
            title="Featured picks"
            link="/shop"
          />

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {featured.slice(0, 8).map((product, index) => (
              <ProductCard
                key={(product as any).id || index}
                product={product}
                index={index}
              />
            ))}
          </div>
        </section>
      )}

      {newest.length > 0 && (
        <section className="mt-16">
          <SectionTitle
            eyebrow="Just in"
            title="New arrivals"
            link="/shop"
          />

          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4">
            {newest.slice(0, 8).map((product, index) => (
              <ProductCard
                key={(product as any).id || index}
                product={product}
                index={index + 2}
              />
          ))}
        </div>
      </section>
    )}

    <section className="mt-16 overflow-hidden rounded-[2rem] bg-black p-8 text-white md:p-12">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-white/60">
          JAO PLAN
        </p>
        <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
          Good things, in three.
        </h2>
        <p className="mt-4 max-w-xl text-white/70">
          Pay one third today, then complete the remaining payments according
          to your selected installment plan.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
        >
          Shop with JAO PLAN
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>

    <section className="mt-16">
      <SectionTitle
        eyebrow="Categories"
        title="Explore the edit"
        link="/categories"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {data.categories?.slice(0, 4).map((category, index) => (
          <Link
            key={(category as any).id || index}
            href={`/shop?category=${encodeURIComponent(
              (category as any).slug || (category as any).name || ""
            )}`}
            className="group overflow-hidden rounded-[1.5rem] bg-neutral-100"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={img(category, index)}
                alt={(category as any).name || "Category"}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex items-center justify-between p-4">
              <span className="font-medium">
                {(category as any).name}
              </span>
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  </main>
);

function Shop() {
  const { data, isLoading, error } = useListProducts();
  const products = data?.products || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <SectionTitle
        eyebrow="Shop"
        title="The Jao Lab edit"
      />

      {isLoading && <Loading />}

      {error && <QueryError message="Unable to load products." />}

      {!isLoading && !error && products.length === 0 && (
        <Empty title="No products yet" />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {products.map((product, index) => (
          <ProductCard
            key={(product as any).id || index}
            product={product}
            index={index}
          />
        ))}
      </div>
    </main>
  );
}

function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetProduct(id);

  const product = data?.product;

  if (isLoading) return <Loading />;
  if (error || !product) {
    return <QueryError message="Product could not be found." />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-[2rem] bg-neutral-100">
          <img
            src={img(product, 0)}
            alt={product.name}
            className="aspect-square h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            JAO LAB
          </p>

          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            {product.name}
          </h1>

          <p className="mt-5 text-2xl font-medium">
            {money(Number(product.price || 0))}
          </p>

          {product.description && (
            <p className="mt-6 leading-7 text-neutral-600">
              {product.description}
            </p>
          )}

          <div className="mt-8 grid gap-3">
            <button
              type="button"
              onClick={() => {
                const cart = JSON.parse(
                  localStorage.getItem("jao-lab-cart") || "[]"
                );

                const existing = cart.find(
                  (item: any) => item.productId === (product as any).id
                );

                if (existing) {
                  existing.quantity += 1;
                } else {
                  cart.push({
                    productId: (product as any).id,
                    product,
                    quantity: 1,
                  });
                }

                localStorage.setItem(
                  "jao-lab-cart",
                  JSON.stringify(cart)
                );

                window.dispatchEvent(new Event("storage"));
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-black px-6 py-4 text-sm font-medium text-white"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to cart
            </button>

            <Link
              href="/cart"
              className="flex w-full items-center justify-center rounded-full border border-black px-6 py-4 text-sm font-medium"
            >
              View cart
            </Link>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-neutral-100 p-4">
              <ShieldCheck className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">
                Secure checkout
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Multiple payment options available.
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-100 p-4">
              <WalletCards className="h-5 w-5" />
              <p className="mt-3 text-sm font-medium">
                JAO PLAN
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Choose an installment option during checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function CategoriesPage() {
  const { data, isLoading } = useListCategories();
  const categories = data?.categories || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <SectionTitle
        eyebrow="Categories"
        title="Shop by category"
      />

      {isLoading && <Loading />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {categories.map((category, index) => (
          <Link
            key={(category as any).id || index}
            href={`/shop?category=${encodeURIComponent(
              (category as any).slug || (category as any).name || ""
            )}`}
            className="group overflow-hidden rounded-[1.5rem] bg-neutral-100"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={img(category, index)}
                alt={(category as any).name || "Category"}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-4 font-medium">
              {(category as any).name}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

function WishlistPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Heart className="mx-auto h-10 w-10" />
        <h1 className="mt-5 text-2xl font-semibold">
          Sign in to view your wishlist
        </h1>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm text-white"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data, isLoading } = useGetWishlist();

  const items = data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <SectionTitle
        eyebrow="Saved"
        title="Your wishlist"
      />

      {isLoading && <Loading />}

      {!isLoading && items.length === 0 && (
        <Empty title="Your wishlist is empty" />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item: any, index: number) => (
          <ProductCard
            key={item.id || index}
            product={item.product || item}
            index={index}
          />
        ))}
      </div>
    </main>
  );
}

function OrdersPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <Package className="mx-auto h-10 w-10" />
        <h1 className="mt-5 text-2xl font-semibold">
          Sign in to view your orders
        </h1>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm text-white"
        >
          Sign in
        </Link>
      </main>
    );
  }

  const { data, isLoading, error } = useListOrders();

  const orders = data?.orders || [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <SectionTitle
        eyebrow="Account"
        title="Your orders"
      />

      {isLoading && <Loading />}

      {error && <QueryError message="Unable to load orders." />}

      {!isLoading && !error && orders.length === 0 && (
        <Empty title="No orders yet" />
      )}

      <div className="space-y-4">
        {orders.map((order: any, index: number) => (
          <div
            key={order.id || order.orderNumber || index}
            className="rounded-3xl border border-neutral-200 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Order
                </p>
                <p className="mt-1 font-medium">
                  {order.orderNumber || order.id}
                </p>
              </div>

              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">
                {order.status || "Pending"}
              </span>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-neutral-500">
                Total
              </span>
              <span className="font-semibold">
                {money(Number(order.total || order.totalAmount || 0))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

function CartPage() {
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const loadCart = () => {
      try {
        setCart(
          JSON.parse(
            localStorage.getItem("jao-lab-cart") || "[]"
          )
        );
      } catch {
        setCart([]);
      }
    };

    loadCart();
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("storage", loadCart);
    };
  }, []);

  const total = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.product?.price || 0) *
        Number(item.quantity || 1),
    0
  );

  const updateQuantity = (index: number, quantity: number) => {
    const next = [...cart];

    if (quantity <= 0) {
      next.splice(index, 1);
    } else {
      next[index] = {
        ...next[index],
        quantity,
      };
    }

    setCart(next);
    localStorage.setItem("jao-lab-cart", JSON.stringify(next));
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
      <SectionTitle
        eyebrow="Shopping bag"
        title="Your cart"
      />

      {cart.length === 0 ? (
        <Empty title="Your cart is empty" />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {cart.map((item, index) => (
              <div
                key={item.product?.id || index}
                className="flex gap-4 rounded-3xl border border-neutral-200 p-4"
              >
                <img
                  src={img(item.product, index)}
                  alt={item.product?.name || "Product"}
                  className="h-28 w-24 rounded-2xl object-cover"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">
                    {item.product?.name}
                  </h3>

                  <p className="mt-1 text-sm text-neutral-500">
                    {money(Number(item.product?.price || 0))}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          index,
                          Number(item.quantity || 1) - 1
                        )
                      }
                      className="rounded-full border p-2"
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    <span className="min-w-5 text-center text-sm">
                      {item.quantity || 1}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(
                          index,
                          Number(item.quantity || 1) + 1
                        )
                      }
                      className="rounded-full border p-2"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-3xl bg-neutral-100 p-6">
            <h2 className="text-xl font-semibold">
              Order summary
            </h2>

            <div className="mt-6 flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span className="font-medium">{money(total)}</span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-neutral-500">Delivery</span>
              <span className="text-sm">Calculated at checkout</span>
            </div>

            <div className="my-5 border-t border-neutral-300" />

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            <Link
              href="/login"
              className="mt-6 flex w-full items-center justify-center rounded-full bg-black px-6 py-4 text-sm font-medium text-white"
            >
              Continue to checkout
            </Link>

            <p className="mt-3 text-center text-xs text-neutral-500">
              Installment options can be selected during checkout.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={ProductPage} />
      <Route path="/categories" component={CategoriesPage} />
      <Route path="/wishlist" component={WishlistPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/cart" component={CartPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/account" component={AccountPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/admin" component={AdminPage} />
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <TooltipProvider>
          <AuthProvider>
            <WouterRouter>
              <Shell>
                <AppRoutes />
              </Shell>
            </WouterRouter>

            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
          }
