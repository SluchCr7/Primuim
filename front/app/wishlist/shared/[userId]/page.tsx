"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import Breadcrumbs from "../../../components/Breadcrumbs";
import { useGetSharedWishlistQuery, useAddToCartMutation } from "../../../../lib/api";
import { useAppSelector } from "../../../../lib/store";
import { useToast } from "../../../components/Toast";
import { addGuestCartItem } from "../../../../lib/cartUtils";
import { Star, ShoppingBag, Heart } from "lucide-react";

export default function SharedWishlistPage() {
  const { userId } = useParams();
  const { showToast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const [addingId, setAddingId] = useState<string | null>(null);

  // Fetch shared wishlist items
  const { data, isLoading } = useGetSharedWishlistQuery(userId as string);
  const [addToCart] = useAddToCartMutation();

  const targetUser = data?.user;
  const wishlistItems = data?.wishlist || [];

  const handleQuickAdd = async (product: any) => {
    setAddingId(product._id);
    if (!isAuthenticated) {
      addGuestCartItem(product, 1);
      showToast("Added to guest cart successfully.", "success");
      setAddingId(null);
      return;
    }

    try {
      await addToCart({ productId: product._id, quantity: 1 }).unwrap();
      showToast("Added to your shopping bag.", "success");
    } catch (err) {
      showToast("Could not add item to cart.", "error");
    } finally {
      setAddingId(null);
    }
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

  if (!targetUser) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4">
          <h2 className="font-serif text-2xl font-bold">Wishlist Not Found</h2>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-card-border px-5 text-sm font-semibold hover:border-gold cursor-pointer"
          >
            Return to Homepage
          </Link>
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
            { label: "Bespoke Curation", url: "/" },
            { label: `${targetUser.username}'s Wishlist`, url: `/wishlist/shared/${userId}` }
          ]}
        />

        <div className="mb-12 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full border border-gold overflow-hidden bg-background">
            <img
              src={targetUser.profilePhoto?.url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
              alt={targetUser.username}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-[0.24em] text-gold uppercase flex items-center gap-1.5 mb-0.5">
              <Heart className="h-3 w-3 fill-gold" /> Shared Curations
            </span>
            <h1 className="font-serif text-3xl font-bold">{targetUser.username}'s Collection</h1>
          </div>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-card-border rounded-2xl p-6 bg-card-bg/25 max-w-md mx-auto">
            <Heart className="h-10 w-10 text-gold/30 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold">Wishlist is empty</h3>
            <p className="text-sm text-muted mt-1.5 font-light">This user has not wishlisted any designs yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {wishlistItems.map((item: any) => {
              const product = item.product;
              if (!product) return null;
              
              return (
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
                      onClick={() => handleQuickAdd(product)}
                      disabled={addingId === product._id}
                      className="absolute bottom-4 left-4 right-4 bg-background/95 backdrop-blur-sm py-2 rounded text-xs font-semibold tracking-wider uppercase opacity-0 group-hover:opacity-100 hover:bg-gold hover:text-luxury-white transition-all duration-300 border border-card-border cursor-pointer"
                    >
                      {addingId === product._id ? "Adding..." : "Quick Add"}
                    </button>
                  </div>
                  <div className="flex flex-col p-4 flex-grow justify-between">
                    <div>
                      <span className="text-xs text-muted tracking-widest uppercase mb-1">{product.brand || "DESIGNER"}</span>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-serif font-bold text-sm text-foreground hover:text-gold transition-colors line-clamp-1 mb-2"
                      >
                        {product.title}
                      </Link>
                    </div>
                    <div className="flex items-center justify-between mt-auto border-t border-card-border/40 pt-3">
                      <span className="text-sm font-bold text-gold">{product.price.toLocaleString()} EGP</span>
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
