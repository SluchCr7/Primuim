"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowRight, Heart, Search, ShoppingBag, Sparkles } from "lucide-react";
import {
  useAddToCartMutation,
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from "@/redux/api";
import { useAppSelector } from "@/lib/store";
import { addGuestCartItem } from "@/lib/cartUtils";
import { formatPrice } from "@/lib/currencyUtils";
import { StoreCategory, StoreProduct } from "@/lib/types";
import { useToast } from "./Toast";

type HomeProduct = StoreProduct & {
  variants?: Array<{ sku?: string }>;
};

interface WishlistItem {
  product?: { _id?: string } | null;
}

const categoryImageRules: Array<[RegExp, string]> = [
  [/fashion|clothing|apparel|wear/i, "/categoriesFolder/fashion.jpg"],
  [/beauty|cosmetic|skin/i, "/categoriesFolder/Beauty.jpg"],
  [/book|stationery/i, "/categoriesFolder/Books.jpg"],
  [/home|kitchen|living/i, "/categoriesFolder/Home&Kitchen.jpg"],
  [/sport|fitness/i, "/categoriesFolder/Sports.jpg"],
  [/baby|toy|child/i, "/categoriesFolder/Baby & Toys.avif"],
  [/market|grocery|food/i, "/categoriesFolder/Supermarker.jpg"],
  [/phone|mobile/i, "/categoriesFolder/smartPhones.jpg"],
  [/electronic|technology|tech/i, "/categoriesFolder/electronics.jpg"],
];

function getCategoryImage(category: StoreCategory) {
  if (category.image?.trim()) return category.image;
  return categoryImageRules.find(([pattern]) => pattern.test(category.name))?.[1] ?? null;
}

function getProductHref(product: StoreProduct) {
  return product.slug ? `/product/${product.slug}` : `/products/${product._id}`;
}

function ProductCard({
  product,
  currency,
  isAuthenticated,
  isOwner,
  isWishlisted,
  isAdding,
  onAdd,
  onWishlist,
}: {
  product: HomeProduct;
  currency: "EGP" | "USD" | "EUR";
  isAuthenticated: boolean;
  isOwner: boolean;
  isWishlisted: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onWishlist: () => void;
}) {
  const image = product.images?.[0]?.url;
  const hasVariants = Boolean(product.variants?.length);
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round((1 - product.price / product.comparePrice) * 100)
      : null;

  if (!image) return null;

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted-light">
        <Link href={getProductHref(product)} className="absolute inset-0">
          <Image
            src={image}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 24vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
          />
        </Link>
        {discount !== null && (
          <span className="absolute left-3 top-3 bg-foreground px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-background">
            {discount}% off
          </span>
        )}
        {isAuthenticated && (
          <button
            type="button"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={isWishlisted}
            onClick={onWishlist}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground transition-colors hover:bg-background"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current text-gold" : ""}`} />
          </button>
        )}
        {isOwner ? (
          <span className="absolute inset-x-3 bottom-3 bg-background/95 px-3 py-3 text-center text-xs text-muted">
            Your listing
          </span>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={isAdding || outOfStock || hasVariants}
            className="absolute inset-x-3 bottom-3 flex min-h-11 items-center justify-center gap-2 bg-background/95 px-3 text-xs font-medium uppercase tracking-[0.16em] text-foreground opacity-100 transition-colors hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-70 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          >
            {isAdding ? (
              "Adding…"
            ) : hasVariants ? (
              "Options unavailable"
            ) : outOfStock ? (
              "Out of stock"
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Add to bag
              </>
            )}
          </button>
        )}
      </div>

      <div className="pt-4">
        {product.brand && (
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">{product.brand}</p>
        )}
        <Link
          href={getProductHref(product)}
          className="mt-1 block line-clamp-2 min-h-12 font-serif text-base leading-6 text-foreground transition-colors hover:text-gold"
        >
          {product.title}
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium">{formatPrice(product.price, currency)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-muted line-through">
              {formatPrice(product.comparePrice, currency)}
            </span>
          )}
        </div>
        {hasVariants && (
          <p className="mt-2 text-xs text-muted">Variant purchasing is temporarily unavailable.</p>
        )}
      </div>
    </article>
  );
}

export default function PremiumHomePage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { showToast } = useToast();
  const { isAuthenticated, currency, user } = useAppSelector((state) => state.auth);
  const activeCurrency = (currency || "EGP") as "EGP" | "USD" | "EUR";
  const [search, setSearch] = useState("");
  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const { data: categoryData, isLoading: categoriesLoading, isError: categoriesError } =
    useGetCategoriesQuery(undefined);
  const { data: productData, isLoading: productsLoading, isError: productsError } =
    useGetProductsQuery({ limit: 8, sort: "newest" });
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [addToCart] = useAddToCartMutation();
  const [toggleWishlist] = useToggleWishlistMutation();

  const categories = useMemo(
    () =>
      ((categoryData?.categories || []) as StoreCategory[])
        .map((category) => ({ category, image: getCategoryImage(category) }))
        .filter((item): item is { category: StoreCategory; image: string } => Boolean(item.image))
        .slice(0, 6),
    [categoryData]
  );
  const products = useMemo(
    () =>
      ((productData?.products || []) as HomeProduct[])
        .filter((product) => Boolean(product.images?.[0]?.url))
        .slice(0, 4),
    [productData]
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    if (query) router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const addProduct = async (product: HomeProduct) => {
    if (product.variants?.length) {
      showToast("Variant purchasing is temporarily unavailable.", "error");
      return;
    }

    const sellerId = product.seller?._id || product.seller;
    if (user?.id && sellerId?.toString() === user.id) {
      showToast("You cannot add your own product to the cart.", "error");
      return;
    }

    setAddingProductId(product._id);
    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      } else {
        addGuestCartItem(product, 1);
      }
      showToast("Added to your bag.", "success");
    } catch (error) {
      console.error("Could not add product to cart:", error);
      showToast("Could not add this product to your bag.", "error");
    } finally {
      setAddingProductId(null);
    }
  };

  const toggleProductWishlist = async (productId: string) => {
    try {
      const response = await toggleWishlist(productId).unwrap();
      showToast(response.message, "success");
    } catch (error) {
      console.error("Could not update wishlist:", error);
      showToast("Could not update your wishlist.", "error");
    }
  };

  const wishlistItems: WishlistItem[] = wishlistData?.wishlist || [];
  const wishlistIds = new Set(
    wishlistItems.flatMap(({ product }) => (product?._id ? [product._id] : []))
  );

  return (
    <div className="bg-background text-foreground">
      <section className="relative isolate overflow-hidden bg-[#eee8df] dark:bg-[#191814]">
        <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-12 pt-10 sm:px-8 md:py-16 lg:min-h-[680px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-12 xl:px-16">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.6 }}
            className="relative z-10 order-2 max-w-xl lg:order-1"
          >
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-muted sm:text-xs">
              <span className="h-px w-8 bg-gold" />
              LUMIXA — A considered edit
            </p>
            <h1 className="mt-6 max-w-lg font-serif text-5xl font-medium leading-[0.98] tracking-[-0.045em] sm:text-6xl xl:text-7xl">
              Discover what feels like you.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-muted sm:text-base">
              Explore fashion, home, technology and everyday finds through one thoughtfully
              organized storefront.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex min-h-12 items-center gap-3 bg-foreground px-6 text-xs font-medium uppercase tracking-[0.18em] text-background transition-colors hover:bg-gold"
              >
                Explore the edit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#collections"
                className="inline-flex min-h-12 items-center gap-2 px-4 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:text-gold"
              >
                Browse collections <ArrowDownRight className="h-4 w-4" />
              </Link>
            </div>

            <form onSubmit={submitSearch} className="mt-10 flex max-w-md border-b border-foreground/25 pb-2">
              <Search className="mr-3 mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search the catalog"
                aria-label="Search the catalog"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-gold hover:text-foreground"
              >
                Search
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : 0.08 }}
            className="relative order-1 min-h-[360px] overflow-hidden sm:min-h-[480px] lg:order-2 lg:min-h-[560px]"
          >
            <Image
              src="/images/lumixa-editorial-hero.webp"
              alt="Fashion editorial with a shopper carrying bags"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="object-cover object-[center_38%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/5" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 text-white sm:bottom-8 sm:left-8 sm:right-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/75">The LUMIXA edit</p>
                <p className="mt-2 max-w-xs font-serif text-2xl leading-tight sm:text-3xl">
                  A little inspiration for the everyday.
                </p>
              </div>
              <span className="mb-1 hidden h-11 w-11 items-center justify-center rounded-full border border-white/60 sm:flex">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="collections" className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-16">
        <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">Browse by interest</p>
            <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">Collections to explore</h2>
          </div>
          <Link href="/categories" className="hidden items-center gap-2 pb-1 text-xs font-medium uppercase tracking-[0.14em] hover:text-gold sm:inline-flex">
            All collections <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse bg-muted-light" />
            ))}
          </div>
        ) : categoriesError ? (
          <div className="border border-card-border px-5 py-8 text-sm text-muted">
            Collections could not be loaded. <Link href="/categories" className="text-gold underline">Browse all categories</Link>
          </div>
        ) : categories.length === 0 ? (
          <div className="border border-card-border px-5 py-8 text-sm text-muted">
            No collections are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {categories.map(({ category, image }, index) => (
              <motion.div
                key={category._id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.04 }}
              >
                <Link
                  href={category.slug ? `/category/${category.slug}` : `/categories/${category._id}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-muted-light"
                >
                  <Image
                    src={image}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 16vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3 text-white sm:p-4">
                    <span className="font-serif text-base sm:text-lg">{category.name}</span>
                    <ArrowRight className="mb-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
        <Link href="/categories" className="mt-5 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-gold sm:hidden">
          All collections <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="border-y border-card-border bg-card-bg">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-16">
          <div className="mb-8 flex items-end justify-between gap-4 sm:mb-10">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">Recently listed</p>
              <h2 className="mt-3 font-serif text-3xl font-medium sm:text-4xl">A fresh look through the catalog</h2>
            </div>
            <Link href="/products" className="hidden items-center gap-2 pb-1 text-xs font-medium uppercase tracking-[0.14em] hover:text-gold sm:inline-flex">
              Shop all products <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="aspect-[4/5] animate-pulse bg-muted-light" />
                  <div className="mt-4 h-4 w-2/3 animate-pulse bg-muted-light" />
                  <div className="mt-3 h-4 w-1/3 animate-pulse bg-muted-light" />
                </div>
              ))}
            </div>
          ) : productsError ? (
            <div className="border border-card-border px-5 py-8 text-sm text-muted">
              Products could not be loaded right now. You can still <Link href="/products" className="text-gold underline">browse the catalog</Link>.
            </div>
          ) : products.length === 0 ? (
            <div className="border border-card-border px-5 py-8 text-sm text-muted">
              No products with images are available to feature right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
              {products.map((product) => {
                const sellerId = product.seller?._id || product.seller;
                const isOwner = Boolean(user?.id && sellerId?.toString() === user.id);
                return (
                  <ProductCard
                    key={product._id}
                    product={product}
                    currency={activeCurrency}
                    isAuthenticated={isAuthenticated}
                    isOwner={isOwner}
                    isWishlisted={wishlistIds.has(product._id)}
                    isAdding={addingProductId === product._id}
                    onAdd={() => void addProduct(product)}
                    onWishlist={() => void toggleProductWishlist(product._id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-12 xl:px-16">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">A simpler way to discover</p>
          <h2 className="mt-4 max-w-md font-serif text-3xl font-medium leading-tight sm:text-4xl">
            Find your next favorite, at your own pace.
          </h2>
        </div>
        <div className="flex flex-col gap-5 border-l border-card-border pl-5 text-sm leading-7 text-muted sm:pl-8">
          <p>
            Browse collections, open the details that matter, and save products you want to revisit.
            LUMIXA brings the catalog and its independent sellers into one place to explore.
          </p>
          <Link href="/stores" className="inline-flex w-fit items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:text-gold">
            Meet the stores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="bg-[#1c1b18] text-[#fcfcfa]">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-5 py-12 sm:px-8 sm:py-14 md:flex-row md:items-center lg:px-12 xl:px-16">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[#d7bc97]">Your next discovery starts here</p>
            <h2 className="mt-3 max-w-2xl font-serif text-3xl font-medium sm:text-4xl">
              Take a closer look around.
            </h2>
          </div>
          <Link href="/products" className="inline-flex min-h-12 items-center gap-3 border border-white/35 px-6 text-xs font-medium uppercase tracking-[0.18em] transition-colors hover:bg-white hover:text-[#1c1b18]">
            Explore all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
