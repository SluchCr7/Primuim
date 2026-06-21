"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetWishlistQuery, useToggleWishlistMutation, useAddToCartMutation } from "../../lib/api";
import { useAppSelector } from "../../lib/store";
import { useToast } from "../components/Toast";
import { Star, Heart, Trash2, Share2, Clipboard, ArrowRight, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WishlistPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, user: currentUser } = useAppSelector((state) => state.auth);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Security Check: Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Queries & Mutations
  const { data: wishlistData, isLoading, refetch } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  const [toggleWishlist] = useToggleWishlistMutation();
  const [addToCart] = useAddToCartMutation();

  const wishlistItems = wishlistData?.wishlist || [];

  const handleQuickAdd = async (product: any) => {
    // Self-purchase blocker check
    const productSellerId = product.seller?._id || product.seller;
    if (currentUser && productSellerId && productSellerId.toString() === currentUser.id) {
      showToast("Sellers cannot add their own products to the cart.", "error");
      return;
    }

    setAddingId(product._id);
    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      showToast("Added to your shopping bag.", "success");
    } catch (err: any) {
      showToast(err.data?.message || "Could not add item to cart.", "error");
    } finally {
      setAddingId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const res = await toggleWishlist(productId).unwrap();
      showToast(res.message || "Removed from wishlist.", "success");
      refetch();
    } catch (err) {
      showToast("Failed to remove item.", "error");
    }
  };

  const copyShareableLink = () => {
    if (!currentUser) return;
    const link = `${window.location.origin}/wishlist/shared/${currentUser.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    showToast("Shareable wishlist link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 3000);
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Atelier Home", url: "/" },
            { label: "My Wishlist", url: "/wishlist" }
          ]}
        />

        {/* Title and Shareable Link Box */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12 border-b border-card-border/40 pb-8">
          <div>
            <span className="text-[10px] font-bold tracking-[0.24em] text-gold uppercase flex items-center gap-1.5 mb-1.5">
              <Heart className="h-3.5 w-3.5 fill-gold text-gold" /> Personal Collection
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold tracking-wide">My Wishlist</h1>
          </div>

          {currentUser && (
            <div className="bg-card-bg/40 border border-card-border p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shadow-sm backdrop-blur-sm">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[9px] font-bold text-gold uppercase tracking-wider block">Share Curation</span>
                <span className="text-xs text-muted font-light truncate max-w-[200px] block">
                  {window.location.origin}/wishlist/shared/{currentUser.id.substring(0, 8)}...
                </span>
              </div>
              <button
                onClick={copyShareableLink}
                className="w-full sm:w-auto h-10 px-4 rounded-xl bg-foreground text-background hover:bg-gold hover:text-white transition-all text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                {copied ? <Clipboard className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </button>
            </div>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-card-border rounded-3xl p-8 bg-card-bg/10 max-w-md mx-auto">
            <Heart className="h-12 w-12 text-gold/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold">Your Wishlist is Empty</h3>
            <p className="text-xs text-muted mt-2 mb-6 font-light leading-relaxed">
              Curate your selection by tapping the heart icon on any design.
            </p>
            <Link
              href="/products"
              className="inline-flex h-11 items-center justify-center rounded-full bg-gold px-8 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md hover:-translate-y-0.5"
            >
              Discover Designs <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {wishlistItems.map((item: any, idx: number) => {
                const product = item.product;
                if (!product) return null;

                const productSellerId = product.seller?._id || product.seller;
                const isProductOwner = currentUser && productSellerId && productSellerId.toString() === currentUser.id;

                return (
                  <motion.div
                    key={product._id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="group flex flex-col justify-between luxury-card overflow-hidden rounded-[24px] border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:shadow-xl h-[420px]"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted-light">
                      <img
                        src={product.images?.[0]?.url || "https://placehold.co/400x400"}
                        alt={product.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 saturate-50 group-hover:saturate-100"
                      />
                      
                      {/* Delete / Remove trigger */}
                      <button
                        onClick={() => handleRemove(product._id)}
                        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 hover:bg-destructive/15 text-muted hover:text-destructive flex items-center justify-center transition-all shadow-md border border-card-border cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      {/* Add to Cart CTA */}
                      {isProductOwner ? (
                        <div className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-background/95 border border-gold/30 text-[10px] font-bold uppercase tracking-wider text-gold shadow-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <Lock className="h-3.5 w-3.5" /> Seller Account
                        </div>
                      ) : (
                        <button
                          onClick={() => handleQuickAdd(product)}
                          disabled={addingId === product._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/95 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white cursor-pointer"
                        >
                          {addingId === product._id ? "Adding..." : "Add to Cart"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col p-5 flex-grow justify-between border-t border-card-border/40">
                      <div>
                        <span className="text-[9px] font-bold tracking-[0.15em] text-gold uppercase">{product.brand || "Bespoke Design"}</span>
                        <Link
                          href={`/product/${product.slug}`}
                          className="mt-1 block font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-2 min-h-[40px]"
                        >
                          {product.title}
                        </Link>
                      </div>

                      <div className="flex items-center justify-between border-t border-card-border/40 pt-3.5 mt-auto">
                        <span className="font-bold text-gold text-sm">{product.price.toLocaleString()} EGP</span>
                        <div className="flex items-center gap-1 text-xs text-gold">
                          <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                          <span>{product.ratingAverage?.toFixed(1) || "5.0"}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
