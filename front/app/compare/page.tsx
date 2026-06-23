"use client";

/**
 * /app/compare/page.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Professional Product Comparison Page
 *
 * Features:
 *  ① Searchable product picker (up to 4 slots)
 *  ② Sticky column headers with product image, title, links & actions
 *  ③ 14-row animated comparison table covering all Product schema fields
 *  ④ Best-value auto-highlighting (lowest price / highest rating / most stock)
 *  ⑤ Per-product: Add to Cart, Toggle Wishlist, View Detail, Remove
 *  ⑥ URL ?ids= persistence so comparisons are shareable
 *  ⑦ Floating bottom tray (synced with localStorage "compare_list")
 *  ⑧ Framer Motion animated transitions throughout
 *  ⑨ Full dark/light mode via CSS custom properties
 *  ⑩ Fully responsive — mobile horizontal scroll + sticky left label column
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  useGetProductsQuery,
  useAddToCartMutation,
  useToggleWishlistMutation,
  useGetWishlistQuery,
} from "../../lib/api";
import { useAppSelector } from "../../lib/store";
import { useToast } from "../components/Toast";
import { formatPrice as fmt } from "../../lib/currencyUtils";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitCompare,
  Trash2,
  Star,
  ShoppingBag,
  Heart,
  ExternalLink,
  Search,
  X,
  Check,
  TrendingDown,
  Award,
  Package,
  Tag,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
  Copy,
  Link2,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart3,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_COMPARE = 4;
const LS_KEY = "compare_list";

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read / write the compare list from localStorage */
function readLS(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}
function writeLS(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(ids));
}

/** Render a ✓ or – icon for boolean product fields */
function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-success font-semibold text-xs">
      <Check className="h-3.5 w-3.5" /> Yes
    </span>
  ) : (
    <span className="text-muted text-xs font-light">—</span>
  );
}

/** Star-bar rating visual */
function StarBar({ rating }: { rating: number }) {
  const pct = Math.round((rating / 5) * 100);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Star className="h-3.5 w-3.5 fill-gold text-gold shrink-0" />
        <span className="font-bold text-sm">{rating.toFixed(1)}</span>
        <span className="text-[10px] text-muted">/ 5</span>
      </div>
      <div className="h-1 w-full max-w-[80px] rounded-full bg-card-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gold transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row definition
// ─────────────────────────────────────────────────────────────────────────────
type RowDef = {
  id: string;
  label: string;
  icon: React.ReactNode;
  render: (p: any, winner?: boolean) => React.ReactNode;
  /** Which field to use for "winner" comparison (higher = better unless invert) */
  compareKey?: (p: any) => number;
  invertWinner?: boolean; // lower is better (e.g. price)
  winnerLabel?: string;
};

const ROWS: RowDef[] = [
  {
    id: "price",
    label: "Price",
    icon: <TrendingDown className="h-3.5 w-3.5" />,
    render: (p, winner) => (
      <div className="flex flex-col gap-1">
        <span className={`text-lg font-bold ${winner ? "text-gold" : "text-foreground"}`}>
          {fmt(p.price, "EGP")}
        </span>
        {p.comparePrice && p.comparePrice > p.price && (
          <div className="flex items-center gap-2">
            <span className="text-xs line-through text-muted">{fmt(p.comparePrice, "EGP")}</span>
            <span className="text-[10px] font-bold text-white bg-error px-1.5 py-0.5 rounded-md">
              -{Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100)}%
            </span>
          </div>
        )}
      </div>
    ),
    compareKey: (p) => p.price,
    invertWinner: true,
    winnerLabel: "Lowest Price",
  },
  {
    id: "rating",
    label: "Rating",
    icon: <Star className="h-3.5 w-3.5" />,
    render: (p, winner) => (
      <div className={winner ? "opacity-100" : "opacity-80"}>
        <StarBar rating={p.ratingAverage || 0} />
        <span className="text-[10px] text-muted mt-1 block">
          {p.ratingCount || 0} reviews
        </span>
      </div>
    ),
    compareKey: (p) => p.ratingAverage || 0,
    winnerLabel: "Highest Rated",
  },
  {
    id: "brand",
    label: "Brand",
    icon: <Award className="h-3.5 w-3.5" />,
    render: (p) => (
      <span className="text-xs font-bold uppercase tracking-widest text-foreground">
        {p.brand || <span className="text-muted font-light">—</span>}
      </span>
    ),
  },
  {
    id: "category",
    label: "Category",
    icon: <Layers className="h-3.5 w-3.5" />,
    render: (p) => (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-foreground">
          {p.category?.name || "—"}
        </span>
        {p.subcategory?.name && (
          <span className="text-[10px] text-muted">{p.subcategory.name}</span>
        )}
      </div>
    ),
  },
  {
    id: "stock",
    label: "Availability",
    icon: <Package className="h-3.5 w-3.5" />,
    render: (p, winner) => (
      <div className="flex flex-col gap-1">
        {p.stock > 0 ? (
          <>
            <span className={`text-xs font-bold ${winner ? "text-success" : "text-success/80"}`}>
              ● In Stock
            </span>
            <span className="text-[10px] text-muted">{p.stock} units</span>
          </>
        ) : (
          <span className="text-xs font-bold text-error">● Out of Stock</span>
        )}
      </div>
    ),
    compareKey: (p) => p.stock || 0,
    winnerLabel: "Most Available",
  },
  {
    id: "sku",
    label: "SKU",
    icon: <Tag className="h-3.5 w-3.5" />,
    render: (p) => (
      <span className="text-[11px] font-mono text-muted tracking-widest">
        {p.sku || "—"}
      </span>
    ),
  },
  {
    id: "variants",
    label: "Variants",
    icon: <Cpu className="h-3.5 w-3.5" />,
    render: (p) => {
      const count = p.variants?.length || 0;
      if (count === 0) return <span className="text-xs text-muted">No variants</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {p.variants.slice(0, 4).map((v: any, i: number) => (
            <span
              key={i}
              className="text-[10px] bg-muted-light text-muted px-2 py-0.5 rounded-md font-medium"
            >
              {Object.values(v.attributes || {}).join(" / ")}
            </span>
          ))}
          {count > 4 && (
            <span className="text-[10px] text-gold font-semibold">+{count - 4} more</span>
          )}
        </div>
      );
    },
  },
  {
    id: "specifications",
    label: "Specifications",
    icon: <BarChart3 className="h-3.5 w-3.5" />,
    render: (p) => {
      const specs = p.specifications || [];
      if (specs.length === 0) return <span className="text-xs text-muted">—</span>;
      return (
        <ul className="flex flex-col gap-1 max-w-[200px]">
          {specs.slice(0, 5).map((s: any, i: number) => (
            <li key={i} className="text-[10px] text-muted leading-snug">
              <span className="font-bold text-foreground">{s.name}:</span> {s.value}
            </li>
          ))}
          {specs.length > 5 && (
            <li className="text-[10px] text-gold font-semibold">+{specs.length - 5} more</li>
          )}
        </ul>
      );
    },
  },
  {
    id: "tags",
    label: "Tags",
    icon: <Tag className="h-3.5 w-3.5" />,
    render: (p) => {
      const tags = p.tags || [];
      if (tags.length === 0) return <span className="text-xs text-muted">—</span>;
      return (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {tags.slice(0, 5).map((t: string, i: number) => (
            <span
              key={i}
              className="text-[10px] bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full font-medium"
            >
              {t}
            </span>
          ))}
          {tags.length > 5 && (
            <span className="text-[10px] text-gold font-semibold">+{tags.length - 5}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "sold",
    label: "Units Sold",
    icon: <Zap className="h-3.5 w-3.5" />,
    render: (p, winner) => (
      <span className={`text-sm font-bold ${winner ? "text-gold" : "text-foreground"}`}>
        {(p.sold || 0).toLocaleString()}
      </span>
    ),
    compareKey: (p) => p.sold || 0,
    winnerLabel: "Best Seller",
  },
  {
    id: "isBestSeller",
    label: "Best Seller",
    icon: <Sparkles className="h-3.5 w-3.5" />,
    render: (p) => <BoolCell value={!!p.isBestSeller} />,
  },
  {
    id: "isDigital",
    label: "Digital Product",
    icon: <Cpu className="h-3.5 w-3.5" />,
    render: (p) => <BoolCell value={!!p.isDigital} />,
  },
  {
    id: "isBundle",
    label: "Bundle",
    icon: <Layers className="h-3.5 w-3.5" />,
    render: (p) => <BoolCell value={!!p.isBundle} />,
  },
  {
    id: "seller",
    label: "Seller",
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    render: (p) =>
      p.seller?.storeName || p.seller?.username ? (
        <Link
          href={p.seller?.storeSlug ? `/store/${p.seller.storeSlug}` : "#"}
          className="text-xs text-gold hover:underline underline-offset-2 font-semibold"
        >
          {p.seller?.storeName || p.seller?.username}
        </Link>
      ) : (
        <span className="text-xs text-muted">—</span>
      ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, currency } = useAppSelector((s) => s.auth);
  const { showToast } = useToast();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ limit: 60 });
  const [addToCart, { isLoading: cartLoading }] = useAddToCartMutation();
  const [toggleWishlist] = useToggleWishlistMutation();
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });

  const allProducts: any[] = useMemo(() => productsData?.products || [], [productsData]);

  // ── Compare list state ─────────────────────────────────────────────────────
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(true);
  const [trayDismissed, setTrayDismissed] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // ── Boot: read from URL ?ids= first, then localStorage ────────────────────
  useEffect(() => {
    const urlIds = searchParams.get("ids");
    if (urlIds) {
      const parsed = urlIds.split(",").filter(Boolean).slice(0, MAX_COMPARE);
      setCompareIds(parsed);
      writeLS(parsed);
    } else {
      setCompareIds(readLS());
    }
  }, []);  // eslint-disable-line

  // ── Sync compareIds → URL + localStorage ──────────────────────────────────
  const syncIds = useCallback((ids: string[]) => {
    setCompareIds(ids);
    writeLS(ids);
    const params = new URLSearchParams();
    if (ids.length > 0) params.set("ids", ids.join(","));
    router.replace(`/compare${ids.length ? `?${params.toString()}` : ""}`, { scroll: false });
  }, [router]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleAdd = (id: string) => {
    if (compareIds.includes(id)) return;
    if (compareIds.length >= MAX_COMPARE) {
      showToast(`You can compare up to ${MAX_COMPARE} products at once.`, "error");
      return;
    }
    syncIds([...compareIds, id]);
    setTrayDismissed(false);
  };

  const handleRemove = (id: string) => {
    syncIds(compareIds.filter((i) => i !== id));
  };

  const handleClearAll = () => {
    syncIds([]);
    showToast("Comparison cleared.", "info");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Comparison link copied to clipboard!", "success");
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to your cart.", "error");
      return;
    }
    setAddingToCart(product._id);
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      showToast(`"${product.title}" added to your bag.`, "success");
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to add to cart.", "error");
    } finally {
      setAddingToCart(null);
    }
  };

  const handleWishlist = async (product: any) => {
    if (!isAuthenticated) {
      showToast("Please log in to use your wishlist.", "error");
      return;
    }
    try {
      const res = await toggleWishlist(product._id).unwrap();
      showToast(res.message, "success");
    } catch {
      showToast("Failed to update wishlist.", "error");
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────
  const comparedItems: any[] = useMemo(
    () => compareIds.map((id) => allProducts.find((p) => p._id === id)).filter(Boolean),
    [compareIds, allProducts]
  );

  const isWishlisted = (id: string) =>
    wishlistData?.wishlist?.some((w: any) => w.product?._id === id);

  /** Filtered picker list */
  const pickerList = useMemo(() => {
    const q = pickerSearch.toLowerCase();
    return allProducts.filter(
      (p) =>
        !compareIds.includes(p._id) &&
        (p.title.toLowerCase().includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.category?.name || "").toLowerCase().includes(q))
    );
  }, [allProducts, compareIds, pickerSearch]);

  /**
   * Compute per-row "winner" index.
   * Returns a map: rowId → productId of winner
   */
  const winners = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    if (comparedItems.length < 2) return result;

    ROWS.forEach((row) => {
      if (!row.compareKey) return;
      const values = comparedItems.map((p) => ({ id: p._id, val: row.compareKey!(p) }));
      const best = row.invertWinner
        ? values.reduce((a, b) => (a.val <= b.val ? a : b))
        : values.reduce((a, b) => (a.val >= b.val ? a : b));
      // Only highlight if not all equal
      const allSame = values.every((v) => v.val === values[0].val);
      if (!allSame) result[row.id] = best.id;
    });
    return result;
  }, [comparedItems]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow w-full mx-auto max-w-[1400px] px-4 sm:px-6 py-10 lg:py-14">

        {/* ── Page Header ────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase flex items-center gap-1.5 mb-2">
              <GitCompare className="h-3.5 w-3.5" /> Side-by-Side Analysis
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
              Compare Products
            </h1>
            <p className="text-sm text-muted font-light mt-2">
              Evaluate up to {MAX_COMPARE} products side-by-side across {ROWS.length} attributes.
            </p>
          </div>

          {/* Actions row */}
          <div className="flex items-center gap-3 flex-wrap">
            {compareIds.length > 0 && (
              <>
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-card-border text-xs font-semibold uppercase tracking-wider text-muted hover:border-gold/50 hover:text-gold transition-all cursor-pointer"
                >
                  <Link2 className="h-3.5 w-3.5" /> Share Link
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-error/30 text-xs font-semibold uppercase tracking-wider text-error hover:bg-error/5 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Product Picker ─────────────────────────────────────────────── */}
        <div className="luxury-card mb-8 overflow-hidden">
          {/* Picker header — collapsible */}
          <button
            onClick={() => setPickerOpen((o) => !o)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted-light/30 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-gold" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Add products to compare</p>
                <p className="text-[10px] text-muted">
                  {compareIds.length}/{MAX_COMPARE} slots used
                </p>
              </div>
            </div>
            {pickerOpen ? (
              <ChevronUp className="h-4 w-4 text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted" />
            )}
          </button>

          <AnimatePresence>
            {pickerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="overflow-hidden border-t border-card-border"
              >
                <div className="p-5 flex flex-col gap-4">
                  {/* Selected chips */}
                  {comparedItems.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {comparedItems.map((p) => (
                        <motion.div
                          key={p._id}
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          className="flex items-center gap-2 pl-2 pr-1 py-1 bg-gold/10 border border-gold/25 rounded-full"
                        >
                          <img
                            src={p.images?.[0]?.url || "https://placehold.co/24x24"}
                            alt={p.title}
                            className="h-5 w-5 rounded-full object-cover shrink-0"
                          />
                          <span className="text-[11px] font-semibold text-gold max-w-[120px] truncate">
                            {p.title}
                          </span>
                          <button
                            onClick={() => handleRemove(p._id)}
                            className="h-5 w-5 rounded-full bg-gold/20 hover:bg-error/20 flex items-center justify-center text-gold hover:text-error transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Slot progress bar */}
                  <div className="flex items-center gap-2">
                    {Array.from({ length: MAX_COMPARE }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                          i < compareIds.length ? "bg-gold" : "bg-card-border"
                        }`}
                      />
                    ))}
                    <span className="text-[10px] text-muted ml-1 font-semibold shrink-0">
                      {compareIds.length}/{MAX_COMPARE}
                    </span>
                  </div>

                  {/* Search input */}
                  {compareIds.length < MAX_COMPARE && (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                        <input
                          id="picker-search"
                          type="text"
                          placeholder="Search by name, brand or category..."
                          value={pickerSearch}
                          onChange={(e) => setPickerSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-card-border bg-background text-sm focus:outline-none focus:border-gold/60 transition-colors"
                        />
                        {pickerSearch && (
                          <button
                            onClick={() => setPickerSearch("")}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Product grid picker */}
                      {productsLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-24 rounded-xl bg-muted-light animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto pr-1">
                          {pickerList.slice(0, 30).map((p) => (
                            <button
                              key={p._id}
                              onClick={() => handleAdd(p._id)}
                              className="group flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-card-border hover:border-gold hover:bg-gold/5 transition-all cursor-pointer text-center"
                            >
                              <img
                                src={p.images?.[0]?.url || "https://placehold.co/60x60"}
                                alt={p.title}
                                className="h-10 w-10 object-cover rounded-lg group-hover:scale-105 transition-transform"
                              />
                              <span className="text-[10px] font-semibold text-muted group-hover:text-gold line-clamp-2 leading-tight">
                                {p.title}
                              </span>
                              <span className="text-[9px] text-gold font-bold">
                                {fmt(p.price, "EGP")}
                              </span>
                            </button>
                          ))}
                          {pickerList.length === 0 && (
                            <div className="col-span-full text-center py-8 text-sm text-muted">
                              No products match your search.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {compareIds.length >= MAX_COMPARE && (
                    <p className="text-xs text-muted text-center py-2">
                      Maximum {MAX_COMPARE} products reached. Remove one to add another.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Empty state ────────────────────────────────────────────────── */}
        <AnimatePresence>
          {comparedItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="luxury-card py-20 px-8 flex flex-col items-center gap-6 text-center max-w-lg mx-auto"
            >
              {/* SVG illustration */}
              <svg
                viewBox="0 0 120 100"
                className="w-32 h-auto opacity-30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="5" y="20" width="48" height="65" rx="6" stroke="var(--primary)" strokeWidth="2" />
                <rect x="67" y="20" width="48" height="65" rx="6" stroke="var(--primary)" strokeWidth="2" />
                <line x1="29" y1="35" x2="29" y2="35" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
                <rect x="13" y="32" width="32" height="4" rx="2" fill="var(--primary)" fillOpacity=".4" />
                <rect x="13" y="42" width="20" height="3" rx="1.5" fill="var(--primary)" fillOpacity=".25" />
                <rect x="13" y="50" width="26" height="3" rx="1.5" fill="var(--primary)" fillOpacity=".25" />
                <rect x="75" y="32" width="32" height="4" rx="2" fill="var(--primary)" fillOpacity=".4" />
                <rect x="75" y="42" width="20" height="3" rx="1.5" fill="var(--primary)" fillOpacity=".25" />
                <rect x="75" y="50" width="26" height="3" rx="1.5" fill="var(--primary)" fillOpacity=".25" />
                <path d="M53 52.5 L67 52.5" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 2" />
                <circle cx="53" cy="52.5" r="2.5" fill="var(--primary)" />
                <circle cx="67" cy="52.5" r="2.5" fill="var(--primary)" />
              </svg>

              <div>
                <h2 className="font-serif text-xl font-bold mb-2">Nothing to compare yet</h2>
                <p className="text-sm text-muted font-light leading-relaxed max-w-xs">
                  Use the picker above to select up to {MAX_COMPARE} products and
                  evaluate them across {ROWS.length} detailed attributes.
                </p>
              </div>

              <Link
                href="/products"
                className="flex items-center gap-2 h-11 px-7 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5"
              >
                <ShoppingBag className="h-4 w-4" /> Browse Products
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Comparison Table ──────────────────────────────────────── */}
        {comparedItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="luxury-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: "600px" }}>

                {/* ── Sticky product header row ── */}
                <thead>
                  <tr className="border-b border-card-border">
                    {/* Label column */}
                    <th className="sticky left-0 z-20 bg-card-bg w-[160px] min-w-[160px] p-5 text-left">
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted">
                        Attribute
                      </span>
                    </th>

                    {/* Product columns */}
                    {comparedItems.map((item) => (
                      <th
                        key={item._id}
                        className="p-5 min-w-[220px] max-w-[280px] align-top border-l border-card-border"
                      >
                        <div className="flex flex-col gap-3">
                          {/* Product image */}
                          <div className="relative">
                            <img
                              src={item.images?.[0]?.url || "https://placehold.co/200x200"}
                              alt={item.title}
                              className="w-full aspect-square object-cover rounded-xl border border-card-border"
                            />
                            {item.isBestSeller && (
                              <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest bg-gold text-white px-2 py-0.5 rounded-full">
                                Best Seller
                              </span>
                            )}
                            {item.comparePrice && item.comparePrice > item.price && (
                              <span className="absolute top-2 right-2 text-[9px] font-bold bg-error text-white px-2 py-0.5 rounded-full">
                                -{Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)}%
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <div>
                            <p className="text-[10px] font-bold tracking-widest text-gold uppercase mb-0.5">
                              {item.brand || "—"}
                            </p>
                            <Link
                              href={`/product/${item.slug}`}
                              className="font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-2 leading-snug"
                            >
                              {item.title}
                            </Link>
                          </div>

                          {/* Action row */}
                          <div className="flex flex-col gap-2">
                            {/* Add to Cart */}
                            <button
                              onClick={() => handleAddToCart(item)}
                              disabled={addingToCart === item._id || item.stock === 0}
                              className="w-full h-9 rounded-lg bg-foreground text-background hover:bg-gold hover:text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {addingToCart === item._id ? (
                                <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <ShoppingBag className="h-3.5 w-3.5" />
                              )}
                              {item.stock === 0 ? "Out of Stock" : "Add to Bag"}
                            </button>

                            {/* Wishlist + View + Remove */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleWishlist(item)}
                                title={isWishlisted(item._id) ? "Remove from Wishlist" : "Add to Wishlist"}
                                className={`flex-1 h-8 rounded-lg border text-[10px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                                  isWishlisted(item._id)
                                    ? "border-error/30 bg-error/5 text-error"
                                    : "border-card-border hover:border-gold/50 text-muted hover:text-gold"
                                }`}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${isWishlisted(item._id) ? "fill-error" : ""}`}
                                />
                              </button>
                              <Link
                                href={`/product/${item.slug}`}
                                title="View Product"
                                className="flex-1 h-8 rounded-lg border border-card-border hover:border-gold/50 text-muted hover:text-gold text-[10px] font-semibold flex items-center justify-center gap-1 transition-all"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => handleRemove(item._id)}
                                title="Remove"
                                className="flex-1 h-8 rounded-lg border border-card-border hover:border-error/40 text-muted hover:text-error text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}

                    {/* Empty slot column */}
                    {comparedItems.length < MAX_COMPARE && (
                      <th className="p-5 min-w-[180px] border-l border-card-border border-dashed align-middle">
                        <button
                          onClick={() => { setPickerOpen(true); setPickerSearch(""); }}
                          className="w-full h-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-card-border hover:border-gold/40 hover:bg-gold/5 transition-all group cursor-pointer"
                        >
                          <div className="h-12 w-12 rounded-full bg-muted-light group-hover:bg-gold/10 flex items-center justify-center transition-all">
                            <Plus className="h-5 w-5 text-muted group-hover:text-gold" />
                          </div>
                          <span className="text-xs text-muted group-hover:text-gold font-medium transition-colors">
                            Add product
                          </span>
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>

                {/* ── Comparison rows ── */}
                <tbody>
                  {ROWS.map((row, rowIdx) => {
                    const winnerId = winners[row.id];
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-card-border last:border-none transition-colors ${
                          rowIdx % 2 === 0 ? "bg-transparent" : "bg-muted-light/20"
                        }`}
                      >
                        {/* Label cell — sticky left */}
                        <td className="sticky left-0 z-10 bg-card-bg px-5 py-4 w-[160px] min-w-[160px] border-r border-card-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-muted/60">{row.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
                              {row.label}
                            </span>
                          </div>
                          {/* Winner badge */}
                          {winnerId && row.winnerLabel && (
                            <span className="mt-1.5 inline-flex items-center gap-1 text-[8px] font-bold text-gold uppercase tracking-wider">
                              <Sparkles className="h-2.5 w-2.5" /> {row.winnerLabel}
                            </span>
                          )}
                        </td>

                        {/* Data cells */}
                        {comparedItems.map((item) => {
                          const isWinner = winnerId === item._id;
                          return (
                            <td
                              key={item._id}
                              className={`px-5 py-4 border-l border-card-border align-top transition-all ${
                                isWinner
                                  ? "bg-gold/5 border-gold/15"
                                  : ""
                              }`}
                            >
                              {/* Winner top indicator */}
                              {isWinner && (
                                <div className="flex items-center gap-1 mb-2">
                                  <span className="text-[8px] font-bold text-gold uppercase tracking-widest bg-gold/10 border border-gold/20 px-1.5 py-0.5 rounded-full">
                                    ✦ {row.winnerLabel}
                                  </span>
                                </div>
                              )}
                              {row.render(item, isWinner)}
                            </td>
                          );
                        })}

                        {/* Empty slot cell */}
                        {comparedItems.length < MAX_COMPARE && (
                          <td className="px-5 py-4 border-l border-card-border border-dashed bg-muted-light/5" />
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom summary bar */}
            <div className="border-t border-card-border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted-light/20">
              <p className="text-[10px] text-muted font-light">
                Comparing <span className="font-bold text-foreground">{comparedItems.length}</span> products
                across <span className="font-bold text-foreground">{ROWS.length}</span> attributes.
                {comparedItems.length < MAX_COMPARE && (
                  <> You can add <span className="font-bold text-gold">{MAX_COMPARE - comparedItems.length}</span> more.</>
                )}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-card-border text-[10px] font-semibold text-muted hover:text-gold hover:border-gold/50 transition-all cursor-pointer"
                >
                  <Copy className="h-3 w-3" /> Copy Share Link
                </button>
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/20 text-[10px] font-semibold text-error hover:bg-error/5 transition-all cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" /> Clear All
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── Floating Compare Tray ──────────────────────────────────────────── */}
      <AnimatePresence>
        {compareIds.length > 0 && !trayDismissed && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
          >
            <div className="luxury-card shadow-2xl shadow-black/20 backdrop-blur-xl border-gold/20 px-5 py-4 flex items-center gap-4">
              {/* Thumbnails */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {comparedItems.map((item) => (
                  <div key={item._id} className="relative shrink-0">
                    <img
                      src={item.images?.[0]?.url || "https://placehold.co/36x36"}
                      alt={item.title}
                      className="h-9 w-9 rounded-lg object-cover border border-card-border"
                    />
                    <button
                      onClick={() => handleRemove(item._id)}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-error text-white rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 transition-transform"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {Array.from({ length: MAX_COMPARE - comparedItems.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="h-9 w-9 rounded-lg border-2 border-dashed border-card-border flex items-center justify-center shrink-0"
                  >
                    <Plus className="h-3 w-3 text-muted/40" />
                  </div>
                ))}
                <div className="min-w-0 ml-1 hidden sm:block">
                  <p className="text-xs font-bold truncate">
                    {compareIds.length} product{compareIds.length !== 1 ? "s" : ""} selected
                  </p>
                  <p className="text-[10px] text-muted">
                    {MAX_COMPARE - compareIds.length} slot{MAX_COMPARE - compareIds.length !== 1 ? "s" : ""} remaining
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setTrayDismissed(true)}
                  className="p-2 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
                <Link
                  href="/compare"
                  className="flex items-center gap-2 h-9 px-5 rounded-full bg-foreground text-background hover:bg-gold hover:text-white text-xs font-bold uppercase tracking-widest transition-all shadow-md"
                >
                  <GitCompare className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Compare Now</span>
                  <span className="sm:hidden">Compare</span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
