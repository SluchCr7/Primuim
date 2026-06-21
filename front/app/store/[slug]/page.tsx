"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { 
  useGetPublicStoreBySlugQuery, 
  useFollowSellerMutation, 
  useAddToCartMutation,
  useToggleWishlistMutation,
  useGetWishlistQuery
} from "../../../lib/api";
import { useAppSelector } from "../../../lib/store";
import { useToast } from "../../components/Toast";
import { addGuestCartItem } from "../../../lib/cartUtils";
import { 
  Star, 
  MapPin, 
  Clock, 
  Award, 
  Users, 
  ShoppingBag, 
  FileText, 
  CheckCircle2, 
  UserPlus, 
  UserMinus,
  Briefcase,
  Calendar,
  TrendingUp,
  Sparkles,
  Search,
  MessageSquare,
  Heart,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PublicStorePage() {
  const { slug } = useParams();
  const { showToast } = useToast();
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<"products" | "articles" | "reviews">("products");
  const [addingId, setAddingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [productSearch, setProductSearch] = useState("");
  const [productSort, setProductSort] = useState<"newest" | "price-asc" | "price-desc" | "rating">("newest");

  // Fetch store details
  const { data, isLoading, refetch } = useGetPublicStoreBySlugQuery(slug as string);
  const [followSeller, { isLoading: isFollowingSeller }] = useFollowSellerMutation();
  const [addToCart] = useAddToCartMutation();

  // Wishlist queries & mutations
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();

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

  // Local follow state for instant UI update
  const [localFollowersCount, setLocalFollowersCount] = useState<number | null>(null);
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(null);

  const seller = data?.seller;
  const products = data?.products || [];
  const articles = data?.articles || [];
  const reviews = data?.reviews || [];

  useEffect(() => {
    if (seller) {
      setLocalFollowersCount(seller.followersCount);
      setLocalIsFollowing(currentUser ? seller.followers?.includes(currentUser.id) : false);
    }
  }, [seller, currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Store Not Found</h2>
          <p className="text-muted text-sm max-w-sm mb-6 font-light">The requested store profile does not exist or has been suspended.</p>
          <Link href="/stores" className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background hover:bg-gold hover:text-white transition-all">
            Browse All Stores
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to follow store channels.", "error");
      return;
    }

    const oldFollow = localIsFollowing;
    const oldCount = localFollowersCount || 0;

    setLocalIsFollowing(!oldFollow);
    setLocalFollowersCount(oldFollow ? oldCount - 1 : oldCount + 1);

    try {
      const res = await followSeller(seller.id).unwrap();
      showToast(res.message, "success");
      refetch();
    } catch (err: any) {
      setLocalIsFollowing(oldFollow);
      setLocalFollowersCount(oldCount);
      showToast(err.data?.message || "Failed to toggle follow status.", "error");
    }
  };

  const handleQuickAdd = async (product: any) => {
    // Owner check
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
      showToast("Item added to your shopping bag.", "success");
    } catch (err) {
      showToast("Could not add item to bag.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const sellerCategories: string[] = ["All", ...Array.from(new Set(products.map((p: any) => p.category?.name || "Uncategorized"))).map(c => c as string)];

  // Process store products: search, category filters, and sorting
  let processedProducts = [...products];

  // Category filter
  if (selectedCategory !== "All") {
    processedProducts = processedProducts.filter((p: any) => p.category?.name === selectedCategory);
  }

  // Search filter
  if (productSearch.trim()) {
    const query = productSearch.toLowerCase();
    processedProducts = processedProducts.filter(
      (p: any) => p.title?.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query)
    );
  }

  // Sorting
  processedProducts.sort((a: any, b: any) => {
    if (productSort === "price-asc") return a.price - b.price;
    if (productSort === "price-desc") return b.price - a.price;
    if (productSort === "rating") return (b.ratingAverage || 0) - (a.ratingAverage || 0);
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  // Review statistics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : seller.storeRating.toFixed(1);

  // Star breakdown
  const starCounts = [0, 0, 0, 0, 0];
  reviews.forEach((r: any) => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[5 - r.rating]++;
    }
  });

  const memberSince = seller.createdAt
    ? new Date(seller.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "Verified Partner";

  // Safe logo and cover image resolution
  const logoUrl = seller.storeLogo?.url || seller.storeLogo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";
  const coverUrl = seller.storeCover?.url || seller.storeCover || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      {/* Hero Banner Section with Blur Overlay */}
      <div className="h-[280px] md:h-[380px] relative w-full overflow-hidden border-b border-card-border">
        <img
          src={coverUrl}
          alt={seller.storeName}
          className="w-full h-full object-cover saturate-50 opacity-60 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
      </div>

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 pb-20 relative -mt-36 z-10">
        
        {/* Glassmorphism Profile Header Card */}
        <div className="luxury-card p-6 md:p-10 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between mb-12 bg-card-bg/85 backdrop-blur-md border border-card-border shadow-2xl rounded-[32px]">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center w-full">
            {/* Logo with gold border ring */}
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-4 border-gold bg-background shrink-0 shadow-2xl transition-transform hover:scale-105 duration-300 overflow-hidden">
              <img
                src={logoUrl}
                alt={seller.storeName}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Store Information */}
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.24em] text-gold uppercase px-2.5 py-0.5 rounded border border-gold/25 bg-gold/5">
                  <Award className="h-3 w-3" /> Approved Brand Partner
                </span>
                {seller.totalSales > 10 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-[0.24em] text-success uppercase px-2.5 py-0.5 rounded border border-success/25 bg-success/5">
                    <Sparkles className="h-3 w-3 animate-pulse" /> Top Seller
                  </span>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight tracking-wide">{seller.storeName}</h1>
              {seller.brandName && (
                <p className="text-xs text-gold/80 tracking-widest uppercase font-medium mt-0.5 mb-4">Atelier: {seller.brandName}</p>
              )}
              
              {/* Quick Info Badges */}
              <div className="flex flex-wrap items-center gap-y-2.5 gap-x-5 text-xs text-muted mt-3">
                {seller.country && (
                  <span className="flex items-center gap-1.5 font-light">
                    <MapPin className="h-4 w-4 text-gold" /> {seller.country}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-light">
                  <Clock className="h-4 w-4 text-gold" /> Response: {seller.responseTime}
                </span>
                <span className="flex items-center gap-1.5 font-light">
                  <Calendar className="h-4 w-4 text-gold" /> Since {memberSince}
                </span>
              </div>
            </div>
          </div>

          {/* Follow CTA Button */}
          <div className="w-full lg:w-auto shrink-0 flex items-center justify-end">
            <button
              onClick={handleFollowToggle}
              disabled={isFollowingSeller}
              className={`w-full lg:w-auto h-12 rounded-full px-8 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg hover:-translate-y-0.5 active:translate-y-0 ${
                localIsFollowing 
                  ? "border border-gold text-gold hover:bg-gold/10" 
                  : "bg-foreground text-background hover:bg-gold hover:text-white"
              }`}
            >
              {localIsFollowing ? (
                <>
                  <UserMinus className="h-4 w-4" /> Unfollow Store
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" /> Follow Channel
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-card-bg/40 border border-card-border p-5 rounded-2xl text-center backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-card-bg/60">
            <Star className="h-5 w-5 fill-gold text-gold mx-auto mb-2" />
            <span className="block text-xl font-bold font-serif">{parseFloat(averageRating).toFixed(1)} / 5.0</span>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Atelier Rating</span>
          </div>
          <div className="bg-card-bg/40 border border-card-border p-5 rounded-2xl text-center backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-card-bg/60">
            <Users className="h-5 w-5 text-gold mx-auto mb-2" />
            <span className="block text-xl font-bold font-serif">{localFollowersCount ?? seller.followersCount}</span>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Followers</span>
          </div>
          <div className="bg-card-bg/40 border border-card-border p-5 rounded-2xl text-center backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-card-bg/60">
            <TrendingUp className="h-5 w-5 text-gold mx-auto mb-2" />
            <span className="block text-xl font-bold font-serif">{seller.totalSales || 0}</span>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Sales Completed</span>
          </div>
          <div className="bg-card-bg/40 border border-card-border p-5 rounded-2xl text-center backdrop-blur-sm transition-all hover:border-gold/30 hover:bg-card-bg/60">
            <ShoppingBag className="h-5 w-5 text-gold mx-auto mb-2" />
            <span className="block text-xl font-bold font-serif">{products.length}</span>
            <span className="text-[10px] text-muted font-bold uppercase tracking-wider">Listed Products</span>
          </div>
        </div>

        {/* Description / Philosophy Block & Trust checklist */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {seller.storeDescription && (
            <div className="lg:col-span-2 luxury-card p-6 md:p-8 border border-card-border/60 bg-card-bg/25 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-3 flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5" /> Brand Identity & Vision
              </h3>
              <p className="text-sm text-muted font-light leading-relaxed whitespace-pre-line italic">
                "{seller.storeDescription}"
              </p>
            </div>
          )}

          <div className="luxury-card p-6 border border-card-border/60 bg-card-bg/25 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.25em] text-gold mb-4 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Quality Checklist
              </h3>
              <ul className="space-y-2.5 text-xs text-muted font-light">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Verified Atelier Partner
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Eco-friendly Premium Packaging
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Insured Express Delivery
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                  Secure Checkout Encrypted SSL
                </li>
              </ul>
            </div>

            <button
              onClick={() => showToast(`A secure chat portal with ${seller.storeName} is loading...`, "success")}
              className="w-full mt-6 h-9 rounded-full border border-gold/40 hover:bg-gold/10 text-[10px] font-bold uppercase tracking-widest text-gold transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Inquire / Send Message
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-card-border mb-8 flex gap-8 text-xs font-bold uppercase tracking-widest">
          {(["products", "articles", "reviews"] as const).map((tab) => {
            const counts = {
              products: products.length,
              articles: articles.length,
              reviews: reviews.length
            };
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 border-b-2 transition-all cursor-pointer ${
                  activeTab === tab 
                    ? "border-gold text-gold" 
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {tab} <span className="text-[10px] font-normal text-muted">({counts[tab]})</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div>
          {/* TAB 1: PRODUCTS */}
          {activeTab === "products" && (
            <div>
              {products.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-card-border rounded-2xl p-6 bg-card-bg/25">
                  <ShoppingBag className="h-10 w-10 text-gold/30 mx-auto mb-3" />
                  <h4 className="font-serif text-lg font-bold">No Products Listed</h4>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light leading-relaxed">
                    This brand hasn't listed any items for purchase yet. Check back soon.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Catalog Controls Row */}
                  <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center mb-8 border-b border-card-border/30 pb-6">
                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted mr-2">Categories:</span>
                      {sellerCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                            selectedCategory === cat
                              ? "bg-gold border-gold text-white shadow-md"
                              : "border-card-border bg-card-bg/25 text-muted hover:text-foreground hover:border-gold/50"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Search & Sort inside store */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center shrink-0">
                      <div className="relative w-full sm:w-60">
                        <input
                          type="text"
                          placeholder="Search in store catalog..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full rounded-full border border-card-border/80 bg-card-bg/30 py-2 pl-4 pr-10 text-xs text-foreground outline-none focus:border-gold transition-all"
                        />
                        <Search className="absolute right-3.5 top-2.5 h-3.5 w-3.5 text-muted" />
                      </div>

                      <select
                        value={productSort}
                        onChange={(e) => setProductSort(e.target.value as any)}
                        className="bg-card-bg/30 border border-card-border rounded-full px-4 py-2 text-xs font-semibold outline-none focus:border-gold transition-colors w-full sm:w-auto cursor-pointer"
                      >
                        <option value="newest">Newest Arrivals</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="rating">Top Rated</option>
                      </select>
                    </div>
                  </div>

                  {processedProducts.length === 0 ? (
                    <div className="text-center py-20 bg-card-bg/10 rounded-2xl border border-dashed border-card-border max-w-sm mx-auto">
                      <ShoppingBag className="h-8 w-8 text-gold/30 mx-auto mb-3" />
                      <h5 className="font-bold text-sm">No Matching Items</h5>
                      <p className="text-xs text-muted mt-1">Try modifying your filter categories or search query.</p>
                    </div>
                  ) : (
                    /* Grid layout for catalog */
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <AnimatePresence mode="popLayout">
                        {processedProducts.map((item: any, index: number) => (
                          <motion.article 
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            key={item._id} 
                            className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between"
                          >
                            <div className="relative aspect-square overflow-hidden bg-muted-light">
                              <img
                                src={item.images?.[0]?.url || "https://placehold.co/400x400"}
                                alt={item.title}
                                className="h-full w-full object-cover transition duration-700 group-hover:scale-105 saturate-50 group-hover:saturate-100"
                              />
                              
                              {/* Wishlist Toggle Overlay */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleWishlistToggle(item._id);
                                }}
                                className={`absolute top-3 right-3 h-7 w-7 rounded-full flex items-center justify-center transition-all bg-black/35 hover:bg-black/60 backdrop-blur-md cursor-pointer z-10 ${
                                  wishlistData?.wishlist?.some((w: any) => w.product?._id === item._id)
                                    ? "text-gold"
                                    : "text-white hover:text-gold"
                                }`}
                              >
                                <Heart className={`h-4 w-4 ${wishlistData?.wishlist?.some((w: any) => w.product?._id === item._id) ? "fill-gold" : ""}`} />
                              </button>

                              {/* Quick Add Block */}
                              {(() => {
                                const productSellerId = item.seller?._id || item.seller;
                                const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
                                if (isProductOwner) {
                                  return (
                                    <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider text-gold bg-background/95 shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full border border-gold/25 select-none">
                                      <Lock className="h-3 w-3" /> Owner Account
                                    </div>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => handleQuickAdd(item)}
                                    disabled={addingId === item._id}
                                    className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/95 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white cursor-pointer"
                                  >
                                    {addingId === item._id ? "Adding..." : "Quick Add"}
                                  </button>
                                );
                              })()}
                            </div>

                            <div className="flex flex-col gap-4 p-5 flex-grow justify-between">
                              <div>
                                <span className="text-[9px] font-bold uppercase tracking-widest text-gold/80">{seller.storeName}</span>
                                <Link 
                                  href={`/product/${item.slug}`} 
                                  className="mt-1 block font-serif text-base font-bold leading-snug text-foreground transition-colors hover:text-gold line-clamp-2 min-h-[44px]"
                                >
                                  {item.title}
                                </Link>
                              </div>

                              <div className="flex items-center justify-between gap-3 text-xs border-t border-card-border/40 pt-3.5 mt-auto">
                                <div className="flex items-center gap-1 font-bold text-gold">
                                  <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                                  <span>{item.ratingAverage?.toFixed(1) || "5.0"}</span>
                                </div>
                                <span className="font-bold text-gold">{item.price.toLocaleString()} EGP</span>
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ARTICLES */}
          {activeTab === "articles" && (
            <div>
              {articles.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-card-border rounded-2xl p-6 bg-card-bg/25">
                  <FileText className="h-10 w-10 text-gold/30 mx-auto mb-3" />
                  <h4 className="font-serif text-lg font-bold">No Editorial Pieces</h4>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light leading-relaxed">
                    This brand hasn't published any articles or buying guides yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2">
                  {articles.map((art: any, index: number) => (
                    <motion.article 
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      key={art._id} 
                      className="group flex flex-col md:flex-row gap-5 items-start border border-card-border rounded-[24px] p-4 bg-card-bg/40 hover:bg-card-bg/85 transition-all duration-300"
                    >
                      <div className="h-36 w-full md:w-36 rounded-2xl overflow-hidden shrink-0 border border-card-border relative">
                        <img
                          src={art.image?.url || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800"}
                          alt={art.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex flex-col justify-between h-full py-1">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gold">{art.category || "Editorial"}</span>
                          <Link 
                            href={`/article/${art._id}`} 
                            className="mt-1 block font-serif text-lg font-bold leading-tight text-foreground hover:text-gold transition-colors line-clamp-2"
                          >
                            {art.title}
                          </Link>
                          {art.subtitle && (
                            <p className="text-xs text-muted font-light line-clamp-1 mt-1">{art.subtitle}</p>
                          )}
                        </div>
                        <div className="text-[10px] text-muted font-medium mt-4 flex gap-4">
                          <span>{new Date(art.publishedAt || art.createdAt).toLocaleDateString()}</span>
                          <span>{art.readTime || 1} min read</span>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === "reviews" && (
            <div>
              {reviews.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-card-border rounded-2xl p-6 bg-card-bg/25">
                  <Star className="h-10 w-10 text-gold/30 mx-auto mb-3" />
                  <h4 className="font-serif text-lg font-bold">No Reviews Received</h4>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto font-light leading-relaxed">
                    Clients haven't left review scores on this store's product catalogs yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  
                  {/* Reviews Summary Column */}
                  <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="luxury-card p-6 border border-card-border bg-card-bg/20 rounded-2xl">
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-muted">Feedback Summary</h4>
                      <div className="flex items-center gap-4 mb-6">
                        <span className="text-5xl font-serif font-bold text-foreground">{parseFloat(averageRating).toFixed(1)}</span>
                        <div>
                          <div className="flex gap-0.5 mb-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.round(parseFloat(averageRating)) ? "fill-gold text-gold" : "text-card-border"}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted">{totalReviews} customer reviews</span>
                        </div>
                      </div>

                      {/* Bar chart breakdown */}
                      <div className="flex flex-col gap-3">
                        {starCounts.map((count, index) => {
                          const stars = 5 - index;
                          const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-3 text-xs">
                              <span className="w-10 text-right">{stars} star</span>
                              <div className="flex-grow h-2 bg-card-border/40 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gold rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-8 text-muted">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Reviews Feed Column */}
                  <div className="lg:col-span-2 flex flex-col gap-6">
                    {reviews.map((rev: any, index: number) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        key={rev._id} 
                        className="border-b border-card-border/60 pb-6 last:border-none last:pb-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-foreground">{rev.user?.username || "Client"}</span>
                            {rev.isVerifiedPurchase && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-[9px] font-bold text-success px-2.5 py-0.5 uppercase tracking-widest border border-success/15">
                                <CheckCircle2 className="h-3 w-3" /> Verified Purchase
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted font-light">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-0.5 mb-2.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-gold text-gold" : "text-card-border"}`}
                            />
                          ))}
                        </div>

                        <p className="text-sm text-muted/95 leading-relaxed font-light">{rev.comment}</p>

                        {/* Display replies if exists */}
                        {rev.reply && (
                          <div className="mt-4 rounded-xl border border-gold/15 bg-gold/5 p-4 text-xs max-w-2xl relative overflow-hidden ml-4">
                            <div className="absolute top-0 left-0 w-0.5 h-full bg-gold" />
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-gold uppercase tracking-wider text-[9px] flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> Store Response
                              </span>
                              <span className="text-muted text-[10px]">{new Date(rev.reply.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-muted font-light leading-relaxed">{rev.reply.comment}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          )}
        </div>

      </main>
      
      <Footer />
    </div>
  );
}
