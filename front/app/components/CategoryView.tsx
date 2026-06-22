"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "./Header";
import Footer from "./Footer";
import Breadcrumbs from "./Breadcrumbs";
import {
  useGetCategoryByIdQuery,
  useGetCategoryBySlugQuery,
  useGetProductsQuery,
  useAddToCartMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} from "../../lib/api";
import { CardSkeleton } from "./Skeletons";
import { useAppSelector } from "../../lib/store";
import { useToast } from "./Toast";
import { addGuestCartItem } from "../../lib/cartUtils";
import { 
  Star, 
  ArrowLeft, 
  ShoppingBag, 
  SlidersHorizontal, 
  Search, 
  Heart, 
  Sparkles,
  ChevronRight,
  X,
  ChevronLeft
} from "lucide-react";

interface CategoryViewProps {
  id?: string;
  slug?: string;
}

export default function CategoryView({ id, slug }: CategoryViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [appliedMinPrice, setAppliedMinPrice] = useState("");
  const [appliedMaxPrice, setAppliedMaxPrice] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [wishlistUpdatingId, setWishlistUpdatingId] = useState<string | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch Category details (deep populated on backend)
  const idQuery = useGetCategoryByIdQuery(id!, { skip: !id });
  const slugQuery = useGetCategoryBySlugQuery(slug!, { skip: !slug });

  const categoryLoading = id ? idQuery.isLoading : slugQuery.isLoading;
  const categoryError = id ? idQuery.isError : slugQuery.isError;
  const categoryResponse = id ? idQuery.data : slugQuery.data;
  const currentCategory = categoryResponse?.category;

  // Fetch products under category
  const productsQueryArgs = useMemo(() => {
    if (!currentCategory?._id) return undefined;
    const params: any = {
      category: currentCategory._id,
      page: currentPage,
      limit: 8,
      sort: sortOption,
    };
    if (debouncedSearch) params.search = debouncedSearch;
    if (appliedMinPrice) params.minPrice = Number(appliedMinPrice);
    if (appliedMaxPrice) params.maxPrice = Number(appliedMaxPrice);
    return params;
  }, [currentCategory?._id, currentPage, sortOption, debouncedSearch, appliedMinPrice, appliedMaxPrice]);

  const skipProducts = !currentCategory?._id;
  const { data: productsData, isLoading: productsLoading, isFetching: productsFetching } = useGetProductsQuery(
    skipProducts ? undefined : productsQueryArgs,
    { skip: skipProducts }
  );

  const [addToCart] = useAddToCartMutation();
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;

  // Track wishlist items map
  const wishlistMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (wishlistData?.wishlist?.products) {
      wishlistData.wishlist.products.forEach((prod: any) => {
        map[prod._id || prod] = true;
      });
    }
    return map;
  }, [wishlistData]);

  // Add to cart
  const handleQuickAdd = async (product: any) => {
    setAddingId(product._id);
    
    // Prevent self-purchase
    const productSellerId = product.seller?._id || product.seller;
    if (currentUser && productSellerId && productSellerId.toString() === currentUser.id) {
      showToast("You cannot purchase your own designs.", "error");
      setAddingId(null);
      return;
    }

    if (!isAuthenticated) {
      addGuestCartItem(product, 1);
      showToast("Added to guest cart successfully.", "success");
      setAddingId(null);
      return;
    }

    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      showToast("Added to your shopping bag.", "success");
    } catch (err: any) {
      showToast(err?.data?.message || "Could not add item to cart.", "error");
    } finally {
      setAddingId(null);
    }
  };

  // Toggle wishlist
  const handleWishlistToggle = async (productId: string) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to your wishlist.", "error");
      return;
    }
    setWishlistUpdatingId(productId);
    try {
      const res = await toggleWishlist(productId).unwrap();
      showToast(res.message || "Wishlist updated.", "success");
      refetchWishlist();
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to update wishlist.", "error");
    } finally {
      setWishlistUpdatingId(null);
    }
  };

  // Construct Breadcrumbs
  const breadcrumbItems = useMemo(() => {
    if (!currentCategory) return [];
    const items: { label: string; url?: string }[] = [];
    
    let temp = currentCategory.parent;
    while (temp) {
      items.unshift({
        label: temp.name,
        url: temp.slug ? `/category/${temp.slug}` : `/categories/${temp._id}`,
      });
      temp = temp.parent;
    }
    
    items.unshift({ label: "Categories", url: "/categories" });
    items.push({ label: currentCategory.name });
    return items;
  }, [currentCategory]);

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedMinPrice(minPrice);
    setAppliedMaxPrice(maxPrice);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setAppliedMinPrice("");
    setAppliedMaxPrice("");
    setSortOption("newest");
    setCurrentPage(1);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
            <p className="text-xs text-muted tracking-widest uppercase font-semibold">Loading Catalog...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (categoryError || !currentCategory) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 text-center py-24 px-6">
          <div className="luxury-card p-8 max-w-md bg-card-bg/25 border border-card-border/60">
            <h2 className="font-serif text-2xl font-bold mb-2">Category Not Found</h2>
            <p className="text-sm text-muted mb-6 font-light">The category you are looking for might have been moved or deleted.</p>
            <button
              onClick={() => router.push("/categories")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded border border-card-border px-6 text-xs font-bold tracking-widest uppercase hover:border-gold hover:text-gold transition-colors cursor-pointer bg-background"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Categories
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-gold/20">
      <Header />

      <main className="flex-grow mx-auto max-w-[1400px] w-full px-4 sm:px-6 py-8">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Dynamic Category Hero Banner */}
        <div className="relative h-[280px] sm:h-[340px] rounded-[32px] overflow-hidden flex items-end p-6 sm:p-10 mb-10 border border-card-border group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />
          <img
            src={currentCategory.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"}
            alt={currentCategory.name}
            className="absolute inset-0 h-full w-full object-cover saturate-50 group-hover:scale-105 transition-transform duration-[8s] ease-out"
          />
          <div className="relative z-20 text-white max-w-2xl">
            <span className="text-[10px] sm:text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-2 sm:mb-3">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" /> Fine Selections
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight leading-none mb-3 sm:mb-4">
              {currentCategory.name}
            </h1>
            {currentCategory.description ? (
              <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-xl">
                {currentCategory.description}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-white/80 font-light leading-relaxed max-w-xl">
                Explore handpicked products crafted by leading global designers, offering unmatched quality and exquisite detail.
              </p>
            )}
          </div>
        </div>

        {/* Subcategories strip if child categories exist */}
        {currentCategory.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="mb-12">
            <h3 className="text-xs font-bold tracking-widest text-gold uppercase mb-5">Subcategories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentCategory.subcategories.map((sub: any) => (
                <Link
                  key={sub._id}
                  href={`/category/${sub.slug || sub._id}`}
                  className="group flex flex-col items-center justify-center luxury-card p-4 text-center border border-card-border hover:border-gold/30 hover:shadow-md transition-all duration-300 bg-card-bg/10 rounded-2xl overflow-hidden relative cursor-pointer"
                >
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden mb-3 border border-card-border/60 group-hover:border-gold transition-colors relative">
                    <img
                      src={sub.image || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=150"}
                      alt={sub.name}
                      className="h-full w-full object-cover saturate-[0.45] group-hover:saturate-100 group-hover:scale-110 transition-all duration-500"
                    />
                  </div>
                  <span className="font-serif text-xs sm:text-sm font-bold text-foreground group-hover:text-gold transition-colors line-clamp-1">
                    {sub.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Catalog Search & Filters Header */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky top-24 bg-card-bg/10 border border-card-border p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-card-border/60">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gold" /> Filters
              </h2>
              <button
                onClick={handleClearFilters}
                className="text-[10px] tracking-wider uppercase font-bold text-muted hover:text-gold transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* Local search within category */}
            <div className="mb-6">
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">
                Search In Category
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-card-border/80 focus:border-gold rounded-lg py-2 pl-9 pr-3 text-xs outline-none transition-colors"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted/65" />
              </div>
            </div>

            {/* Price range filter */}
            <div className="mb-6">
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">
                Price Range (EGP)
              </label>
              <form onSubmit={handleApplyPrice} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full bg-background border border-card-border/80 focus:border-gold rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full bg-background border border-card-border/80 focus:border-gold rounded-lg py-2 px-3 text-xs outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full h-9 bg-foreground text-background font-bold text-[10px] tracking-widest uppercase hover:bg-gold hover:text-luxury-white transition-colors rounded-lg cursor-pointer"
                >
                  Apply Filter
                </button>
              </form>
            </div>

            {/* Sort controls inside sidebar */}
            <div>
              <label className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">
                Sort By
              </label>
              <select
                value={sortOption}
                onChange={(e) => {
                  setSortOption(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-background border border-card-border/80 focus:border-gold rounded-lg py-2 px-3 text-xs outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="sold">Best Sellers</option>
              </select>
            </div>
          </aside>

          {/* Catalog Content Area */}
          <div className="flex-grow w-full">
            
            {/* Top Toolbar (Mobile filters toggle + current status) */}
            <div className="flex items-center justify-between mb-6 bg-card-bg/5 p-4 border border-card-border rounded-xl">
              <span className="text-xs text-muted font-medium">
                {productsLoading ? "Finding designs..." : `${productsData?.totalProducts || 0} designs available`}
              </span>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-card-border rounded-lg text-xs font-semibold hover:border-gold transition-colors cursor-pointer bg-background"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </button>

                {/* Quick select (mostly for desktop/mobile consistency) */}
                <select
                  value={sortOption}
                  onChange={(e) => {
                    setSortOption(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="lg:hidden bg-background border border-card-border rounded-lg py-1.5 px-2.5 text-xs outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low-High</option>
                  <option value="price-desc">Price: High-Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="sold">Popularity</option>
                </select>
              </div>
            </div>

            {/* Products grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, idx) => (
                  <CardSkeleton key={idx} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 luxury-card max-w-md mx-auto bg-card-bg/25 border border-card-border/60">
                <ShoppingBag className="h-10 w-10 text-gold/30 mx-auto mb-3" />
                <h3 className="font-serif text-xl font-bold">No designs found</h3>
                <p className="text-sm text-muted mt-1.5 font-light">Try adjusting your filters or checking another subcategory.</p>
                <button
                  onClick={handleClearFilters}
                  className="mt-6 inline-flex h-9 items-center justify-center rounded border border-gold/40 px-5 text-[10px] font-bold tracking-widest uppercase text-gold hover:bg-gold hover:text-luxury-white transition-all cursor-pointer bg-background"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-300 ${productsFetching ? "opacity-60" : "opacity-100"}`}>
                {products.map((product: any) => {
                  const isOnSale = product.comparePrice && product.comparePrice > product.price;
                  const isWishlisted = wishlistMap[product._id];
                  
                  return (
                    <div
                      key={product._id}
                      className="group flex flex-col luxury-card overflow-hidden hover:scale-[1.01] hover:border-gold/30 transition-all duration-300 bg-card-bg/5 rounded-2xl border border-card-border relative"
                    >
                      {/* Badge (Sale or Best Seller) */}
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        {isOnSale && (
                          <span className="bg-red-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">
                            Sale
                          </span>
                        )}
                        {product.isBestSeller && (
                          <span className="bg-gold text-luxury-white font-bold text-[9px] px-2 py-0.5 rounded-full tracking-wider uppercase shadow-sm">
                            Bespoke
                          </span>
                        )}
                      </div>

                      {/* Wishlist Button */}
                      <button
                        onClick={() => handleWishlistToggle(product._id)}
                        disabled={wishlistUpdatingId === product._id}
                        className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-card-border hover:border-gold/40 transition-colors shadow-sm cursor-pointer group/wishlist"
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            isWishlisted
                              ? "fill-red-500 text-red-500"
                              : "text-muted group-hover/wishlist:text-red-500"
                          } ${wishlistUpdatingId === product._id ? "animate-pulse" : ""}`}
                        />
                      </button>

                      {/* Image Frame */}
                      <div className="relative aspect-square overflow-hidden bg-muted-light/20">
                        <img
                          src={product.images?.[0]?.url || "https://placehold.co/400x400"}
                          alt={product.title}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 saturate-50 group-hover:saturate-100"
                        />
                        <button
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute bottom-3 left-3 right-3 bg-background/95 backdrop-blur-sm py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white transition-all duration-300 border border-card-border cursor-pointer shadow-md"
                        >
                          {addingId === product._id ? "Adding..." : "Quick Add"}
                        </button>
                      </div>

                      {/* Info Panel */}
                      <div className="flex flex-col p-4 flex-grow justify-between">
                        <div>
                          <span className="text-[9px] text-muted tracking-widest uppercase font-bold mb-1 block">
                            {product.brand || "DESIGNER HOUSE"}
                          </span>
                          <Link
                            href={`/product/${product.slug || product._id}`}
                            className="font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-1 mb-1.5 cursor-pointer block"
                          >
                            {product.title}
                          </Link>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto border-t border-card-border/40 pt-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gold">
                              {product.price.toLocaleString()} EGP
                            </span>
                            {isOnSale && (
                              <span className="text-[10px] text-muted line-through">
                                {product.comparePrice.toLocaleString()} EGP
                              </span>
                            )}
                          </div>
                          
                          <span className="flex items-center gap-1 text-[10px] text-muted font-semibold">
                            <Star className="h-3 w-3 fill-gold text-gold" /> {product.ratingAverage || 5.0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pb-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="h-9 w-9 rounded-lg border border-card-border flex items-center justify-center hover:border-gold hover:text-gold disabled:opacity-40 disabled:hover:border-card-border disabled:hover:text-muted transition-colors cursor-pointer bg-background"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setCurrentPage(pNum)}
                      className={`h-9 w-9 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pNum
                          ? "border-gold bg-gold text-luxury-white"
                          : "border-card-border hover:border-gold hover:text-gold bg-background"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="h-9 w-9 rounded-lg border border-card-border flex items-center justify-center hover:border-gold hover:text-gold disabled:opacity-40 disabled:hover:border-card-border disabled:hover:text-muted transition-colors cursor-pointer bg-background"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Mobile Drawer Filter Menu */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer sheet */}
          <div className="relative w-full max-w-[320px] h-full bg-background border-l border-card-border p-6 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-card-border/60 mb-6">
                <h3 className="font-serif text-lg font-bold">Filters</h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="h-8 w-8 rounded-full border border-card-border flex items-center justify-center hover:border-gold transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Local search within category */}
              <div className="mb-6">
                <label className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">
                  Search In Category
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-background border border-card-border rounded-lg py-2.5 pl-9 pr-3 text-xs outline-none"
                  />
                  <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted/60" />
                </div>
              </div>

              {/* Price range */}
              <div className="mb-6">
                <label className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2 block">
                  Price Range (EGP)
                </label>
                <form
                  onSubmit={(e) => {
                    handleApplyPrice(e);
                    setIsMobileFilterOpen(false);
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-background border border-card-border rounded-lg py-2.5 px-3 text-xs outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-background border border-card-border rounded-lg py-2.5 px-3 text-xs outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-10 bg-foreground text-background font-bold text-xs tracking-widest uppercase hover:bg-gold hover:text-luxury-white transition-colors rounded-lg cursor-pointer"
                  >
                    Apply Filter
                  </button>
                </form>
              </div>
            </div>

            {/* Clear All button */}
            <button
              onClick={() => {
                handleClearFilters();
                setIsMobileFilterOpen(false);
              }}
              className="w-full h-11 border border-card-border rounded-lg text-xs font-bold tracking-widest uppercase hover:border-gold hover:text-gold transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
