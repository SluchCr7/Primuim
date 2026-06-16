"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetProductsQuery, useAddToCartMutation } from "../../lib/api";
import { CardSkeleton } from "../components/Skeletons";
import { useAppSelector } from "../../lib/store";
import { Star, Eye, Trash2 } from "lucide-react";

export default function RecentlyViewedPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 50 });
  const [addToCart] = useAddToCartMutation();

  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("recently_viewed");
    if (saved) {
      try {
        setViewedIds(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const handleClearRecentlyViewed = () => {
    localStorage.removeItem("recently_viewed");
    setViewedIds([]);
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
      alert("Failed to add to cart.");
    }
  };

  const allProducts = productsData?.products || [];
  
  // Filter and maintain order of recently viewed items
  const viewedProducts = viewedIds
    .map((id) => allProducts.find((p: any) => p._id === id))
    .filter((p): p is any => !!p);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Recently Viewed", url: "/recently-viewed" }]} />

        <div className="mb-12 flex justify-between items-end flex-wrap gap-4">
          <div>
            <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> Navigation Log
            </span>
            <h1 className="font-serif text-4xl font-extrabold mt-1">Recently Viewed</h1>
            <p className="text-sm text-muted mt-2">Bespoke catalog designs you evaluated recently</p>
          </div>

          {viewedProducts.length > 0 && (
            <button
              onClick={handleClearRecentlyViewed}
              className="text-xs font-semibold text-error hover:text-error/80 uppercase tracking-widest flex items-center gap-1.5 transition-colors border border-card-border/60 hover:border-error/20 p-2 rounded"
            >
              <Trash2 className="h-4 w-4" /> Clear History
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : viewedProducts.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <Eye className="h-10 w-10 text-gold/30 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold">No history found</h3>
            <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
              You haven't clicked or viewed any designs in this browser session yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {viewedProducts.map((product: any) => (
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
      </main>

      <Footer />
    </div>
  );
}
