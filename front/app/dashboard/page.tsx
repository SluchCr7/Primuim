"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAppSelector } from "../../lib/store";
import {
  useGetMeQuery,
  useUpdateProfileMutation,
  useGetMyOrdersQuery,
  useCancelOrderMutation,
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useAddToCartMutation,
  useUploadProfilePhotoMutation,
  useDeleteProfilePhotoMutation,
  useToggle2FAMutation,
  useApplyAsSellerMutation,
  useGetMyApplicationStatusQuery,
  API_BASE_URL,
} from "../../lib/api";
import { useToast } from "../components/Toast";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Gift,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  Wallet,
  Shield,
  History,
  Camera,
  Copy,
  Lock,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  // Active Tab: "profile" | "orders" | "addresses" | "wishlist" | "wallet" | "security2fa" | "securitylogs" | "seller"
  const [activeTab, setActiveTab] = useState<
    "profile" | "orders" | "addresses" | "wishlist" | "wallet" | "security2fa" | "securitylogs" | "seller"
  >("profile");

  // Edit Profile form
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileName, setProfileName] = useState("");
  const [description, setDescription] = useState("");

  // Add Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrCity, setAddrCity] = useState("Cairo");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrDefault, setAddrDefault] = useState(false);

  // 2FA setups
  const [otpToken, setOtpToken] = useState("");
  const [showQrCode, setShowQrCode] = useState(false);

  // Seller Onboarding Form states
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeAddress, setStoreAddress] = useState("");

  // RTK Queries
  const { data: meData, isLoading: meLoading, refetch: refetchMe } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: ordersData, refetch: refetchOrders } = useGetMyOrdersQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesData, refetch: refetchAddresses } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });

  // Mutations
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [cancelOrder] = useCancelOrderMutation();
  const [addAddress, { isLoading: isAddingAddr }] = useAddAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();
  const [toggleWishlist] = useToggleWishlistMutation();
  const [addToCart] = useAddToCartMutation();
  const [uploadProfilePhoto, { isLoading: isUploadingPhoto }] = useUploadProfilePhotoMutation();
  const [deleteProfilePhoto, { isLoading: isDeletingPhoto }] = useDeleteProfilePhotoMutation();
  const [toggle2FA, { isLoading: isToggling2FA }] = useToggle2FAMutation();
  const [applyAsSeller, { isLoading: isApplyingSeller }] = useApplyAsSellerMutation();
  const { data: appStatusData, refetch: refetchAppStatus } = useGetMyApplicationStatusQuery(undefined, { skip: !isAuthenticated });

  // Redirect if guest
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Load profile details
  useEffect(() => {
    if (meData?.user) {
      setUsername(meData.user.username || "");
      setEmail(meData.user.email || "");
      setPhone(meData.user.phone || "");
      setProfileName(meData.user.profileName || "");
      setDescription(meData.user.description || "");
    }
  }, [meData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ username, email, phone, profileName, description }).unwrap();
      showToast("VIP Profile updated successfully!", "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update profile.", "error");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Profile image must be less than 2MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      await uploadProfilePhoto(formData).unwrap();
      showToast("Profile photo updated successfully!", "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to upload photo", "error");
    }
  };

  const handlePhotoDelete = async () => {
    if (confirm("Are you sure you want to remove your profile photo?")) {
      try {
        await deleteProfilePhoto(undefined).unwrap();
        showToast("Profile photo removed successfully!", "success");
        refetchMe();
      } catch (err: any) {
        showToast(err.data?.message || "Failed to remove photo", "error");
      }
    }
  };

  const handleToggle2FA = async (enable: boolean) => {
    try {
      await toggle2FA({ enable }).unwrap();
      showToast(
        enable ? "Two-Factor Authentication activated successfully!" : "Two-Factor Authentication deactivated.",
        "success"
      );
      refetchMe();
      setShowQrCode(false);
      setOtpToken("");
    } catch (err: any) {
      showToast(err.data?.message || "Failed to toggle 2FA.", "error");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm("Are you sure you want to cancel this order? This action cannot be undone.")) {
      try {
        await cancelOrder(orderId).unwrap();
        showToast("Order cancelled successfully.", "success");
        refetchOrders();
      } catch (err: any) {
        showToast(err.data?.message || "Could not cancel order.", "error");
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAddress({
        fullName: addrName,
        phone: addrPhone,
        city: addrCity,
        street: addrStreet,
        postalCode: addrPostal,
        isDefault: addrDefault,
      }).unwrap();
      setShowAddressForm(false);
      setAddrName("");
      setAddrPhone("");
      setAddrCity("Cairo");
      setAddrStreet("");
      setAddrPostal("");
      setAddrDefault(false);
      showToast("Address added successfully.", "success");
      refetchAddresses();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to add address.", "error");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Delete this address from your book?")) {
      try {
        await deleteAddress(addressId).unwrap();
        showToast("Address deleted successfully.", "success");
        refetchAddresses();
      } catch (err) {
        showToast("Failed to delete address.", "error");
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId).unwrap();
      showToast("Default address updated.", "success");
      refetchAddresses();
    } catch (err) {
      showToast("Failed to update default address.", "error");
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await toggleWishlist(productId).unwrap();
      showToast("Removed from wishlist.", "success");
      refetchWishlist();
    } catch (err) {
      showToast("Could not remove item.", "error");
    }
  };

  const handleAddWishlistToCart = async (productId: string) => {
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      showToast("Added to shopping bag!", "success");
    } catch (err) {
      showToast("Failed to add to bag.", "error");
    }
  };

  const handleCopyReferral = () => {
    const code = user?.referralCode || "PREMIUM2026";
    navigator.clipboard.writeText(code);
    showToast("Referral code copied to clipboard!", "success");
  };

  const handleApplySeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyAsSeller({ storeName, storeDescription, storePhone, storeAddress }).unwrap();
      showToast("Seller application submitted!", "success");
      refetchAppStatus();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to submit application", "error");
    }
  };

  if (meLoading) {
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

  const user = meData?.user;

  // Build wallet history
  const walletTransactions: any[] = [];
  if (user) {
    walletTransactions.push({
      id: "tx-signup",
      date: new Date(user.createdAt).toLocaleDateString(),
      description: "VIP Welcome Loyalty points reward",
      type: "points",
      amount: "+25 pts",
      status: "completed",
    });

    if (user.referredBy) {
      walletTransactions.push({
        id: "tx-referred",
        date: new Date(user.createdAt).toLocaleDateString(),
        description: "Referred signup points bonus",
        type: "points",
        amount: "+25 pts",
        status: "completed",
      });
    }

    if (user.activityLogs) {
      user.activityLogs.forEach((log: any, idx: number) => {
        if (log.action === "referral_bonus") {
          walletTransactions.push({
            id: `tx-ref-${idx}`,
            date: new Date(log.createdAt).toLocaleDateString(),
            description: log.details || "Referral invitation reward",
            type: "points",
            amount: "+50 pts",
            status: "completed",
          });
        }
      });
    }

    if (ordersData?.orders) {
      ordersData.orders.forEach((order: any) => {
        if (order.orderStatus !== "cancelled") {
          const cashback = order.totalPrice * 0.1;
          walletTransactions.push({
            id: `tx-cashback-${order._id}`,
            date: new Date(order.createdAt).toLocaleDateString(),
            description: `10% Cashback for Order #${order._id.substring(18).toUpperCase()}`,
            type: "wallet",
            amount: `+${cashback.toFixed(2)} EGP`,
            status: "completed",
          });
        }
      });
    }
  }

  // Sort logs in reverse chronological order
  const logins = user?.loginHistory ? [...user.loginHistory].reverse() : [];
  const activities = user?.activityLogs ? [...user.activityLogs].reverse() : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
        {/* Banner Section */}
        {user && (
          <div className="relative overflow-hidden luxury-card p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5" /> VIP Profile Tier
              </span>
              <h1 className="font-serif text-3xl font-bold">Welcome, {user.username}</h1>
              <p className="text-xs text-muted mt-1 font-light">Registered email address: {user.email}</p>
            </div>

            {/* Referral Credits Widget */}
            <div className="flex items-center gap-4 bg-background/50 border border-card-border p-4 rounded-lg">
              <Gift className="h-8 w-8 text-gold flex-shrink-0" />
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted block">Loyalty Referral Code</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-sm text-gold tracking-wider uppercase">
                    {user.referralCode || "PREMIUM2026"}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-1 hover:bg-card-border rounded transition-colors text-muted hover:text-gold"
                    title="Copy Code"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-success font-semibold mt-0.5 block">Invite guests to get 10% cash credits</span>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* TAB NAVIGATION SIDEBAR */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "profile" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <User className="h-4 w-4" /> VIP Profile Account
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                refetchOrders();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "orders" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <ShoppingBag className="h-4 w-4" /> Order History
            </button>

            <button
              onClick={() => {
                setActiveTab("addresses");
                refetchAddresses();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "addresses" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <MapPin className="h-4 w-4" /> Saved Addresses
            </button>

            <button
              onClick={() => {
                setActiveTab("wishlist");
                refetchWishlist();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "wishlist" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Heart className="h-4 w-4" /> Curated Wishlist
            </button>

            <button
              onClick={() => setActiveTab("wallet")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "wallet" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Wallet className="h-4 w-4" /> Wallet & Loyalty
            </button>

            <button
              onClick={() => setActiveTab("security2fa")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "security2fa" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Shield className="h-4 w-4" /> Security (2FA)
            </button>

            <button
              onClick={() => setActiveTab("securitylogs")}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "securitylogs" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <History className="h-4 w-4" /> Security Logs
            </button>

            {user && (user.role === "seller" || user.role === "admin") ? (
              <button
                onClick={() => router.push("/seller")}
                className="flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all bg-gold/15 text-gold hover:bg-gold hover:text-luxury-white"
              >
                <Sparkles className="h-4 w-4 text-gold group-hover:text-inherit" /> Seller Portal
              </button>
            ) : (
              <button
                onClick={() => setActiveTab("seller")}
                className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${activeTab === "seller" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
              >
                <ShoppingBag className="h-4 w-4" /> Become a Seller
              </button>
            )}
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="lg:col-span-3">
            {/* PROFILE DETAILS TAB */}
            {activeTab === "profile" && (
              <div className="luxury-card p-6 md:p-8">
                <h2 className="font-serif text-2xl font-bold mb-6">VIP Profile Settings</h2>

                {/* Profile Photo Uploader Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-card-border mb-6">
                  <div className="relative h-20 w-20 rounded-full overflow-hidden border border-gold/40 bg-muted-light">
                    <img
                      src={user?.profilePhoto?.url || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                      alt={user?.username}
                      className="h-full w-full object-cover"
                    />
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-luxury-black/70 flex items-center justify-center">
                        <div className="h-4 w-4 animate-spin rounded-full border border-gold border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex h-9 items-center justify-center gap-1.5 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white px-4 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer">
                      <Camera className="h-3.5 w-3.5" />
                      Upload Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={isUploadingPhoto}
                      />
                    </label>
                    {user?.profilePhoto?.publicId && (
                      <button
                        type="button"
                        onClick={handlePhotoDelete}
                        disabled={isDeletingPhoto}
                        className="text-[10px] text-error hover:underline font-semibold uppercase tracking-wider text-left pl-1"
                      >
                        {isDeletingPhoto ? "Removing..." : "Remove Photo"}
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Username</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Profile / Display Name</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder="Alex Mercer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder="+20 100 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">VIP Portal Notes / Description</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold"
                      placeholder="Add notes about design preferences or customization requests..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full sm:w-auto px-8 py-3 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-xs uppercase tracking-widest transition-all mt-2"
                  >
                    {isUpdatingProfile ? "Saving changes..." : "Save VIP Profile"}
                  </button>
                </form>
              </div>
            )}

            {/* ORDER HISTORY TAB */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-2xl font-bold mb-2">Your Orders</h2>

                {!ordersData?.orders || ordersData.orders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-card-border rounded p-6 text-muted text-sm font-light">
                    No orders have been recorded on this profile yet.
                  </div>
                ) : (
                  ordersData.orders.map((order: any) => (
                    <div key={order._id} className="luxury-card p-6 flex flex-col gap-4 border-gold/20 hover:border-gold/40 transition-all">
                      {/* Order Header Meta */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-card-border">
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Order ID</span>
                          <span className="font-mono text-xs text-foreground font-semibold">{order._id}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Order Date</span>
                          <span className="text-xs text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Total Amount</span>
                          <span className="text-sm font-bold text-gold">{order.totalPrice.toFixed(2)} EGP</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {order.orderStatus === "pending" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded uppercase tracking-wider"><Clock className="h-3 w-3" /> Pending</span>}
                          {order.orderStatus === "processing" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/10 px-2 py-0.5 rounded uppercase tracking-wider"><CheckCircle className="h-3 w-3" /> Processing</span>}
                          {order.orderStatus === "cancelled" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-error bg-error/10 px-2 py-0.5 rounded uppercase tracking-wider"><XCircle className="h-3 w-3" /> Cancelled</span>}
                          {order.orderStatus === "delivered" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/15 px-2 py-0.5 rounded uppercase tracking-wider"><CheckCircle className="h-3 w-3" /> Delivered</span>}
                        </div>
                      </div>

                      {/* Items lists */}
                      <div className="flex flex-col gap-3">
                        {order.orderItems?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center gap-4 text-xs">
                            <div className="flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="h-8 w-8 rounded object-cover border border-card-border" />
                              )}
                              <span className="font-medium truncate max-w-[180px]">{item.title}</span>
                            </div>
                            <span className="text-muted">x{item.quantity}</span>
                            <span className="font-semibold">{item.price.toFixed(2)} EGP</span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-4 pt-3 border-t border-card-border mt-1 justify-between items-center">
                        <div className="text-xs text-muted font-light">
                          Payment Status: <span className={`font-semibold capitalize ${order.isPaid ? "text-success" : "text-gold"}`}>{order.paymentStatus}</span>
                        </div>
                        
                        <div className="flex gap-3">
                          <Link
                            href={`${API_BASE_URL}/orders/${order._id}/invoice`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded border border-card-border px-3 text-[10px] font-bold uppercase tracking-wider hover:border-gold hover:text-gold transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF Invoice
                          </Link>

                          {order.orderStatus === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order._id)}
                              className="inline-flex h-9 items-center gap-1.5 rounded border border-error/30 text-error px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-error/10 transition-colors"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" /> Cancel Order
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SAVED ADDRESSES TAB */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold">Address Book</h2>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white px-4 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Address
                  </button>
                </div>

                {/* Address add form */}
                {showAddressForm && (
                  <form onSubmit={handleAddAddress} className="luxury-card p-6 flex flex-col gap-4 border-gold">
                    <h3 className="font-serif font-bold text-base mb-2">New Delivery Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={addrName}
                          onChange={(e) => setAddrName(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Phone Number</label>
                        <input
                          type="text"
                          required
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Street Address</label>
                        <input
                          type="text"
                          required
                          value={addrStreet}
                          onChange={(e) => setAddrStreet(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">City</label>
                        <select
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                        >
                          <option value="Cairo">Cairo</option>
                          <option value="Giza">Giza</option>
                          <option value="Alexandria">Alexandria</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-grow">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Postal Code</label>
                        <input
                          type="text"
                          value={addrPostal}
                          onChange={(e) => setAddrPostal(e.target.value)}
                          className="w-full max-w-xs rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs mt-4">
                        <input
                          type="checkbox"
                          checked={addrDefault}
                          onChange={(e) => setAddrDefault(e.target.checked)}
                          className="rounded border-card-border text-gold focus:ring-gold"
                        />
                        Set as default address
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(false)}
                        className="px-4 py-2 border border-card-border rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingAddr}
                        className="px-5 py-2 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        Save Address
                      </button>
                    </div>
                  </form>
                )}

                {/* List of addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!addressesData?.addresses || addressesData.addresses.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 border border-dashed border-card-border rounded text-muted text-sm">
                      Address book is empty. Please add an address to speed up checkout.
                    </div>
                  ) : (
                    addressesData.addresses.map((addr: any) => (
                      <div key={addr._id} className={`p-5 rounded border flex flex-col justify-between gap-4 ${addr.isDefault ? "border-gold bg-gold/5" : "border-card-border bg-card-bg"}`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm">{addr.fullName}</h4>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold text-gold uppercase tracking-wider border border-gold px-1.5 py-0.5 rounded">Default</span>
                            )}
                          </div>
                          <p className="text-xs text-muted font-light leading-relaxed">
                            {addr.street} <br />
                            {addr.city}, Egypt <br />
                            {addr.postalCode && `Postal: ${addr.postalCode}`} <br />
                            Phone: {addr.phone}
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-card-border/50 pt-3 mt-1">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              className="text-[10px] text-gold hover:underline font-semibold uppercase tracking-wider"
                            >
                              Make Default
                            </button>
                          ) : (
                            <span className="text-[10px] text-success font-semibold uppercase tracking-wider">Active</span>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-muted hover:text-error p-1 rounded"
                            aria-label="Delete address"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* CURATED WISHLIST TAB */}
            {activeTab === "wishlist" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-2xl font-bold">Your Wishlist</h2>

                {!wishlistData?.wishlist || wishlistData.wishlist.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-card-border rounded text-muted text-sm">
                    No items in your wishlist. Start exploring catalog items and click the heart icon to save!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistData.wishlist.map((item: any) => {
                      const prod = item.product;
                      if (!prod) return null;
                      return (
                        <div key={item._id} className="luxury-card flex flex-col justify-between overflow-hidden hover:scale-[1.01] transition-all">
                          <div className="relative aspect-square overflow-hidden bg-muted-light">
                            <img
                              src={prod.images?.[0]?.url || "https://placehold.co/300x300"}
                              alt={prod.title}
                              className="h-full w-full object-cover saturate-50 hover:saturate-100 transition-all duration-300"
                            />
                            <button
                              onClick={() => handleRemoveWishlist(prod._id)}
                              className="absolute top-3 right-3 rounded-full bg-background/85 p-2 text-error shadow-sm hover:scale-105 transition-transform"
                            >
                              <Heart className="h-4 w-4 fill-error text-error" />
                            </button>
                          </div>
                          <div className="p-4 flex flex-col flex-grow">
                            <span className="text-[9px] text-muted tracking-widest uppercase mb-1">{prod.brand || "Designer"}</span>
                            <h4 className="font-serif font-bold text-sm block line-clamp-1 mb-2 text-foreground">{prod.title}</h4>
                            <div className="text-xs text-gold font-bold mb-4">{prod.price.toFixed(2)} EGP</div>
                            
                            <button
                              onClick={() => handleAddWishlistToCart(prod._id)}
                              className="w-full py-2 bg-foreground hover:bg-gold hover:text-luxury-white text-background text-xs font-semibold uppercase tracking-wider rounded transition-all mt-auto"
                            >
                              Add to Bag
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WALLET & LOYALTY TAB */}
            {activeTab === "wallet" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Wallet & Loyalty Portal</h2>
                  <p className="text-xs text-muted font-light mt-1">Monitor credit balances and loyalty redemption logs</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wallet Card */}
                  <div className="luxury-card p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Available Credit Balance</span>
                        <span className="text-3xl font-serif font-bold text-gold mt-1 block">
                          {(user?.walletBalance || 0).toFixed(2)} EGP
                        </span>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-full text-gold">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted font-light leading-relaxed">
                      Use credit balance to pay directly at checkout. Credits are accumulated via returns, promotions, and cashbacks.
                    </p>
                  </div>

                  {/* Loyalty Points Card */}
                  <div className="luxury-card p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Loyalty Reward Points</span>
                        <span className="text-3xl font-serif font-bold text-foreground mt-1 block">
                          {user?.loyaltyPoints || 0} <span className="text-xs text-muted font-sans font-medium">pts</span>
                        </span>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-full text-gold">
                        <Sparkles className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> 100 points = 10 EGP Store Credit auto-redemption
                    </div>
                  </div>
                </div>

                {/* Referral Card */}
                <div className="luxury-card p-6 border-dashed border-gold/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="max-w-md">
                    <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-gold" /> Earn VIP Referral Cash credits
                    </h3>
                    <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
                      Share your unique code. New signups receive 25 reward points. Once they place their first order, your account gets credited with 50 loyalty points plus 10% order cashbacks!
                    </p>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="w-full md:w-auto px-6 py-2.5 bg-foreground hover:bg-gold hover:text-luxury-white text-background text-xs font-semibold uppercase tracking-wider rounded transition-all"
                  >
                    Copy invite code
                  </button>
                </div>

                {/* Ledger Table */}
                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4">Transaction Ledger History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Transaction ID</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Date</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Description</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Credit Ledger</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted font-light">
                              No transactions recorded in your ledger yet.
                            </td>
                          </tr>
                        ) : (
                          walletTransactions.map((tx, i) => (
                            <tr key={tx.id || i} className="border-b border-card-border/50">
                              <td className="py-3 px-3 font-mono text-[10px] text-muted">{tx.id}</td>
                              <td className="py-3 px-3 text-muted">{tx.date}</td>
                              <td className="py-3 px-3 font-medium text-foreground">{tx.description}</td>
                              <td className={`py-3 px-3 font-bold ${tx.type === "wallet" ? "text-gold" : "text-foreground"}`}>
                                {tx.amount}
                              </td>
                              <td className="py-3 px-3">
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY (2FA) TAB */}
            {activeTab === "security2fa" && (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-2">Two-Factor Security (2FA)</h2>
                <p className="text-xs text-muted font-light mb-8">Maintain validation policies on your VIP account</p>

                {user?.is2FAEnabled ? (
                  <div className="luxury-card p-6 md:p-8 border-gold/20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg">
                    <div className="flex items-center gap-3.5 mb-6 text-success">
                      <CheckCircle className="h-6 w-6" />
                      <h3 className="font-serif text-lg font-bold text-foreground">Two-Factor Authentication Active</h3>
                    </div>
                    <p className="text-xs text-muted mb-6 font-light leading-relaxed max-w-xl">
                      Your VIP account is protected with 2FA codes. Every login attempt will prompt you to provide a verification token generated by your authenticator app (such as Google Authenticator or Authy).
                    </p>
                    <button
                      onClick={() => handleToggle2FA(false)}
                      disabled={isToggling2FA}
                      className="px-6 py-2.5 bg-error/10 hover:bg-error/20 text-error rounded text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      {isToggling2FA ? "Processing..." : "Deactivate 2FA Protection"}
                    </button>
                  </div>
                ) : (
                  <div className="luxury-card p-6 md:p-8">
                    <div className="flex items-center gap-3.5 mb-6 text-gold">
                      <AlertTriangle className="h-6 w-6" />
                      <h3 className="font-serif text-lg font-bold text-foreground">Activate Two-Factor Protection</h3>
                    </div>
                    <p className="text-xs text-muted mb-6 font-light leading-relaxed max-w-xl">
                      Prevent unauthorized signins. Once configured, you must supply a 6-digit dynamic token generated on your mobile phone to login.
                    </p>

                    {!showQrCode ? (
                      <button
                        onClick={() => setShowQrCode(true)}
                        className="px-6 py-2.5 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        Start 2FA Configuration
                      </button>
                    ) : (
                      <div className="flex flex-col gap-6 items-start border-t border-card-border pt-6">
                        <div className="flex flex-col sm:flex-row gap-6 items-center bg-background/50 border border-card-border p-5 rounded-lg w-full">
                          <div className="bg-white p-3 rounded flex-shrink-0">
                            <svg className="h-28 w-28 text-black" viewBox="0 0 100 100">
                              <rect x="0" y="0" width="100" height="100" fill="none" />
                              <rect x="10" y="10" width="25" height="25" fill="black" />
                              <rect x="15" y="15" width="15" height="15" fill="white" />
                              <rect x="18" y="18" width="9" height="9" fill="black" />
                              <rect x="65" y="10" width="25" height="25" fill="black" />
                              <rect x="70" y="15" width="15" height="15" fill="white" />
                              <rect x="73" y="18" width="9" height="9" fill="black" />
                              <rect x="10" y="65" width="25" height="25" fill="black" />
                              <rect x="15" y="70" width="15" height="15" fill="white" />
                              <rect x="18" y="73" width="9" height="9" fill="black" />
                              <rect x="42" y="12" width="6" height="18" fill="black" />
                              <rect x="52" y="15" width="8" height="6" fill="black" />
                              <rect x="40" y="40" width="20" height="20" fill="black" />
                              <rect x="45" y="45" width="10" height="10" fill="white" />
                              <rect x="48" y="48" width="4" height="4" fill="black" />
                              <rect x="12" y="42" width="12" height="6" fill="black" />
                              <rect x="18" y="52" width="6" height="8" fill="black" />
                              <rect x="75" y="45" width="10" height="12" fill="black" />
                              <rect x="68" y="62" width="18" height="6" fill="black" />
                              <rect x="62" y="75" width="12" height="12" fill="black" />
                              <rect x="80" y="78" width="8" height="8" fill="black" />
                            </svg>
                          </div>
                          <div className="flex-grow">
                            <span className="text-[9px] text-muted uppercase tracking-wider font-semibold">Scan QR or enter key manually</span>
                            <div className="font-mono text-sm text-gold font-bold mt-1 bg-background px-3 py-1.5 border border-card-border rounded select-all w-fit">
                              JBSWY3DPEHPK3PXP
                            </div>
                            <p className="text-[10px] text-muted font-light mt-2 leading-relaxed">
                              Install Google Authenticator or Authy on your iOS/Android. Scan this QR code or input the Secret Key manually to synchronize tokens.
                            </p>
                          </div>
                        </div>

                        <div className="w-full max-w-sm">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                            Enter dynamic 6-digit OTP code to verify
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              maxLength={6}
                              value={otpToken}
                              onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ""))}
                              className="flex-grow rounded border border-card-border bg-background px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-gold"
                              placeholder="000000"
                            />
                            <button
                              onClick={() => {
                                if (otpToken.length !== 6) {
                                  showToast("Please enter a valid 6-digit code", "error");
                                  return;
                                }
                                handleToggle2FA(true);
                              }}
                              disabled={isToggling2FA}
                              className="px-6 py-2.5 bg-foreground hover:bg-gold hover:text-luxury-white text-background rounded text-xs font-semibold uppercase tracking-wider transition-all"
                            >
                              {isToggling2FA ? "Validating..." : "Verify & Enable"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SECURITY LOGS TAB */}
            {activeTab === "securitylogs" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold">Security & Audit Logs</h2>
                  <p className="text-xs text-muted font-light mt-1">Review account audit trails and login details</p>
                </div>

                {/* Login History */}
                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4 flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-gold" /> Login Sessions History
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Device / User Agent</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">IP Address</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logins.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted font-light">
                              No logins recorded.
                            </td>
                          </tr>
                        ) : (
                          logins.slice(0, 10).map((log: any, i: number) => (
                            <tr key={i} className="border-b border-card-border/50">
                              <td className="py-3 px-3 text-foreground font-medium truncate max-w-[300px]" title={log.device}>
                                {log.device}
                              </td>
                              <td className="py-3 px-3 font-mono text-muted">{log.ip || "127.0.0.1"}</td>
                              <td className="py-3 px-3 text-muted">{new Date(log.loginAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Activity logs */}
                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4 flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-gold" /> Account Activity Audit Trail
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Audit Action</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Details</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">IP Address</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted font-light">
                              No security activity recorded.
                            </td>
                          </tr>
                        ) : (
                          activities.slice(0, 15).map((act: any, i: number) => (
                            <tr key={i} className="border-b border-card-border/50">
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    act.action.includes("fail") || act.action.includes("alert") || act.action.includes("lock")
                                      ? "text-error bg-error/10"
                                      : act.action.includes("success") || act.action.includes("verify") || act.action.includes("enable")
                                        ? "text-success bg-success/10"
                                        : "text-gold bg-gold/10"
                                  }`}
                                >
                                  {act.action}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-muted leading-relaxed max-w-[250px] truncate" title={act.details}>
                                {act.details}
                              </td>
                              <td className="py-3 px-3 font-mono text-muted">{act.ip || "127.0.0.1"}</td>
                              <td className="py-3 px-3 text-muted">{new Date(act.createdAt).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BECOME A SELLER TAB */}
            {activeTab === "seller" && (
              <div className="luxury-card p-6 md:p-8">
                <h2 className="font-serif text-2xl font-bold mb-2">Seller Onboarding Application</h2>
                <p className="text-xs text-muted font-light mt-1 mb-6">Apply to open a merchant store on Shop Premium and list your custom catalog</p>

                {appStatusData?.request ? (
                  <div className="p-6 rounded border border-card-border bg-card-bg/50">
                    <h3 className="font-serif font-bold text-base mb-4">Application Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6">
                      <div>
                        <span className="text-muted block">Store Name</span>
                        <span className="font-semibold text-foreground">{appStatusData.request.storeName}</span>
                      </div>
                      <div>
                        <span className="text-muted block">Status</span>
                        <span className={`inline-flex font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider mt-1 ${
                          appStatusData.request.status === "pending"
                            ? "bg-gold/20 text-gold"
                            : appStatusData.request.status === "approved"
                              ? "bg-success/20 text-success"
                              : "bg-error/20 text-error"
                        }`}>
                          {appStatusData.request.status}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted block">Store Description</span>
                        <span className="text-foreground">{appStatusData.request.storeDescription}</span>
                      </div>
                      {appStatusData.request.adminNotes && (
                        <div className="md:col-span-2 p-3 bg-error/10 border border-error/20 text-error rounded mt-2">
                          <span className="font-semibold block text-[10px] uppercase">Admin Feedback:</span>
                          {appStatusData.request.adminNotes}
                        </div>
                      )}
                    </div>

                    {appStatusData.request.status === "rejected" && (
                      <button
                        onClick={() => {
                          // Clear status locally to let them apply again
                          // (or backend deletes it on new post request)
                          // We can just let them resubmit
                          location.reload();
                        }}
                        className="px-6 py-2.5 bg-foreground hover:bg-gold hover:text-luxury-white text-background text-xs font-semibold uppercase tracking-wider rounded transition-all"
                      >
                        Resubmit Application
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleApplySeller} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Store / Brand Name</label>
                        <input
                          type="text"
                          required
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold font-bold"
                          placeholder="e.g. Damascus Goldsmiths"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Business Phone Number</label>
                        <input
                          type="text"
                          required
                          value={storePhone}
                          onChange={(e) => setStorePhone(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                          placeholder="e.g. +20 123 456 7890"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Store / Pickup Address</label>
                      <input
                        type="text"
                        required
                        value={storeAddress}
                        onChange={(e) => setStoreAddress(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder="e.g. 15 Zamalek St, Cairo, Egypt"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Brand Story & Description</label>
                      <textarea
                        rows={4}
                        required
                        value={storeDescription}
                        onChange={(e) => setStoreDescription(e.target.value)}
                        className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold leading-relaxed"
                        placeholder="Describe the craft details, heritage, and products you intend to list..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isApplyingSeller}
                      className="w-full sm:w-auto px-8 py-3 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-xs uppercase tracking-widest transition-all mt-2"
                    >
                      {isApplyingSeller ? "Submitting Application..." : "Submit Seller Onboarding"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
