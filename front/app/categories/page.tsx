"use client";

import React from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetCategoriesQuery } from "../../lib/api";
import { CardSkeleton } from "../components/Skeletons";
import { ArrowRight, Sparkles } from "lucide-react";

export default function CategoriesPage() {
  const { data: categoriesData, isLoading } = useGetCategoriesQuery(undefined);

  const categories = categoriesData?.categories || [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Categories", url: "/categories" }]} />

        {/* Header */}
        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Curated Selections
          </span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Design Categories</h1>
          <p className="text-sm text-muted mt-2">Browse bespoke collections curated by luxury houses</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-20 luxury-card max-w-md mx-auto">
            <h3 className="font-serif text-xl font-bold">No categories found</h3>
            <p className="text-sm text-muted mt-1.5 font-light">Check back later for updated design catalogs.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((cat: any) => (
              <div
                key={cat._id}
                className="group relative luxury-card h-[280px] overflow-hidden flex flex-col justify-end p-6 hover:scale-[1.01] hover:border-gold/30 transition-all duration-500"
              >
                {/* Fallback pattern background for premium texture */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5 z-10" />
                <img
                  src={cat.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop"}
                  alt={cat.name}
                  className="absolute inset-0 h-full w-full object-cover saturate-50 group-hover:saturate-100 group-hover:scale-105 transition-all duration-700"
                />

                <div className="relative z-20 flex flex-col gap-2 text-white">
                  <h2 className="font-serif text-2xl font-bold">{cat.name}</h2>
                  {cat.description && (
                    <p className="text-xs text-white/70 font-light line-clamp-2 max-w-sm">
                      {cat.description}
                    </p>
                  )}
                  <Link
                    href={`/category/${cat.slug || cat._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold group-hover:text-gold-hover transition-colors uppercase tracking-widest mt-2"
                  >
                    Explore Subcategories <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
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
