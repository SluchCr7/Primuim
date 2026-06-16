"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {
  useGetProductByIdQuery,
  useAddToCartMutation,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useVoteHelpfulMutation,
  useGetProductsQuery,
} from "../../../lib/api";
import { useAppSelector } from "../../../lib/store";
import { Star, Shield, HelpCircle, FileText, CheckCircle, Award } from "lucide-react";
import { addGuestCartItem } from "../../../lib/cartUtils";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  
  // Queries & Mutations
  const { data: productData, isLoading } = useGetProductByIdQuery(id);
  const { data: reviewsData, refetch: refetchReviews } = useGetProductReviewsQuery(id);
  const { data: recommendationsData } = useGetProductsQuery({ limit: 4 });

  const [addToCart] = useAddToCartMutation();
  const [createReview, { isLoading: reviewLoading }] = useCreateReviewMutation();
  const [voteHelpful] = useVoteHelpfulMutation();
  const product = productData?.product;
  useEffect(() => {
    if (product?._id) {
      try {
        const stored = localStorage.getItem("recently_viewed");
        const list: string[] = stored ? JSON.parse(stored) : [];
        const filtered = list.filter((pid) => pid !== product._id);
        filtered.unshift(product._id);
        localStorage.setItem("recently_viewed", JSON.stringify(filtered.slice(0, 8)));
      } catch (err) {
        console.error("Recently viewed error:", err);
      }
    }
  }, [product]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      addGuestCartItem(product, 1, selectedVariant ? selectedVariant.sku : undefined);
      alert("Added to cart!");
      return;
    }
    try {
      await addToCart({
        productId: product._id,
        quantity: 1,
        variantSku: selectedVariant ? selectedVariant.sku : undefined,
      }).unwrap();
      alert("Added to cart!");
    } catch (err) {
      alert("Failed to add to cart.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    try {
      await createReview({
        product: product._id,
        rating: reviewRating,
        comment: reviewComment,
      }).unwrap();
      setReviewComment("");
      refetchReviews();
      alert("Review submitted!");
    } catch (err: any) {
      alert(err.data?.message || "Failed to submit review.");
    }
  };

  const handleHelpfulVote = async (reviewId: string) => {
    try {
      await voteHelpful(reviewId).unwrap();
      refetchReviews();
    } catch (err) {
      alert("Could not vote.");
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


  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center font-serif text-xl">
          Product not found or unavailable.
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          
          {/* IMAGES GALLERY */}
          <div className="flex flex-col gap-4">
            <div className="aspect-square bg-card-bg border border-card-border rounded-lg overflow-hidden">
              <img
                src={product.images?.[selectedImage]?.url || "https://placehold.co/600x600"}
                alt={product.title}
                className="h-full w-full object-cover saturate-50 hover:saturate-100 transition-all duration-300"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4">
                {product.images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`h-20 w-20 rounded border overflow-hidden ${selectedImage === idx ? "border-gold" : "border-card-border"}`}
                  >
                    <img src={img.url} alt="thumbnail" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PRODUCT META & INFO */}
          <div className="flex flex-col gap-6">
            <div>
              <span className="text-xs font-bold tracking-widest text-gold uppercase">{product.brand || "Designer Collection"}</span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold mt-1 mb-2">{product.title}</h1>
              
              <div className="flex items-center gap-4 text-sm mt-1">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-gold text-gold" /> {product.ratingAverage || 5.0}
                </span>
                <span className="text-muted">|</span>
                <span className="text-muted">{reviewsData?.reviews?.length || 0} customer reviews</span>
              </div>
            </div>

            <div className="border-y border-card-border py-4">
              <span className="text-2xl font-bold text-gold">
                {selectedVariant ? selectedVariant.price.toFixed(2) : product.price.toFixed(2)} EGP
              </span>
              {product.comparePrice && (
                <span className="text-sm line-through text-muted ml-3">{product.comparePrice.toFixed(2)} EGP</span>
              )}
            </div>

            <p className="text-sm text-muted leading-relaxed font-light">{product.description}</p>

            {/* VARIANTS SELECTOR */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Select Variant</span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((v: any) => (
                    <button
                      key={v.sku}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 text-sm rounded border ${selectedVariant?.sku === v.sku ? "border-gold bg-gold/10 font-medium" : "border-card-border hover:border-gold"}`}
                    >
                      {Object.values(v.attributes).join(" / ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* DIGITAL PRODUCT INDICATOR */}
            {product.isDigital && (
              <div className="flex items-center gap-2 rounded bg-gold/10 border border-gold/20 p-4 text-sm text-gold">
                <FileText className="h-5 w-5" />
                <span>This is a digital product. Complete payment to download files instantly.</span>
              </div>
            )}

            {/* PURCHASE BUTTON */}
            <div className="flex flex-col gap-4 mt-2">
              <button
                onClick={handleAddToCart}
                className="w-full h-14 rounded bg-foreground font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all flex items-center justify-center gap-2 shadow-md uppercase tracking-wider text-sm"
              >
                Add To Shopping Bag
              </button>
              <div className="flex items-center justify-center gap-6 text-xs text-muted">
                <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> 100% Secure Checkout</span>
                <span className="flex items-center gap-1"><Award className="h-3.5 w-3.5" /> Luxury Authenticity</span>
              </div>
            </div>

          </div>
        </div>

        {/* SPECIFICATIONS SHEET */}
        {product.specifications && product.specifications.length > 0 && (
          <section className="mb-16 border-t border-card-border pt-12">
            <h3 className="font-serif text-2xl font-bold mb-6">Product Specifications</h3>
            <div className="max-w-2xl luxury-card overflow-hidden">
              <table className="w-full text-sm text-left">
                <tbody>
                  {product.specifications.map((spec: any, idx: number) => (
                    <tr key={idx} className="border-b border-card-border last:border-none">
                      <td className="px-6 py-4 bg-muted-light/30 font-medium w-1/3 text-muted uppercase tracking-wider text-xs">{spec.name}</td>
                      <td className="px-6 py-4 text-foreground font-light">{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* REVIEWS & VERIFIED CUSTOMERS FEEDBACK */}
        <section className="border-t border-card-border pt-12">
          <h3 className="font-serif text-2xl font-bold mb-8">Verified Customer Reviews</h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Reviews display */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {!reviewsData?.reviews || reviewsData.reviews.length === 0 ? (
                <div className="text-muted text-sm italic py-8">
                  No customer reviews have been submitted for this product yet.
                </div>
              ) : (
                reviewsData.reviews.map((rev: any) => (
                  <div key={rev._id} className="border-b border-card-border pb-6 last:border-none">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{rev.user?.username || "Verified Customer"}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 rounded bg-success/10 text-[10px] font-bold text-success px-2 py-0.5 uppercase tracking-wider">
                            <CheckCircle className="h-3 w-3" /> Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-gold text-gold" : "text-card-border"}`}
                        />
                      ))}
                    </div>

                    <p className="text-sm text-muted leading-relaxed font-light">{rev.comment}</p>

                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <span className="text-muted">Was this review helpful?</span>
                      <button
                        onClick={() => handleHelpfulVote(rev._id)}
                        className="rounded border border-card-border px-3 py-1 hover:border-gold hover:text-gold transition-colors font-medium"
                      >
                        Helpful ({rev.helpfulVotes || 0})
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Create review form */}
            {isAuthenticated ? (
              <div className="luxury-card p-6 h-fit">
                <h4 className="font-serif font-semibold text-lg mb-4">Write a Review</h4>
                <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Rating</label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="text-gold"
                        >
                          <Star className={`h-6 w-6 ${star <= reviewRating ? "fill-gold" : "text-card-border"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Comments</label>
                    <textarea
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      placeholder="Share your experience with this item..."
                      className="w-full rounded border border-card-border bg-background p-3 text-sm outline-none focus:border-gold transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="w-full rounded bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all"
                  >
                    Submit Review
                  </button>
                </form>
              </div>
            ) : (
              <div className="luxury-card p-6 text-center text-sm text-muted">
                Please <Link href="/login" className="text-gold font-medium hover:underline">Sign In</Link> to post a review.
              </div>
            )}

          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
