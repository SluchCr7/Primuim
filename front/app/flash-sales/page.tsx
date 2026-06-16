"use client";

import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetProductsQuery, useAddToCartMutation } from "../../lib/api";
import { CardSkeleton } from "../components/Skeletons";
import { useAppSelector } from "../../lib/store";
import { Star, Clock, Sparkles } from "lucide-react";

export default function FlashSalesPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 4 });
  const [addToCart] = useAddToCartMutation();

  // Timer states
  const [hours, setHours] = useState(3);
  const [minutes, setMinutes] = useState(44);
  const [seconds, setSeconds] = useState(59);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev > 0) return prev - 1;
        setMinutes((m) => {
          if (m > 0) return m - 1;
          setHours((h) => {
            if (h > 0) return h - 1;
            clearInterval(timer);
            return 0;
          });
          return 59;
        });
        return 59;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  const products = productsData?.products || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Flash Sales", url: "/flash-sales" }]} />

        {/* Timer Banner */}
        <div className="luxury-card p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
          <div>
            <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5 animate-pulse">
              <Sparkles className="h-4 w-4" /> Live Allocation Lock
            </span>
            <h1 className="font-serif text-3xl font-extrabold">Flash Vault Releases</h1>
            <p className="text-sm text-muted mt-2 font-light max-w-sm">
              High-demand collector items whitelisted for immediate reservation at special rates.
            </p>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-gold shrink-0" />
            <div className="flex gap-2 text-center text-sm font-semibold">
              <div className="bg-background border border-card-border p-2.5 rounded min-w-[50px]">
                <span className="block font-mono text-lg font-bold text-gold">{String(hours).padStart(2, "0")}</span>
                <span className="text-[9px] text-muted font-light uppercase tracking-wider block mt-0.5">Hours</span>
              </div>
              <div className="bg-background border border-card-border p-2.5 rounded min-w-[50px]">
                <span className="block font-mono text-lg font-bold text-gold">{String(minutes).padStart(2, "0")}</span>
                <span className="text-[9px] text-muted font-light uppercase tracking-wider block mt-0.5">Mins</span>
              </div>
              <div className="bg-background border border-card-border p-2.5 rounded min-w-[50px]">
                <span className="block font-mono text-lg font-bold text-gold">{String(seconds).padStart(2, "0")}</span>
                <span className="text-[9px] text-muted font-light uppercase tracking-wider block mt-0.5">Secs</span>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-bold mb-8">Active Allocations</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold">No active releases</h3>
            <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
              No flash vault items are currently active. Verify dashboard notifications for announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </main>

      <Footer />
    </div>
  );
}
