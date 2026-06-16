"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetArticlesQuery } from "../../lib/api";
import { Sparkles, Calendar, User, ArrowRight, Search, Filter } from "lucide-react";

export default function BlogListingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useGetArticlesQuery({
    search: debouncedSearch,
    category: selectedCategory
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
  };

  const categories = ["Lifestyle", "Collections", "Luxury Watch", "Brand Story"];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Atelier Blog", url: "/blog" }]} />

        {/* Hero Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> Editorial Reads
            </span>
            <h1 className="font-serif text-4xl font-extrabold mt-1">Lifestyle Blog</h1>
            <p className="text-sm text-muted mt-2 font-light">Bespoke insights, designer conversations, and design histories</p>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search articles..."
                className="bg-card-bg border border-card-border rounded px-4 py-2 text-xs w-48 focus:w-64 outline-none focus:border-gold transition-all duration-300 pr-8"
              />
              <button type="submit" className="absolute right-2.5 text-muted hover:text-gold">
                <Search className="h-4 w-4" />
              </button>
            </form>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-card-bg border border-card-border rounded px-3 py-2 text-xs text-muted outline-none focus:border-gold"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
          </div>
        ) : !data?.articles || data.articles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-card-border rounded-lg text-muted text-sm font-light">
            No editorial reads matched your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {data.articles.map((post: any) => (
              <div key={post._id} className="group flex flex-col luxury-card overflow-hidden hover:scale-[1.01] transition-all duration-300 bg-card-bg border border-card-border rounded-lg">
                <div className="relative h-[250px] overflow-hidden bg-muted-light">
                  <img
                    src={post.image?.url || "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600&auto=format&fit=crop"}
                    alt={post.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-750 saturate-50 group-hover:saturate-100"
                  />
                  <span className="absolute top-4 left-4 text-[9px] font-bold text-luxury-white bg-luxury-black/70 px-2 py-1 uppercase tracking-wider rounded border border-gold/30">
                    {post.category}
                  </span>
                </div>
                
                <div className="p-6 flex flex-col flex-grow gap-3.5">
                  <div className="flex items-center gap-4 text-[10px] text-muted font-semibold uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> 
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> 
                      By {post.authorName || post.author?.username || "Editorial Staff"}
                    </span>
                  </div>
                  
                  <h2 className="font-serif font-bold text-xl text-foreground hover:text-gold transition-colors line-clamp-2">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  
                  <p className="text-sm text-muted font-light leading-relaxed line-clamp-3">
                    {post.subtitle || post.content.replace(/[#*`]/g, "").substring(0, 150) + "..."}
                  </p>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-card-border/30">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold group-hover:text-gold-hover transition-colors uppercase tracking-widest"
                    >
                      Read Editorial <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <span className="text-[10px] text-muted font-light">{post.views || 0} views</span>
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
