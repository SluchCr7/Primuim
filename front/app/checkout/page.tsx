"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../components/Toast";
import { useAppSelector } from "../../lib/store";
import {
  useGetCartQuery,
  useGetMeQuery,
  useValidateAddressMutation,
  useSaveShippingMutation,
  useSavePaymentMethodMutation,
  useCreateOrderMutation,
  useStartCheckoutMutation,
  useGetLoyaltyWalletQuery,
  API_BASE_URL,
} from "@/redux/api";
import {
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle,
  FileText,
  ChevronRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

type CreatedOrder = { _id: string };

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  const [startCheckout] = useStartCheckoutMutation();
  const [hasStartedCheckout, setHasStartedCheckout] = useState(false);

  // Stepper State: "shipping" | "payment" | "processing" | "confirm"
  const [step, setStep] = useState<"shipping" | "payment" | "processing" | "confirm">("shipping");

  // Address form states
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Cairo");
  const [street, setStreet] = useState("");
  const [postalCode, setPostalCode] = useState("");
  
  // Validation and status states
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [addressWarning, setAddressWarning] = useState("");
  const [validationLoading, setValidationLoading] = useState(false);
  
  // Shipping Method
  const [shippingMethod, setShippingMethod] = useState("std"); // "std" | "exp"

  // Payment State
  const [shippingQuote, setShippingQuote] = useState({ shippingCost: 0, taxCost: 0 });

  // Completed Order State
  const [createdOrders, setCreatedOrders] = useState<CreatedOrder[]>([]);

  // Loyalty points redemption state
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
  const [pointsRedeemedApplied, setPointsRedeemedApplied] = useState<number>(0);

  // RTK Queries & Mutations
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: loyaltyWalletData } = useGetLoyaltyWalletQuery(undefined, { skip: !isAuthenticated });
  const loyaltyWallet = loyaltyWalletData?.wallet;
  const availablePoints = loyaltyWallet?.balance || 0;

  const [validateAddress] = useValidateAddressMutation();
  const [saveShipping] = useSaveShippingMutation();
  const [savePaymentMethod] = useSavePaymentMethodMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();

  // Start checkout session on load
  useEffect(() => {
    if (isAuthenticated && !hasStartedCheckout) {
      setHasStartedCheckout(true);
      startCheckout(undefined)
        .unwrap()
        .catch((err: any) => {
          showToast(t(err.data?.message || "Failed to initialize checkout session"), "error");
        });
    }
  }, [isAuthenticated, startCheckout, showToast, hasStartedCheckout, t]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=checkout");
    }
  }, [isAuthenticated, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (
      (step === "shipping" || step === "payment") &&
      cartData &&
      (!cartData.cart || cartData.cart.items.length === 0)
    ) {
      showToast(t("Your cart is empty. Please add items before checking out."), "info");
      router.push("/cart");
    }
  }, [cartData, step, router, showToast, t]);

  // Load saved user address if available
  useEffect(() => {
    if (userData?.user?.addresses && userData.user.addresses.length > 0) {
      const addr = userData.user.addresses.find((a: any) => a.isDefault) || userData.user.addresses[0];
      setFullName(addr.fullName || "");
      setPhone(addr.phone || "");
      setCity(addr.city || "Cairo");
      setStreet(addr.street || "");
      setPostalCode(addr.postalCode || "");
    }
  }, [userData]);

  const handleValidateAddress = async () => {
    setAddressWarning("");
    setIsAddressVerified(false);
    setValidationLoading(true);
    try {
      const res = await validateAddress({ fullName, phone, city, street, postalCode }).unwrap();
      if (res.success) {
        setIsAddressVerified(true);
      }
    } catch (err: any) {
      setAddressWarning(t(err.data?.message || "Verification warning: Please check spelling."));
    } finally {
      setValidationLoading(false);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !city || !street) {
      showToast(t("Please fill in all address details."), "error");
      return;
    }

    try {
      // Sync shipping in checkout session
      const shippingResponse = await saveShipping({
        shippingAddress: { fullName, phone, city, street, postalCode, country: "Egypt" },
        shippingMethodId: shippingMethod,
      }).unwrap();
      setShippingQuote({
        shippingCost: shippingResponse.checkoutSession.shippingCost,
        taxCost: shippingResponse.checkoutSession.taxCost,
      });

      setStep("payment");
    } catch (err: any) {
      showToast(t(err.data?.message || "Failed to save shipping information."), "error");
    }
  };

  const handlePlaceOrder = async () => {
    setStep("processing");

    try {
      await savePaymentMethod({ paymentMethod: "cod" }).unwrap();

      // 1. Create order
      const orderRes = await createOrder({
        redeemPoints: pointsRedeemedApplied,
      }).unwrap();

      const orders = orderRes.orders || (orderRes.order ? [orderRes.order] : []);
      if (orders.length === 0) {
        throw new Error("Order creation did not return any orders.");
      }
      setCreatedOrders(orders);

      setStep("confirm");
    } catch (err: any) {
      showToast(t(err.data?.message || err.message || "Checkout failed. Please try again."), "error");
      setStep("payment");
    }
  };

  // Price calculations
  const cartPrice = cartData?.cart?.totalPrice || 0;
  const shippingPrice = shippingQuote.shippingCost;
  const taxPrice = shippingQuote.taxCost;
  const total = Math.max(
    0,
    cartPrice + shippingPrice + taxPrice - pointsRedeemedApplied
  );

  if (isCartLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12 max-w-lg mx-auto text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <span className={`${step === "shipping" ? "text-gold" : "text-muted"}`}>{t("1. Shipping")}</span>
          <ChevronRight className="h-4 w-4 text-card-border" />
          <span className={`${step === "payment" ? "text-gold" : "text-muted"}`}>{t("2. Payment")}</span>
          <ChevronRight className="h-4 w-4 text-card-border" />
          <span className={`${step === "confirm" ? "text-gold" : "text-muted"}`}>{t("3. Confirmation")}</span>
        </div>

        {/* PROCESSING LOADER STATE */}
        {step === "processing" && (
          <div className="text-center py-24 luxury-card flex flex-col items-center gap-6 max-w-md mx-auto">
            <Loader2 className="h-12 w-12 text-gold animate-spin" />
            <h2 className="font-serif text-2xl font-bold">{t("Securing Allocation")}</h2>
            <p className="text-sm text-muted font-light leading-relaxed">
              {t("We are verifying inventory levels and tokenizing your billing secure vault. Please do not refresh.")}
            </p>
          </div>
        )}

        {/* STEP 1: SHIPPING ADDRESS & METHOD */}
        {step === "shipping" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold mb-6">{t("Escrow Shipping Details")}</h2>
              <form onSubmit={handleProceedToPayment} className="flex flex-col gap-6">
                
                {/* Vault Autofill Indicator */}
                {userData?.user?.addresses && userData.user.addresses.length > 0 && (
                  <div className="rounded border border-gold/20 bg-gold/5 p-4 text-xs flex justify-between items-center text-gold">
                    <span>{t("Loaded profile address from your secure multi-address vault.")}</span>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Full Name")}</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="Alex Mercer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Phone Number")}</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="+20 100 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Street Address")}</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="9 El-Gezira St, Zamalek"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("City")}</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                    >
                      <option value="Cairo">{t("Cairo")}</option>
                      <option value="Giza">{t("Giza")}</option>
                      <option value="Alexandria">{t("Alexandria")}</option>
                      <option value="Suez">{t("Suez")}</option>
                      <option value="Port Said">{t("Port Said")}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Postal Code (Optional)")}</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="11211"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleValidateAddress}
                      disabled={validationLoading}
                      className="w-full h-11 border border-gold text-gold hover:bg-gold/10 font-semibold rounded text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      {validationLoading ? t("Checking...") : <><MapPin className="h-4 w-4" /> {t("Verify Address")}</>}
                    </button>
                  </div>
                </div>

                {isAddressVerified && (
                  <div className="rounded border border-success/30 bg-success/10 px-4 py-3 text-xs text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> {t("Address verified against standard postal registry.")}
                  </div>
                )}

                {addressWarning && (
                  <div className="rounded border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
                    {addressWarning}
                  </div>
                )}

                {/* Shipping Method Selector */}
                <div className="border-t border-card-border pt-6 mt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">{t("Select Transit Priority")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("std")}
                      className={`p-4 border rounded text-left flex gap-4 ${shippingMethod === "std" ? "border-gold bg-gold/5" : "border-card-border"}`}
                    >
                      <Truck className="h-5 w-5 text-gold flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm block">{t("Standard Shipping")}</span>
                        <span className="text-xs text-muted font-light mt-0.5 block">{t("3-5 business days &bull; {price}").replace("{price}", cartPrice > 10000 ? t("Free") : "250 EGP")}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingMethod("exp")}
                      className={`p-4 border rounded text-left flex gap-4 ${shippingMethod === "exp" ? "border-gold bg-gold/5" : "border-card-border"}`}
                    >
                      <Sparkles className="h-5 w-5 text-gold flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm block">{t("Bespoke Courier (Express)")}</span>
                        <span className="text-xs text-muted font-light mt-0.5 block">{t("1-2 business days &bull; 150.00 EGP")}</span>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-14 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-sm uppercase tracking-wider shadow-md transition-all mt-4"
                >
                  {t("Continue to Payment")}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: MINI BAG SUMMARY */}
            <div className="flex flex-col gap-6">
              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-base border-b border-card-border pb-3 mb-4">{t("Order Summary")}</h3>
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {cartData?.cart?.items?.map((item: any) => (
                    <div key={item._id} className="flex gap-4 items-center justify-between">
                      <span className="text-xs font-light truncate max-w-[150px]">{item.product?.title}</span>
                      <span className="text-xs text-muted">x{item.quantity}</span>
                      <span className="text-xs font-semibold text-gold">{item.product?.price ? `${(item.product.price * item.quantity).toFixed(2)} EGP` : ""}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-card-border pt-4 mt-4 flex flex-col gap-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">{t("Subtotal")}</span>
                    <span className="font-semibold text-xs">{cartPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">{t("VAT (14%)")}</span>
                    <span className="font-semibold text-xs">{taxPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">{t("Shipping")}</span>
                    <span className="font-semibold text-xs">{shippingPrice === 0 ? t("Free") : `${shippingPrice.toFixed(2)} EGP`}</span>
                  </div>
                  <div className="border-t border-card-border pt-3 mt-1 flex justify-between items-end font-serif">
                    <span className="font-bold text-sm">{t("Total")}</span>
                    <span className="font-extrabold text-base text-gold">{total.toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT METHOD SELECTION */}
        {step === "payment" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold mb-6">{t("Payment Options")}</h2>
              
              <div className="flex flex-col gap-5">
                <div className="p-5 border border-gold rounded bg-gold/5 text-left flex gap-4 items-start">
                  <Truck className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">{t("Cash on Delivery (COD)")}</span>
                    <span className="text-xs text-muted font-light mt-0.5 block">{t("Pay cash to the bespoke courier when packages are delivered to your door.")}</span>
                  </div>
                </div>
                <p className="text-xs text-muted">
                  {t("Online payment methods are currently unavailable. No card or mobile-wallet details are collected.")}
                </p>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="w-1/3 h-14 border border-card-border hover:bg-muted-light font-semibold rounded text-xs uppercase tracking-wider"
                >
                  {t("Back to Address")}
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-2/3 h-14 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-sm uppercase tracking-wider shadow-md transition-all"
                >
                  {t("Place Order (Cash on Delivery)")}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: BILLING SIDE SUMMARY */}
            <div className="flex flex-col gap-6">
              
              {/* Loyalty Wallet Widget */}
              {availablePoints > 0 && (
                <div className="luxury-card p-6 border border-gold/30 bg-gold/5 flex flex-col gap-3">
                  <h3 className="font-serif font-bold text-sm border-b border-card-border pb-2 flex items-center gap-1.5 text-gold">
                    <Sparkles className="h-4 w-4" /> {t("Redeem Loyalty Points")}
                  </h3>
                  <div className="text-xs flex flex-col gap-2.5">
                    <p className="font-light">
                      {t("You have")} <strong className="font-semibold text-gold">{availablePoints}</strong> {t("loyalty points available")} ({t(loyaltyWallet?.tier || "Bronze")} {t("Tier")}).
                    </p>
                    <p className="text-[10px] text-muted font-light">
                      {t("1 Point = 1.00 EGP discount. Redeemable up to subtotal.")}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max={Math.min(availablePoints, cartPrice)}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full rounded border border-card-border bg-background px-3 py-1.5 text-xs outline-none focus:border-gold"
                        placeholder={t("Points")}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.min(pointsToRedeem, availablePoints, cartPrice);
                          setPointsRedeemedApplied(val);
                          showToast(t("Applied discount!"), "success");
                        }}
                        className="bg-gold text-luxury-white hover:bg-gold/95 px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        {t("Apply")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Price Details Breakdown */}
              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-sm border-b border-card-border pb-2 mb-3">{t("Price Breakdown")}</h3>
                <div className="flex flex-col gap-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted font-light">{t("Subtotal")}</span>
                    <span className="font-semibold">{cartPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light">{t("VAT (14%)")}</span>
                    <span className="font-semibold">{taxPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light">{t("Shipping")}</span>
                    <span className="font-semibold">{shippingPrice === 0 ? t("Free") : `${shippingPrice.toFixed(2)} EGP`}</span>
                  </div>
                  {pointsRedeemedApplied > 0 && (
                    <div className="flex justify-between text-gold font-medium">
                      <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {t("Points Discount")}</span>
                      <span>-{pointsRedeemedApplied.toFixed(2)} EGP</span>
                    </div>
                  )}
                  <div className="border-t border-card-border pt-3 mt-1 flex justify-between items-end font-serif">
                    <span className="font-bold text-sm">{t("Total")}</span>
                    <span className="font-extrabold text-base text-gold">{total.toFixed(2)} EGP</span>
                  </div>
                </div>
              </div>

              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-sm border-b border-card-border pb-2 mb-3">{t("Delivery Overview")}</h3>
                <div className="flex flex-col gap-3 text-xs">
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">{t("Recipient")}</strong>
                    {fullName} <br /> {phone}
                  </p>
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">{t("Destination Address")}</strong>
                    {street}, {t(city)}, {t("Egypt")}
                  </p>
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">{t("Transit Priority")}</strong>
                    {shippingMethod === "std" ? t("Standard Delivery (3-5 days)") : t("Bespoke Courier Express (1-2 days)")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMATION & RECEIPT DETAILS */}
        {step === "confirm" && createdOrders.length > 0 && (
          <div className="max-w-2xl mx-auto luxury-card p-8 text-center flex flex-col items-center gap-6 shadow-xl border-gold">
            <div className="rounded-full bg-gold/10 p-5 text-gold animate-bounce">
              <CheckCircle className="h-12 w-12" />
            </div>

            <div>
              <span className="text-xs font-bold tracking-widest text-gold uppercase">{t("Successful Reservation")}</span>
              <h2 className="font-serif text-3xl font-bold mt-1">
                {createdOrders.length > 1 ? t("Store Orders Allocated") : t("Order Allocated")}
              </h2>
              <p className="text-sm text-muted font-light mt-2 max-w-md mx-auto">
                {t("We have registered your purchase. Each store has its own order and delivery status.")}
              </p>
            </div>

            <div className="w-full border-t border-card-border pt-6 flex flex-col gap-3">
              {createdOrders.map((createdOrder) => (
                <div key={createdOrder._id} className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded border border-card-border p-3">
                  <span className="font-mono text-xs text-gold">{createdOrder._id}</span>
                  <Link
                    href={`${API_BASE_URL}/orders/${createdOrder._id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded border border-gold hover:bg-gold/10 px-5 text-gold font-semibold text-xs uppercase tracking-wider transition-all"
                  >
                    <FileText className="h-4 w-4" /> {t("Download Invoice")}
                  </Link>
                </div>
              ))}
              <button
                onClick={() => router.push("/dashboard")}
                className="h-12 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white px-8 font-semibold text-xs uppercase tracking-wider transition-all"
              >
                {t("Go to Dashboard")}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted font-light mt-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span>{t("Bespoke courier delivery dispatched within 12 hours.")}</span>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}