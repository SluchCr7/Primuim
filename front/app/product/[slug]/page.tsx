"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AttributeSelector from "../../components/product/AttributeSelector";
import {
  useGetProductBySlugQuery,
  useAddToCartMutation,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useVoteHelpfulMutation,
  useGetProductsQuery,
  useToggleWishlistMutation,
  useGetWishlistQuery,
  useGetMeQuery,               // Smart Fit — read sizeProfile
} from "../../../lib/api";
import { useAppSelector } from "../../../lib/store";
import { useToast } from "../../components/Toast";
import { addGuestCartItem } from "../../../lib/cartUtils";
import { formatPrice as formatCurrencyPrice } from "../../../lib/currencyUtils";
import { 
  Star, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Award, 
  ShoppingBag, 
  ChevronRight, 
  ArrowRight, 
  Sparkles,
  Heart,
  Lock,
  Ruler,       // Smart Fit — size guide icon
  Footprints,  // Smart Fit — shoe guide icon
  GitCompare,  // Compare feature
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetailsBySlugPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, user: currentUser, currency } = useAppSelector((state) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [addingToCart, setAddingToCart] = useState(false);

  // ── Dynamic Attribute Selection (new system) ───────────────────────────────
  // Tracks the user's current per-axis pick, e.g. { Color: "Red", Size: "M" }
  const [attrSelection, setAttrSelection] = useState<Record<string, string>>({});

  // ── Compare list state (synced with localStorage) ─────────────────────────
  const [compareIds, setCompareIds] = useState<string[]>([]);
  useEffect(() => {
    try { setCompareIds(JSON.parse(localStorage.getItem("compare_list") || "[]")); } catch {}
  }, []);
  const toggleCompare = (productId: string) => {
    setCompareIds(prev => {
      let next: string[];
      if (prev.includes(productId)) {
        next = prev.filter(id => id !== productId);
        showToast("Removed from comparison.", "info");
      } else {
        if (prev.length >= 4) {
          showToast("You can compare up to 4 products at once.", "error");
          return prev;
        }
        next = [...prev, productId];
        showToast("Added to comparison!", "success");
      }
      localStorage.setItem("compare_list", JSON.stringify(next));
      return next;
    });
  };

  // Hover Zoom States & Event Handlers
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: "center center", transform: "scale(1)" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.75)",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)",
    });
  };

  // 1. Fetch Product by Slug
  const { data: productData, isLoading: isProductLoading, refetch: refetchProduct } = useGetProductBySlugQuery(slug as string);
  const product = productData?.product;

  // 2. Fetch Reviews once product._id is available
  const { data: reviewsData, refetch: refetchReviews } = useGetProductReviewsQuery(product?.slug, {
    skip: !product?.slug,
  });

  // 3. Fetch Related Products in same Category
  const { data: relatedData } = useGetProductsQuery(
    { category: product?.category?._id || product?.category, limit: 4 },
    { skip: !product?.category }
  );

  const [addToCart] = useAddToCartMutation();
  const [createReview, { isLoading: reviewLoading }] = useCreateReviewMutation();
  const [voteHelpful] = useVoteHelpfulMutation();

  // Wishlist queries & mutations
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();

  // Set default variant if available (legacy: no attributes array)
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && (!product.attributes || product.attributes.length === 0)) {
      setSelectedVariant(product.variants[0]);
    }
    // Reset attribute selection when product changes
    setAttrSelection({});
  }, [product]);

  // ── Smart Fit: fetch the logged-in user's full profile (including sizeProfile)
  // Skip if not authenticated to avoid unnecessary API calls.
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const userSizeProfile = meData?.user?.sizeProfile;

  /**
   * Determine whether this product's category is size-relevant.
   * We normalise category name to lowercase for comparison.
   * Returns: "clothing" | "shoes" | null
   */
  const categoryName = (
    product?.category?.name ||
    product?.category ||
    ""
  ).toString().toLowerCase();

  const isSizeableCategory =
    categoryName.includes("clothing") ||
    categoryName.includes("apparel") ||
    categoryName.includes("fashion") ||
    categoryName.includes("shirt") ||
    categoryName.includes("dress") ||
    categoryName.includes("jacket")
      ? "clothing"
      : categoryName.includes("shoe") ||
        categoryName.includes("footwear") ||
        categoryName.includes("boot") ||
        categoryName.includes("sneaker")
      ? "shoes"
      : null;

  /**
   * The recommended size string for this product:
   * - For clothing: the user's calculatedSize ("S", "M", "L", etc.)
   * - For shoes:    "EU {calculatedSizeEU}"
   * - null if no profile exists for this category
   */
  const recommendedSize: string | null = (() => {
    if (!isSizeableCategory || !userSizeProfile) return null;
    if (isSizeableCategory === "clothing" && userSizeProfile.clothing?.calculatedSize) {
      return userSizeProfile.clothing.calculatedSize;
    }
    if (isSizeableCategory === "shoes" && userSizeProfile.shoes?.calculatedSizeEU) {
      return `EU ${userSizeProfile.shoes.calculatedSizeEU}`;
    }
    return null;
  })();

  // Log recently viewed product
  useEffect(() => {
    if (product?._id) {
      try {
        const stored = localStorage.getItem("recently_viewed");
        const list: string[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((pid) => pid !== product._id);
        filtered.unshift(product._id);
        localStorage.setItem("recently_viewed", JSON.stringify(filtered.slice(0, 8)));
      } catch (err) {
        console.error("Recently viewed error:", err);
      }
    }
  }, [product]);

  const productSellerId = product?.seller?._id || product?.seller;
  const isOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;
  const isWishlisted = wishlistData?.wishlist?.some((w: any) => w.product?._id === product?._id);

  /**
   * Derive the active variant from the current attrSelection.
   * Supports both new `combination` Map and legacy `attributes` Map.
   * Falls back to `selectedVariant` for products without the attributes system.
   */
  const activeVariant = useMemo(() => {
    const attrs = product?.attributes || [];
    const variants = product?.variants || [];

    // New system: match against combination
    if (attrs.length > 0 && Object.keys(attrSelection).length > 0) {
      return variants.find((v: any) => {
        const combo: Record<string, string> =
          v.combination && Object.keys(v.combination).length > 0
            ? v.combination
            : v.attributes
            ? Object.fromEntries(Object.entries(v.attributes))
            : {};
        return Object.entries(attrSelection).every(([k, val]) => combo[k] === val);
      }) ?? null;
    }

    // Legacy system: use selectedVariant
    return selectedVariant;
  }, [attrSelection, product, selectedVariant]);

  /**
   * Whether all attribute axes have been selected by the user.
   * If the product has no attributes, this is always true.
   */
  const allAttributesSelected = useMemo(() => {
    const attrs = product?.attributes || [];
    if (attrs.length === 0) return true;
    return attrs.every((axis: any) => attrSelection[axis.name] !== undefined);
  }, [attrSelection, product]);

  const handleAddToCart = async () => {
    if (!product) return;

    if (isOwner) {
      showToast("Sellers cannot add their own products to the cart.", "error");
      return;
    }

    // Guard: require full attribute selection before adding
    if (!allAttributesSelected) {
      showToast("Please select all options before adding to bag.", "error");
      return;
    }

    // Guard: selected combination must be in-stock
    if (activeVariant !== null && activeVariant !== undefined && activeVariant.stock <= 0) {
      showToast("This combination is currently out of stock.", "error");
      return;
    }

    setAddingToCart(true);

    // Determine which SKU to use
    const variantSku = activeVariant?.sku ?? (selectedVariant?.sku || undefined);

    if (!isAuthenticated) {
      addGuestCartItem(product, 1, variantSku);
      showToast("Added to guest cart successfully.", "success");
      setAddingToCart(false);
      return;
    }

    try {
      await addToCart({
        productId: product._id,
        quantity: 1,
        variantSku,
      }).unwrap();
      showToast("Item added to your shopping bag.", "success");
    } catch (err: any) {
      showToast(err.data?.message || "Failed to add item to bag.", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      showToast("Please log in to add items to your wishlist.", "error");
      return;
    }
    try {
      const res = await toggleWishlist(product._id).unwrap();
      showToast(res.message, "success");
      refetchWishlist();
    } catch (err) {
      showToast("Failed to update wishlist.", "error");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    try {
      await createReview({
        product: product._id,
        rating: reviewRating,
        comment: reviewComment,
      }).unwrap();
      setReviewComment("");
      refetchReviews();
      refetchProduct();
      showToast("Thank you! Your review has been submitted.", "success");
    } catch (err: any) {
      showToast(err.data?.message || "Failed to submit review.", "error");
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      await voteHelpful(reviewId).unwrap();
      refetchReviews();
      showToast("Review marked as helpful.", "success");
    } catch (err) {
      showToast("Could not record helpful vote.", "error");
    }
  };

  if (isProductLoading) {
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

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Design Not Found</h2>
          <p className="text-muted text-sm max-w-sm mb-6 font-light">The requested product slug is invalid or the item has been archived.</p>
          <Link href="/products" className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background hover:bg-gold hover:text-white transition-all shadow-md">
            Return to Collections
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Calculate review stats
  const reviewsList = reviewsData?.reviews || [];
  const reviewsCount = reviewsList.length;
  const ratingAvg = product.ratingAverage || 5.0;

  const starPercentages = [0, 0, 0, 0, 0]; // 1 to 5 stars
  if (reviewsCount > 0) {
    reviewsList.forEach((r: any) => {
      const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
      starPercentages[idx]++;
    });
    for (let i = 0; i < 5; i++) {
      starPercentages[i] = Math.round((starPercentages[i] / reviewsCount) * 100);
    }
  } else {
    starPercentages[4] = 100; // default 5-stars mock fill
  }

  // Price calculations
  const displayPrice = activeVariant ? activeVariant.price : product.price;
  const comparePriceVal = product.comparePrice;
  const discountPercent = comparePriceVal ? Math.round(((comparePriceVal - displayPrice) / comparePriceVal) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      {/* BREADCRUMB NAVIGATION */}
      <div className="border-b border-card-border bg-card-bg/40 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center gap-2 text-xs font-medium text-muted">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5 text-card-border" />
          <Link href="/products" className="hover:text-gold transition-colors">Collections</Link>
          <ChevronRight className="h-3.5 w-3.5 text-card-border" />
          <Link href={`/products?category=${product.category?._id}`} className="hover:text-gold transition-colors truncate max-w-[120px]">{product.category?.name || "Category"}</Link>
          {product.subcategory && (
            <>
              <ChevronRight className="h-3.5 w-3.5 text-card-border" />
              <span className="truncate max-w-[120px]">{product.subcategory?.name}</span>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-card-border" />
          <span className="text-foreground truncate max-w-[150px]">{product.title}</span>
        </div>
      </div>

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-10 lg:py-16">
        
        {/* PRODUCT METADATA & PHOTO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-16 mb-20">
          
          {/* LEFT COLUMN: INTERACTIVE IMAGES GALLERY */}
          <div className="flex flex-col gap-5">
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative aspect-square overflow-hidden rounded-[32px] border border-card-border bg-card-bg group cursor-zoom-in"
            >
              {discountPercent > 0 && (
                <div className="absolute left-6 top-6 z-10 rounded-full bg-error px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg">
                  Save {discountPercent}%
                </div>
              )}
              
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.4 }}
                  src={product.images?.[selectedImage]?.url || "https://placehold.co/800x800"}
                  alt={product.title}
                  style={zoomStyle}
                  className="h-full w-full object-cover transition-transform duration-100 ease-out"
                />
              </AnimatePresence>
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar">
                {product.images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-20 w-20 rounded-2xl border overflow-hidden shrink-0 transition-all ${
                      selectedImage === idx ? "border-gold scale-95 ring-2 ring-gold/10" : "border-card-border hover:border-gold/50"
                    }`}
                  >
                    <img src={img.url} alt="thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LUXURY INFO & ACTION PANEL */}
          <div className="flex flex-col justify-between py-2">
            <div className="flex flex-col gap-6">
              
              {/* Brand, Title & Ratings */}
              <div>
                <span className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> {product.brand || "Atelier Paris"}
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold mt-2 leading-tight">
                  {product.title}
                </h1>
                
                <div className="flex items-center gap-3.5 text-xs mt-3">
                  <div className="flex items-center gap-1 bg-gold/10 text-gold px-2.5 py-1 rounded-md border border-gold/10 font-bold">
                    <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {ratingAvg.toFixed(1)}
                  </div>
                  <span className="text-muted">|</span>
                  <a href="#reviews" className="text-muted hover:text-gold transition-colors font-medium underline underline-offset-4">
                    {reviewsCount} Customer Reviews
                  </a>
                  <span className="text-muted">|</span>
                  <span className={`font-semibold ${product.stock > 0 ? "text-success" : "text-error"}`}>
                    {product.stock > 0 ? "In Stock" : "Temporarily Archived"}
                  </span>
                </div>
              </div>

              {/* Price segment */}
              <div className="border-y border-card-border py-5 flex items-baseline gap-4">
                <span className="text-3xl font-bold text-gold">
                  {formatCurrencyPrice(displayPrice, currency)}
                </span>
                {comparePriceVal && comparePriceVal > displayPrice && (
                  <span className="text-sm line-through text-muted font-light">
                    {formatCurrencyPrice(comparePriceVal, currency)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted block mb-2">Heritage & Design</span>
                <p className="text-sm text-muted leading-relaxed font-light">
                  {product.description}
                </p>
              </div>

              {/* ── NEW: Dynamic Attribute Selector (Color, Size, etc.) ── */}
              {product.attributes && product.attributes.length > 0 && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Options</span>
                  <AttributeSelector
                    attributes={product.attributes}
                    variants={product.variants || []}
                    selection={attrSelection}
                    onSelectionChange={setAttrSelection}
                    activeVariant={activeVariant}
                  />

                  {/* Smart Fit badge — shown only for clothing/shoes when attributes include Size */}
                  {isSizeableCategory && (
                    <>
                      {recommendedSize ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl bg-gold/8 border border-gold/25 w-fit"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="text-[10px] font-semibold text-gold">
                            Recommended size{" "}
                            <strong className="font-bold">{recommendedSize}</strong>{" "}
                            based on your Fit Profile
                          </span>
                        </motion.div>
                      ) : isAuthenticated ? (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                          <Link
                            id="fitting-guide-cta"
                            href="/size-guide"
                            className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl border border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 transition-all text-[10px] font-semibold text-muted hover:text-gold group"
                          >
                            {isSizeableCategory === "shoes"
                              ? <Footprints className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />
                              : <Ruler className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />
                            }
                            Unsure about your size? Use our AI Fitting Guide
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                          <Link
                            href="/login"
                            id="fitting-guide-cta-guest"
                            className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl border border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 transition-all text-[10px] font-semibold text-muted hover:text-gold group"
                          >
                            <Ruler className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />
                            Log in to use our AI Fitting Guide
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* ── LEGACY: Old variant selector (for products without attributes array) ── */}
              {product.variants && product.variants.length > 0 && (!product.attributes || product.attributes.length === 0) && (
                <div className="flex flex-col gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Aesthetic Variant</span>
                  <div className="flex flex-wrap gap-2.5">
                    {product.variants.map((v: any) => {
                      const variantLabel = Object.values(v.attributes || {}).join(" / ");
                      const isRecommended =
                        recommendedSize !== null &&
                        variantLabel.toUpperCase().includes(
                          recommendedSize.replace("EU ", "").toUpperCase()
                        );

                      return (
                        <button
                          key={v.sku}
                          onClick={() => setSelectedVariant(v)}
                          className={`relative px-4 py-2.5 text-xs rounded-xl border transition-all cursor-pointer ${
                            selectedVariant?.sku === v.sku
                              ? "border-gold bg-gold/10 text-gold font-bold"
                              : isRecommended
                              ? "border-gold/60 bg-gold/5 text-gold/80"
                              : "border-card-border hover:border-gold/40 text-muted"
                          }`}
                        >
                          {variantLabel || v.sku}
                          {isRecommended && (
                            <span
                              title="Recommended based on your Fit Profile"
                              className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-gold border-2 border-card-bg"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Smart Fit badge for legacy variants */}
                  {isSizeableCategory && (
                    <>
                      {recommendedSize ? (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4 }}
                          className="flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl bg-gold/8 border border-gold/25 w-fit"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-gold shrink-0" />
                          <span className="text-[10px] font-semibold text-gold">
                            Recommended size{" "}
                            <strong className="font-bold">{recommendedSize}</strong>{" "}
                            based on your Fit Profile
                          </span>
                        </motion.div>
                      ) : isAuthenticated ? (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                          <Link id="fitting-guide-cta" href="/size-guide"
                            className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl border border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 transition-all text-[10px] font-semibold text-muted hover:text-gold group">
                            {isSizeableCategory === "shoes"
                              ? <Footprints className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />
                              : <Ruler className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />}
                            Unsure about your size? Use our AI Fitting Guide
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                          <Link href="/login" id="fitting-guide-cta-guest"
                            className="inline-flex items-center gap-2 mt-1 px-3.5 py-2 rounded-xl border border-dashed border-gold/40 hover:border-gold hover:bg-gold/5 transition-all text-[10px] font-semibold text-muted hover:text-gold group">
                            <Ruler className="h-3.5 w-3.5 shrink-0 text-gold/70 group-hover:text-gold" />
                            Log in to use our AI Fitting Guide
                            <ArrowRight className="h-3 w-3 shrink-0" />
                          </Link>
                        </motion.div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Digital Assets Note */}
              {product.isDigital && (
                <div className="flex items-start gap-3 rounded-2xl bg-gold/5 border border-gold/15 p-4 text-xs text-gold/90">
                  <FileText className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[9px] mb-1">Instant digital delivery</span>
                    This is a digital masterwork. High-fidelity files and authorization license codes will be made available in your account cabinet immediately after purchase.
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Bag Button */}
            <div className="flex flex-col gap-4 mt-8">
              {isOwner && (
                <div className="flex items-start gap-3 rounded-2xl bg-gold/5 border border-gold/15 p-4 text-xs text-gold/90 mb-2">
                  <Lock className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[9px] mb-1">Owner Account</span>
                    This is your product. Cart and checkout purchase operations are restricted for self-owned inventory.
                  </div>
                </div>
              )}

              <div className="flex gap-4 items-center">
                <button
                  id="add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={
                    addingToCart ||
                    product.stock === 0 ||
                    isOwner ||
                    !allAttributesSelected ||
                    (allAttributesSelected && activeVariant !== undefined && activeVariant !== null && activeVariant.stock <= 0)
                  }
                  className="flex-grow h-14 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/5 uppercase tracking-widest text-xs font-semibold disabled:opacity-50 cursor-pointer hover:-translate-y-0.5"
                >
                  {addingToCart ? (
                    "Reserving Allocation…"
                  ) : product.stock === 0 ? (
                    "Allocation Closed"
                  ) : isOwner ? (
                    "Self-Owned Product"
                  ) : !allAttributesSelected ? (
                    "Select All Options"
                  ) : allAttributesSelected && activeVariant !== undefined && activeVariant !== null && activeVariant.stock <= 0 ? (
                    "Combination Out of Stock"
                  ) : (
                    <>
                      <ShoppingBag className="h-4 w-4" /> Add To Shopping Bag
                    </>
                  )}
                </button>

                <button
                  onClick={handleWishlistToggle}
                  className={`h-14 w-14 rounded-full border flex items-center justify-center transition-all shadow-md cursor-pointer shrink-0 ${
                    isWishlisted 
                      ? "border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/10" 
                      : "border-card-border hover:border-gold/60 text-muted hover:text-gold"
                  }`}
                  title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-destructive" : ""}`} />
                </button>
              </div>

              {/* ── Add to Compare button ── */}
              {product && (
                <button
                  id="add-to-compare-btn"
                  onClick={() => toggleCompare(product._id)}
                  className={`w-full flex items-center justify-center gap-2 h-10 rounded-full border text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                    compareIds.includes(product._id)
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-card-border hover:border-gold/50 text-muted hover:text-gold"
                  }`}
                >
                  <GitCompare className="h-4 w-4" />
                  {compareIds.includes(product._id) ? "In Comparison — View Compare" : "Add to Comparison"}
                </button>
              )}
              {compareIds.includes(product?._id) && (
                <Link
                  href="/compare"
                  className="text-center text-[10px] text-gold hover:underline underline-offset-2 font-semibold tracking-wider"
                >
                  → Open Compare Page ({compareIds.length} item{compareIds.length !== 1 ? "s" : ""})
                </Link>
              )}
              
              <div className="flex items-center justify-center gap-6 text-[10px] text-muted uppercase tracking-wider font-semibold mt-2">
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-gold" /> Encrypted Checkout</span>
                <span className="text-card-border">|</span>
                <span className="flex items-center gap-1.5"><Award className="h-4 w-4 text-gold" /> Atelier Authenticated</span>
              </div>
            </div>

          </div>
        </div>

        {/* SPECIFICATIONS SHEET */}
        {product.specifications && product.specifications.length > 0 && (
          <section className="mb-20 border-t border-card-border pt-12">
            <div className="max-w-2xl">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-2">Details</span>
              <h3 className="font-serif text-2xl font-semibold mb-6">Product Specifications</h3>
              <div className="luxury-card overflow-hidden">
                <table className="w-full text-xs text-left">
                  <tbody>
                    {product.specifications.map((spec: any, idx: number) => (
                      <tr key={idx} className="border-b border-card-border last:border-none hover:bg-muted-light/10">
                        <td className="px-5 py-3.5 bg-muted-light/20 font-bold w-1/3 text-muted uppercase tracking-wider text-[10px]">{spec.name}</td>
                        <td className="px-5 py-3.5 text-foreground font-light">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* REVIEWS & VERIFIED CUSTOMERS FEEDBACK */}
        <section id="reviews" className="border-t border-card-border pt-12 scroll-mt-20">
          <div className="mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-2">Feedback</span>
            <h3 className="font-serif text-2xl sm:text-3xl font-semibold">Verified Client Ledger</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-start">
            
            {/* Review Analytics Summary */}
            <div className="luxury-card p-6 flex flex-col gap-5">
              <h4 className="font-serif font-bold text-lg">Rating Distribution</h4>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-serif">{ratingAvg.toFixed(1)}</span>
                <span className="text-xs text-muted">out of 5.0</span>
              </div>

              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < Math.round(ratingAvg) ? "fill-gold text-gold" : "text-card-border"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted block -mt-2">{reviewsCount} ratings submitted</span>

              {/* Progress bars */}
              <div className="space-y-3 mt-2">
                {[5, 4, 3, 2, 1].map((stars, idx) => {
                  const percentage = starPercentages[stars - 1] || 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-xs">
                      <span className="w-3 text-muted font-bold">{stars}</span>
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <div className="flex-grow h-1.5 bg-card-border rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="w-8 text-right text-muted font-medium">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews display */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              {reviewsList.length === 0 ? (
                <div className="luxury-card p-8 text-center text-sm text-muted font-light italic bg-card-bg/40">
                  No verified client feedback has been recorded for this item yet.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {reviewsList.map((rev: any) => (
                    <div key={rev._id} className="border-b border-card-border pb-6 last:border-none">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold text-foreground">{rev.user?.username || "Client"}</span>
                          {rev.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-[9px] font-bold text-success px-2.5 py-0.5 uppercase tracking-widest border border-success/10">
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
                            className={`h-3 w-3.5 ${i < rev.rating ? "fill-gold text-gold" : "text-card-border"}`}
                          />
                        ))}
                      </div>

                      <p className="text-sm text-muted leading-relaxed font-light">{rev.comment}</p>

                      <div className="flex items-center gap-3.5 mt-4 text-xs">
                        <span className="text-muted font-light">Was this perspective helpful?</span>
                        <button
                          onClick={() => handleHelpfulVote(rev._id)}
                          className="rounded-full border border-card-border hover:border-gold hover:text-gold px-4 py-1 transition-all font-semibold uppercase tracking-wider text-[9px] cursor-pointer"
                        >
                          Helpful ({rev.helpfulVotes || 0})
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create review form */}
              <div className="border-t border-card-border pt-8 mt-4">
                {isAuthenticated ? (
                  <div className="luxury-card p-6 bg-card-bg/60">
                    <h4 className="font-serif font-bold text-lg mb-1">Submit Your Perspective</h4>
                    <p className="text-xs text-muted mb-5 font-light">Your review must be grounded in actual design interactions.</p>
                    
                    <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="text-gold cursor-pointer transform hover:scale-110 transition-transform"
                            >
                              <Star className={`h-7 w-7 ${star <= reviewRating ? "fill-gold" : "text-card-border"}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Comments</label>
                        <textarea
                          rows={4}
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          required
                          placeholder="Provide details about the fit, texture, aesthetic fidelity, or delivery logistics..."
                          className="w-full rounded-2xl border border-card-border bg-background p-3.5 text-xs outline-none focus:border-gold transition-colors leading-relaxed"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={reviewLoading}
                        className="h-11 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all font-semibold uppercase tracking-widest text-[10px] cursor-pointer self-start px-6 shadow-md"
                      >
                        Submit Perspective
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="luxury-card p-6 text-center text-xs text-muted font-light">
                    Please <Link href="/login" className="text-gold font-semibold hover:underline">Sign In</Link> with your profile to write a ledger review.
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

        {/* RELATED RECOMMENDATIONS */}
        {relatedData?.products && relatedData.products.length > 0 && (
          <section className="border-t border-card-border pt-20 mt-20">
            <div className="mb-10 flex justify-between items-end">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold block mb-2">Selected Edits</span>
                <h3 className="font-serif text-3xl font-semibold">Related Pieces</h3>
              </div>
              <Link href="/products" className="text-xs font-semibold text-gold hover:underline uppercase tracking-wider flex items-center gap-1">
                See Catalog <ArrowRight className="h-4.5 w-4.5" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedData.products.slice(0, 4).map((item: any) => (
                <article key={item._id} className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between">
                  <div className="relative aspect-square overflow-hidden bg-muted-light">
                    <img
                      src={item.images?.[0]?.url || "https://placehold.co/400x400"}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 text-white">
                      <span className="rounded-full bg-black/45 px-3 py-1 text-[9px] font-semibold uppercase tracking-widest backdrop-blur-md">{item.brand || "Atelier"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 p-4 flex-grow justify-between">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{item.brand || "Designer edit"}</span>
                      <Link href={`/product/${item.slug}`} className="mt-1 block font-serif text-base font-bold leading-snug text-foreground transition-colors hover:text-gold line-clamp-1">
                        {item.title}
                      </Link>
                    </div>

                    <div className="flex items-center justify-between gap-3 text-xs border-t border-card-border/40 pt-3">
                      <div className="flex items-center gap-1 font-bold text-gold">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                        <span>{item.ratingAverage?.toFixed(1) || "5.0"}</span>
                      </div>
                      <span className="font-bold text-gold">{formatCurrencyPrice(item.price, currency)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
