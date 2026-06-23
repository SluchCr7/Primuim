"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { CardSkeleton } from "../components/Skeletons";
import { useAppSelector } from "../../lib/store";
import {
  useGetAdvancedSearchQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchesQuery,
  useGetCategoriesQuery,
  useAddToCartMutation,
  useToggleWishlistMutation,
  useGetWishlistQuery,
} from "../../lib/api";
import {
  Search,
  Star,
  SlidersHorizontal,
  X,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Package,
  Filter,
  Sparkles,
  Tag,
  BadgePercent,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Product {
  _id: string;
  title: string;
  brand?: string;
  price: number;
  comparePrice?: number;
  images?: { url: string; publicId: string }[];
  ratingAverage?: number;
  ratingCount?: number;
  slug?: string;
  stock?: number;
  tags?: string[];
  category?: { name: string; _id: string };
}

interface FacetItem {
  _id: string;
  count: number;
  name?: string;
}

interface PriceRange {
  min: number;
  max: number;
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const RECENT_KEY = "recentSearches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function addRecentSearch(term: string) {
  if (!term.trim() || typeof window === "undefined") return;
  const existing = getRecentSearches().filter(
    (s) => s.toLowerCase() !== term.toLowerCase()
  );
  localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([term, ...existing].slice(0, MAX_RECENT))
  );
}

function removeRecentSearch(term: string) {
  if (typeof window === "undefined") return;
  const existing = getRecentSearches().filter(
    (s) => s.toLowerCase() !== term.toLowerCase()
  );
  localStorage.setItem(RECENT_KEY, JSON.stringify(existing));
}

function highlightMatch(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        style={{ background: "var(--primary)", color: "#fff", borderRadius: "2px", padding: "0 2px" }}
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function StarRating({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3 w-3 ${
            s <= Math.round(rating)
              ? "fill-gold text-gold"
              : "fill-muted-light text-card-border"
          }`}
        />
      ))}
      {count !== undefined && (
        <span className="text-[10px] text-muted ml-0.5">({count})</span>
      )}
    </span>
  );
}

// ─────────────────────────────────────────────────────────
// Price Slider Component
// ─────────────────────────────────────────────────────────
function PriceSlider({
  min,
  max,
  value,
  onChange,
}: {
  min: number;
  max: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const rangeRef = useRef<HTMLDivElement>(null);

  const getPercent = (val: number) =>
    max === min ? 0 : ((val - min) / (max - min)) * 100;

  const leftPercent = getPercent(value[0]);
  const rightPercent = getPercent(value[1]);

  return (
    <div className="px-1 py-2">
      <div className="flex justify-between text-xs text-muted mb-3">
        <span className="font-semibold text-foreground">{value[0].toLocaleString()} EGP</span>
        <span className="font-semibold text-foreground">{value[1].toLocaleString()} EGP</span>
      </div>
      <div ref={rangeRef} className="relative h-1.5 rounded-full" style={{ background: "var(--card-border)" }}>
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            left: `${leftPercent}%`,
            right: `${100 - rightPercent}%`,
            background: "linear-gradient(90deg, var(--primary), var(--primary-hover))",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[0]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v < value[1]) onChange([v, value[1]]);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer"
          style={{ top: 0 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value[1]}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v > value[0]) onChange([value[0], v]);
          }}
          className="absolute w-full h-1.5 appearance-none bg-transparent cursor-pointer"
          style={{ top: 0 }}
        />
      </div>
      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 1px 6px rgba(0,0,0,0.15);
          cursor: grab;
        }
        input[type='range']::-webkit-slider-thumb:active { cursor: grabbing; }
        input[type='range']:focus { outline: none; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Collapsible Section
// ─────────────────────────────────────────────────────────
function FilterSection({
  title,
  icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-card-border last:border-b-0 py-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left group"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Product Card
// ─────────────────────────────────────────────────────────
function ProductCard({
  product,
  view,
  wishlisted,
  onWishlist,
  onAddToCart,
}: {
  product: Product;
  view: "grid" | "list";
  wishlisted: boolean;
  onWishlist: (id: string) => void;
  onAddToCart: (id: string) => void;
}) {
  const discount =
    product.comparePrice && product.comparePrice > product.price
      ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
      : null;

  if (view === "list") {
    return (
      <div className="flex gap-4 luxury-card p-4 hover:shadow-md transition-all duration-300 group">
        <div className="relative w-32 h-32 shrink-0 overflow-hidden rounded-lg bg-muted-light">
          <img
            src={product.images?.[0]?.url || "https://placehold.co/200x200/f5f5f3/C5A880?text=Product"}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {discount && (
            <span className="absolute top-1.5 left-1.5 bg-error text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              -{discount}%
            </span>
          )}
        </div>
        <div className="flex flex-col justify-between flex-1 min-w-0">
          <div>
            <span className="text-[10px] text-gold font-bold tracking-widest uppercase">
              {product.brand || product.category?.name || ""}
            </span>
            <Link
              href={`/product/${product.slug || product._id}`}
              className="block font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-2 mt-0.5 leading-snug"
            >
              {product.title}
            </Link>
            {product.ratingAverage !== undefined && (
              <div className="mt-1.5">
                <StarRating rating={product.ratingAverage} count={product.ratingCount} />
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {product.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full border border-card-border text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gold">{product.price.toFixed(2)} EGP</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-muted line-through">{product.comparePrice.toFixed(2)}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onWishlist(product._id)}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  wishlisted
                    ? "border-error bg-error/10 text-error"
                    : "border-card-border hover:border-error hover:text-error"
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-current" : ""}`} />
              </button>
              <button
                onClick={() => onAddToCart(product._id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground text-background hover:bg-gold text-xs font-semibold tracking-wide transition-all duration-200"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className="group flex flex-col luxury-card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
      <div className="relative aspect-square overflow-hidden bg-muted-light">
        <img
          src={product.images?.[0]?.url || "https://placehold.co/400x400/f5f5f3/C5A880?text=Product"}
          alt={product.title}
          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-2.5 left-2.5 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
            -{discount}%
          </span>
        )}

        {/* Out of stock */}
        {product.stock === 0 && (
          <span className="absolute top-2.5 right-2.5 bg-muted text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
            Sold Out
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out flex gap-2">
          <button
            onClick={() => onAddToCart(product._id)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-background/95 backdrop-blur-sm py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase hover:bg-gold hover:text-white transition-all duration-200 border border-card-border"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </button>
          <button
            onClick={() => onWishlist(product._id)}
            className={`p-2.5 rounded-lg backdrop-blur-sm border transition-all duration-200 ${
              wishlisted
                ? "bg-error/90 border-error text-white"
                : "bg-background/95 border-card-border hover:bg-error/10 hover:border-error hover:text-error"
            }`}
            aria-label="Toggle wishlist"
          >
            <Heart className={`h-3.5 w-3.5 ${wishlisted ? "fill-current" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col p-4 flex-grow">
        <span className="text-[10px] text-gold font-bold tracking-widest uppercase mb-1 line-clamp-1">
          {product.brand || product.category?.name || ""}
        </span>
        <Link
          href={`/product/${product.slug || product._id}`}
          className="font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-2 leading-snug mb-2"
        >
          {product.title}
        </Link>

        {product.ratingAverage !== undefined && (
          <div className="mb-2">
            <StarRating rating={product.ratingAverage} count={product.ratingCount} />
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-card-border">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gold">{product.price.toFixed(2)} EGP</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] text-muted line-through">{product.comparePrice.toFixed(2)}</span>
            )}
          </div>
          <Link
            href={`/product/${product.slug || product._id}`}
            className="text-[10px] text-muted hover:text-gold font-semibold uppercase tracking-wider transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Skeleton for sidebar
// ─────────────────────────────────────────────────────────
function SidebarSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[100, 80, 90, 70, 85].map((w, i) => (
        <div key={i} className="h-4 rounded bg-muted-light" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────
export default function ProfessionalSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // ── URL-synced params ─────────────────────────────────
  const urlQ        = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlSort     = searchParams.get("sort") || "relevance";
  const urlMinPrice = searchParams.get("minPrice") || "";
  const urlMaxPrice = searchParams.get("maxPrice") || "";
  const urlBrands   = searchParams.get("brand") || "";
  const urlTags     = searchParams.get("tags") || "";
  const urlRating   = searchParams.get("rating") || "";
  const urlInStock  = searchParams.get("inStock") || "";
  const urlPage     = Number(searchParams.get("page") || "1");

  // ── Local state ───────────────────────────────────────
  const [inputValue, setInputValue]       = useState(urlQ);
  const [showDropdown, setShowDropdown]   = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [view, setView]                   = useState<"grid" | "list">("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedSort,     setSelectedSort]     = useState(urlSort);
  const [selectedBrands,   setSelectedBrands]   = useState<string[]>(
    urlBrands ? urlBrands.split(",") : []
  );
  const [selectedTags,     setSelectedTags]     = useState<string[]>(
    urlTags ? urlTags.split(",") : []
  );
  const [selectedRating,   setSelectedRating]   = useState(urlRating);
  const [inStock,          setInStock]           = useState(urlInStock === "true");
  const [priceRange,       setPriceRange]        = useState<[number, number]>([
    urlMinPrice ? Number(urlMinPrice) : 0,
    urlMaxPrice ? Number(urlMaxPrice) : 10000,
  ]);
  const [priceInitialized, setPriceInitialized] = useState(false);

  const searchBarRef = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  // ── Debounced suggestion query (300ms) ────────────────
  const [debouncedQ, setDebouncedQ] = useState(inputValue);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(inputValue), 300);
    return () => clearTimeout(t);
  }, [inputValue]);

  // ── API calls ─────────────────────────────────────────
  const { data: suggestionsData } = useGetSearchSuggestionsQuery(debouncedQ, {
    skip: debouncedQ.trim().length < 1,
  });
  const { data: trendingData }    = useGetTrendingSearchesQuery(undefined);
  const { data: categoriesData }  = useGetCategoriesQuery(undefined);
  const { data: wishlistData }    = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  });

  const searchApiParams = useMemo(() => ({
    q:        urlQ,
    category: urlCategory || undefined,
    brand:    urlBrands   || undefined,
    tags:     urlTags     || undefined,
    minPrice: urlMinPrice || undefined,
    maxPrice: urlMaxPrice || undefined,
    rating:   urlRating   || undefined,
    inStock:  urlInStock  || undefined,
    sort:     urlSort,
    page:     urlPage,
    limit:    12,
  }), [urlQ, urlCategory, urlBrands, urlTags, urlMinPrice, urlMaxPrice, urlRating, urlInStock, urlSort, urlPage]);

  const { data: searchData, isLoading, isFetching } = useGetAdvancedSearchQuery(searchApiParams);

  const [addToCart]       = useAddToCartMutation();
  const [toggleWishlist]  = useToggleWishlistMutation();

  // ── Derived data ──────────────────────────────────────
  const products      = (searchData?.products || []) as Product[];
  const facets        = searchData?.facets;
  const totalProducts = searchData?.totalProducts || 0;
  const totalPages    = searchData?.totalPages    || 1;

  const wishlistIds = useMemo(() => {
    const items = (wishlistData as any)?.wishlist?.products || [];
    return new Set<string>(items.map((p: any) => p._id || p));
  }, [wishlistData]);

  const suggestions     = suggestionsData?.suggestions;
  const trendingTerms   = trendingData?.trending || [];

  // Init price range from facets
  useEffect(() => {
    if (!priceInitialized && facets?.priceRange) {
      const { min, max } = facets.priceRange as PriceRange;
      if (!urlMinPrice && !urlMaxPrice) {
        setPriceRange([min, max]);
      }
      setPriceInitialized(true);
    }
  }, [facets, priceInitialized, urlMinPrice, urlMaxPrice]);

  // Sync URL → local state
  useEffect(() => {
    setInputValue(urlQ);
    setSelectedCategory(urlCategory);
    setSelectedSort(urlSort);
    setSelectedBrands(urlBrands ? urlBrands.split(",") : []);
    setSelectedTags(urlTags ? urlTags.split(",") : []);
    setSelectedRating(urlRating);
    setInStock(urlInStock === "true");
    if (!urlMinPrice && !urlMaxPrice && facets?.priceRange && !priceInitialized) {
      const { min, max } = facets.priceRange as PriceRange;
      setPriceRange([min, max]);
    } else {
      if (urlMinPrice) setPriceRange((r) => [Number(urlMinPrice), r[1]]);
      if (urlMaxPrice) setPriceRange((r) => [r[0], Number(urlMaxPrice)]);
    }
  }, [urlQ, urlCategory, urlSort, urlBrands, urlTags, urlRating, urlInStock, urlMinPrice, urlMaxPrice]);

  // Recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !searchBarRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K or /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        searchBarRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── URL builder ───────────────────────────────────────
  const buildUrl = useCallback(
    (overrides: Record<string, string | number | boolean | undefined> = {}, resetPage = true) => {
      const p = new URLSearchParams();
      const vals: Record<string, any> = {
        q:        inputValue.trim() || urlQ,
        category: selectedCategory,
        sort:     selectedSort,
        brand:    selectedBrands.join(","),
        tags:     selectedTags.join(","),
        minPrice: priceRange[0] !== (facets?.priceRange as any)?.min ? String(priceRange[0]) : "",
        maxPrice: priceRange[1] !== (facets?.priceRange as any)?.max ? String(priceRange[1]) : "",
        rating:   selectedRating,
        inStock:  inStock ? "true" : "",
        page:     resetPage ? "" : String(urlPage),
        ...overrides,
      };
      Object.entries(vals).forEach(([k, v]) => {
        if (v && String(v).trim()) p.set(k, String(v));
      });
      return `/search?${p.toString()}`;
    },
    [inputValue, urlQ, selectedCategory, selectedSort, selectedBrands, selectedTags, priceRange, selectedRating, inStock, urlPage, facets]
  );

  // ── Handlers ──────────────────────────────────────────
  const handleSearchSubmit = (term?: string) => {
    const q = (term ?? inputValue).trim();
    if (q) addRecentSearch(q);
    setRecentSearches(getRecentSearches());
    setShowDropdown(false);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (selectedCategory) p.set("category", selectedCategory);
    if (selectedSort && selectedSort !== "relevance") p.set("sort", selectedSort);
    router.push(`/search?${p.toString()}`);
  };

  const handleApplyFilters = () => {
    setMobileFiltersOpen(false);
    router.push(buildUrl({}, true));
  };

  const handleClearFilters = () => {
    setSelectedCategory("");
    setSelectedSort("relevance");
    setSelectedBrands([]);
    setSelectedTags([]);
    setSelectedRating("");
    setInStock(false);
    if (facets?.priceRange) {
      const { min, max } = facets.priceRange as PriceRange;
      setPriceRange([min, max]);
    }
    const p = new URLSearchParams();
    if (urlQ) p.set("q", urlQ);
    router.push(`/search?${p.toString()}`);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
    } catch {}
  };

  const handleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    try {
      await toggleWishlist(productId).unwrap();
    } catch {}
  };

  const handleSuggestionClick = (term: string, url?: string) => {
    addRecentSearch(term);
    setRecentSearches(getRecentSearches());
    setShowDropdown(false);
    if (url) {
      router.push(url);
    } else {
      const p = new URLSearchParams();
      p.set("q", term);
      router.push(`/search?${p.toString()}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(newPage));
    router.push(`/search?${p.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Active filters count ──────────────────────────────
  const activeFilterCount = [
    selectedCategory,
    selectedBrands.length > 0,
    selectedTags.length > 0,
    selectedRating,
    inStock,
    urlMinPrice || urlMaxPrice,
  ].filter(Boolean).length;

  // ── Show suggestions dropdown ─────────────────────────
  const hasSuggestions =
    (suggestions?.products?.length ?? 0) > 0 ||
    (suggestions?.keywords?.length ?? 0) > 0;
  const hasRecent = recentSearches.length > 0;
  const hasTrending = trendingTerms.length > 0;
  const showDropdownContent = showDropdown && (hasSuggestions || hasRecent || hasTrending);

  // ─────────────────────────────────────────────────────
  // Sidebar Filters JSX (shared between desktop + mobile)
  // ─────────────────────────────────────────────────────
  const SidebarFilters = (
    <div className="space-y-0">
      {/* Categories */}
      <FilterSection title="Category" icon={<Tag className="h-3 w-3 text-gold" />}>
        {categoriesData?.categories ? (
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="category"
                checked={!selectedCategory}
                onChange={() => setSelectedCategory("")}
                className="accent-gold"
              />
              <span className="text-xs text-foreground group-hover:text-gold transition-colors">
                All Categories
              </span>
            </label>
            {(categoriesData.categories as any[]).map((cat: any) => (
              <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat._id}
                  onChange={() => setSelectedCategory(cat._id)}
                  className="accent-gold"
                />
                <span className="text-xs text-foreground group-hover:text-gold transition-colors flex-1">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <SidebarSkeleton />
        )}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" icon={<BadgePercent className="h-3 w-3 text-gold" />}>
        {facets?.priceRange ? (
          <PriceSlider
            min={(facets.priceRange as PriceRange).min}
            max={(facets.priceRange as PriceRange).max}
            value={priceRange}
            onChange={setPriceRange}
          />
        ) : (
          <SidebarSkeleton />
        )}
      </FilterSection>

      {/* Brands */}
      {facets?.brands && (facets.brands as FacetItem[]).length > 0 && (
        <FilterSection title="Brands" icon={<Sparkles className="h-3 w-3 text-gold" />}>
          <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {(facets.brands as FacetItem[]).map((b) => (
              <label key={b._id} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b._id)}
                  onChange={() => toggleBrand(b._id)}
                  className="accent-gold rounded"
                />
                <span className="text-xs text-foreground group-hover:text-gold transition-colors flex-1">
                  {b._id}
                </span>
                <span className="text-[10px] text-muted bg-muted-light px-1.5 py-0.5 rounded-full">
                  {b.count}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Rating */}
      <FilterSection title="Minimum Rating" icon={<Star className="h-3 w-3 text-gold" />}>
        <div className="space-y-2">
          {["", "4", "3", "2"].map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={selectedRating === r}
                onChange={() => setSelectedRating(r)}
                className="accent-gold"
              />
              <span className="flex items-center gap-1">
                {r ? (
                  <>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= Number(r) ? "fill-gold text-gold" : "fill-card-border text-card-border"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted ml-0.5">& up</span>
                  </>
                ) : (
                  <span className="text-xs text-foreground">Any Rating</span>
                )}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Tags */}
      {facets?.tags && (facets.tags as FacetItem[]).length > 0 && (
        <FilterSection title="Tags" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {(facets.tags as FacetItem[]).slice(0, 20).map((t) => (
              <button
                key={t._id}
                onClick={() => toggleTag(t._id)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-all duration-200 ${
                  selectedTags.includes(t._id)
                    ? "bg-gold text-white border-gold"
                    : "border-card-border text-muted hover:border-gold hover:text-gold"
                }`}
              >
                {t._id}
                <span className="ml-1 opacity-60">{t.count}</span>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* In Stock */}
      <FilterSection title="Availability" icon={<Package className="h-3 w-3 text-gold" />}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-xs text-foreground">In Stock Only</span>
          <div
            onClick={() => setInStock((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-300 cursor-pointer ${
              inStock ? "bg-gold" : "bg-muted-light border border-card-border"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                inStock ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
        </label>
      </FilterSection>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4">
        <button
          onClick={handleClearFilters}
          className="flex-1 h-10 border border-card-border hover:border-error hover:text-error rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200"
        >
          Clear All
        </button>
        <button
          onClick={handleApplyFilters}
          className="flex-1 h-10 bg-foreground text-background hover:bg-gold rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200"
        >
          Apply
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow">
        {/* ── HERO SEARCH SECTION ─────────────────────── */}
        <div
          className="relative overflow-hidden py-14 px-6"
          style={{
            background:
              "linear-gradient(135deg, var(--muted-light) 0%, var(--background) 60%, var(--accent)/20 100%)",
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full opacity-[0.05]"
            style={{ background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)" }}
          />

          <div className="relative max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full border border-card-border bg-card-bg text-[10px] font-bold text-gold uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Smart Search Engine
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-extrabold mb-3 leading-tight">
              Find What You
              <span
                className="block"
                style={{
                  WebkitTextStroke: "1px var(--primary)",
                  color: "transparent",
                  display: "inline",
                }}
              >
                {" "}Love
              </span>
            </h1>
            <p className="text-sm text-muted mb-8 max-w-md mx-auto">
              Search across thousands of premium products with AI-powered filtering and real-time suggestions.
            </p>

            {/* Search bar */}
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit();
                }}
                className="relative"
              >
                <div
                  className="flex items-center gap-3 rounded-2xl border-2 px-5 py-4 bg-card-bg shadow-lg transition-all duration-300"
                  style={{
                    borderColor: showDropdown ? "var(--primary)" : "var(--card-border)",
                    boxShadow: showDropdown
                      ? "0 0 0 4px rgba(197,168,128,0.12), 0 8px 32px rgba(0,0,0,0.08)"
                      : "0 4px 24px rgba(0,0,0,0.06)",
                  }}
                >
                  <Search className="h-5 w-5 text-gold shrink-0" />
                  <input
                    ref={searchBarRef}
                    id="main-search-input"
                    type="text"
                    placeholder="Search products, brands, categories..."
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    autoComplete="off"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={() => {
                        setInputValue("");
                        setShowDropdown(true);
                      }}
                      className="text-muted hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-card-border text-[10px] text-muted font-mono">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                  <button
                    type="submit"
                    className="shrink-0 px-5 py-2 rounded-xl bg-foreground text-background hover:bg-gold text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* Autocomplete Dropdown */}
              {showDropdownContent && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-card-border bg-card-bg shadow-2xl z-50 overflow-hidden"
                  style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.14)" }}
                >
                  {/* Product suggestions */}
                  {suggestions?.products && suggestions.products.length > 0 && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-[9px] font-bold text-gold tracking-widest uppercase flex items-center gap-1.5">
                        <Package className="h-3 w-3" />
                        Products
                      </div>
                      {suggestions.products.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSuggestionClick(p.title, p.url)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted-light transition-colors text-left group"
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted-light shrink-0">
                            {p.image ? (
                              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted">
                                <Package className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-foreground group-hover:text-gold transition-colors line-clamp-1">
                              {highlightMatch(p.title, inputValue)}
                            </div>
                            {p.brand && (
                              <div className="text-[10px] text-muted">{p.brand}</div>
                            )}
                          </div>
                          <div className="text-xs font-bold text-gold shrink-0">
                            {p.price?.toFixed(2)} EGP
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Keyword suggestions */}
                  {suggestions?.keywords && suggestions.keywords.length > 0 && (
                    <div className="border-t border-card-border">
                      <div className="px-4 pt-2.5 pb-1 text-[9px] font-bold text-gold tracking-widest uppercase flex items-center gap-1.5">
                        <Search className="h-3 w-3" />
                        Suggestions
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                        {suggestions.keywords.map((k: any) => (
                          <button
                            key={k.title}
                            type="button"
                            onClick={() => handleSuggestionClick(k.title, k.url)}
                            className="text-[11px] px-2.5 py-1 rounded-full border border-card-border hover:border-gold hover:text-gold text-muted transition-all"
                          >
                            {highlightMatch(k.title, inputValue)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent searches */}
                  {!hasSuggestions && hasRecent && (
                    <div>
                      <div className="px-4 pt-3 pb-1 text-[9px] font-bold text-muted tracking-widest uppercase flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        Recent Searches
                      </div>
                      {recentSearches.map((term) => (
                        <div key={term} className="flex items-center px-4 py-2 hover:bg-muted-light group">
                          <button
                            type="button"
                            onClick={() => handleSuggestionClick(term)}
                            className="flex-1 text-left flex items-center gap-2.5 text-sm text-foreground"
                          >
                            <Clock className="h-3.5 w-3.5 text-muted" />
                            {term}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecentSearch(term);
                              setRecentSearches(getRecentSearches());
                            }}
                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-error transition-all"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending */}
                  {!hasSuggestions && hasTrending && (
                    <div className="border-t border-card-border">
                      <div className="px-4 pt-3 pb-1 text-[9px] font-bold text-muted tracking-widest uppercase flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3 text-gold" />
                        Trending Now
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4 pb-3">
                        {trendingTerms.slice(0, 8).map((t: any) => (
                          <button
                            key={t.term}
                            type="button"
                            onClick={() => handleSuggestionClick(t.term)}
                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full border border-card-border hover:border-gold hover:text-gold text-muted transition-all"
                          >
                            🔥 {t.term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Trending pills below search */}
            {trendingTerms.length > 0 && !showDropdown && (
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className="text-[10px] text-muted flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-gold" /> Trending:
                </span>
                {trendingTerms.slice(0, 6).map((t: any) => (
                  <button
                    key={t.term}
                    onClick={() => handleSuggestionClick(t.term)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-card-border hover:border-gold hover:text-gold text-muted transition-all duration-200"
                  >
                    {t.term}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT ────────────────────────────── */}
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-4">
            <Breadcrumbs items={[{ label: "Search", url: "/search" }]} />
          </div>

          {/* ── ACTIVE FILTER CHIPS ───────────────────── */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-xl bg-muted-light border border-card-border">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider shrink-0">
                Active Filters:
              </span>
              {urlCategory && categoriesData?.categories && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  {(categoriesData.categories as any[]).find((c: any) => c._id === urlCategory)?.name || "Category"}
                  <button onClick={() => { setSelectedCategory(""); router.push(buildUrl({ category: "" })); }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              )}
              {urlBrands && urlBrands.split(",").map(b => (
                <span key={b} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  {b}
                  <button onClick={() => {
                    const nb = selectedBrands.filter(x => x !== b);
                    setSelectedBrands(nb);
                    router.push(buildUrl({ brand: nb.join(",") }));
                  }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              ))}
              {urlTags && urlTags.split(",").map(t => (
                <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  #{t}
                  <button onClick={() => {
                    const nt = selectedTags.filter(x => x !== t);
                    setSelectedTags(nt);
                    router.push(buildUrl({ tags: nt.join(",") }));
                  }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              ))}
              {urlRating && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  ≥{urlRating}★
                  <button onClick={() => { setSelectedRating(""); router.push(buildUrl({ rating: "" })); }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              )}
              {urlInStock === "true" && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  In Stock
                  <button onClick={() => { setInStock(false); router.push(buildUrl({ inStock: "" })); }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              )}
              {(urlMinPrice || urlMaxPrice) && (
                <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold font-medium">
                  {urlMinPrice || "0"} - {urlMaxPrice || "∞"} EGP
                  <button onClick={() => { router.push(buildUrl({ minPrice: "", maxPrice: "" })); }}>
                    <X className="h-3 w-3 ml-0.5" />
                  </button>
                </span>
              )}
              <button
                onClick={handleClearFilters}
                className="ml-auto text-[10px] text-error hover:underline font-semibold uppercase tracking-wider"
              >
                Clear All
              </button>
            </div>
          )}

          <div className="flex gap-6">
            {/* ── DESKTOP SIDEBAR ───────────────────── */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-4 luxury-card p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-1 pb-4 border-b border-card-border">
                  <h2 className="font-serif text-base font-bold flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-gold" />
                    Filters
                  </h2>
                  {activeFilterCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {SidebarFilters}
              </div>
            </aside>

            {/* ── RESULTS AREA ──────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  {/* Mobile filter button */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-card-border text-xs font-semibold hover:border-gold transition-all"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-gold text-white text-[9px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {/* Result count */}
                  <div>
                    {isLoading || isFetching ? (
                      <div className="h-4 w-32 bg-muted-light rounded animate-pulse" />
                    ) : (
                      <p className="text-sm text-muted">
                        <span className="font-bold text-foreground">{totalProducts.toLocaleString()}</span>{" "}
                        results{urlQ ? <> for <span className="font-bold text-gold">"{urlQ}"</span></> : ""}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Sort */}
                  <select
                    value={selectedSort}
                    onChange={(e) => {
                      setSelectedSort(e.target.value);
                      const p = new URLSearchParams(searchParams.toString());
                      p.set("sort", e.target.value);
                      p.delete("page");
                      router.push(`/search?${p.toString()}`);
                    }}
                    className="h-9 rounded-xl border border-card-border bg-card-bg px-3 text-xs font-medium outline-none focus:border-gold cursor-pointer"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="newest">Newest First</option>
                    <option value="price-asc">Price: Low → High</option>
                    <option value="price-desc">Price: High → Low</option>
                    <option value="rating">Top Rated</option>
                    <option value="popular">Most Popular</option>
                  </select>

                  {/* View toggle */}
                  <div className="flex rounded-xl border border-card-border overflow-hidden">
                    <button
                      onClick={() => setView("grid")}
                      className={`p-2.5 transition-colors ${
                        view === "grid" ? "bg-foreground text-background" : "hover:bg-muted-light text-muted"
                      }`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setView("list")}
                      className={`p-2.5 transition-colors border-l border-card-border ${
                        view === "list" ? "bg-foreground text-background" : "hover:bg-muted-light text-muted"
                      }`}
                      aria-label="List view"
                    >
                      <List className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {isLoading || isFetching ? (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                      : "flex flex-col gap-3"
                  }
                >
                  {[...Array(9)].map((_, i) => (
                    view === "grid" ? (
                      <CardSkeleton key={i} />
                    ) : (
                      <div key={i} className="h-32 rounded-2xl bg-muted-light animate-pulse" />
                    )
                  ))}
                </div>
              ) : products.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                    style={{ background: "linear-gradient(135deg, var(--muted-light), var(--card-border))" }}
                  >
                    <Search className="h-10 w-10 text-muted" />
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-2">No Results Found</h3>
                  <p className="text-sm text-muted max-w-sm mb-6 leading-relaxed">
                    We couldn't find anything matching{" "}
                    {urlQ ? <strong className="text-gold">"{urlQ}"</strong> : "your filters"}.
                    Try adjusting your search or clearing filters.
                  </p>
                  {activeFilterCount > 0 && (
                    <button
                      onClick={handleClearFilters}
                      className="px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-gold text-xs font-bold uppercase tracking-wider transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  )}
                  {/* Trending */}
                  {trendingTerms.length > 0 && (
                    <div className="mt-8">
                      <p className="text-xs text-muted font-semibold uppercase tracking-wider mb-3">
                        Try these trending searches:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {trendingTerms.slice(0, 5).map((t: any) => (
                          <button
                            key={t.term}
                            onClick={() => handleSuggestionClick(t.term)}
                            className="text-xs px-3 py-1.5 rounded-full border border-card-border hover:border-gold hover:text-gold text-muted transition-all"
                          >
                            🔥 {t.term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className={
                      view === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
                        : "flex flex-col gap-3"
                    }
                  >
                    {products.map((product) => (
                      <ProductCard
                        key={product._id}
                        product={product}
                        view={view}
                        wishlisted={wishlistIds.has(product._id)}
                        onWishlist={handleWishlist}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-10">
                      <button
                        onClick={() => handlePageChange(urlPage - 1)}
                        disabled={urlPage <= 1}
                        className="p-2 rounded-xl border border-card-border hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>

                      {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                        let page: number;
                        if (totalPages <= 7) {
                          page = i + 1;
                        } else if (urlPage <= 4) {
                          page = i + 1;
                        } else if (urlPage >= totalPages - 3) {
                          page = totalPages - 6 + i;
                        } else {
                          page = urlPage - 3 + i;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-9 h-9 rounded-xl text-xs font-semibold transition-all duration-200 ${
                              page === urlPage
                                ? "bg-foreground text-background"
                                : "border border-card-border hover:border-gold text-muted hover:text-foreground"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(urlPage + 1)}
                        disabled={urlPage >= totalPages}
                        className="p-2 rounded-xl border border-card-border hover:border-gold disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── MOBILE FILTER DRAWER ──────────────────────── */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div
            className="absolute top-0 left-0 h-full w-80 max-w-full bg-card-bg shadow-2xl overflow-y-auto"
            style={{ animation: "slideInLeft 0.3s ease-out" }}
          >
            <div className="flex items-center justify-between p-5 border-b border-card-border sticky top-0 bg-card-bg z-10">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gold" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-muted-light transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">{SidebarFilters}</div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
