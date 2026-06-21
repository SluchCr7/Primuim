"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useGetApprovedSellersQuery, useFollowSellerMutation, useGetMeQuery, useGetCategoriesQuery } from "../../lib/api";
import { useAppSelector } from "../../lib/store";
import { useToast } from "../components/Toast";
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  Users, 
  ShoppingBag, 
  Search, 
  UserPlus, 
  UserMinus,
  Sparkles,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Store
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function StoresDirectoryPage() {
  const { showToast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Filter & Search states
  const [searchVal, setSearchVal] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortOption, setSortOption] = useState<"rating" | "sales" | "newest">("rating");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: sellersData, isLoading, isFetching, refetch: refetchSellers } = useGetApprovedSellersQuery({
    search: activeSearch,
    sort: sortOption,
    category: selectedCategory || undefined,
    page: currentPage,
    limit: 9
  });

  const [followSeller] = useFollowSellerMutation();

  const sellers = sellersData?.sellers || [];
  const totalPages = sellersData?.totalPages || 1;
  const currentUser = meData?.user;
  const categories = categoriesData?.categories || [];

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchVal);
    setCurrentPage(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchVal("");
    setActiveSearch("");
    setSortOption("rating");
    setSelectedCategory("");
    setCurrentPage(1);
  };

  // Follow/Unfollow toggle
  const handleFollowToggle = async (sellerId: string, sellerName: string) => {
    if (!isAuthenticated) {
      showToast("Please log in to follow store channels.", "error");
      return;
    }

    try {
      const res = await followSeller(sellerId).unwrap();
      showToast(res.message, "success");
      refetchMe();
      refetchSellers();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update follow status.", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      {/* Hero Banner Section */}
      <div className="relative py-20 px-6 overflow-hidden border-b border-card-border/50 bg-gradient-to-b from-gold/5 via-transparent to-transparent">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="mx-auto max-w-7xl text-center relative z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.3em] text-gold uppercase px-3 py-1 rounded-full border border-gold/20 bg-gold/5 mb-4">
            <Award className="h-3 w-3" /> Verified Marketplace Partners
          </span>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-wide mb-4 leading-tight">
            Flagship Design Houses & Sellers
          </h1>
          <p className="text-muted text-sm md:text-base max-w-2xl mx-auto font-light leading-relaxed">
            Shop directly from verified independent creators, local designers, and premium boutiques. 
            Enjoy bespoke service and curated excellence directly from the source.
          </p>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        {/* Search and Filters Panel */}
        <div className="luxury-card p-5 mb-10 bg-card-bg/60 backdrop-blur-md border border-card-border/60 rounded-3xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
          <form onSubmit={handleSearchSubmit} className="w-full md:max-w-md relative flex items-center">
            <input
              type="text"
              placeholder="Search boutique or design house..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full rounded-full border border-card-border/80 bg-background/50 py-2.5 pl-6 pr-12 text-xs text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all duration-300"
            />
            <button type="submit" className="absolute right-4 text-muted hover:text-gold transition-colors duration-200">
              <Search className="h-4 w-4" />
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <span className="text-xs text-muted flex items-center gap-1.5 font-medium">
              <SlidersHorizontal className="h-3.5 w-3.5 text-gold" /> Sort by:
            </span>
            <select
              value={sortOption}
              onChange={(e) => {
                setSortOption(e.target.value as any);
                setCurrentPage(1);
              }}
              className="bg-background/50 border border-card-border rounded-full px-4 py-2 text-xs font-semibold outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option value="rating">Highest Rated</option>
              <option value="sales">Most Sales Completed</option>
              <option value="newest">Newest Partners</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar scroll-smooth">
          <button
            onClick={() => {
              setSelectedCategory("");
              setCurrentPage(1);
            }}
            className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border whitespace-nowrap transition-all duration-300 cursor-pointer ${
              selectedCategory === ""
                ? "bg-gold text-white border-gold shadow-lg shadow-gold/10"
                : "border-card-border hover:border-gold/50 bg-card-bg text-muted hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat._id}
              onClick={() => {
                setSelectedCategory(cat._id);
                setCurrentPage(1);
              }}
              className={`px-5 py-2 rounded-full text-xs font-semibold tracking-wide border whitespace-nowrap transition-all duration-300 cursor-pointer ${
                selectedCategory === cat._id
                  ? "bg-gold text-white border-gold shadow-lg shadow-gold/10"
                  : "border-card-border hover:border-gold/50 bg-card-bg text-muted hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading || isFetching ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="luxury-card h-[380px] rounded-3xl border border-card-border/50 bg-card-bg/30 p-6 flex flex-col justify-between animate-pulse">
                <div className="space-y-4">
                  <div className="h-28 bg-card-border/20 rounded-2xl" />
                  <div className="flex gap-4 items-center">
                    <div className="h-14 w-14 rounded-full bg-card-border/30 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-card-border/30 rounded w-2/3" />
                      <div className="h-3 bg-card-border/20 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-12 bg-card-border/10 rounded-xl" />
                </div>
                <div className="h-10 bg-card-border/20 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {sellers.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-card-border rounded-3xl p-8 bg-card-bg/10 max-w-md mx-auto">
                <Store className="h-12 w-12 text-gold/30 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold">No Stores Found</h3>
                <p className="text-xs text-muted mt-2 mb-6 font-light leading-relaxed">
                  No partners matched your search term. Try adjusting your spelling or searching for another keyword.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="inline-flex h-10 items-center justify-center rounded-full bg-gold px-6 text-[10px] font-bold uppercase tracking-widest text-white transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div>
                {/* Store Cards Grid */}
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {sellers.map((seller: any, idx: number) => {
                      const isFollowing = currentUser?.followingSellers?.includes(seller.id);
                      
                      return (
                        <motion.div
                          key={seller.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          className="group relative overflow-hidden rounded-3xl border border-card-border bg-card-bg shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col justify-between h-[400px]"
                        >
                          {/* Banner Background */}
                          <div className="h-32 w-full overflow-hidden relative border-b border-card-border/40 bg-muted-light">
                            <img
                              src={seller.storeCover?.url || seller.storeCover || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop"}
                              alt={seller.storeName}
                              className="w-full h-full object-cover saturate-[0.6] group-hover:saturate-[0.95] group-hover:scale-105 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-card-bg to-transparent opacity-85" />
                          </div>

                          {/* Profile details wrapper */}
                          <div className="px-6 pb-6 flex-grow flex flex-col justify-between -mt-10 relative z-10">
                            <div>
                              {/* Logo avatar with gold ring */}
                              <div className="h-20 w-20 rounded-full border-4 border-gold bg-background overflow-hidden shadow-xl mb-4 shrink-0 transition-transform group-hover:scale-105 duration-300">
                                <img
                                  src={seller.storeLogo?.url || seller.storeLogo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                                  alt={seller.storeName}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              {/* Title */}
                              <div>
                                <span className="text-[9px] font-bold tracking-[0.2em] text-gold uppercase">
                                  {seller.brandName || "Exclusive Partner"}
                                </span>
                                <h3 className="font-serif text-xl font-bold leading-tight mt-0.5 group-hover:text-gold transition-colors duration-200 truncate">
                                  {seller.storeName}
                                </h3>
                              </div>

                              {/* Description */}
                              <p className="text-xs text-muted font-light leading-relaxed line-clamp-2 mt-3 italic">
                                {seller.storeDescription || "Verified luxury independent store on our premium marketplace."}
                              </p>

                              {/* Badges / Metrics Row */}
                              <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] font-medium text-muted/90 mt-4 border-t border-card-border/30 pt-3.5">
                                <span className="flex items-center gap-1.5">
                                  <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                                  <span className="font-bold text-foreground">{seller.storeRating?.toFixed(1) || "5.0"}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-gold" />
                                  <span>{seller.followersCount || 0} followers</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <TrendingUp className="h-3.5 w-3.5 text-gold" />
                                  <span>{seller.totalSales || 0} sales</span>
                                </span>
                              </div>
                            </div>

                            {/* CTA Action Buttons */}
                            <div className="flex items-center gap-3 border-t border-card-border/30 pt-4 mt-auto">
                              <button
                                onClick={() => handleFollowToggle(seller.id, seller.storeName)}
                                className={`flex-1 h-9 rounded-full px-4 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                                  isFollowing
                                    ? "border border-gold text-gold hover:bg-gold/10"
                                    : "bg-foreground/5 hover:bg-gold hover:text-white text-foreground"
                                }`}
                              >
                                {isFollowing ? (
                                  <>
                                    <UserMinus className="h-3 w-3" /> Unfollow
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="h-3 w-3" /> Follow
                                  </>
                                )}
                              </button>

                              <Link
                                href={`/store/${seller.storeSlug}`}
                                className="flex-1 h-9 rounded-full bg-foreground text-background hover:bg-gold hover:text-white px-4 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-all shadow-md hover:-translate-y-0.5"
                              >
                                Visit Store <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>

                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-16">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-10 w-10 rounded-full border border-card-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:hover:text-muted cursor-pointer"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider mx-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-10 w-10 rounded-full border border-card-border flex items-center justify-center hover:border-gold hover:text-gold transition-colors disabled:opacity-50 disabled:hover:text-muted cursor-pointer"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
