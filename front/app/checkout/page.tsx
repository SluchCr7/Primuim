"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useToast } from "../components/Toast";
import { useAppSelector } from "../../lib/store";
import {
  useGetCartQuery,
  useGetMeQuery,
  useValidateAddressMutation,
  useSaveShippingMutation,
  useSavePaymentMethodMutation,
  useCreateOrderMutation,
  useCreatePaymentMutation,
  useStartCheckoutMutation,
  API_BASE_URL,
} from "../../lib/api";
import {
  CreditCard,
  Phone,
  MapPin,
  Truck,
  ShieldCheck,
  CheckCircle,
  FileText,
  ChevronRight,
  Loader2,
  QrCode,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
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
  const [paymentMethod, setPaymentMethod] = useState("cod"); // "cod" | "card" | "fawry" | "vodafone_cash"
  const [walletNumber, setWalletNumber] = useState("");
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletOtp, setWalletOtp] = useState("");
  const [walletPin, setWalletPin] = useState("");

  // Card Form State
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  // Completed Order State
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [paymentResponse, setPaymentResponse] = useState<any>(null);

  // RTK Queries & Mutations
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: userData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const [validateAddress] = useValidateAddressMutation();
  const [saveShipping] = useSaveShippingMutation();
  const [savePaymentMethod] = useSavePaymentMethodMutation();
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation();
  const [createPayment] = useCreatePaymentMutation();

  // Start checkout session on load
  useEffect(() => {
    if (isAuthenticated && !hasStartedCheckout) {
      setHasStartedCheckout(true);
      startCheckout(undefined)
        .unwrap()
        .catch((err: any) => {
          showToast(err.data?.message || "Failed to initialize checkout session", "error");
        });
    }
  }, [isAuthenticated, startCheckout, showToast, hasStartedCheckout]);

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
      showToast("Your cart is empty. Please add items before checking out.", "info");
      router.push("/cart");
    }
  }, [cartData, step, router, showToast]);

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
      setAddressWarning(err.data?.message || "Verification warning: Please check spelling.");
    } finally {
      setValidationLoading(false);
    }
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !city || !street) {
      showToast("Please fill in all address details.", "error");
      return;
    }

    try {
      // Sync shipping in checkout session
      await saveShipping({
        shippingAddress: { fullName, phone, city, street, postalCode, country: "Egypt" },
        shippingMethodId: shippingMethod,
      }).unwrap();

      setStep("payment");
    } catch (err: any) {
      showToast(err.data?.message || "Failed to save shipping information.", "error");
    }
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === "vodafone_cash" && !isWalletModalOpen && !paymentResponse) {
      // Prompt wallet verification modal first
      if (!walletNumber) {
        showToast("Please enter your Vodafone Cash wallet number.", "error");
        return;
      }
      setIsWalletModalOpen(true);
      return;
    }

    setStep("processing");

    const cartPrice = cartData?.cart?.totalPrice || 0;
    const shippingPrice = shippingMethod === "exp" ? 150 : cartPrice > 10000 ? 0 : 250;
    const taxPrice = Math.round(cartPrice * 0.14 * 100) / 100;

    try {
      // 1. Create order
      const orderRes = await createOrder({
        shippingAddress: { fullName, phone, city, street, postalCode, country: "Egypt" },
        paymentMethod: paymentMethod === "cod" ? "cod" : paymentMethod === "card" ? "card" : "paypal",
        shippingPrice,
        taxPrice,
      }).unwrap();

      const order = orderRes.order;
      setCreatedOrder(order);

      // 2. Process mock payment if not COD
      if (paymentMethod !== "cod") {
        const payload: any = {
          paymentMethod,
        };

        if (paymentMethod === "card") {
          payload.transactionId = `stripe_mock_txn_${Date.now()}`;
          payload.provider = "stripe";
        } else if (paymentMethod === "fawry") {
          payload.provider = "fawry";
        } else if (paymentMethod === "vodafone_cash") {
          payload.provider = "vodafone_cash";
          payload.transactionId = `vdf_mock_txn_${Date.now()}`;
          payload.providerReference = `VDF-${Math.floor(100000 + Math.random() * 900000)}`;
        }

        const payRes = await createPayment({
          orderId: order._id,
          paymentData: payload,
        }).unwrap();

        setPaymentResponse(payRes);
      }

      setStep("confirm");
    } catch (err: any) {
      showToast(err.data?.message || err.message || "Checkout failed. Please try again.", "error");
      setStep("payment");
    }
  };

  const handleWalletSubmit = () => {
    if (!walletOtp || !walletPin) {
      showToast("Please fill in OTP and wallet PIN.", "error");
      return;
    }
    setIsWalletModalOpen(false);
    handlePlaceOrder();
  };

  // Price calculations
  const cartPrice = cartData?.cart?.totalPrice || 0;
  const shippingPrice = shippingMethod === "exp" ? 150 : cartPrice > 10000 ? 0 : 250;
  const taxPrice = Math.round(cartPrice * 0.14 * 100) / 100;
  const total = cartPrice + shippingPrice + taxPrice;

  if (isCartLoading) {
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12 max-w-lg mx-auto text-xs sm:text-sm font-semibold tracking-wider uppercase">
          <span className={`${step === "shipping" ? "text-gold" : "text-muted"}`}>1. Shipping</span>
          <ChevronRight className="h-4 w-4 text-card-border" />
          <span className={`${step === "payment" ? "text-gold" : "text-muted"}`}>2. Payment</span>
          <ChevronRight className="h-4 w-4 text-card-border" />
          <span className={`${step === "confirm" ? "text-gold" : "text-muted"}`}>3. Confirmation</span>
        </div>

        {/* PROCESSING LOADER STATE */}
        {step === "processing" && (
          <div className="text-center py-24 luxury-card flex flex-col items-center gap-6 max-w-md mx-auto">
            <Loader2 className="h-12 w-12 text-gold animate-spin" />
            <h2 className="font-serif text-2xl font-bold">Securing Allocation</h2>
            <p className="text-sm text-muted font-light leading-relaxed">
              We are verifying inventory levels and tokenizing your billing secure vault. Please do not refresh.
            </p>
          </div>
        )}

        {/* STEP 1: SHIPPING ADDRESS & METHOD */}
        {step === "shipping" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="font-serif text-2xl font-bold mb-6">Escrow Shipping Details</h2>
              <form onSubmit={handleProceedToPayment} className="flex flex-col gap-6">
                
                {/* Vault Autofill Indicator */}
                {userData?.user?.addresses && userData.user.addresses.length > 0 && (
                  <div className="rounded border border-gold/20 bg-gold/5 p-4 text-xs flex justify-between items-center text-gold">
                    <span>Loaded profile address from your secure multi-address vault.</span>
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Full Name</label>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Phone Number</label>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Street Address</label>
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
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">City</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                    >
                      <option value="Cairo">Cairo</option>
                      <option value="Giza">Giza</option>
                      <option value="Alexandria">Alexandria</option>
                      <option value="Suez">Suez</option>
                      <option value="Port Said">Port Said</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Postal Code (Optional)</label>
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
                      {validationLoading ? "Checking..." : <><MapPin className="h-4 w-4" /> Verify Address</>}
                    </button>
                  </div>
                </div>

                {isAddressVerified && (
                  <div className="rounded border border-success/30 bg-success/10 px-4 py-3 text-xs text-success flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Address verified against standard postal registry.
                  </div>
                )}

                {addressWarning && (
                  <div className="rounded border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
                    {addressWarning}
                  </div>
                )}

                {/* Shipping Method Selector */}
                <div className="border-t border-card-border pt-6 mt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">Select Transit Priority</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("std")}
                      className={`p-4 border rounded text-left flex gap-4 ${shippingMethod === "std" ? "border-gold bg-gold/5" : "border-card-border"}`}
                    >
                      <Truck className="h-5 w-5 text-gold flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm block">Standard Shipping</span>
                        <span className="text-xs text-muted font-light mt-0.5 block">3-5 business days &bull; {cartPrice > 10000 ? "Free" : "250 EGP"}</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShippingMethod("exp")}
                      className={`p-4 border rounded text-left flex gap-4 ${shippingMethod === "exp" ? "border-gold bg-gold/5" : "border-card-border"}`}
                    >
                      <Sparkles className="h-5 w-5 text-gold flex-shrink-0" />
                      <div>
                        <span className="font-bold text-sm block">Bespoke Courier (Express)</span>
                        <span className="text-xs text-muted font-light mt-0.5 block">1-2 business days &bull; 150.00 EGP</span>
                      </div>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-14 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-sm uppercase tracking-wider shadow-md transition-all mt-4"
                >
                  Continue to Payment
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: MINI BAG SUMMARY */}
            <div className="flex flex-col gap-6">
              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-base border-b border-card-border pb-3 mb-4">Order Summary</h3>
                <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                  {cartData?.cart?.items?.map((item: any) => (
                    <div key={item._id} className="flex gap-4 items-center justify-between">
                      <span className="text-xs font-light truncate max-w-[150px]">{item.product?.title}</span>
                      <span className="text-xs text-muted">x{item.quantity}</span>
                      <span className="text-xs font-semibold text-gold">{(item.product?.price * item.quantity).toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-card-border pt-4 mt-4 flex flex-col gap-3.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">Subtotal</span>
                    <span className="font-semibold text-xs">{cartPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">VAT (14%)</span>
                    <span className="font-semibold text-xs">{taxPrice.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted font-light text-xs">Shipping</span>
                    <span className="font-semibold text-xs">{shippingPrice === 0 ? "Free" : `${shippingPrice.toFixed(2)} EGP`}</span>
                  </div>
                  <div className="border-t border-card-border pt-3 mt-1 flex justify-between items-end font-serif">
                    <span className="font-bold text-sm">Total</span>
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
              <h2 className="font-serif text-2xl font-bold mb-6">Payment Options</h2>
              
              <div className="flex flex-col gap-5">
                
                {/* Stripe Simulator Card */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`p-5 border rounded text-left flex gap-4 items-start ${paymentMethod === "card" ? "border-gold bg-gold/5" : "border-card-border"}`}
                >
                  <CreditCard className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <span className="font-bold text-sm block">Credit / Debit Card (Stripe SDK stub)</span>
                    <span className="text-xs text-muted font-light mt-0.5 block">Securely authorize and charge using international card rails.</span>

                    {paymentMethod === "card" && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="sm:col-span-3">
                          <input
                            type="text"
                            placeholder="Card Number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                    )}
                  </div>
                </button>

                {/* Fawry Cash Egyptian stub */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("fawry")}
                  className={`p-5 border rounded text-left flex gap-4 items-start ${paymentMethod === "fawry" ? "border-gold bg-gold/5" : "border-card-border"}`}
                >
                  <FileText className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">Fawry Pay (Egyptian Retail Kiosk)</span>
                    <span className="text-xs text-muted font-light mt-0.5 block">Get a Fawry billing code and pay at any neighborhood kiosk machine.</span>
                  </div>
                </button>

                {/* Vodafone Cash Egyptian stub */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("vodafone_cash")}
                  className={`p-5 border rounded text-left flex gap-4 items-start ${paymentMethod === "vodafone_cash" ? "border-gold bg-gold/5" : "border-card-border"}`}
                >
                  <Phone className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <span className="font-bold text-sm block">Vodafone Cash (Mobile Wallet)</span>
                    <span className="text-xs text-muted font-light mt-0.5 block">Pay instantly using your active Vodafone Egypt mobile wallet.</span>

                    {paymentMethod === "vodafone_cash" && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="tel"
                          placeholder="Wallet Mobile Number"
                          value={walletNumber}
                          onChange={(e) => setWalletNumber(e.target.value)}
                          className="w-full max-w-sm rounded border border-card-border bg-background px-3 py-2.5 text-xs outline-none focus:border-gold"
                        />
                      </div>
                    )}
                  </div>
                </button>

                {/* Cash on Delivery */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={`p-5 border rounded text-left flex gap-4 items-start ${paymentMethod === "cod" ? "border-gold bg-gold/5" : "border-card-border"}`}
                >
                  <Truck className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-sm block">Cash on Delivery (COD)</span>
                    <span className="text-xs text-muted font-light mt-0.5 block">Pay cash to the bespoke courier when packages are delivered to your door.</span>
                  </div>
                </button>

              </div>

              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setStep("shipping")}
                  className="w-1/3 h-14 border border-card-border hover:bg-muted-light font-semibold rounded text-xs uppercase tracking-wider"
                >
                  Back to Address
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="w-2/3 h-14 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-sm uppercase tracking-wider shadow-md transition-all"
                >
                  Place Order & Pay {total.toFixed(2)} EGP
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: BILLING SIDE SUMMARY */}
            <div className="flex flex-col gap-6">
              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-base border-b border-card-border pb-3 mb-4">Delivery Overview</h3>
                <div className="flex flex-col gap-3.5 text-xs">
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">Recipient</strong>
                    {fullName} <br /> {phone}
                  </p>
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">Destination Address</strong>
                    {street}, {city}, Egypt
                  </p>
                  <p className="font-light leading-relaxed">
                    <strong className="font-semibold block uppercase tracking-wider mb-1 text-[10px] text-muted">Transit Priority</strong>
                    {shippingMethod === "std" ? "Standard Delivery (3-5 days)" : "Bespoke Courier Express (1-2 days)"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ORDER CONFIRMATION & RECEIPT DETAILS */}
        {step === "confirm" && createdOrder && (
          <div className="max-w-2xl mx-auto luxury-card p-8 text-center flex flex-col items-center gap-6 shadow-xl border-gold">
            <div className="rounded-full bg-gold/10 p-5 text-gold animate-bounce">
              <CheckCircle className="h-12 w-12" />
            </div>

            <div>
              <span className="text-xs font-bold tracking-widest text-gold uppercase">Successful Reservation</span>
              <h2 className="font-serif text-3xl font-bold mt-1">Order Allocated</h2>
              <p className="text-sm text-muted font-light mt-2 max-w-md mx-auto">
                We have registered your purchase. Your order identifier is: <br />
                <span className="font-mono text-gold font-semibold text-xs">{createdOrder._id}</span>
              </p>
            </div>

            {/* Egyptian local stubs feedback block */}
            {paymentMethod === "fawry" && paymentResponse?.fawryRef && (
              <div className="w-full rounded bg-gold/10 border border-gold/30 p-5 text-left flex flex-col gap-3">
                <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-gold uppercase">
                  <QrCode className="h-4 w-4" /> Fawry Invoice Code
                </span>
                <p className="text-sm font-light">
                  Please head to any Fawry kiosk outlet and supply the reference number below to make your payment:
                </p>
                <div className="text-center font-mono text-2xl font-extrabold tracking-widest text-foreground bg-background py-3 rounded border border-card-border">
                  {paymentResponse.fawryRef}
                </div>
                <p className="text-[10px] text-muted">
                  Note: Reservation holds automatically expire in 24 hours if checkout cash is not received.
                </p>
              </div>
            )}

            {paymentMethod === "vodafone_cash" && paymentResponse?.vodafoneRef && (
              <div className="w-full rounded bg-gold/10 border border-gold/30 p-5 text-left flex flex-col gap-3">
                <span className="flex items-center gap-2 text-xs font-bold tracking-widest text-gold uppercase">
                  <Phone className="h-4 w-4" /> Vodafone Cash Transaction
                </span>
                <p className="text-sm font-light">
                  Your mobile wallet billing has been registered successfully.
                </p>
                <div className="text-xs font-light">
                  Reference: <strong className="font-mono text-gold font-semibold">{paymentResponse.vodafoneRef}</strong>
                </div>
                <div className="text-xs font-light">
                  Wallet Charged: <strong className="font-mono">{walletNumber}</strong>
                </div>
              </div>
            )}

            {/* INVOICE DOWNLOAD & CONTINUE ACTIONS */}
            <div className="w-full border-t border-card-border pt-6 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`${API_BASE_URL}/orders/${createdOrder._id}/invoice`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded border border-gold hover:bg-gold/10 px-6 text-gold font-semibold text-xs uppercase tracking-wider transition-all"
              >
                <FileText className="h-4 w-4" /> Download PDF Invoice
              </Link>
              <button
                onClick={() => router.push("/dashboard")}
                className="h-12 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white px-8 font-semibold text-xs uppercase tracking-wider transition-all"
              >
                Go to Dashboard
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted font-light mt-2">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span>Bespoke courier delivery dispatched within 12 hours.</span>
            </div>
          </div>
        )}

        {/* Vodafone cash verification simulator modal */}
        {isWalletModalOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="w-full max-w-sm luxury-card p-6 shadow-xl border-gold">
              <h3 className="font-serif font-bold text-lg mb-2">Vodafone Cash Wallet</h3>
              <p className="text-xs text-muted font-light mb-4">
                We have triggered a transaction validation code to {walletNumber}.
              </p>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Enter OTP Code</label>
                  <input
                    type="text"
                    placeholder="E.g. 593028"
                    value={walletOtp}
                    onChange={(e) => setWalletOtp(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Enter Wallet Pin</label>
                  <input
                    type="password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;"
                    value={walletPin}
                    onChange={(e) => setWalletPin(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-mono"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsWalletModalOpen(false)}
                    className="w-1/2 h-10 border border-card-border rounded text-xs font-semibold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleWalletSubmit}
                    className="w-1/2 h-10 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider"
                  >
                    Authorize Pay
                  </button>
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
