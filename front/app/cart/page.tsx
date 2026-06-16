"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAppSelector } from "../../lib/store";
import {
  useGetCartQuery,
  useUpdateCartItemQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} from "../../lib/api";
import {
  getGuestCartTotals,
  updateGuestCartItemQuantity,
  removeGuestCartItem,
  clearGuestCart,
} from "../../lib/cartUtils";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Ticket, Sparkles, ShoppingBag } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  
  // States
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0); // in EGP
  const [discountError, setDiscountError] = useState("");
  const [discountSuccess, setDiscountSuccess] = useState("");
  const [guestCartData, setGuestCartData] = useState<any>({ items: [], totalItems: 0, totalPrice: 0 });

  // RTK Query endpoints
  const { data: dbCartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  const [updateDbQuantity, { isLoading: isUpdating }] = useUpdateCartItemQuantityMutation();
  const [removeFromDb, { isLoading: isRemoving }] = useRemoveFromCartMutation();
  const [clearDbCart] = useClearCartMutation();

  // Load guest cart
  useEffect(() => {
    if (!isAuthenticated) {
      const loadGuest = () => {
        const data = getGuestCartTotals();
        setGuestCartData(data);
      };
      loadGuest();
      window.addEventListener("guest-cart-updated", loadGuest);
      return () => window.removeEventListener("guest-cart-updated", loadGuest);
    }
  }, [isAuthenticated]);

  // Derived values depending on auth status
  const cartItems = isAuthenticated ? dbCartData?.cart?.items || [] : guestCartData.items;
  const totalItems = isAuthenticated ? dbCartData?.cart?.totalItems || 0 : guestCartData.totalItems;
  const subtotal = isAuthenticated ? dbCartData?.cart?.totalPrice || 0 : guestCartData.totalPrice;
  const shipping = subtotal > 10000 ? 0 : 250; // Free shipping for luxury orders above 10k EGP
  const vat = subtotal * 0.14; // 14% Egyptian VAT
  const total = subtotal + shipping + vat - discount;

  const handleQuantityChange = async (productId: string, currentQty: number, delta: number, variantSku?: string) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    if (isAuthenticated) {
      try {
        await updateDbQuantity({ productId, quantity: newQty }).unwrap();
      } catch (err) {
        alert("Could not update item quantity.");
      }
    } else {
      updateGuestCartItemQuantity(productId, newQty, variantSku);
    }
  };

  const handleRemoveItem = async (productId: string, variantSku?: string) => {
    if (isAuthenticated) {
      try {
        await removeFromDb(productId).unwrap();
      } catch (err) {
        alert("Could not remove item.");
      }
    } else {
      removeGuestCartItem(productId, variantSku);
    }
  };

  const handleClearCart = async () => {
    if (confirm("Are you sure you want to empty your shopping bag?")) {
      if (isAuthenticated) {
        try {
          await clearDbCart(undefined).unwrap();
        } catch (err) {
          alert("Could not clear bag.");
        }
      } else {
        clearGuestCart();
      }
    }
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError("");
    setDiscountSuccess("");
    
    // Stub codes
    const code = promoCode.trim().toUpperCase();
    if (code === "GOLD2026") {
      const discountVal = subtotal * 0.20; // 20% Off
      setDiscount(discountVal);
      setDiscountSuccess("VIP Promo Code 'GOLD2026' Applied (20% Off)!");
    } else if (code === "WELCOME10") {
      const discountVal = subtotal * 0.10; // 10% Off
      setDiscount(discountVal);
      setDiscountSuccess("Promo Code 'WELCOME10' Applied (10% Off)!");
    } else if (code === "") {
      setDiscount(0);
    } else {
      setDiscountError("Invalid or expired VIP invitation code.");
      setDiscount(0);
    }
  };

  const handleCheckoutRedirect = () => {
    if (!isAuthenticated) {
      // Redirect to login page and preserve checkout path in query param
      router.push("/login?redirect=checkout");
    } else {
      router.push("/checkout");
    }
  };

  if (isAuthenticated && isCartLoading) {
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
        
        {/* Title */}
        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Your Collection</span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Shopping Bag</h1>
          <p className="text-sm text-muted mt-2">Review your selected pieces and reserve allocation</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-24 luxury-card flex flex-col items-center gap-6 max-w-2xl mx-auto">
            <div className="rounded-full bg-gold/10 p-6 text-gold">
              <ShoppingBag className="h-12 w-12" />
            </div>
            <h2 className="font-serif text-2xl font-bold">Your Bag is Empty</h2>
            <p className="text-sm text-muted max-w-md font-light leading-relaxed">
              You haven't reserved any luxury designs yet. Browse our collections to add rings, garments, and digital assets.
            </p>
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center rounded bg-foreground px-8 font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all shadow-md uppercase tracking-wider text-xs"
            >
              Continue Exploring
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT COLUMN: LIST OF ITEMS */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="flex justify-between items-center pb-4 border-b border-card-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                  {totalItems} {totalItems === 1 ? "Item" : "Items"} Reserved
                </span>
                <button
                  onClick={handleClearCart}
                  className="text-xs font-semibold text-error hover:text-error/80 uppercase tracking-wider transition-colors"
                >
                  Clear Bag
                </button>
              </div>

              <div className="flex flex-col gap-6">
                {cartItems.map((item: any) => {
                  const productObj = item.product;
                  if (!productObj) return null;
                  
                  return (
                    <div
                      key={item._id || `${productObj._id}_${item.variantSku || ""}`}
                      className="flex gap-6 p-5 luxury-card items-start sm:items-center justify-between flex-col sm:flex-row hover:border-gold/30 transition-all duration-300"
                    >
                      {/* Product details thumbnail & titles */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="h-24 w-24 rounded overflow-hidden border border-card-border bg-muted-light flex-shrink-0">
                          <img
                            src={productObj.images?.[0]?.url || "https://placehold.co/150x150"}
                            alt={productObj.title}
                            className="h-full w-full object-cover saturate-50 hover:saturate-100 transition-all"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold tracking-widest text-gold uppercase">
                            {productObj.brand || "Designer Collection"}
                          </span>
                          <Link
                            href={productObj.slug ? `/product/${productObj.slug}` : `/products/${productObj._id}`}
                            className="font-serif font-bold text-base block text-foreground hover:text-gold transition-colors line-clamp-1 mt-0.5"
                          >
                            {productObj.title}
                          </Link>
                          {item.variantSku && (
                            <span className="text-xs text-muted block mt-1 font-light">
                              SKU: <span className="font-mono text-gold">{item.variantSku}</span>
                            </span>
                          )}
                          {productObj.isDigital && (
                            <span className="inline-flex items-center gap-1 rounded bg-gold/10 text-[9px] font-bold text-gold px-1.5 py-0.5 uppercase tracking-wider mt-1.5">
                              Digital Download
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Controls & Prices */}
                      <div className="flex items-center justify-between w-full sm:w-auto gap-8 border-t sm:border-none border-card-border pt-4 sm:pt-0">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-card-border rounded bg-background">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productObj._id, item.quantity, -1, item.variantSku)}
                            disabled={item.quantity <= 1 || isUpdating}
                            className="p-2 text-muted hover:text-gold disabled:opacity-30 transition-all"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="px-3 text-sm font-semibold min-w-[30px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(productObj._id, item.quantity, 1, item.variantSku)}
                            disabled={isUpdating}
                            className="p-2 text-muted hover:text-gold transition-all"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        {/* Prices & Delete */}
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="font-bold text-gold block text-sm">
                              {(productObj.price * item.quantity).toFixed(2)} EGP
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-muted font-light mt-0.5 block">
                                {productObj.price.toFixed(2)} each
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(productObj._id, item.variantSku)}
                            disabled={isRemoving}
                            className="p-2 text-muted hover:text-error transition-all rounded hover:bg-error/10"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY */}
            <div className="flex flex-col gap-6">
              <div className="luxury-card p-6 flex flex-col gap-6 shadow-md border-gold/20">
                <h3 className="font-serif font-bold text-lg border-b border-card-border pb-3">
                  Reservation Summary
                </h3>

                {/* Subtotals list */}
                <div className="flex flex-col gap-3.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-light">Subtotal</span>
                    <span className="font-semibold">{subtotal.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-light">VAT (14% EG)</span>
                    <span className="font-semibold">{vat.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-light">Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-success font-bold uppercase tracking-wider text-xs">Free</span>
                      ) : (
                        `${shipping.toFixed(2)} EGP`
                      )}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-success font-semibold">
                      <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Discount</span>
                      <span>-{discount.toFixed(2)} EGP</span>
                    </div>
                  )}

                  <div className="border-t border-card-border pt-4 mt-2 flex justify-between items-end">
                    <span className="font-serif font-bold text-base">Estimated Total</span>
                    <span className="font-serif font-extrabold text-xl text-gold">
                      {total.toFixed(2)} EGP
                    </span>
                  </div>
                </div>

                {/* Coupon form */}
                <form onSubmit={handleApplyPromo} className="flex flex-col gap-2 pt-2 border-t border-card-border">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                    VIP Coupon / Referral
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow flex items-center">
                      <Ticket className="absolute left-3.5 h-4 w-4 text-muted" />
                      <input
                        type="text"
                        placeholder="GOLD2026"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="w-full rounded border border-card-border bg-background py-2 pl-10 pr-3 text-sm uppercase outline-none focus:border-gold transition-colors font-semibold"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-foreground hover:bg-gold hover:text-luxury-white text-background px-4 rounded text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      Apply
                    </button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-error mt-1">{discountError}</p>
                  )}
                  {discountSuccess && (
                    <p className="text-xs text-success mt-1">{discountSuccess}</p>
                  )}
                </form>

                {/* Proceed to checkout */}
                <button
                  type="button"
                  onClick={handleCheckoutRedirect}
                  className="w-full h-14 rounded bg-foreground font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-md"
                >
                  Proceed to Checkout <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-muted font-light pt-2">
                  <ShieldCheck className="h-4 w-4 text-gold" />
                  <span>Escrow system activated. Your transactions are secure.</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
