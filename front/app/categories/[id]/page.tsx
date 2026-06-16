"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useGetCategoriesQuery, useGetProductsQuery, useAddToCartMutation } from "../../../lib/api";
import { CardSkeleton } from "../../components/Skeletons";
import { useAppSelector } from "../../../lib/store";
import { Star, ArrowLeft } from "lucide-react";

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const { data: categoriesData, isLoading: categoriesLoading } = useGetCategoriesQuery(undefined);
  const { data: productsData, isLoading: productsLoading } = useGetProductsQuery({ category: id });
  const [addToCart] = useAddToCartMutation();

  const currentCategory = categoriesData?.categories?.find((cat: any) => cat._id === id);
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

  if (categoriesLoading || productsLoading) {
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

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <h2 className="font-serif text-2xl font-bold">Category Not Found</h2>
          <button
            onClick={() => router.push("/categories")}
            className="inline-flex h-11 items-center gap-2 rounded border border-card-border px-5 text-sm font-semibold hover:border-gold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Categories
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Categories", url: "/categories" },
            { label: currentCategory.name, url: `/categories/${id}` },
          ]}
        />

        {/* Banner header */}
        <div className="relative h-[250px] rounded-lg overflow-hidden flex items-end p-8 mb-12 border border-card-border">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />
          <img
            src={currentCategory.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop"}
            alt={currentCategory.name}
            className="absolute inset-0 h-full w-full object-cover saturate-50"
          />
          <div className="relative z-20 text-white">
            <h1 className="font-serif text-3xl md:text-4xl font-extrabold">{currentCategory.name}</h1>
            {currentCategory.description && (
              <p className="text-sm text-white/80 mt-2 font-light max-w-xl leading-relaxed">
                {currentCategory.description}
              </p>
            )}
          </div>
        </div>

        {/* Product listing grid */}
        <h2 className="font-serif text-2xl font-bold mb-8">Available Designs</h2>

        {products.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold">No designs in category</h3>
            <p className="text-sm text-muted mt-1.5 font-light">We are working on adding new bespoke items. Check back soon.</p>
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
