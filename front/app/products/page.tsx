"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next"; // استدعاء مكتبة الترجمة
import { useGetProductsQuery, useGetCategoriesQuery, useAddToCartMutation } from "@/redux/api";
import { useAppSelector } from "../../lib/store";
import { formatPrice as formatCurrencyPrice } from "../../lib/currencyUtils";
import { Star, Search, SlidersHorizontal, ChevronLeft, ChevronRight, ShoppingBag, Store, RotateCcw, GitCompare } from "lucide-react";
import Image from "next/image";
import { useToast } from "../components/Toast";
import { SidebarCategoriesSkeleton } from "../components/Skeletons";

export default function ProductsPage() {
  const { t } = useTranslation(); // تفعيل دالة الترجمة
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, currency } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  // ── Compare list state (synced with localStorage) ─────────────────────────
  const [compareIds, setCompareIds] = React.useState<string[]>([]);
  useEffect(() => {
    try { setCompareIds(JSON.parse(localStorage.getItem("compare_list") || "[]")); } catch {}
  }, []);
  const toggleCompare = (productId: string) => {
    setCompareIds(prev => {
      let next: string[];
      if (prev.includes(productId)) {
        next = prev.filter(id => id !== productId);
        showToast(t("Removed from comparison."), "info");
      } else {
        if (prev.length >= 4) {
          showToast(t("You can compare up to 4 products at once."), "error");
          return prev;
        }
        next = [...prev, productId];
        showToast(t("Added to comparison! View at /compare."), "success");
      }
      localStorage.setItem("compare_list", JSON.stringify(next));
      return next;
    });
  };

  // Read URL params
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const subcategory = searchParams.get("subcategory") || "";
  const sort = searchParams.get("sort") || "newest";
  const requestedPage = Number(searchParams.get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(search);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);
  const [localSort, setLocalSort] = useState(sort);

  const [addToCart] = useAddToCartMutation();

  // Sync state if URL changes
  useEffect(() => {
    setLocalSearch(search);
    setLocalMinPrice(minPrice);
    setLocalMaxPrice(maxPrice);
    setLocalSort(sort);
  }, [search, minPrice, maxPrice, sort]);

  // Query products
  const { data: productsData, isFetching, isError, refetch } = useGetProductsQuery({
    search,
    category,
    subcategory,
    sort,
    page,
    minPrice,
    maxPrice
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery(undefined);

  const handleApplyFilters = () => {
    const minValue = localMinPrice.trim() ? Number(localMinPrice) : undefined;
    const maxValue = localMaxPrice.trim() ? Number(localMaxPrice) : undefined;

    if (
      (minValue !== undefined && (!Number.isFinite(minValue) || minValue < 0)) ||
      (maxValue !== undefined && (!Number.isFinite(maxValue) || maxValue < 0))
    ) {
      showToast(t("Enter a valid non-negative price."), "error");
      return;
    }

    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
      showToast(t("Minimum price cannot be greater than maximum price."), "error");
      return;
    }

    const params = new URLSearchParams();
    if (localSearch.trim()) params.set("search", localSearch.trim());
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    if (minValue !== undefined) params.set("minPrice", String(minValue));
    if (maxValue !== undefined) params.set("maxPrice", String(maxValue));
    if (localSort) params.set("sort", localSort);
    params.set("page", "1");
    
    router.push(`/products?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setLocalSort("newest");
    router.push("/products");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/products?${params.toString()}`);
  };

  const handleQuickAdd = async (productId: string) => {
    if (!isAuthenticated) {
      showToast(t("Please sign in to add items to your cart."), "error");
      return;
    }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      showToast(t("Product added to your bag!"), "success");
    } catch (err) {
      showToast(t("Could not add item to cart."), "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-gold/20">

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 py-10">
        
        {/* PAGE HEADER */}
        <div className="mb-8 border-b border-card-border pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-extrabold tracking-tight text-foreground">{t("Our Collection")}</h1>
            <p className="text-sm text-muted mt-1">{t("Discover premium products curated just for you.")}</p>
          </div>
          <div className="text-sm text-muted font-medium" aria-live="polite">
            {!isFetching && productsData && (
              <span>{t("Showing {{count}} exquisite items", { count: productsData.totalProducts ?? productsData.products.length })}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* SIDEBAR FILTERS */}
          <aside className="w-full lg:w-68 shrink-0 bg-card-bg border border-card-border rounded-2xl p-6 shadow-sm h-fit sticky top-6">
            <div className="flex items-center justify-between border-b border-card-border pb-4 mb-5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-600" />
                <h2 className="font-serif text-md font-bold text-foreground">{t("Filter & Refine")}</h2>
              </div>
              <button 
                onClick={handleClearFilters}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-amber-600 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> {t("Reset")}
              </button>
            </div>

            <div className="space-y-6">
              {/* Keyword Search */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  {t("Keywords")}
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder={t("Search brand, tags...")}
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-background py-2.5 pl-3 pr-10 text-sm text-foreground outline-none focus:border-amber-500 transition-all"
                  />
                  <Search className="absolute right-3 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Categories list */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  {t("Category")}
                </label>
                <ul className="flex flex-col gap-1 text-sm max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  <li>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("category");
                        params.delete("subcategory");
                        params.set("page", "1");
                        router.push(`/products?${params.toString()}`);
                      }}
                      className={`text-left w-full rounded-lg px-3 py-2 transition-all cursor-pointer ${!category ? "bg-gold/10 text-gold font-bold" : "text-muted hover:bg-foreground/5 hover:text-foreground"}`}
                    >
                      {t("All Categories")}
                    </button>
                  </li>
                  {categoriesLoading ? (
                    <SidebarCategoriesSkeleton count={6} />
                  ) : (
                    categoriesData?.categories &&
                    categoriesData.categories.map((cat: any) => {
                      const isCatActive = category === cat._id;
                      return (
                        <li key={cat._id} className="flex flex-col">
                          <button
                            onClick={() => {
                              const params = new URLSearchParams(searchParams.toString());
                              params.set("category", cat._id);
                              params.delete("subcategory");
                              params.set("page", "1");
                              router.push(`/products?${params.toString()}`);
                            }}
                            className={`text-left w-full rounded-lg px-3 py-2 transition-all cursor-pointer ${isCatActive && !subcategory ? "bg-gold/10 text-gold font-bold" : isCatActive ? "text-foreground font-semibold bg-foreground/5" : "text-muted hover:bg-foreground/5 hover:text-foreground"}`}
                          >
                            {cat.name}
                          </button>
                          
                          {/* Subcategories list */}
                          {isCatActive && cat.subcategories && cat.subcategories.length > 0 && (
                            <ul className="pl-4 mt-1 mb-2 flex flex-col gap-1 border-l border-card-border ml-3">
                              {cat.subcategories.map((sub: any) => {
                                const isSubActive = subcategory === sub._id;
                                return (
                                  <li key={sub._id}>
                                    <button
                                      onClick={() => {
                                        const params = new URLSearchParams(searchParams.toString());
                                        params.set("subcategory", sub._id);
                                        params.set("page", "1");
                                        router.push(`/products?${params.toString()}`);
                                      }}
                                      className={`text-left w-full rounded-md px-2.5 py-1.5 text-xs transition-all cursor-pointer ${isSubActive ? "text-gold font-bold bg-gold/5" : "text-muted hover:text-foreground hover:bg-foreground/5"}`}
                                    >
                                      {sub.name}
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>

              {/* Price limits */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  {t("Price Range (EGP)")}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={t("Min")}
                    value={localMinPrice}
                    onChange={(e) => setLocalMinPrice(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-amber-500 transition-all"
                  />
                  <span className="text-slate-300 font-light">—</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder={t("Max")}
                    value={localMaxPrice}
                    onChange={(e) => setLocalMaxPrice(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-background py-2 px-3 text-sm text-foreground outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Sort order */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-2">
                  {t("Sort By")}
                </label>
                <select
                  value={localSort}
                  onChange={(e) => setLocalSort(e.target.value)}
                  className="w-full rounded-xl border border-card-border bg-background py-2.5 px-3 text-sm text-foreground outline-none focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="newest">{t("Newest Arrivals")}</option>
                  <option value="price-asc">{t("Price: Low to High")}</option>
                  <option value="price-desc">{t("Price: High to Low")}</option>
                  <option value="rating">{t("Top Rated")}</option>
                  <option value="sold">{t("Best Sellers")}</option>
                </select>
              </div>

              <button
                onClick={handleApplyFilters}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-amber-600 shadow-md hover:shadow-amber-600/10 transition-all duration-300 mt-4"
              >
                {t("Apply Filters")}
              </button>
            </div>
          </aside>

          {/* MAIN PRODUCT GRID */}
          <div className="flex-grow">
            {isFetching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="bg-card-bg border border-card-border rounded-2xl overflow-hidden h-[410px] animate-pulse shadow-sm">
                    <div className="aspect-square bg-muted-light"></div>
                    <div className="p-5 flex flex-col gap-3">
                      <div className="h-3 bg-muted-light w-1/4 rounded"></div>
                      <div className="h-5 bg-muted-light w-3/4 rounded"></div>
                      <div className="h-3 bg-muted-light w-1/2 rounded mt-1"></div>
                      <div className="flex justify-between items-center mt-4 pt-2">
                        <div className="h-5 bg-muted-light w-24 rounded"></div>
                        <div className="h-4 bg-muted-light w-10 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-card-bg border border-dashed border-card-border rounded-2xl p-8 shadow-sm">
                <h3 className="font-serif text-xl font-bold text-foreground">{t("Unable to load products")}</h3>
                <p className="text-muted text-sm mt-2 max-w-xs mx-auto">{t("Please try again in a moment.")}</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-6 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                >
                  {t("Try Again")}
                </button>
              </div>
            ) : !productsData?.products || productsData.products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center bg-card-bg border border-dashed border-card-border rounded-2xl p-8 shadow-sm">
                <div className="p-4 bg-muted-light rounded-full mb-4">
                  <Search className="h-8 w-8 text-muted" />
                </div>
                <h3 className="font-serif text-xl font-bold text-foreground">{t("No items found")}</h3>
                <p className="text-muted text-sm mt-2 max-w-xs mx-auto">{t("We couldn't find any matches for your current filters. Try refining your keywords.")}</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 rounded-xl bg-foreground px-6 py-2.5 text-sm font-semibold text-background hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                >
                  {t("Clear Filters")}
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {productsData.products.map((product: any) => (
                    <div 
                      key={product._id} 
                      className="group flex flex-col bg-card-bg border border-card-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-gold/40 transition-all duration-300 relative"
                    >
                      {/* Image Container */}
                      <div className="relative aspect-square overflow-hidden bg-muted-light">
                        <Image
                          fill
                          src={product.images?.[0]?.url || "https://placehold.co/400x400"}
                          alt={product.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Quick Add + Compare Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
                          <button
                            onClick={() => handleQuickAdd(product._id)}
                            className="w-full flex items-center justify-center gap-2 bg-background hover:bg-amber-600 hover:text-white text-foreground py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg"
                          >
                            <ShoppingBag className="h-3.5 w-3.5" /> {t("Quick Add")}
                          </button>
                        </div>

                        {/* Compare toggle badge — top-right */}
                        <button
                          onClick={(e) => { e.preventDefault(); toggleCompare(product._id); }}
                          title={compareIds.includes(product._id) ? t("Remove from Compare") : t("Add to Compare")}
                          className={`absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center shadow-md transition-all z-10 cursor-pointer ${
                            compareIds.includes(product._id)
                              ? "bg-gold text-white scale-110"
                              : "bg-background/90 backdrop-blur-sm text-muted opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-white"
                          }`}
                        >
                          <GitCompare className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Content Container */}
                      <div className="flex flex-col p-5 flex-grow">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-muted font-bold tracking-widest uppercase">
                            {product.brand || t("DESIGNER")}
                          </span>
                          
                          {/* SELLER NAME */}
                          {product.seller?.username && (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50/70 px-2 py-0.5 rounded-md border border-amber-100/50 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800/50">
                              <Store className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[90px]">{product.seller.username}</span>
                            </div>
                          )}
                        </div>

                        <Link 
                          href={product.slug ? `/product/${product.slug}` : `/products/${product._id}`} 
                          className="font-serif font-bold text-base text-foreground hover:text-gold transition-colors line-clamp-1 mb-3 cursor-pointer"
                        >
                          {product.title}
                        </Link>

                        {/* Divider */}
                        <div className="w-full h-px bg-card-border my-1"></div>

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted font-medium">{t("Price")}</span>
                            <span className="text-base font-black text-foreground">
                              {formatCurrencyPrice(product.price, currency)}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 bg-muted-light px-2.5 py-1 rounded-lg border border-card-border shadow-sm">
                            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> 
                            <span className="text-xs font-bold text-foreground">{product.ratingAverage?.toFixed(1) || "5.0"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINATION */}
                {productsData.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-card-border">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="rounded-xl border border-card-border p-2.5 text-muted hover:text-foreground hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-all bg-card-bg shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <div className="bg-muted-light px-4 py-2 rounded-xl text-xs font-semibold text-foreground shadow-inner">
                      {t("Page {{page}} of {{totalPages}}", { page, totalPages: productsData.totalPages })}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === productsData.totalPages}
                      className="rounded-xl border border-card-border p-2.5 text-muted hover:text-foreground hover:border-gold disabled:opacity-30 disabled:pointer-events-none transition-all bg-card-bg shadow-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </main>

    </div>
  );
}