import {
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  ArrowRight,
  CreditCard,
  Heart,
  Home as HomeIcon,
  Loader2,
  Menu,
  Minus,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import {
  useGetHome,
  useGetProduct,
  useGetWishlist,
  useListCategories,
  useListOrders,
  useListProducts,
} from "@workspace/api-client-react";

import type {
  Category,
  Product,
} from "@workspace/api-client-react";

import {
  Link,
  Redirect,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
  useParams,
} from "wouter";

import { useAuth, AuthProvider } from "@/lib/auth";
import { contactConfig } from "@/config/contact";

import {
  AccountPage,
  ContactPage,
  LoginPage,
} from "@/components/customer-pages";

import { AdminPage } from "@/components/admin-page";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./index.css";

const queryClient = new QueryClient();

const money = (value: unknown) => {
  const number = Number(value || 0);

  return `₦${Math.round(number).toLocaleString("en-NG")}`;
};

const fallbackImages = [
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&q=85",
  "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=900&q=85",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=85",
];

const getProductImage = (
  product: Product | Category | any,
  index = 0,
) => {
  return (
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    fallbackImages[index % fallbackImages.length]
  );
};

const img = (item: any, index = 0) => getProductImage(item, index);

type Order = {
  id: string | number;
  status?: unknown;
  total?: unknown;
  paymentMethod?: unknown;
  trackingNumber?: unknown;
  installmentFrequency?: unknown;
  nextPayment?: unknown;
  [key: string]: unknown;
};

type CartItem = {
  productId: string | number;
  quantity: number;
};

const readCart = (): CartItem[] => {
  try {
    const parsed = JSON.parse(
      localStorage.getItem("jao-cart") || "[]",
    );

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const addProductToCart = (productId: string | number) => {
  const existing = readCart();

  const found = existing.find(
    (item) => String(item.productId) === String(productId),
  );

  if (found) {
    found.quantity += 1;
  } else {
    existing.push({
      productId,
      quantity: 1,
    });
  }

  localStorage.setItem("jao-cart", JSON.stringify(existing));
  window.dispatchEvent(new Event("jao-cart-updated"));
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function useNotice() {
  const [message, setMessage] = useState("");

  const show = (text: string) => {
    setMessage(text);

    window.setTimeout(() => {
      setMessage("");
    }, 2500);
  };

  return {
    message,
    show,
  };
}

function Loading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

function Empty({
  title,
  description,
  message,
}: {
  title?: string;
  description?: string;
  message?: string;
}) {
  const heading = title || message || "Nothing here yet";

  return (
    <div className="rounded-[2rem] border border-neutral-200 p-10 text-center">
      <ShoppingBag className="mx-auto h-8 w-8" />

      <h2 className="mt-4 text-xl font-semibold">
        {heading}
      </h2>

      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
          {description}
        </p>
      )}
    </div>
  );
}

function QueryError({
  message = "Something went wrong.",
}: {
  message?: string;
}) {
  return (
    <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      {message}
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  link,
  action,
}: {
  eyebrow?: string;
  title: string;
  link?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>

      {action ? (
        action
      ) : link ? (
        <Link
          href={link}
          className="flex items-center gap-1 text-sm font-medium"
        >
          View all
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}

function Notice({
  message,
}: {
  message: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-black px-5 py-3 text-sm text-white shadow-xl">
      {message}
    </div>
  );
}

function Shell({
  children,
}: {
  children: ReactNode;
}) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved =
      localStorage.getItem("jao-lab-theme") || "dark";

    setTheme(saved);

    if (saved === "light") {
      document.documentElement.classList.remove("dark");
    } else if (saved === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      const dark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      document.documentElement.classList.toggle("dark", dark);
    }
  }, []);

  const changeTheme = (value: string) => {
    setTheme(value);
    localStorage.setItem("jao-lab-theme", value);

    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else if (value === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const dark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;

      document.documentElement.classList.toggle("dark", dark);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }

    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-[#0b0b0b] dark:text-white">
      <div className="border-b border-black/10 bg-black px-4 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-white dark:border-white/10">
        Complimentary Lagos delivery on orders over ₦150,000
        {" • "}
        Flexible JAO PLAN payment options
      </div>

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0b0b]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
              JL
            </div>

            <span className="hidden text-sm font-semibold sm:block">
              Jao Lab
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/shop"
              className={
                isActive("/shop")
                  ? "text-sm font-semibold"
                  : "text-sm text-neutral-500"
              }
            >
              Shop
            </Link>

            <Link
              href="/categories"
              className="text-sm text-neutral-500"
            >
              Categories
            </Link>

            <Link
              href="/contact"
              className="text-sm text-neutral-500"
            >
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/shop"
              className="rounded-full p-2"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Link>

            <select
              value={theme}
              onChange={(event) =>
                changeTheme(event.target.value)
              }
              className="hidden rounded-full border border-black/10 bg-transparent px-3 py-2 text-xs outline-none dark:border-white/10 sm:block"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>

            <Link
              href="/wishlist"
              className="hidden rounded-full p-2 sm:block"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
            </Link>

            <Link
              href="/account"
              className="rounded-full p-2"
              aria-label="Account"
            >
              <UserRound className="h-5 w-5" />
            </Link>

            <Link
              href="/cart"
              className="rounded-full p-2"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="rounded-full p-2 md:hidden"
              aria-label="Menu"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-black/10 px-4 py-5 dark:border-white/10 md:hidden">
            <div className="grid gap-4">
              <Link href="/shop">Shop</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/orders">Orders</Link>
              <Link href="/account">Account</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-black/10 dark:border-white/10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-xs font-bold text-white dark:bg-white dark:text-black">
                JL
              </div>

              <span className="font-semibold">
                Jao Lab
              </span>
            </div>

            <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-500">
              Fashion, accessories and lifestyle pieces selected
              for modern Nigerian shoppers.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Explore
            </p>

            <div className="mt-4 grid gap-3 text-sm text-neutral-500">
              <Link href="/shop">Shop</Link>
              <Link href="/categories">Categories</Link>
              <Link href="/wishlist">Wishlist</Link>
              <Link href="/orders">Orders</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Help
            </p>

            <div className="mt-4 grid gap-3 text-sm text-neutral-500">
              <Link href="/shipping">Shipping &amp; Returns</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/faq">FAQs</Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold">
              Contact
            </p>

            <div className="mt-4 grid gap-3 text-sm text-neutral-500">
              <span className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                WhatsApp / Call
              </span>

              <span>
                {(contactConfig as any)?.email ||
                  "Jao Lab Fashion & Styles"}
              </span>

              <span className="flex items-center gap-2">
                <InstagramIcon className="h-4 w-4" />
                @raymonjao0
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-black/10 px-4 py-5 text-center text-xs text-neutral-500 dark:border-white/10">
          © {new Date().getFullYear()} Jao Lab Fashion &amp;
          Styles. All rights reserved.
        </div>
      </footer>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 px-4 py-2 backdrop-blur-xl dark:border-white/10 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 p-2 text-[10px]"
          >
            <HomeIcon className="h-5 w-5" />
            Home
          </Link>

          <Link
            href="/shop"
            className="flex flex-col items-center gap-1 p-2 text-[10px]"
          >
            <Search className="h-5 w-5" />
            Shop
          </Link>

          <Link
            href="/wishlist"
            className="flex flex-col items-center gap-1 p-2 text-[10px]"
          >
            <Heart className="h-5 w-5" />
            Wishlist
          </Link>

          <Link
            href="/account"
            className="flex flex-col items-center gap-1 p-2 text-[10px]"
          >
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
  onWishlist,
}: {
  product: any;
  onWishlist?: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const { message, show } = useNotice();

  const addToCart = (event: ReactMouseEvent<HTMLButtonElement>) => {
    // The card sits inside a link, so stop the click from navigating.
    event.preventDefault();
    event.stopPropagation();

    addProductToCart(product.id);
    show("Added to cart");
  };

  return (
    <>
      <div className="group overflow-hidden rounded-3xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-950">
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 dark:bg-neutral-900">
          <img
            src={img(product)}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setLiked((value) => !value);
              onWishlist?.();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur dark:bg-black/70"
            aria-label="Wishlist"
          >
            <Heart
              className={`h-5 w-5 ${
                liked ? "fill-current" : ""
              }`}
            />
          </button>

          {product.discount ? (
            <div className="absolute left-3 top-3 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              -{product.discount}%
            </div>
          ) : null}
        </div>

        <div className="p-4">
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
            JAO LAB
          </p>

          <h3 className="line-clamp-2 min-h-[2.8rem] text-sm font-semibold">
            {product.name}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">
                {money(Number(product.price || 0))}
              </p>

              {product.originalPrice ? (
                <p className="text-xs text-neutral-400 line-through">
                  {money(Number(product.originalPrice))}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={addToCart}
              className="rounded-full bg-black px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <Notice message={message} />
    </>
  );
}

function Home() {
  const { data, isLoading, error } = useGetHome();

  const homeData: any = data;
  const featured: Product[] = homeData?.featured || [];
  const newest: Product[] = homeData?.newest || [];
  const categories: Category[] = homeData?.categories || [];

  return (
    <Shell>
      <main>
        <section className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-24">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
                Jao Lab Fashion & Styles
              </p>

              <h1 className="max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
                Wear your story.
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-400 md:text-lg">
                Discover fashion, accessories and everyday style
                essentials built for modern life.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
                >
                  Shop now
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </Link>

                <Link
                  href="/categories"
                  className="rounded-full border border-black/10 px-6 py-3 text-sm font-semibold dark:border-white/10"
                >
                  Explore categories
                </Link>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-neutral-100 dark:bg-neutral-900">
              <img
                src={fallbackImages[0]}
                alt="Jao Lab fashion"
                className="aspect-[4/5] h-full w-full object-cover"
              />

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 p-4 backdrop-blur dark:bg-black/75">
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                  JAO PLAN
                </p>
                <p className="mt-1 text-lg font-bold">
                  Flexible ways to pay
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
                    <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
              <Sparkles className="h-6 w-6" />
              <h3 className="mt-4 font-bold">
                Fresh styles
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Discover new fashion and lifestyle pieces.
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
              <Truck className="h-6 w-6" />
              <h3 className="mt-4 font-bold">
                Nationwide delivery
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Get your orders delivered to your preferred address.
              </p>
            </div>

            <div className="rounded-3xl border border-black/10 p-6 dark:border-white/10">
              <CreditCard className="h-6 w-6" />
              <h3 className="mt-4 font-bold">
                Flexible payment
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                Pay in full or choose an available JAO PLAN.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <SectionTitle
            eyebrow="Featured"
            title="Popular right now"
            action={
              <Link
                href="/shop"
                className="text-sm font-semibold"
              >
                View all
                <ArrowRight className="ml-1 inline h-4 w-4" />
              </Link>
            }
          />

          {isLoading ? (
            <Loading />
          ) : error ? (
            <QueryError />
          ) : featured.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {featured.slice(0, 8).map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                >
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No featured products yet." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <SectionTitle
            eyebrow="New arrivals"
            title="Fresh from Jao Lab"
            action={
              <Link
                href="/shop"
                className="text-sm font-semibold"
              >
                Shop everything
              </Link>
            }
          />

          {newest.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {newest.slice(0, 8).map((product: Product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                >
                  <ProductCard product={product} />
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No new products yet." />
          )}
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <div className="rounded-[2rem] bg-black p-8 text-white md:p-12 dark:bg-white dark:text-black">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] opacity-60">
                JAO PLAN
              </p>

              <h2 className="mt-3 text-3xl font-black md:text-5xl">
                Good things, in flexible payments.
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 opacity-70 md:text-base">
                Choose an eligible product and select an available
                installment option during your purchase.
              </p>

              <Link
                href="/shop"
                className="mt-7 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-black dark:bg-black dark:text-white"
              >
                Explore products
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6">
          <SectionTitle
            eyebrow="Explore"
            title="Shop by category"
          />

          {categories.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {categories.slice(0, 8).map((category: Category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.id}`}
                  className="group overflow-hidden rounded-3xl border border-black/10 dark:border-white/10"
                >
                  <img
                    src={img(category)}
                    alt={category.name}
                    className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  <div className="p-4">
                    <p className="font-semibold">
                      {category.name}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Explore collection
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Empty message="No categories available yet." />
          )}
        </section>
      </main>
    </Shell>
  );
}

function Shop() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useListProducts();

  const raw: any = data;
  const products: any[] = Array.isArray(raw)
    ? raw
    : raw?.items || raw?.products || [];

  const filtered = products.filter((product: Product) =>
    product.name
      ?.toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Jao Lab
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Shop
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-500 md:text-base">
            Explore fashion, accessories and lifestyle products
            from Jao Lab Fashion & Styles.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search products..."
              className="h-12 w-full rounded-full border border-black/10 bg-transparent pl-12 pr-4 outline-none focus:border-black dark:border-white/10 dark:focus:border-white"
            />
          </div>

          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-5 text-sm font-semibold dark:border-white/10"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </button>
        </div>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <QueryError />
        ) : filtered.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product: Product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
              >
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        ) : (
          <Empty message="No products found." />
        )}
      </main>
    </Shell>
  );
}

function ProductPage() {
  const params = useParams() as unknown as { id?: string };
  const id = params.id || "";

  const { data, isLoading, error } = useGetProduct(id);
  const { message, show } = useNotice();

  const product: any = data;

  const addToCart = () => {
    if (!product) return;

    addProductToCart(product.id);
    show("Added to cart");
  };

  if (isLoading) {
    return (
      <Shell>
        <Loading />
      </Shell>
    );
  }

  if (error || !product) {
    return (
      <Shell>
        <QueryError />
      </Shell>
    );
  }

  return (
    <Shell>
      <Notice message={message} />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] bg-neutral-100 dark:bg-neutral-900">
            <img
              src={img(product)}
              alt={product.name}
              className="aspect-square h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              JAO LAB
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 text-3xl font-bold">
              {money(Number(product.price || 0))}
            </p>

            {product.description ? (
              <p className="mt-6 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                {product.description}
              </p>
            ) : null}

            <div className="mt-8 grid gap-3">
              <button
                type="button"
                onClick={addToCart}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to cart
              </button>

              <button
                type="button"
                className="flex h-12 items-center justify-center gap-2 rounded-full border border-black/10 px-6 text-sm font-semibold dark:border-white/10"
              >
                Start Installment Plan
              </button>
            </div>

            <div className="mt-8 grid gap-3 border-t border-black/10 pt-6 text-sm dark:border-white/10">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                Secure shopping
              </div>

              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5" />
                Delivery available
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5" />
                Flexible payment options
              </div>
            </div>
          </div>
        </div>
      </main>
    </Shell>
  );
}

function CategoriesPage() {
  const { data, isLoading, error } = useListCategories();

  const raw: any = data;
  const categories: Category[] = Array.isArray(raw)
    ? raw
    : raw?.items || raw?.categories || [];

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Explore
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Categories
          </h1>
        </div>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <QueryError />
        ) : categories.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {categories.map((category: Category) => (
              <Link
                key={category.id}
                href={`/shop?category=${category.id}`}
                className="group overflow-hidden rounded-3xl border border-black/10 dark:border-white/10"
              >
                <img
                  src={img(category)}
                  alt={category.name}
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="p-5">
                  <h2 className="font-bold">
                    {category.name}
                  </h2>

                  <p className="mt-1 text-xs text-neutral-500">
                    Explore collection
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty message="No categories available yet." />
        )}
      </main>
    </Shell>
  );
}

function WishlistPage() {
  const { data, isLoading, error } = useGetWishlist();

  const raw: any = data;
  const items: any[] = Array.isArray(raw)
      ? raw
    : raw?.items || raw?.products || [];

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Saved
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Wishlist
          </h1>
        </div>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <QueryError />
        ) : items.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item: any) => {
              const product = item.product || item;

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                >
                  <ProductCard product={product} />
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty message="Your wishlist is empty." />
        )}
      </main>
    </Shell>
  );
}

function OrdersPage() {
  const { data, isLoading, error } = useListOrders();

  const raw: any = data;
  const orders: Order[] = Array.isArray(raw)
    ? raw
    : raw?.items || raw?.orders || [];

  return (
    <Shell>
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Account
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Orders
          </h1>
        </div>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <QueryError />
        ) : orders.length ? (
          <div className="grid gap-4">
            {orders.map((order: Order) => (
              <div
                key={order.id}
                className="rounded-3xl border border-black/10 p-5 dark:border-white/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
                      Order
                    </p>

                    <p className="mt-1 font-bold">
                      {order.id}
                    </p>
                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold dark:bg-neutral-900">
                    {String(order.status || "Pending")}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-neutral-500">
                      Total
                    </p>
                    <p className="mt-1 font-semibold">
                      {money(Number(order.total || 0))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Payment
                    </p>
                    <p className="mt-1 font-semibold">
                      {String(
                        order.paymentMethod || "Not specified",
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-500">
                      Tracking
                    </p>
                    <p className="mt-1 font-semibold">
                      {String(
                        order.trackingNumber || "Pending",
                      )}
                    </p>
                  </div>
                </div>

                {order.installmentFrequency ? (
                  <div className="mt-5 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-900">
                    <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
                      JAO PLAN
                    </p>

                    <p className="mt-2 text-sm font-semibold">
                      {String(order.installmentFrequency)}
                    </p>

                    {order.nextPayment ? (
                      <p className="mt-1 text-xs text-neutral-500">
                        Next payment:{" "}
                        {String(order.nextPayment)}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <Empty message="You have no orders yet." />
        )}
      </main>
    </Shell>
  );
}

function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCart = async () => {
      try {
        const saved = readCart();

        setCart(saved);

        const results: any[] = [];

        for (const item of saved) {
          try {
            const rawApiBase =
    (import.meta as any).env?.VITE_API_URL ||
    "https://jao-lab-fashion-api.onrender.com";

const apiBase = rawApiBase.endsWith("/api")
    ? rawApiBase
    : `${rawApiBase}/api`;

const response = await fetch(
    `${apiBase}/products/${item.productId}`,
);

            if (response.ok) {
              const product = await response.json();
              results.push(product);
            }
          } catch {
            // Ignore an unavailable product.
          }
        }

        setProducts(results);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const updateQuantity = (
    productId: string | number,
    quantity: number,
  ) => {
    const next = cart
      .map((item) =>
        String(item.productId) === String(productId)
          ? {
              ...item,
              quantity,
            }
          : item,
      )
      .filter((item) => item.quantity > 0);

    setCart(next);
    localStorage.setItem("jao-cart", JSON.stringify(next));
    window.dispatchEvent(new Event("jao-cart-updated"));
  };

  const removeItem = (productId: string | number) => {
    updateQuantity(productId, 0);
  };

  const total = cart.reduce((sum, item) => {
    const product = products.find(
      (p) => String(p.id) === String(item.productId),
    );

    return (
      sum +
      Number(product?.price || 0) * item.quantity
    );
  }, 0);

  if (loading) {
    return (
      <Shell>
        <Loading />
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
            Your selection
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-6xl">
            Cart
          </h1>
        </div>

        {!cart.length ? (
          <div className="rounded-[2rem] border border-black/10 p-10 text-center dark:border-white/10">
            <ShoppingBag className="mx-auto h-10 w-10 text-neutral-400" />

            <h2 className="mt-4 text-xl font-bold">
              Your cart is empty
            </h2>

            <p className="mt-2 text-sm text-neutral-500">
              Find something you like and add it to your cart.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="grid gap-4">
              {cart.map((item) => {
                const product = products.find(
                  (p) => String(p.id) === String(item.productId),
                );

                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex gap-4 rounded-3xl border border-black/10 p-4 dark:border-white/10"
                  >
                    <img
                      src={img(product)}
                      alt={product.name}
                      className="h-28 w-24 rounded-2xl object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold">
                        {product.name}
                      </h2>

                      <p className="mt-1 font-semibold">
                        {money(Number(product.price || 0))}
                      </p>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          className="rounded-full border border-black/10 p-2 dark:border-white/10"
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="min-w-8 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          className="rounded-full border border-black/10 p-2 dark:border-white/10"
                        >
                          <Plus className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeItem(item.productId)
                          }
                          className="ml-3 text-xs font-semibold text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="h-fit rounded-3xl border border-black/10 p-6 dark:border-white/10">
              <h2 className="text-xl font-bold">
                Order summary
              </h2>

              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  Subtotal
                </span>

                <span className="font-semibold">
                  {money(total)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  Delivery
                </span>

                <span className="font-semibold">
                  Calculated at checkout
                </span>
              </div>

              <div className="my-6 border-t border-black/10 dark:border-white/10" />

              <div className="flex items-center justify-between">
                <span className="font-bold">
                  Total
                </span>

                <span className="text-xl font-black">
                  {money(total)}
                </span>
              </div>

              <button
                type="button"
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-black px-6 text-sm font-semibold text-white dark:bg-white dark:text-black"
              >
                Proceed to checkout
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-neutral-500">
                Payment methods and installment options will
                appear during checkout.
              </p>
            </aside>
          </div>
        )}
      </main>
    </Shell>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const auth: any = useAuth();

  const authLoading = Boolean(auth?.isLoading ?? auth?.loading);
  const signedIn = Boolean(
    auth?.user ?? auth?.isAuthenticated ?? auth?.token,
  );

  if (authLoading) {
    return (
      <Shell>
        <Loading />
      </Shell>
    );
  }

  if (!signedIn) {
    return <Redirect to="/login" />;
  }
      <Route path="/admin" component={AdminPage} />


  return <>{children}</>;
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

      <Route path="/account">
        <RequireAuth>
          <AccountPage />
        </RequireAuth>
      </Route>

      <Route path="/login" component={LoginPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/about">
        <Shell>
          <main className="mx-auto max-w-4xl px-4 py-16 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-500">
              Jao Lab
            </p>

            <h1 className="mt-3 text-4xl font-black md:text-6xl">
              Fashion with your story in it.
            </h1>

            <p className="mt-6 text-base leading-8 text-neutral-600 dark:text-neutral-400">
              Jao Lab Fashion & Styles is built to make discovering
              and shopping for fashion and lifestyle products simple,
              modern and accessible.
            </p>
          </main>
        </Shell>
      </Route>

      <Route>
        <Shell>
          <main className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
            <h1 className="text-5xl font-black">
              Page not found
            </h1>

            <p className="mt-4 text-neutral-500">
              The page you are looking for does not exist.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-full bg-black px-6 py-3 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              Back home
            </Link>
          </main>
        </Shell>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <ErrorBoundary>
            <WouterRouter>
              <AppRoutes />
            </WouterRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
                    }
      
