"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CountUp from "react-countup";
import Header from "./components/Header";
import Footer from "./components/Footer";
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useAddToCartMutation,
  useGetApprovedSellersQuery,
  useGetArticlesQuery,
  useToggleWishlistMutation,
  useGetWishlistQuery,
  useGetAllTestimonialsQuery,
} from "../lib/api";
import { useAppSelector } from "../lib/store";
import { useToast } from "./components/Toast";
import { addGuestCartItem } from "../lib/cartUtils";
import { formatPrice as formatCurrencyPrice } from "../lib/currencyUtils";
import { StatCard } from "./components/StatsCard";
import { stats } from "../lib/data";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Camera,
  ChevronRight,
  Clock3,
  Globe2,
  HeartHandshake,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Zap,
  Heart,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

type StoreProduct = {
  _id: string;
  title: string;
  brand?: string;
  slug?: string;
  price: number;
  comparePrice?: number;
  images?: Array<{ url: string }>;
  ratingAverage?: number;
  sold?: number;
  stock?: number;
  isDigital?: boolean;
  seller?: any;
};

type StoreCategory = {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
};

const fallbackCategories: StoreCategory[] = [
  {
    _id: "cat-fashion",
    name: "Signature Fashion",
    slug: "signature-fashion",
    description: "Statement silhouettes, elevated essentials, and capsule pieces built around modern luxury.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-home",
    name: "Home Curations",
    slug: "home-curations",
    description: "Refined objects, ambient decor, and tactile details that make interiors feel collected.",
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-tech",
    name: "Modern Tech",
    slug: "modern-tech",
    description: "Beautifully engineered devices, accessories, and tools that fit a premium workflow.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=900&auto=format&fit=crop",
  },
  {
    _id: "cat-gifts",
    name: "Gifting Studio",
    slug: "gifting-studio",
    description: "Curated edits and gift-ready bundles for launches, milestones, and private events.",
    image: "https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=900&auto=format&fit=crop",
  },
];

const fallbackProducts: StoreProduct[] = [
  {
    _id: "demo1",
    title: "Signature Gold Signet Ring",
    brand: "L'Auréole",
    slug: "signature-gold-signet-ring",
    price: 3200,
    images: [{ url: "https://images.unsplash.com/photo-1603974372039-adc49044b6bd?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.9,
    sold: 120,
  },
  {
    _id: "demo2",
    title: "Alabaster Ceramic Vase",
    brand: "Maison Blanc",
    slug: "alabaster-ceramic-vase",
    price: 1850,
    images: [{ url: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.8,
    sold: 95,
  },
  {
    _id: "demo3",
    title: "Suede Shearling Jacket",
    brand: "Atelier Paris",
    slug: "suede-shearling-jacket",
    price: 14500,
    images: [{ url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 5.0,
    sold: 45,
  },
  {
    _id: "demo4",
    title: "Noir Chronograph Watch",
    brand: "Kronos",
    slug: "noir-chronograph-watch",
    price: 9200,
    images: [{ url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=900&auto=format&fit=crop" }],
    ratingAverage: 4.7,
    sold: 80,
  },
];

const fallbackSellers = [
  {
    id: "seller1",
    storeName: "Maison de L'Élégance",
    brandName: "L'Élégance",
    storeSlug: "maison-de-l-elegance",
    storeLogo: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Curated premium Parisian designer wear and fine accessories.",
    storeRating: 4.9,
    followersCount: 1420,
    responseTime: "Within 2 hours"
  },
  {
    id: "seller2",
    storeName: "Aura Home Curations",
    brandName: "Aura",
    storeSlug: "aura-home-curations",
    storeLogo: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Handcrafted ceramics, ambient lighting, and luxury home design.",
    storeRating: 4.8,
    followersCount: 890,
    responseTime: "Within 1 hour"
  },
  {
    id: "seller3",
    storeName: "Kronos Horology",
    brandName: "Kronos",
    storeSlug: "kronos-horology",
    storeLogo: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop",
    storeDescription: "Precision timepiece engineering and luxury vintage restorations.",
    storeRating: 5.0,
    followersCount: 2300,
    responseTime: "Within 24 hours"
  }
];

const fallbackArticles = [
  {
    _id: "art1",
    title: "The Art of Capsule Wardrobe: Quality Over Quantity",
    slug: "art-of-capsule-wardrobe",
    excerpt: "Discover the philosophy of minimalist luxury and how to curate a timeless selection of statement pieces.",
    coverImage: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Atelier Paris" },
    readTime: 5,
    createdAt: "2026-06-12T10:00:00Z"
  },
  {
    _id: "art2",
    title: "Designing Ambient Spaces: A Guide to Light and Texture",
    slug: "designing-ambient-spaces",
    excerpt: "How ambient decor and carefully placed lighting transform modern residential spaces into peaceful sanctuaries.",
    coverImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Studio Noon" },
    readTime: 4,
    createdAt: "2026-06-10T14:30:00Z"
  },
  {
    _id: "art3",
    title: "Crafting Precision: Inside the Modern Watchmaker Workshop",
    slug: "inside-watchmaker-workshop",
    excerpt: "A deep dive into horological engineering and the incredible craftsmanship behind mechanical movements.",
    coverImage: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=900&auto=format&fit=crop",
    author: { storeName: "Kronos" },
    readTime: 7,
    createdAt: "2026-06-08T09:15:00Z"
  }
];

const trustPoints = [
  { icon: ShieldCheck, title: "Protected checkout", description: "Tokenized payments and secure session restoration keep accounts safe across devices." },
  { icon: Truck, title: "Fast delivery", description: "Same-day dispatch on selected Cairo drops, with clear tracking from warehouse to door." },
  { icon: HeartHandshake, title: "White-glove support", description: "Concierge-grade help for product selection, order follow-up, and post-purchase care." },
];

const journey = [
  { step: "01", title: "Discover", description: "Explore editorial collections, seasonal drops, and focused category edits." },
  { step: "02", title: "Compare", description: "Save favorites, review details, and compare premium pieces across collections." },
  { step: "03", title: "Checkout", description: "Use secure checkout with automatic session restoration and cart persistence." },
  { step: "04", title: "Receive", description: "Track every order from confirmation to delivery with post-purchase support." },
];

const testimonials = [
  { quote: "The layout feels like a flagship fashion house, but it still moves like a modern commerce platform.", name: "Mona A.", title: "Lifestyle curator" },
  { quote: "I closed the browser, came back later, and my account was still signed in. That is the kind of polish users notice.", name: "Karim S.", title: "Returning customer" },
  { quote: "The homepage finally feels premium enough to represent the product catalog and the brand story.", name: "Dina H.", title: "Creative director" },
];

const faqs = [
  { question: "How does my login stay active after reopening the website?", answer: "The refresh cookie is restored on load, then the app fetches your profile again and repopulates Redux state automatically." },
  { question: "Can guests still shop without an account?", answer: "Yes. Guest carts stay in local storage and can be merged into the account cart once the user signs in." },
  { question: "What makes the homepage different from a basic store front?", answer: "It is built like a real brand landing page: editorial hero, category storytelling, product curation, trust signals, and a conversion-focused CTA flow." },
];

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1400&auto=format&fit=crop",
    tag: "Private Drop",
    badge: "Limited Availability",
    title: "The Modern Luxury Capsule",
    description: "Flagship-grade presentation across every curation. Rebuilt for modern premium standards.",
    link: "/products"
  },
  {
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop",
    tag: "Designer Edit",
    badge: "New Collection",
    title: "Signature Fashion Drops",
    description: "Statement silhouettes, elevated essentials, and private boutique designs.",
    link: "/category/signature-fashion"
  },
  {
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1400&auto=format&fit=crop",
    tag: "Exclusive Tech",
    badge: "Pre-order Open",
    title: "Engineered Horological Devices",
    description: "Tactile gear, vintage restorations, and beautifully engineered items for premium setups.",
    link: "/category/modern-tech"
  }
];

const formatPrice = (value: number | string | undefined) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("en-EG", { maximumFractionDigits: 0 }).format(amount);
};

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, currency } = useAppSelector((state) => state.auth);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [email, setEmail] = useState("");
  
  const [activeSlide, setActiveSlide] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 24, seconds: 55 });
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  // Hero Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Flash Sale Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load recently viewed IDs from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recently_viewed");
      if (stored) {
        setRecentlyViewedIds(JSON.parse(stored).slice(0, 4));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Fetch real data
  const { data: trendingData, isLoading: trendingLoading } = useGetProductsQuery({ limit: 4, sort: "sold" });
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useGetProductsQuery({ limit: 4, sort: "newest" });
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: sellersData, isLoading: sellersLoading } = useGetApprovedSellersQuery({ limit: 3, sort: "rating" });
  const { data: articlesData, isLoading: articlesLoading } = useGetArticlesQuery({ limit: 3 });
  const { data: allProductsQueryData } = useGetProductsQuery({ limit: 20 });
  const { data: testimonialsData } = useGetAllTestimonialsQuery(undefined);
  const [addToCart] = useAddToCartMutation();
  
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const displayTestimonials = useMemo(() => {
    if (testimonialsData?.data && testimonialsData.data.length > 0) {
      return testimonialsData.data.map((item: any) => ({
        quote: item.body,
        name: item.User?.username || "Anonymous",
        title: "Verified Customer"
      }));
    }
    return testimonials;
  }, [testimonialsData]);

  const handleWishlistToggle = async (productId: string) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to your wishlist.", "error");
      return;
    }
    try {
      const res = await toggleWishlist(productId).unwrap();
      showToast(res.message, "success");
      refetchWishlist();
    } catch (err) {
      showToast("Failed to update wishlist.", "error");
    }
  };

  const handleQuickAdd = async (product: StoreProduct) => {
    if (!product) return;

    // Self-purchase blocker check
    const productSellerId = product.seller?._id || product.seller;
    if (currentUser && productSellerId && productSellerId.toString() === currentUser.id) {
      showToast("Sellers cannot add their own products to the cart.", "error");
      return;
    }

    setAddingId(product._id);

    if (!isAuthenticated) {
      addGuestCartItem(product, 1);
      showToast("Added to guest cart.", "success");
      setAddingId(null);
      return;
    }

    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      showToast("Item added to your cart.", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not add item to cart.", "error");
    }

    setAddingId(null);
  };

  const allProductsList = allProductsQueryData?.products || [];

  // Filter out deals (comparePrice > price)
  const discountedProductsList = allProductsList.filter((p: any) => p.comparePrice && p.comparePrice > p.price).slice(0, 4);
  const dealsList = (discountedProductsList.length > 0 ? discountedProductsList : fallbackProducts.map((p) => ({
    ...p,
    comparePrice: p.price * 1.25,
  }))) as StoreProduct[];

  // Filter out recently viewed products
  const recentlyViewedProducts = (allProductsList
    .filter((p: any) => recentlyViewedIds.includes(p._id))
    .sort((a: any, b: any) => recentlyViewedIds.indexOf(a._id) - recentlyViewedIds.indexOf(b._id))
    .slice(0, 4)) as StoreProduct[];

  const trendingList = (trendingData?.products && trendingData.products.length > 0 ? trendingData.products.slice(0, 4) : fallbackProducts) as StoreProduct[];
  const newArrivalsList = (newArrivalsData?.products && newArrivalsData.products.length > 0 ? newArrivalsData.products.slice(0, 4) : fallbackProducts) as StoreProduct[];
  const categoriesList = (categoriesData?.categories && categoriesData.categories.length > 0 ? categoriesData.categories : fallbackCategories) as StoreCategory[];
  const sellersList = sellersData?.sellers || [];
  const articlesList = articlesData?.data || [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      showToast("Thank you for subscribing to our newsletter!", "success");
      setEmail("");
    }
  };



  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-background text-foreground">
      <Header />

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative isolate overflow-hidden border-b border-card-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(197,168,128,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(230,210,184,0.22),_transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="relative z-10 flex flex-col gap-8">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-card-border bg-card-bg/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold shadow-sm backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" /> Premium storefront, rebuilt as a brand experience
              </div>

              <div className="flex flex-col gap-5">
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-muted">Shop Premium Collective</p>
                <h1 className="max-w-3xl font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  A commerce homepage designed to feel like a flagship launch.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                  Editorial storytelling, premium visual hierarchy, trust-led messaging, and real commerce actions in one polished landing page. Built to convert, not just decorate.
                </p>
              </div>

              {/* SEARCH INPUT BAR */}
              <div className="flex flex-col gap-4 max-w-xl">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search for premium products, brands, or articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 rounded-full border border-card-border bg-card-bg/90 pl-12 pr-28 text-sm focus:border-gold/60 focus:outline-none backdrop-blur text-foreground"
                  />
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full bg-foreground px-5 text-xs font-semibold text-background hover:bg-gold hover:text-white transition-colors"
                  >
                    Search
                  </button>
                </form>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted pl-4">
                  <span className="font-semibold uppercase tracking-[0.1em] text-gold">Trending:</span>
                  <Link href="/search?q=Vase" className="hover:underline">Vase</Link>
                  <span>•</span>
                  <Link href="/search?q=Watch" className="hover:underline">Watch</Link>
                  <span>•</span>
                  <Link href="/search?q=Ring" className="hover:underline">Ring</Link>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row mt-2">
                <Link href="/products" className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-sm font-semibold text-background shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-luxury-white">
                  Explore the catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/categories" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-card-border bg-card-bg/90 px-7 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:bg-muted-light">
                  Browse collections
                </Link>
              </div>
            </div>

            <div className="relative z-10">
              <div className="relative mx-auto max-w-xl overflow-hidden rounded-[32px] border border-card-border bg-card-bg p-4 shadow-2xl shadow-black/10">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
                <div className="absolute -left-20 bottom-10 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />

                <div className="relative overflow-hidden rounded-[24px] border border-card-border bg-luxury-black h-[520px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="absolute inset-0"
                    >
                      <img
                        src={heroSlides[activeSlide].image}
                        alt={heroSlides[activeSlide].title}
                        className="h-full w-full object-cover opacity-75"
                      />
                      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/65 via-black/20 to-transparent p-5 text-white z-10">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/75">
                          <span>{heroSlides[activeSlide].tag}</span>
                          <span>{heroSlides[activeSlide].badge}</span>
                        </div>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/65 p-5 text-white backdrop-blur-md z-10">
                        <div className="flex flex-col gap-2">
                          <div className="text-xs uppercase tracking-[0.28em] text-white/60">Featured collection</div>
                          <h2 className="font-serif text-2xl">{heroSlides[activeSlide].title}</h2>
                          <p className="text-xs text-white/80 font-light leading-relaxed">{heroSlides[activeSlide].description}</p>
                          <Link href={heroSlides[activeSlide].link} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-gold hover:text-gold-hover transition-colors">
                            View Collection <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Manual Controls */}
                  <div className="absolute bottom-36 right-5 flex gap-2 z-20">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          activeSlide === idx ? "w-6 bg-gold" : "w-1.5 bg-white/40"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST BANNER */}
        <section className="border-b border-card-border bg-card-bg/60">
          <div className="mx-auto max-w-7xl px-6 py-8">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
              <span className="uppercase tracking-[0.3em] text-gold">Trusted by premium shoppers</span>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2"><Globe2 className="h-4 w-4 text-gold" /> Worldwide shipping</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-gold" /> 24/7 support desk</span>
                <span className="inline-flex items-center gap-2"><Banknote className="h-4 w-4 text-gold" /> Secure online payments</span>
              </div>
            </div>
          </div>
        </section>

        {/* EDITORIAL CATEGORIES */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Collections</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">Editorial categories with a real sense of place.</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Each collection card is designed like a magazine cover, giving the store a distinct visual rhythm instead of a generic catalog grid.
              </p>
            </div>
            <Link href="/categories" className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-hover">
              See all categories <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {categoriesList.map((category) => (
              <Link key={category._id} href={category.slug ? `/category/${category.slug}` : `/categories/${category._id}`} className="group relative min-h-[320px] overflow-hidden rounded-[28px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                <img
                  src={category.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900&auto=format&fit=crop"}
                  alt={category.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/75 backdrop-blur-md">
                    <Camera className="h-3.5 w-3.5 text-gold" /> Featured collection
                  </div>
                  <h3 className="font-serif text-xl font-semibold">{category.name}</h3>
                  <p className="mt-2 line-clamp-1 text-xs leading-6 text-white/75">{category.description || "A curated edit built to feel premium, tactile, and easy to browse."}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold transition-colors group-hover:text-gold-hover">
                    Open collection <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="border-y border-card-border bg-[linear-gradient(180deg,rgba(230,210,184,0.16),transparent)]">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="mb-12 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Why it feels premium</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">A storefront that explains itself without forcing the user to hunt.</h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {trustPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div key={point.title} className="luxury-card p-6 shadow-sm">
                    <div className="inline-flex rounded-2xl bg-gold/10 p-3 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 font-serif text-2xl font-semibold">{point.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted">{point.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FLASH SALES / BEST DEALS */}
        <section className="mx-auto max-w-7xl px-6 py-20 border-b border-card-border/50 bg-[radial-gradient(circle_at_bottom_right,_rgba(197,168,128,0.08),_transparent_30%)]">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-error border border-error/10">
                <Zap className="h-3 w-3 fill-error" /> Limited Time Event
              </span>
              <h2 className="mt-4 font-serif text-4xl font-semibold">Flash Sales & Exquisite Offers</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted font-light">
                High-end creations, allocated with temporary private discounts. Price adjustments expire when the timer hits zero.
              </p>
            </div>

            {/* Countdown timer */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted mr-2">Time Remaining:</span>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-luxury-black border border-white/10 text-white shadow-lg">
                  <span className="text-sm font-bold font-serif">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted">Hrs</span>
                </div>
                <span className="font-bold text-gold">:</span>
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-luxury-black border border-white/10 text-white shadow-lg">
                  <span className="text-sm font-bold font-serif">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted">Min</span>
                </div>
                <span className="font-bold text-gold">:</span>
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-luxury-black border border-white/10 text-white shadow-lg">
                  <span className="text-sm font-bold text-gold animate-pulse font-serif">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted">Sec</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {dealsList.map((product) => {
              const discountPercent = product.comparePrice ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100) : 25;
              const stockPercentage = product.stock ? Math.min(Math.max((product.stock / 15) * 100, 10), 100) : 20;
              return (
                <article key={product._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
                  <div className="relative aspect-[1/1.03] overflow-hidden bg-muted-light">
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/800x800"}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white z-10">
                      <span className="rounded-full bg-error px-3 py-1 text-[9px] font-bold uppercase tracking-widest shadow">SAVE {discountPercent}%</span>
                      
                      {/* Heart Toggle Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product._id);
                        }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all bg-black/35 hover:bg-black/60 backdrop-blur-md cursor-pointer ${
                          wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id)
                            ? "text-gold"
                            : "text-white hover:text-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id) ? "fill-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Quick Add Block */}
                    {(() => {
                      const productSellerId = product.seller?._id || product.seller;
                      const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
                      if (isProductOwner) {
                        return (
                          <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold bg-background/95 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full border border-gold/25 select-none z-10">
                            <Lock className="h-3 w-3" /> Owner Account
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/92 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white disabled:opacity-70 cursor-pointer z-10"
                        >
                          {addingId === product._id ? "Adding..." : <><PackageCheck className="h-3.5 w-3.5" /> Claim Offer</>}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-4 p-5 flex-grow justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">{product.brand || "Atelier Paris"}</div>
                      <Link href={product.slug ? `/product/${product.slug}` : `/products/${product._id}`} className="mt-1 block font-serif text-lg font-semibold leading-snug text-foreground transition-colors hover:text-gold line-clamp-1">
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex flex-col gap-3">
                      {/* Price section with discount */}
                      <div className="flex items-baseline gap-2 text-sm border-t border-card-border/40 pt-3">
                        <span className="font-bold text-gold">{formatCurrencyPrice(product.price, currency)}</span>
                        {product.comparePrice && (
                          <span className="text-xs line-through text-muted font-light">{formatCurrencyPrice(product.comparePrice, currency)}</span>
                        )}
                      </div>

                      {/* Stock availability indicator */}
                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-muted">
                          <span>Stock Remaining</span>
                          <span className="text-error font-bold">{product.stock || 3} left</span>
                        </div>
                        <div className="w-full h-1 bg-card-border rounded-full overflow-hidden">
                          <div className="h-full bg-error rounded-full" style={{ width: `${stockPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* TRENDING PRODUCTS */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Trending Products</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">The pieces in highest demand.</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Explore items currently trending among our boutique shoppers.
              </p>
            </div>
            <Link href="/products" className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-hover">
              Browse everything <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {trendingLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="luxury-card h-[420px] animate-pulse overflow-hidden">
                  <div className="aspect-square bg-muted-light" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-muted-light" />
                    <div className="h-5 w-3/4 rounded bg-muted-light" />
                    <div className="h-4 w-1/2 rounded bg-muted-light" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {trendingList.map((product) => (
                <article key={product._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[1/1.03] overflow-hidden bg-muted-light">
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/800x800"}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white z-10">
                      <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur-md">{product.brand || "Designer edit"}</span>
                      
                      {/* Heart Toggle Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product._id);
                        }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all bg-black/35 hover:bg-black/60 backdrop-blur-md cursor-pointer ${
                          wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id)
                            ? "text-gold"
                            : "text-white hover:text-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id) ? "fill-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Quick Add Block */}
                    {(() => {
                      const productSellerId = product.seller?._id || product.seller;
                      const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
                      if (isProductOwner) {
                        return (
                          <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold bg-background/95 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full border border-gold/25 select-none z-10">
                            <Lock className="h-3 w-3" /> Owner Account
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/92 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white disabled:opacity-70 cursor-pointer z-10"
                        >
                          {addingId === product._id ? "Adding..." : <><PackageCheck className="h-3.5 w-3.5" /> Quick add</>}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-4 p-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">{product.brand || "Premium collection"}</div>
                      <Link href={product.slug ? `/product/${product.slug}` : `/products/${product._id}`} className="mt-1 block font-serif text-lg font-semibold leading-snug text-foreground transition-colors hover:text-gold">
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="font-medium">{product.ratingAverage || 5.0}</span>
                      </div>
                      <span className="font-semibold text-gold">{formatCurrencyPrice(product.price, currency)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                      <Zap className="h-3.5 w-3.5 text-gold" />
                      Ready for immediate checkout
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* NEW ARRIVALS */}
        <section className="mx-auto max-w-7xl px-6 py-20 border-t border-card-border/50">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">New Arrivals</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">Fresh curation, just listed.</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Be the first to secure our newest design entries and limited boutique drops.
              </p>
            </div>
            <Link href="/products?sort=newest" className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-hover">
              Browse new arrivals <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {newArrivalsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="luxury-card h-[420px] animate-pulse overflow-hidden">
                  <div className="aspect-square bg-muted-light" />
                  <div className="flex flex-col gap-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-muted-light" />
                    <div className="h-5 w-3/4 rounded bg-muted-light" />
                    <div className="h-4 w-1/2 rounded bg-muted-light" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {newArrivalsList.map((product) => (
                <article key={product._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative aspect-[1/1.03] overflow-hidden bg-muted-light">
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/800x800"}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white z-10">
                      <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] backdrop-blur-md">{product.brand || "Designer edit"}</span>
                      
                      {/* Heart Toggle Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product._id);
                        }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all bg-black/35 hover:bg-black/60 backdrop-blur-md cursor-pointer ${
                          wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id)
                            ? "text-gold"
                            : "text-white hover:text-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id) ? "fill-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Quick Add Block */}
                    {(() => {
                      const productSellerId = product.seller?._id || product.seller;
                      const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
                      if (isProductOwner) {
                        return (
                          <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold bg-background/95 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full border border-gold/25 select-none z-10">
                            <Lock className="h-3 w-3" /> Owner Account
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/92 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white disabled:opacity-70 cursor-pointer z-10"
                        >
                          {addingId === product._id ? "Adding..." : <><PackageCheck className="h-3.5 w-3.5" /> Quick add</>}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-4 p-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">{product.brand || "Premium collection"}</div>
                      <Link href={product.slug ? `/product/${product.slug}` : `/products/${product._id}`} className="mt-1 block font-serif text-lg font-semibold leading-snug text-foreground transition-colors hover:text-gold">
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 fill-gold text-gold" />
                        <span className="font-medium">{product.ratingAverage || 5.0}</span>
                      </div>
                      <span className="font-semibold text-gold">{formatCurrencyPrice(product.price, currency)}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted">
                      <Zap className="h-3.5 w-3.5 text-gold" />
                      Ready for immediate checkout
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* PERSONALIZED RECOMMENDATIONS (RECENTLY VIEWED) */}
        {recentlyViewedProducts.length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-20 border-t border-card-border/50 bg-[radial-gradient(circle_at_top_left,_rgba(197,168,128,0.03),_transparent_35%)]">
            <div className="mb-12 flex justify-between items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Tailored For You</p>
                <h2 className="mt-2 font-serif text-4xl font-semibold">Based on Your Recent Browsing</h2>
                <p className="mt-3 text-sm text-muted font-light">
                  Pick up right where you left off with these premium selections.
                </p>
              </div>
              <Link href="/products" className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-hover">
                Explore Full Catalog <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {recentlyViewedProducts.map((product) => (
                <article key={product._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
                  <div className="relative aspect-[1/1.03] overflow-hidden bg-muted-light">
                    <img
                      src={product.images?.[0]?.url || "https://placehold.co/800x800"}
                      alt={product.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white z-10">
                      <span className="rounded-full bg-black/45 px-3 py-1 text-[9px] font-semibold uppercase tracking-widest backdrop-blur-md">{product.brand || "Designer edit"}</span>
                      
                      {/* Heart Toggle Overlay */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleWishlistToggle(product._id);
                        }}
                        className={`h-7 w-7 rounded-full flex items-center justify-center transition-all bg-black/35 hover:bg-black/60 backdrop-blur-md cursor-pointer ${
                          wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id)
                            ? "text-gold"
                            : "text-white hover:text-gold"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${wishlistData?.wishlist?.some((w: any) => w.product?._id === product._id) ? "fill-gold" : ""}`} />
                      </button>
                    </div>

                    {/* Quick Add Block */}
                    {(() => {
                      const productSellerId = product.seller?._id || product.seller;
                      const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
                      if (isProductOwner) {
                        return (
                          <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold bg-background/95 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full border border-gold/25 select-none z-10">
                            <Lock className="h-3 w-3" /> Owner Account
                          </div>
                        );
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/92 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white disabled:opacity-70 cursor-pointer z-10"
                        >
                          {addingId === product._id ? "Adding..." : <><PackageCheck className="h-3.5 w-3.5" /> Quick Add</>}
                        </button>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col gap-4 p-5 flex-grow justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted">{product.brand || "Premium Collection"}</div>
                      <Link href={product.slug ? `/product/${product.slug}` : `/products/${product._id}`} className="mt-1 block font-serif text-lg font-semibold leading-snug text-foreground transition-colors hover:text-gold line-clamp-1">
                        {product.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs border-t border-card-border/40 pt-3">
                      <div className="flex items-center gap-1 font-bold text-gold">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <span>{product.ratingAverage?.toFixed(1) || "5.0"}</span>
                      </div>
                      <span className="font-bold text-gold">{formatCurrencyPrice(product.price, currency)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* TOP SELLERS / VERIFIED BRANDS */}
        <section className="mx-auto max-w-7xl px-6 py-20 border-t border-card-border/50">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Verified Partners</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">Flagship Design Houses & Sellers</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Shop directly from verified independent creators, local designers, and premium boutiques.
              </p>
            </div>
          </div>

          {sellersLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="luxury-card h-[280px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(sellersList.length > 0 ? sellersList : fallbackSellers).map((seller: any) => (
                <div key={seller.id || seller.storeSlug} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl p-6 flex flex-col justify-between h-[280px]">
                  <div>
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 rounded-full border border-card-border overflow-hidden bg-muted-light flex items-center justify-center">
                        {seller.storeLogo ? (
                          <img src={seller.storeLogo} alt={seller.storeName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-serif text-xl font-bold text-gold">{seller.storeName?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">{seller.brandName || "Designer Boutique"}</div>
                        <h3 className="font-serif text-lg font-semibold text-foreground truncate mt-0.5">{seller.storeName}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                            <span>{seller.storeRating || 5.0}</span>
                          </div>
                          <span className="text-xs text-muted">•</span>
                          <span className="text-xs text-muted">{seller.followersCount || 0} followers</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-muted line-clamp-2 mt-4">{seller.storeDescription || "Verified luxury independent store on our premium marketplace."}</p>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-card-border/50 pt-4 mt-auto">
                    <span className="text-xs text-muted inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5 text-gold" /> {seller.responseTime || "Within 24 hours"}
                    </span>
                    <Link
                      href={`/store/${seller.storeSlug}`}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-foreground/5 hover:bg-gold hover:text-white px-4 text-xs font-semibold uppercase tracking-[0.15em] text-foreground transition-all"
                    >
                      Visit Store
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* JOURNAL & EDITORIAL */}
        <section className="mx-auto max-w-7xl px-6 py-20 border-t border-card-border/50">
          <div className="mb-12 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">The Editorial</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">Insights, curation & designer stories.</h2>
              <p className="mt-3 text-base leading-7 text-muted">
                Read articles, trend reports, and deep-dives written by our verified design partners.
              </p>
            </div>
            <Link href="/blog" className="group inline-flex items-center gap-2 text-sm font-semibold text-gold transition-colors hover:text-gold-hover">
              Read all articles <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {articlesLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="luxury-card h-[360px] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {(articlesList.length > 0 ? articlesList : fallbackArticles).map((article: any) => (
                <article key={article._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col h-full">
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted-light">
                    <Image
                      width={500}
                      height={500}
                      src={article?.image?.url || "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=900&auto=format&fit=crop"}
                      alt={article.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-col flex-1 p-6 justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted mb-3">
                        <span className="font-semibold uppercase tracking-[0.15em] text-gold">{article.author?.storeName || article.author?.username || "Editorial Staff"}</span>
                        <span>{article.readTime || 5} min read</span>
                      </div>
                      <Link href={`/article/${article._id}`} className="block font-serif text-xl font-semibold leading-snug text-foreground hover:text-gold transition-colors line-clamp-2">
                        {article.title}
                      </Link>
                      <p className="text-sm leading-relaxed text-muted line-clamp-3 mt-3">{article.excerpt || article.metaDescription || "Read the full story on our premium editorial platform."}</p>
                    </div>
                    <div className="border-t border-card-border/50 pt-4 mt-5">
                      <Link href={`/article/${article._id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:text-gold-hover">
                        Read Story <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-card-border bg-card-bg/70">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">How it works</p>
                <h2 className="mt-2 font-serif text-4xl font-semibold">A clean user journey from discovery to delivery.</h2>
                <p className="mt-4 text-base leading-7 text-muted">
                  The structure gives visitors enough information to trust the brand, while keeping the path to shopping obvious and fast.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {journey.map((item) => (
                  <div key={item.step} className="luxury-card p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/10 font-serif text-lg font-semibold text-gold">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-muted">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & COUNTERS */}
        <section className="border-b border-card-border bg-card-bg/60 w-full">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <StatCard
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CLIENT VOICE & FAQS */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-gold">Client voice</p>
              <h2 className="mt-2 font-serif text-4xl font-semibold">Proof the experience feels premium in the real world.</h2>
              <div className="mt-8 grid gap-5">
                {displayTestimonials.map((item: any) => (
                  <figure key={item.name} className="luxury-card p-6 shadow-sm">
                    <QuoteMark />
                    <blockquote className="mt-4 text-base leading-8 text-foreground">{item.quote}</blockquote>
                    <figcaption className="mt-5 flex items-center gap-3 text-sm">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-semibold text-gold">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-muted">{item.title}</div>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="luxury-card overflow-hidden p-8 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                <Users className="h-4 w-4" /> Help & clarity
              </div>
              <h3 className="mt-4 font-serif text-3xl font-semibold">Questions answered before they become friction.</h3>
              <div className="mt-8 space-y-5">
                {faqs.map((faq) => (
                  <div key={faq.question} className="rounded-2xl border border-card-border bg-card-bg/80 p-5">
                    <div className="font-semibold">{faq.question}</div>
                    <p className="mt-2 text-sm leading-7 text-muted">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 rounded-[24px] bg-[linear-gradient(135deg,rgba(197,168,128,0.14),rgba(230,210,184,0.08))] p-6">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
                  <Search className="h-4 w-4" /> Stay discoverable
                </div>
                <p className="text-sm leading-7 text-muted">
                  Strong search, editorial story blocks, and direct links to categories make the homepage feel built for browsing as much as buying.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NEWSLETTER SUBSCRIPTION SECTION */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="relative overflow-hidden rounded-[32px] border border-card-border bg-card-bg/40 p-8 md:p-12 shadow-lg backdrop-blur">
            <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -left-32 -bottom-32 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
            
            <div className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
              <span className="text-xs font-bold uppercase tracking-[0.32em] text-gold">The Inner Circle</span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold">Subscribe for private collections and luxury editorials</h2>
              <p className="text-sm md:text-base leading-relaxed text-muted">
                Receive invitation-only product drops, designer capsules, and editorial articles directly in your inbox. No spam, just pure curation.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="w-full max-w-md flex flex-col sm:flex-row gap-3 mt-4">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 rounded-full border border-card-border bg-card-bg/85 px-6 text-sm focus:border-gold/60 focus:outline-none bg-background text-foreground"
                />
                <button
                  type="submit"
                  className="h-12 rounded-full bg-foreground hover:bg-gold px-8 text-xs font-semibold uppercase tracking-[0.2em] text-background hover:text-white transition-all whitespace-nowrap"
                >
                  Join Now
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="gold-gradient overflow-hidden rounded-[32px] p-[1px] shadow-2xl shadow-black/10">
            <div className="rounded-[31px] bg-luxury-black px-6 py-10 text-luxury-white sm:px-10">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.32em] text-white/60">Make the first impression count</p>
                  <h2 className="mt-3 font-serif text-4xl font-semibold sm:text-5xl">A homepage that looks like the brand can compete with major e-commerce players.</h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
                    The new homepage combines a premium visual system with actual shopping behavior: collections, products, trust messages, support, and session persistence.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <Link href="/register" className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-luxury-black transition-all hover:-translate-y-0.5 hover:bg-gold hover:text-luxury-white">
                    Create an account
                  </Link>
                  <Link href="/products" className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 bg-white/5 px-7 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10">
                    Start shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function QuoteMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8 text-gold" fill="currentColor" aria-hidden="true">
      <path d="M14.5 8C9.7 11.2 7 15.9 7 21.5c0 5.7 3.7 9.8 8.9 10.8-1.1 4.8-3.4 7.8-6.8 9.3 4.8-.1 8.6-1.8 11.2-5.1 2.4-3.2 3.7-7.1 3.7-11.7V8h-9.5zm20 0c-4.8 3.2-7.5 7.9-7.5 13.5 0 5.7 3.7 9.8 8.9 10.8-1.1 4.8-3.4 7.8-6.8 9.3 4.8-.1 8.6-1.8 11.2-5.1 2.4-3.2 3.7-7.1 3.7-11.7V8h-9.5z" />
    </svg>
  );
}
