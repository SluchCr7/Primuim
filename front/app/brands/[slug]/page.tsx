"use client";

import React from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useGetProductsQuery, useAddToCartMutation } from "../../../lib/api";
import { CardSkeleton } from "../../components/Skeletons";
import { useAppSelector } from "../../../lib/store";
import { Star, Award, ShieldCheck } from "lucide-react";

export default function BrandDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Normalize brand name from slug (e.g. "atelier-paris" -> "Atelier Paris")
  const brandName = typeof slug === "string"
    ? slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Designer Collections";

  const { data: productsData, isLoading } = useGetProductsQuery({ search: brandName });
  const [addToCart] = useAddToCartMutation();

  const products = productsData?.products || [];

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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Designers", url: "/products" },
            { label: brandName, url: `/brands/${slug}` },
          ]}
        />

        {/* Brand Header Description */}
        <div className="luxury-card p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5">
              <Award className="h-4 w-4" /> Certified Design Partner
            </span>
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold">{brandName}</h1>
            <p className="text-xs text-muted mt-2 max-w-xl font-light leading-relaxed">
              Bespoke collections crafted exclusively by the master artisans of {brandName}. Formed with the finest, audited raw materials and guaranteed authencity.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded bg-background/50 border border-card-border p-3 text-xs text-muted">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span>100% Authentic Allocation</span>
          </div>
        </div>

        <h2 className="font-serif text-2xl font-bold mb-8">Curated Catalog</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold">No designs found</h3>
            <p className="text-sm text-muted mt-1.5 font-light">
              No items from {brandName} are currently active. Check back later.
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
