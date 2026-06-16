"use client";

import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetProductsQuery, useAddToCartMutation } from "../../lib/api";
import { CardSkeleton } from "../components/Skeletons";
import { useAppSelector } from "../../lib/store";
import { Star, Gift, ShieldAlert } from "lucide-react";

export default function OffersPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  // Fetch products that might have a comparePrice (offers)
  const { data: productsData, isLoading } = useGetProductsQuery({ limit: 8 });
  const [addToCart] = useAddToCartMutation();

  const products = productsData?.products || [];
  
  // Filter products that have comparePrice > price to represent actual offers
  const offerItems = products.filter((p: any) => p.comparePrice && p.comparePrice > p.price);

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Bespoke Offers", url: "/offers" }]} />

        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
            <Gift className="h-4 w-4" /> VIP Invitations
          </span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Exclusive Offers</h1>
          <p className="text-sm text-muted mt-2">Reserved pricing rates on select seasonal designs</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : offerItems.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <Gift className="h-10 w-10 text-gold/30 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold">No active offers</h3>
            <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
              All luxury designs are currently at standard collection rates. Check back soon for VIP promotions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerItems.map((product: any) => {
              const savePercent = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
              return (
                <div
                  key={product._id}
                  className="group flex flex-col luxury-card overflow-hidden hover:scale-[1.01] transition-all duration-300"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted-light">
                    <span className="absolute top-3 left-3 bg-error text-luxury-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded z-10">
                      Save {savePercent}%
                    </span>
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
                      <div>
                        <span className="text-sm font-bold text-gold block">{product.price.toFixed(2)} EGP</span>
                        <span className="text-[10px] line-through text-muted font-light">{product.comparePrice.toFixed(2)} EGP</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted">
                        <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {product.ratingAverage || 5.0}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
