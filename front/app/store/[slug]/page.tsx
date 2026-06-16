"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useGetPublicStoreBySlugQuery, useFollowSellerMutation, useAddToCartMutation } from "../../../lib/api";
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
  ThumbsUp, 
  UserPlus, 
  UserMinus,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function PublicStorePage() {
  const { slug } = useParams();
  const { showToast } = useToast();
  const { user: currentUser, isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<"products" | "articles" | "reviews">("products");
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch store details
  const { data, isLoading, refetch } = useGetPublicStoreBySlugQuery(slug as string);
  const [followSeller, { isLoading: isFollowingSeller }] = useFollowSellerMutation();
  const [addToCart] = useAddToCartMutation();

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

  const seller = data?.seller;
  const products = data?.products || [];
  const articles = data?.articles || [];
  const reviews = data?.reviews || [];

  if (!seller) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center py-20 px-6 text-center">
          <h2 className="font-serif text-3xl font-bold mb-4">Store Not Found</h2>
          <p className="text-muted text-sm max-w-sm mb-6 font-light">The requested store profile does not exist or has been suspended.</p>
          <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-8 text-xs font-semibold uppercase tracking-widest text-background hover:bg-gold hover:text-white transition-all">
            Return to Homepage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isFollowing = currentUser && seller.followers?.includes(currentUser.id);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to follow store channels.", "error");
      return;
    }
    try {
      const res = await followSeller(seller.id).unwrap();
      showToast(res.message, "success");
      refetch();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to toggle follow status.", "error");
    }
  };

  const handleQuickAdd = async (product: any) => {
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      {/* Hero Banner Section */}
      <div className="h-[260px] md:h-[350px] relative w-full overflow-hidden border-b border-card-border">
        <img
          src={seller.storeCover?.url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop"}
          alt={seller.storeName}
          className="w-full h-full object-cover saturate-50 opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 pb-20 relative -mt-32 z-10">
        
        {/* Profile Card Header */}
        <div className="luxury-card p-6 md:p-10 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between mb-12 bg-card-bg/90 backdrop-blur shadow-2xl rounded-[32px]">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Logo */}
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-gold overflow-hidden bg-background shrink-0 shadow-lg">
              <img
                src={seller.storeLogo?.url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                alt={seller.storeName}
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* Main Info */}
            <div>
              <span className="text-[10px] font-bold tracking-[0.24em] text-gold uppercase flex items-center gap-1.5 mb-1">
                <Award className="h-3.5 w-3.5" /> Approved Brand Partner
              </span>
              <h1 className="font-serif text-3xl font-bold leading-tight">{seller.storeName}</h1>
              {seller.brandName && (
                <p className="text-xs text-muted font-medium mb-3">By {seller.brandName}</p>
              )}
              
              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-muted">
                {seller.country && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-gold" /> {seller.country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-gold" /> Response: {seller.responseTime}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-gold" /> {seller.followersCount} Followers
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-gold text-gold" /> {seller.storeRating.toFixed(1)} / 5.0 Rating
                </span>
              </div>
            </div>
          </div>

          {/* Follow CTA */}
          <button
            onClick={handleFollowToggle}
            disabled={isFollowingSeller}
            className={`w-full md:w-auto h-12 rounded-full px-6 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              isFollowing 
                ? "border border-gold text-gold hover:bg-gold/10" 
                : "bg-foreground text-background hover:bg-gold hover:text-luxury-white hover:-translate-y-0.5"
            }`}
          >
            {isFollowing ? (
              <>
                <UserMinus className="h-4 w-4" /> Unfollow Brand
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" /> Follow Channel
              </>
            )}
          </button>
        </div>

        {/* Description Section */}
        {seller.storeDescription && (
          <div className="max-w-3xl mb-16">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-3">About the Atelier</h3>
            <p className="text-sm text-muted font-light leading-relaxed whitespace-pre-line">
              {seller.storeDescription}
            </p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-card-border mb-10 flex gap-8 text-xs font-bold uppercase tracking-widest">
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
                {tab} ({counts[tab]})
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
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {products.map((item: any) => (
                    <article 
                      key={item._id} 
                      className="group overflow-hidden rounded-[24px] border border-card-border bg-card-bg transition-all hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div className="relative aspect-square overflow-hidden bg-muted-light">
                        <img
                          src={item.images?.[0]?.url || "https://placehold.co/400x400"}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105 saturate-50 group-hover:saturate-100"
                        />
                        <button
                          onClick={() => handleQuickAdd(item)}
                          disabled={addingId === item._id}
                          className="absolute inset-x-4 bottom-4 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white/92 text-xs font-semibold uppercase tracking-[0.24em] text-luxury-black opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white cursor-pointer"
                        >
                          {addingId === item._id ? "Adding..." : "Quick Add"}
                        </button>
                      </div>

                      <div className="flex flex-col gap-4 p-4 flex-grow justify-between">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted">{seller.storeName}</span>
                          <Link 
                            href={`/product/${item.slug}`} 
                            className="mt-1 block font-serif text-base font-bold leading-snug text-foreground transition-colors hover:text-gold line-clamp-1"
                          >
                            {item.title}
                          </Link>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs border-t border-card-border/40 pt-3 mt-auto">
                          <div className="flex items-center gap-1 font-bold text-gold">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                            <span>{item.ratingAverage?.toFixed(1) || "5.0"}</span>
                          </div>
                          <span className="font-bold text-gold">{item.price.toLocaleString()} EGP</span>
                        </div>
                      </div>
                    </article>
                  ))}
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
                  {articles.map((art: any) => (
                    <article 
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
                          <span className="text-[9px] font-bold uppercase tracking-widest text-gold">{art.category}</span>
                          <Link 
                            href={`/article/${art.slug}`} 
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
                    </article>
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
                <div className="flex flex-col gap-6 max-w-3xl">
                  {reviews.map((rev: any) => (
                    <div 
                      key={rev._id} 
                      className="border-b border-card-border pb-6 last:border-none"
                    >
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
                            className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-gold text-gold" : "text-card-border"}`}
                          />
                        ))}
                      </div>

                      <p className="text-sm text-muted leading-relaxed font-light">{rev.comment}</p>

                      {/* Display replies if exists */}
                      {rev.reply && (
                        <div className="mt-4 rounded-xl border border-gold/15 bg-gold/5 p-4 text-xs max-w-2xl ml-4">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-gold uppercase tracking-wider text-[9px] flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> Store Response
                            </span>
                            <span className="text-muted text-[10px]">{new Date(rev.reply.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-muted font-light leading-relaxed">{rev.reply.comment}</p>
                        </div>
                      )}
                    </div>
                  ))}
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
