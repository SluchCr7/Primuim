"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import {
  useGetProductsQuery,
  useGetCategoriesQuery,
  useGetSearchSuggestionsQuery,
  useAddToCartMutation,
} from "../../lib/api";
import { CardSkeleton } from "../components/Skeletons";
import { useAppSelector } from "../../lib/store";
import { Search, Star, SlidersHorizontal, Eye } from "lucide-react";

export default function AdvancedSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // URL State values
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // Local Filter state
  const [searchQuery, setSearchQuery] = useState(q);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedSort, setSelectedSort] = useState(sort);
  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  // Auto-suggestions query
  const { data: suggestionsData } = useGetSearchSuggestionsQuery(searchQuery, {
    skip: searchQuery.trim().length < 2,
  });

  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: productsData, isLoading } = useGetProductsQuery({
    search: q,
    category,
    sort,
    minPrice,
    maxPrice,
  });
  
  const [addToCart] = useAddToCartMutation();

  // Sync state with URL params
  useEffect(() => {
    setSearchQuery(q);
    setSelectedCategory(category);
    setSelectedSort(sort);
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [q, category, sort, minPrice, maxPrice]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedSort) params.set("sort", selectedSort);
    if (priceMin) params.set("minPrice", priceMin);
    if (priceMax) params.set("maxPrice", priceMax);
    router.push(`/search?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedSort("newest");
    setPriceMin("");
    setPriceMax("");
    router.push("/search");
  };

  const handleQuickAdd = async (productId: string) => {
    if (!isAuthenticated) {
      alert("Please sign in to add items to your cart.");
      return;
    }
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      alert("Product added to cart!");
    } catch (err) {
      alert("Could not add item to cart.");
    }
  };

  const suggestions = suggestionsData?.suggestions || [];
  const products = productsData?.products || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Advanced Search", url: "/search" }]} />

        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Engine Search</span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Advanced Search</h1>
          <p className="text-sm text-muted mt-2">Filter and query design catalogs with advanced parameters</p>
        </div>

        {/* SEARCH FORM INPUT & AUTOCOMPLETE */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-3xl mb-12">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search details, items, specifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card-bg py-4 pl-6 pr-12 text-sm text-foreground outline-none focus:border-gold shadow-sm"
            />
            <button type="submit" className="absolute right-4 text-muted hover:text-gold transition-colors">
              <Search className="h-5 w-5" />
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {searchQuery.trim().length >= 2 && suggestions.length > 0 && (
            <div className="absolute left-0 mt-2 w-full rounded-lg border border-card-border bg-card-bg p-2 shadow-lg z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-gold tracking-widest uppercase">
                Search Suggestions
              </div>
              <ul>
                {suggestions.map((item: string, idx: number) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(item);
                        const params = new URLSearchParams();
                        params.set("q", item);
                        if (selectedCategory) params.set("category", selectedCategory);
                        router.push(`/search?${params.toString()}`);
                      }}
                      className="w-full text-left rounded px-3 py-2.5 text-xs text-foreground hover:bg-muted-light transition-all"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* SIDEBAR FILTER PANEL */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-card-border pb-4">
              <SlidersHorizontal className="h-4 w-4 text-gold" />
              <h2 className="font-serif text-lg font-bold">Faceted Filters</h2>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded border border-card-border bg-card-bg py-2.5 px-3 text-sm outline-none focus:border-gold"
              >
                <option value="">All Categories</option>
                {categoriesData?.categories?.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Price limits */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Price Limits (EGP)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  className="w-full rounded border border-card-border bg-card-bg py-2 px-3 text-xs outline-none focus:border-gold"
                />
                <span className="text-muted">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  className="w-full rounded border border-card-border bg-card-bg py-2 px-3 text-xs outline-none focus:border-gold"
                />
              </div>
            </div>

            {/* Sorting */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Sorting Order</label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full rounded border border-card-border bg-card-bg py-2.5 px-3 text-sm outline-none focus:border-gold"
              >
                <option value="newest">Newest Designs</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleClearFilters}
                className="w-1/3 h-11 border border-card-border hover:bg-muted-light rounded text-xs font-semibold uppercase tracking-wider"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                className="w-2/3 h-11 bg-foreground text-background hover:bg-gold hover:text-luxury-white rounded text-xs font-semibold uppercase tracking-wider transition-all"
              >
                Apply
              </button>
            </div>
          </div>

          {/* SEARCH RESULTS COLUMN */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-card-border rounded p-6">
                <Search className="h-10 w-10 text-gold/30 mx-auto mb-3" />
                <h3 className="font-serif text-lg font-bold">No results matched your query</h3>
                <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light leading-relaxed">
                  Try adjusting categories, clearing price limit filters, or searching for broader terms.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: any) => (
                  <div
                    key={product._id}
                    className="group flex flex-col luxury-card overflow-hidden hover:scale-[1.01] transition-all duration-300"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted-light">
                      <img
                        src={product.images?.[0]?.url || "https://placehold.co/400x400"}
                        alt={product.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 saturate-50 group-hover:saturate-100"
                      />
                      <button
                        onClick={() => handleQuickAdd(product._id)}
                        className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm py-2 rounded text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white transition-all duration-300 border border-card-border"
                      >
                        Quick Add
                      </button>
                    </div>
                    <div className="flex flex-col p-4 flex-grow">
                      <span className="text-xs text-muted tracking-widest uppercase mb-1">{product.brand || "DESIGNER"}</span>
                      <a
                        href={`/products/${product._id}`}
                        className="font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-1 mb-2"
                      >
                        {product.title}
                      </a>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm font-bold text-gold">{product.price.toFixed(2)} EGP</span>
                        <span className="flex items-center gap-1 text-xs text-muted">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {product.ratingAverage || 5.0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
