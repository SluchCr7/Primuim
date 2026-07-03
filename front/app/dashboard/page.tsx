"use client";
import React, { useReducer, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "../../lib/store";
import { useTranslation } from "react-i18next"; // أو من المكتبة التي تستخدمها مثل next-intl
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
  Ruler,
  Pencil,
  Shirt,
  Footprints,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
type ActiveTab =
  | "profile"
  | "orders"
  | "addresses"
  | "wishlist"
  | "wallet"
  | "security2fa"
  | "securitylogs"
  | "seller"
  | "fitprofile";

type DashboardState = {
  ui: { activeTab: ActiveTab; showAddressForm: boolean };
  profile: { username: string; email: string; phone: string; profileName: string; description: string };
  address: { name: string; phone: string; city: string; street: string; postal: string; isDefault: boolean };
  otp: { token: string; showQr: boolean };
  seller: { name: string; description: string; phone: string; address: string };
};

type DashboardAction =
  | { type: "SET_ACTIVE_TAB"; payload: ActiveTab }
  | { type: "SET_SHOW_ADDRESS_FORM"; payload: boolean }
  | { type: "SET_PROFILE"; field: keyof DashboardState["profile"]; value: string }
  | { type: "INIT_PROFILE"; payload: Partial<DashboardState["profile"]> }
  | { type: "SET_ADDRESS"; field: keyof DashboardState["address"]; value: string | boolean }
  | { type: "RESET_ADDRESS" }
  | { type: "SET_OTP_TOKEN"; payload: string }
  | { type: "SET_SHOW_QR"; payload: boolean }
  | { type: "RESET_OTP" }
  | { type: "SET_SELLER"; field: keyof DashboardState["seller"]; value: string };

// ─── Initial State ────────────────────────────────────────────────────────────
const initialState: DashboardState = {
  ui: { activeTab: "profile", showAddressForm: false },
  profile: { username: "", email: "", phone: "", profileName: "", description: "" },
  address: { name: "", phone: "", city: "Cairo", street: "", postal: "", isDefault: false },
  otp: { token: "", showQr: false },
  seller: { name: "", description: "", phone: "", address: "" },
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, ui: { ...state.ui, activeTab: action.payload } };
    case "SET_SHOW_ADDRESS_FORM":
      return { ...state, ui: { ...state.ui, showAddressForm: action.payload } };
    case "SET_PROFILE":
      return { ...state, profile: { ...state.profile, [action.field]: action.value } };
    case "INIT_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "SET_ADDRESS":
      return { ...state, address: { ...state.address, [action.field]: action.value } };
    case "RESET_ADDRESS":
      return { ...state, address: initialState.address, ui: { ...state.ui, showAddressForm: false } };
    case "SET_OTP_TOKEN":
      return { ...state, otp: { ...state.otp, token: action.payload } };
    case "SET_SHOW_QR":
      return { ...state, otp: { ...state.otp, showQr: action.payload } };
    case "RESET_OTP":
      return { ...state, otp: initialState.otp };
    case "SET_SELLER":
      return { ...state, seller: { ...state.seller, [action.field]: action.value } };
    default:
      return state;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isAuthenticated, accessToken } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();

  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Convenience aliases for readability
  const { ui, profile, address, otp, seller } = state;

  const { data: meData, isLoading: meLoading, refetch: refetchMe } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: ordersData, refetch: refetchOrders } = useGetMyOrdersQuery(undefined, { skip: !isAuthenticated });
  const { data: addressesData, refetch: refetchAddresses } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData, refetch: refetchWishlist } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (meData?.user) {
      dispatch({
        type: "INIT_PROFILE",
        payload: {
          username: meData.user.username || "",
          email: meData.user.email || "",
          phone: meData.user.phone || "",
          profileName: meData.user.profileName || "",
          description: meData.user.description || "",
        },
      });
    }
  }, [meData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        username: profile.username,
        email: profile.email,
        phone: profile.phone,
        profileName: profile.profileName,
        description: profile.description,
      }).unwrap();
      showToast(t("VIP Profile updated successfully!"), "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || t("Failed to update profile."), "error");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(t("Profile image must be less than 2MB."), "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      await uploadProfilePhoto(formData).unwrap();
      showToast(t("Profile photo updated successfully!"), "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || t("Failed to upload photo"), "error");
    }
  };

  const handlePhotoDelete = async () => {
    if (confirm(t("Are you sure you want to remove your profile photo?"))) {
      try {
        await deleteProfilePhoto(undefined).unwrap();
        showToast(t("Profile photo removed successfully!"), "success");
        refetchMe();
      } catch (err: any) {
        showToast(err.data?.message || t("Failed to remove photo"), "error");
      }
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      showToast(t("Generating invoice PDF..."), "info");

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(t("Invoice downloaded successfully!"), "success");
    } catch (err: any) {
      showToast(t("Could not retrieve PDF invoice."), "error");
    }
  };

  const handleToggle2FA = async (enable: boolean) => {
    try {
      await toggle2FA({ enable }).unwrap();
      showToast(
        enable ? t("Two-Factor Authentication activated successfully!") : t("Two-Factor Authentication deactivated."),
        "success"
      );
      refetchMe();
      dispatch({ type: "RESET_OTP" });
    } catch (err: any) {
      showToast(err.data?.message || t("Failed to toggle 2FA."), "error");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (confirm(t("Are you sure you want to cancel this order? This action cannot be undone."))) {
      try {
        await cancelOrder(orderId).unwrap();
        showToast(t("Order cancelled successfully."), "success");
        refetchOrders();
      } catch (err: any) {
        showToast(err.data?.message || t("Could not cancel order."), "error");
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAddress({
        fullName: address.name,
        phone: address.phone,
        city: address.city,
        street: address.street,
        postalCode: address.postal,
        isDefault: address.isDefault,
      }).unwrap();
      dispatch({ type: "RESET_ADDRESS" });
      showToast(t("Address added successfully."), "success");
      refetchAddresses();
    } catch (err: any) {
      showToast(err.data?.message || t("Failed to add address."), "error");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm(t("Delete this address from your book?"))) {
      try {
        await deleteAddress(addressId).unwrap();
        showToast(t("Address deleted successfully."), "success");
        refetchAddresses();
      } catch (err) {
        showToast(t("Failed to delete address."), "error");
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      await setDefaultAddress(addressId).unwrap();
      showToast(t("Default address updated."), "success");
      refetchAddresses();
    } catch (err) {
      showToast(t("Failed to update default address."), "error");
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    try {
      await toggleWishlist(productId).unwrap();
      showToast(t("Removed from wishlist."), "success");
      refetchWishlist();
    } catch (err) {
      showToast(t("Could not remove item."), "error");
    }
  };

  const handleAddWishlistToCart = async (productId: string) => {
    try {
      await addToCart({ productId, quantity: 1 }).unwrap();
      showToast(t("Added to shopping bag!"), "success");
    } catch (err) {
      showToast(t("Failed to add to bag."), "error");
    }
  };

  const handleCopyReferral = () => {
    const code = user?.referralCode || "PREMIUM2026";
    navigator.clipboard.writeText(code);
    showToast(t("Referral code copied to clipboard!"), "success");
  };

  const handleApplySeller = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await applyAsSeller({
        storeName: seller.name,
        storeDescription: seller.description,
        storePhone: seller.phone,
        storeAddress: seller.address,
      }).unwrap();
      showToast(t("Seller application submitted!"), "success");
      refetchAppStatus();
    } catch (err: any) {
      showToast(err.data?.message || t("Failed to submit application"), "error");
    }
  };

  if (meLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const user = meData?.user;

  const walletTransactions: any[] = [];
  if (user) {
    walletTransactions.push({
      id: "tx-signup",
      date: new Date(user.createdAt).toLocaleDateString(),
      description: t("VIP Welcome Loyalty points reward"),
      type: "points",
      amount: t("+25 pts"),
      status: "completed",
    });

    if (user.referredBy) {
      walletTransactions.push({
        id: "tx-referred",
        date: new Date(user.createdAt).toLocaleDateString(),
        description: t("Referred signup points bonus"),
        type: "points",
        amount: t("+25 pts"),
        status: "completed",
      });
    }

    if (user.activityLogs) {
      user.activityLogs.forEach((log: any, idx: number) => {
        if (log.action === "referral_bonus") {
          walletTransactions.push({
            id: `tx-ref-${idx}`,
            date: new Date(log.createdAt).toLocaleDateString(),
            description: log.details || t("Referral invitation reward"),
            type: "points",
            amount: t("+50 pts"),
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
            description: `${t("10% Cashback for Order #")}${order._id.substring(18).toUpperCase()}`,
            type: "wallet",
            amount: `+${cashback.toFixed(2)} ${t("EGP")}`,
            status: "completed",
          });
        }
      });
    }
  }

  const logins = user?.loginHistory ? [...user.loginHistory].reverse() : [];
  const activities = user?.activityLogs ? [...user.activityLogs].reverse() : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12 md:py-20">
        {user && (
          <div className="relative overflow-hidden luxury-card p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {t("VIP Profile Tier")}
              </span>
              <h1 className="font-serif text-3xl font-bold">{t("Welcome")}, {user.username}</h1>
              <p className="text-xs text-muted mt-1 font-light">{t("Registered email address:")} {user.email}</p>
            </div>

            <div className="flex items-center gap-4 bg-background/50 border border-card-border p-4 rounded-lg">
              <Gift className="h-8 w-8 text-gold flex-shrink-0" />
              <div>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted block">{t("Loyalty Referral Code")}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-sm text-gold tracking-wider uppercase">
                    {user.referralCode || "PREMIUM2026"}
                  </span>
                  <button
                    onClick={handleCopyReferral}
                    className="p-1 hover:bg-card-border rounded transition-colors text-muted hover:text-gold"
                    title={t("Copy Code")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-success font-semibold mt-0.5 block">{t("Invite guests to get 10% cash credits")}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "profile" })}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "profile" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <User className="h-4 w-4" /> {t("VIP Profile Account")}
            </button>

            <button
              onClick={() => {
                dispatch({ type: "SET_ACTIVE_TAB", payload: "orders" });
                refetchOrders();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "orders" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <ShoppingBag className="h-4 w-4" /> {t("Order History")}
            </button>

            <button
              onClick={() => {
                dispatch({ type: "SET_ACTIVE_TAB", payload: "addresses" });
                refetchAddresses();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "addresses" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <MapPin className="h-4 w-4" /> {t("Saved Addresses")}
            </button>

            <button
              onClick={() => {
                dispatch({ type: "SET_ACTIVE_TAB", payload: "wishlist" });
                refetchWishlist();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "wishlist" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Heart className="h-4 w-4" /> {t("Curated Wishlist")}
            </button>

            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "wallet" })}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "wallet" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Wallet className="h-4 w-4" /> {t("Wallet & Loyalty")}
            </button>

            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "security2fa" })}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "security2fa" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <Shield className="h-4 w-4" /> {t("Security (2FA)")}
            </button>

            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "securitylogs" })}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "securitylogs" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
            >
              <History className="h-4 w-4" /> {t("Security Logs")}
            </button>

            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "fitprofile" })}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                ui.activeTab === "fitprofile" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <Ruler className="h-4 w-4" /> {t("My Fit Profile")}
            </button>

            {user && (user.role === "seller" || user.role === "admin") ? (
              <button
                onClick={() => router.push("/seller")}
                className="flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all bg-gold/15 text-gold hover:bg-gold hover:text-luxury-white"
              >
                <Sparkles className="h-4 w-4 text-gold group-hover:text-inherit" /> {t("Seller Portal")}
              </button>
            ) : (
              <button
                onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "seller" })}
                className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${ui.activeTab === "seller" ? "bg-foreground text-background" : "hover:bg-muted-light"}`}
              >
                <ShoppingBag className="h-4 w-4" /> {t("Become a Seller")}
              </button>
            )}
          </div>

          <div className="lg:col-span-3">
            {ui.activeTab === "profile" && (
              <div className="luxury-card p-6 md:p-8">
                <h2 className="font-serif text-2xl font-bold mb-6">{t("VIP Profile Settings")}</h2>

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
                      {t("Upload Photo")}
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
                        {isDeletingPhoto ? t("Removing...") : t("Remove Photo")}
                      </button>
                    )}
                  </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Username")}</label>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => dispatch({ type: "SET_PROFILE", field: "username", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Email")}</label>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => dispatch({ type: "SET_PROFILE", field: "email", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Profile / Display Name")}</label>
                      <input
                        type="text"
                        value={profile.profileName}
                        onChange={(e) => dispatch({ type: "SET_PROFILE", field: "profileName", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder="Alex Mercer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Phone Number")}</label>
                      <input
                        type="text"
                        value={profile.phone}
                        onChange={(e) => dispatch({ type: "SET_PROFILE", field: "phone", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder="+20 100 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("VIP Portal Notes / Description")}</label>
                    <textarea
                      rows={4}
                      value={profile.description}
                      onChange={(e) => dispatch({ type: "SET_PROFILE", field: "description", value: e.target.value })}
                      className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold"
                      placeholder={t("Add notes about design preferences or customization requests...")}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="w-full sm:w-auto px-8 py-3 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-xs uppercase tracking-widest transition-all mt-2"
                  >
                    {isUpdatingProfile ? t("Saving changes...") : t("Save VIP Profile")}
                  </button>
                </form>
              </div>
            )}

            {ui.activeTab === "orders" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-2xl font-bold mb-2">{t("Your Orders")}</h2>

                {!ordersData?.orders || ordersData.orders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-card-border rounded p-6 text-muted text-sm font-light">
                    {t("No orders have been recorded on this profile yet.")}
                  </div>
                ) : (
                  ordersData.orders.map((order: any) => (
                    <div key={order._id} className="luxury-card p-6 flex flex-col gap-4 border-gold/20 hover:border-gold/40 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-card-border">
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">{t("Order ID")}</span>
                          <span className="font-mono text-xs text-foreground font-semibold">{order._id}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">{t("Order Date")}</span>
                          <span className="text-xs text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">{t("Total Amount")}</span>
                          <span className="text-sm font-bold text-gold">{order.totalPrice.toFixed(2)} {t("EGP")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {order.orderStatus === "pending" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded uppercase tracking-wider"><Clock className="h-3 w-3" /> {t("Pending")}</span>}
                          {order.orderStatus === "processing" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/10 px-2 py-0.5 rounded uppercase tracking-wider"><CheckCircle className="h-3 w-3" /> {t("Processing")}</span>}
                          {order.orderStatus === "cancelled" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-error bg-error/10 px-2 py-0.5 rounded uppercase tracking-wider"><XCircle className="h-3 w-3" /> {t("Cancelled")}</span>}
                          {order.orderStatus === "delivered" && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/15 px-2 py-0.5 rounded uppercase tracking-wider"><CheckCircle className="h-3 w-3" /> {t("Delivered")}</span>}
                        </div>
                      </div>

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
                            <span className="font-semibold">{item.price.toFixed(2)} {t("EGP")}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-4 pt-3 border-t border-card-border mt-1 justify-between items-center">
                        <div className="text-xs text-muted font-light">
                          {t("Payment Status:")} <span className={`font-semibold capitalize ${order.isPaid ? "text-success" : "text-gold"}`}>{order.paymentStatus}</span>
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(order._id)}
                            className="inline-flex h-9 items-center gap-1.5 rounded border border-card-border px-3 text-[10px] font-bold uppercase tracking-wider hover:border-gold hover:text-gold transition-colors"
                          >
                            <FileText className="h-3.5 w-3.5" /> {t("PDF Invoice")}
                          </button>

                          {order.orderStatus === "pending" && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order._id)}
                              className="inline-flex h-9 items-center gap-1.5 rounded border border-error/30 text-error px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-error/10 transition-colors"
                            >
                              <AlertTriangle className="h-3.5 w-3.5" /> {t("Cancel Order")}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {ui.activeTab === "addresses" && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold">{t("Address Book")}</h2>
                  <button
                    onClick={() => dispatch({ type: "SET_SHOW_ADDRESS_FORM", payload: !ui.showAddressForm })}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded bg-foreground text-background hover:bg-gold hover:text-luxury-white px-4 text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <Plus className="h-4 w-4" /> {t("Add Address")}
                  </button>
                </div>

                {ui.showAddressForm && (
                  <form onSubmit={handleAddAddress} className="luxury-card p-6 flex flex-col gap-4 border-gold">
                    <h3 className="font-serif font-bold text-base mb-2">{t("New Delivery Address")}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{t("Full Name")}</label>
                        <input
                          type="text"
                          required
                          value={address.name}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "name", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{t("Phone Number")}</label>
                        <input
                          type="text"
                          required
                          value={address.phone}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "phone", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{t("Street Address")}</label>
                        <input
                          type="text"
                          required
                          value={address.street}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "street", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{t("City")}</label>
                        <select
                          value={address.city}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "city", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                        >
                          <option value="Cairo">{t("Cairo")}</option>
                          <option value="Giza">{t("Giza")}</option>
                          <option value="Alexandria">{t("Alexandria")}</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-grow">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">{t("Postal Code")}</label>
                        <input
                          type="text"
                          value={address.postal}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "postal", value: e.target.value })}
                          className="w-full max-w-xs rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs mt-4">
                        <input
                          type="checkbox"
                          checked={address.isDefault}
                          onChange={(e) => dispatch({ type: "SET_ADDRESS", field: "isDefault", value: e.target.checked })}
                          className="rounded border-card-border text-gold focus:ring-gold"
                        />
                        {t("Set as default address")}
                      </label>
                    </div>

                    <div className="flex gap-3 justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "SET_SHOW_ADDRESS_FORM", payload: false })}
                        className="px-4 py-2 border border-card-border rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        {t("Cancel")}
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingAddr}
                        className="px-5 py-2 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        {t("Save Address")}
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {!addressesData?.addresses || addressesData.addresses.length === 0 ? (
                    <div className="md:col-span-2 text-center py-12 border border-dashed border-card-border rounded text-muted text-sm">
                      {t("Address book is empty. Please add an address to speed up checkout.")}
                    </div>
                  ) : (
                    addressesData.addresses.map((addr: any) => (
                      <div key={addr._id} className={`p-5 rounded border flex flex-col justify-between gap-4 ${addr.isDefault ? "border-gold bg-gold/5" : "border-card-border bg-card-bg"}`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-sm">{addr.fullName}</h4>
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold text-gold uppercase tracking-wider border border-gold px-1.5 py-0.5 rounded">{t("Default")}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted font-light leading-relaxed">
                            {addr.street} <br />
                            {t(addr.city)}, {t("Egypt")} <br />
                            {addr.postalCode && `${t("Postal:")} ${addr.postalCode}`} <br />
                            {t("Phone:")} {addr.phone}
                          </p>
                        </div>

                        <div className="flex justify-between items-center border-t border-card-border/50 pt-3 mt-1">
                          {!addr.isDefault ? (
                            <button
                              onClick={() => handleSetDefaultAddress(addr._id)}
                              className="text-[10px] text-gold hover:underline font-semibold uppercase tracking-wider"
                            >
                              {t("Make Default")}
                            </button>
                          ) : (
                            <span className="text-[10px] text-success font-semibold uppercase tracking-wider">{t("Active")}</span>
                          )}
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-muted hover:text-error p-1 rounded"
                            aria-label={t("Delete address")}
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

            {ui.activeTab === "wishlist" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-2xl font-bold">{t("Your Wishlist")}</h2>

                {!wishlistData?.wishlist || wishlistData.wishlist.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-card-border rounded text-muted text-sm">
                    {t("No items in your wishlist. Start exploring catalog items and click the heart icon to save!")}
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
                            <span className="text-[9px] text-muted tracking-widest uppercase mb-1">{prod.brand || t("Designer")}</span>
                            <h4 className="font-serif font-bold text-sm block line-clamp-1 mb-2 text-foreground">{prod.title}</h4>
                            <div className="text-xs text-gold font-bold mb-4">{prod.price.toFixed(2)} {t("EGP")}</div>
                            
                            <button
                              onClick={() => handleAddWishlistToCart(prod._id)}
                              className="w-full py-2 bg-foreground hover:bg-gold hover:text-luxury-white text-background text-xs font-semibold uppercase tracking-wider rounded transition-all mt-auto"
                            >
                              {t("Add to Bag")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {ui.activeTab === "wallet" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold">{t("Wallet & Loyalty Portal")}</h2>
                  <p className="text-xs text-muted font-light mt-1">{"Monitor credit balances and loyalty redemption logs"}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="luxury-card p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">{t("Available Credit Balance")}</span>
                        <span className="text-3xl font-serif font-bold text-gold mt-1 block">
                          {(user?.walletBalance || 0).toFixed(2)} {t("EGP")}
                        </span>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-full text-gold">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted font-light leading-relaxed">
                      {t("Use credit balance to pay directly at checkout. Credits are accumulated via returns, promotions, and cashbacks.")}
                    </p>
                  </div>

                  <div className="luxury-card p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">{t("Loyalty Reward Points")}</span>
                        <span className="text-3xl font-serif font-bold text-foreground mt-1 block">
                          {user?.loyaltyPoints || 0} <span className="text-xs text-muted font-sans font-medium">{t("pts")}</span>
                        </span>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-full text-gold">
                        <Sparkles className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="text-[10px] text-success font-semibold flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> {t("100 points = 10 EGP Store Credit auto-redemption")}
                    </div>
                  </div>
                </div>

                <div className="luxury-card p-6 border-dashed border-gold/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="max-w-md">
                    <h3 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                      <Gift className="h-4 w-4 text-gold" /> {t("Earn VIP Referral Cash credits")}
                    </h3>
                    <p className="text-xs text-muted mt-1.5 font-light leading-relaxed">
                      {t("Share your unique code. New signups receive 25 reward points. Once they place their first order, your account gets credited with 50 loyalty points plus 10% order cashbacks!")}
                    </p>
                  </div>
                  <button
                    onClick={handleCopyReferral}
                    className="w-full md:w-auto px-6 py-2.5 bg-foreground hover:bg-gold hover:text-luxury-white text-background text-xs font-semibold uppercase tracking-wider rounded transition-all"
                  >
                    {t("Copy invite code")}
                  </button>
                </div>

                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4">{t("Transaction Ledger History")}</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Transaction ID")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Date")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Description")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Credit Ledger")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Status")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {walletTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted font-light">
                              {t("No transactions recorded in your ledger yet.")}
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
                                  {t(tx.status)}
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

            {ui.activeTab === "security2fa" && (
              <div>
                <h2 className="font-serif text-2xl font-bold mb-2">{t("Two-Factor Security (2FA)")}</h2>
                <p className="text-xs text-muted font-light mb-8">{t("Maintain validation policies on your VIP account")}</p>

                {user?.is2FAEnabled ? (
                  <div className="luxury-card p-6 md:p-8 border-gold/20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg">
                    <div className="flex items-center gap-3.5 mb-6 text-success">
                      <CheckCircle className="h-6 w-6" />
                      <h3 className="font-serif text-lg font-bold text-foreground">{t("Two-Factor Authentication Active")}</h3>
                    </div>
                    <p className="text-xs text-muted mb-6 font-light leading-relaxed max-w-xl">
                      {t("Your VIP account is protected with 2FA codes. Every login attempt will prompt you to provide a verification token generated by your authenticator app (such as Google Authenticator or Authy).")}
                    </p>
                    <button
                      onClick={() => handleToggle2FA(false)}
                      disabled={isToggling2FA}
                      className="px-6 py-2.5 bg-error/10 hover:bg-error/20 text-error rounded text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      {isToggling2FA ? t("Processing...") : t("Deactivate 2FA Protection")}
                    </button>
                  </div>
                ) : (
                  <div className="luxury-card p-6 md:p-8">
                    <div className="flex items-center gap-3.5 mb-6 text-gold">
                      <AlertTriangle className="h-6 w-6" />
                      <h3 className="font-serif text-lg font-bold text-foreground">{t("Activate Two-Factor Protection")}</h3>
                    </div>
                    <p className="text-xs text-muted mb-6 font-light leading-relaxed max-w-xl">
                      {t("Prevent unauthorized signins. Once configured, you must supply a 6-digit dynamic token generated on your mobile phone to login.")}
                    </p>

                    {!otp.showQr ? (
                      <button
                        onClick={() => dispatch({ type: "SET_SHOW_QR", payload: true })}
                        className="px-6 py-2.5 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        {t("Start 2FA Configuration")}
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
                            <span className="text-[9px] text-muted uppercase tracking-wider font-semibold">{t("Scan QR or enter key manually")}</span>
                            <div className="font-mono text-sm text-gold font-bold mt-1 bg-background px-3 py-1.5 border border-card-border rounded select-all w-fit">
                              JBSWY3DPEHPK3PXP
                            </div>
                            <p className="text-[10px] text-muted font-light mt-2 leading-relaxed">
                              {t("Install Google Authenticator or Authy on your iOS/Android. Scan this QR code or input the Secret Key manually to synchronize tokens.")}
                            </p>
                          </div>
                        </div>

                        <div className="w-full max-w-sm">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                            {t("Enter dynamic 6-digit OTP code to verify")}
                          </label>
                          <div className="flex gap-3">
                            <input
                              type="text"
                              maxLength={6}
                              value={otp.token}
                              onChange={(e) => dispatch({ type: "SET_OTP_TOKEN", payload: e.target.value.replace(/\D/g, "") })}
                              className="flex-grow rounded border border-card-border bg-background px-4 py-2.5 text-center font-mono text-lg font-bold tracking-widest outline-none focus:border-gold"
                              placeholder="000000"
                            />
                            <button
                              onClick={() => {
                                if (otp.token.length !== 6) {
                                  showToast(t("Please enter a valid 6-digit code"), "error");
                                  return;
                                }
                                handleToggle2FA(true);
                              }}
                              disabled={isToggling2FA}
                              className="px-6 py-2.5 bg-foreground hover:bg-gold hover:text-luxury-white text-background rounded text-xs font-semibold uppercase tracking-wider transition-all"
                            >
                              {isToggling2FA ? t("Validating...") : t("Verify & Enable")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {ui.activeTab === "securitylogs" && (
              <div className="flex flex-col gap-8">
                <div>
                  <h2 className="font-serif text-2xl font-bold">{t("Security & Audit Logs")}</h2>
                  <p className="text-xs text-muted font-light mt-1">{t("Review account audit trails and login details")}</p>
                </div>

                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4 flex items-center gap-2">
                    <Lock className="h-4.5 w-4.5 text-gold" /> {t("Login Sessions History")}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Device / User Agent")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("IP Address")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Timestamp")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logins.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted font-light">
                              {t("No logins recorded.")}
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

                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4 flex items-center gap-2">
                    <History className="h-4.5 w-4.5 text-gold" /> {t("Account Activity Audit Trail")}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Audit Action")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Details")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("IP Address")}</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">{t("Timestamp")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-muted font-light">
                              {t("No security activity recorded.")}
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
                                  {t(act.action)}
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

            {ui.activeTab === "seller" && (
              <div className="luxury-card p-6 md:p-8">
                <h2 className="font-serif text-2xl font-bold mb-2">{t("Seller Onboarding")}</h2>
                <p className="text-xs text-muted font-light mt-1 mb-6">{t("Apply to open a merchant store on Shop Premium and list your custom catalog")}</p>

                {appStatusData?.request?.status === "approved" || user?.role === "seller" ? (
                  <div className="flex flex-col items-center text-center py-6 gap-5">
                    <div className="h-16 w-16 rounded-full bg-success/15 text-success flex items-center justify-center">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-success block mb-1">{t("Store Approved")}</span>
                      <h3 className="font-serif text-xl font-bold mb-2">{t("Your store is live!")}</h3>
                      <p className="text-sm text-muted font-light">{t("Your seller account has been approved. Head to the Seller Portal to manage your store, list products, and track orders.")}</p>
                    </div>
                    <button
                      onClick={() => router.push("/seller")}
                      className="px-8 py-3 bg-gold hover:bg-gold-hover text-luxury-black font-bold rounded text-xs uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" /> {t("Go to Seller Portal")}
                    </button>
                  </div>

                ) : appStatusData?.request?.status === "pending" ? (
                  <div className="p-6 rounded border border-gold/30 bg-gold/5">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-10 w-10 rounded-full bg-gold/15 text-gold flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base">{t("Application Under Review")}</h3>
                        <p className="text-xs text-muted font-light">{t("Our team is reviewing your seller application")}</p>
                      </div>
                      <span className="ml-auto inline-flex font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider bg-gold/20 text-gold">{t("Pending")}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-5 p-4 rounded border border-card-border bg-background/50">
                      <div>
                        <span className="text-muted block">{t("Store Name")}</span>
                        <span className="font-semibold text-foreground">{appStatusData.request.storeName}</span>
                      </div>
                      <div>
                        <span className="text-muted block">{t("Phone")}</span>
                        <span className="font-semibold text-foreground">{appStatusData.request.storePhone}</span>
                      </div>
                      <div>
                        <span className="text-muted block">{t("Submitted")}</span>
                        <span className="font-semibold text-foreground">{new Date(appStatusData.request.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="md:col-span-3">
                        <span className="text-muted block">{t("Description")}</span>
                        <span className="text-foreground leading-relaxed">{appStatusData.request.storeDescription}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {[
                        { label: t("Applied"), done: true },
                        { label: t("Under Review"), done: false, active: true },
                        { label: t("Decision"), done: false },
                        { label: t("Launch"), done: false },
                      ].map((step, i) => (
                        <React.Fragment key={i}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              step.done ? "bg-success text-white" : step.active ? "bg-gold text-luxury-black animate-pulse" : "bg-card-border text-muted"
                            }`}>
                              {step.done ? "✓" : i + 1}
                            </div>
                            <span className="text-[8px] text-muted uppercase tracking-wider whitespace-nowrap">{step.label}</span>
                          </div>
                          {i < 3 && <div className="h-px flex-1 bg-card-border" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                ) : appStatusData?.request?.status === "rejected" ? (
                  <div className="flex flex-col gap-5">
                    <div className="p-4 rounded border border-error/30 bg-error/5 flex items-start gap-3">
                      <XCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-sm text-error mb-1">{t("Application Not Approved")}</h3>
                        {appStatusData.request.adminNotes ? (
                          <p className="text-xs text-muted leading-relaxed">
                            <span className="font-semibold text-error/80">{t("Admin feedback: ")}</span>
                            {appStatusData.request.adminNotes}
                          </p>
                        ) : (
                          <p className="text-xs text-muted">{t("Your application did not meet our requirements at this time. You may resubmit below.")}</p>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-card-border pt-5">
                      <h3 className="font-serif font-bold text-base mb-4">{t("Resubmit Your Application")}</h3>
                      <form onSubmit={handleApplySeller} className="flex flex-col gap-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Store / Brand Name")}</label>
                            <input type="text" required value={seller.name} onChange={(e) => dispatch({ type: "SET_SELLER", field: "name", value: e.target.value })}
                              className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold font-bold"
                              placeholder={t("e.g. Damascus Goldsmiths")} />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Business Phone Number")}</label>
                            <input type="text" required value={seller.phone} onChange={(e) => dispatch({ type: "SET_SELLER", field: "phone", value: e.target.value })}
                              className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                              placeholder={t("e.g. +20 123 456 7890")} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Store / Pickup Address")}</label>
                          <input type="text" required value={seller.address} onChange={(e) => dispatch({ type: "SET_SELLER", field: "address", value: e.target.value })}
                            className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                            placeholder={t("e.g. 15 Zamalek St, Cairo, Egypt")} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Brand Story & Description")}</label>
                          <textarea rows={4} required value={seller.description} onChange={(e) => dispatch({ type: "SET_SELLER", field: "description", value: e.target.value })}
                            className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold leading-relaxed resize-none"
                            placeholder={t("Describe the craft details, heritage, and products you intend to list...")} />
                        </div>
                        <button type="submit" disabled={isApplyingSeller}
                          className="w-full sm:w-auto px-8 py-3 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-xs uppercase tracking-widest transition-all mt-2 disabled:opacity-50">
                          {isApplyingSeller ? t("Submitting...") : t("Resubmit Application")}
                        </button>
                      </form>
                    </div>
                  </div>

                ) : (
                  <form onSubmit={handleApplySeller} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Store / Brand Name")}</label>
                        <input type="text" required value={seller.name} onChange={(e) => dispatch({ type: "SET_SELLER", field: "name", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold font-bold"
                          placeholder={t("e.g. Damascus Goldsmiths")} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Business Phone Number")}</label>
                        <input type="text" required value={seller.phone} onChange={(e) => dispatch({ type: "SET_SELLER", field: "phone", value: e.target.value })}
                          className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                          placeholder={t("e.g. +20 123 456 7890")} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Store / Pickup Address")}</label>
                      <input type="text" required value={seller.address} onChange={(e) => dispatch({ type: "SET_SELLER", field: "address", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                        placeholder={t("e.g. 15 Zamalek St, Cairo, Egypt")} />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">{t("Brand Story & Description")}</label>
                      <textarea rows={4} required value={seller.description} onChange={(e) => dispatch({ type: "SET_SELLER", field: "description", value: e.target.value })}
                        className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold leading-relaxed resize-none"
                        placeholder={t("Describe the craft details, heritage, and products you intend to list...")} />
                    </div>

                    <button type="submit" disabled={isApplyingSeller}
                      className="w-full sm:w-auto px-8 py-3 bg-foreground hover:bg-gold hover:text-luxury-white text-background font-semibold rounded text-xs uppercase tracking-widest transition-all mt-2 disabled:opacity-50">
                      {isApplyingSeller ? t("Submitting Application...") : t("Submit Seller Onboarding")}
                    </button>
                  </form>
                )}
              </div>
            )}

            {ui.activeTab === "fitprofile" && (
              <div className="flex flex-col gap-8">
                <div>
                  <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5">
                    <Ruler className="h-3.5 w-3.5" /> {t("Smart Fit Technology")}
                  </span>
                  <h2 className="font-serif text-2xl font-bold">{t("My Fit Profile")}</h2>
                  <p className="text-xs text-muted mt-1 font-light">
                    {t("Your saved body measurements used to recommend sizes across the store.")}
                  </p>
                </div>

                {user?.sizeProfile?.clothing || user?.sizeProfile?.shoes ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                    {user.sizeProfile?.clothing && (
                      <div className="luxury-card overflow-hidden">
                        <div className="h-1 gold-gradient" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                              <Shirt className="h-4.5 w-4.5 text-gold" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{t("Clothing Profile")}</p>
                              <p className="text-[10px] text-muted">{t("Apparel & outerwear")}</p>
                            </div>
                          </div>

                          <div className="text-center py-5 border-y border-card-border mb-5">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-muted mb-1">{t("Your Calibrated Size")}</p>
                            <p className="font-serif text-5xl font-bold text-gold">
                              {user.sizeProfile.clothing.calculatedSize}
                            </p>
                          </div>

                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-muted">{t("Height")}</span>
                              <span className="font-semibold text-xs">{user.sizeProfile.clothing.height} {t("cm")}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-muted">{t("Weight")}</span>
                              <span className="font-semibold text-xs">{user.sizeProfile.clothing.weight} {t("kg")}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-muted">{t("Fit")}</span>
                              <span className="font-semibold text-xs capitalize">{t(user.sizeProfile.clothing.preference)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {user.sizeProfile?.shoes && (
                      <div className="luxury-card overflow-hidden">
                        <div className="h-1 gold-gradient" />
                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-5">
                            <div className="h-9 w-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                              <Footprints className="h-4.5 w-4.5 text-gold" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm">{t("Footwear Profile")}</p>
                              <p className="text-[10px] text-muted">{t("EU sizing standard")}</p>
                            </div>
                          </div>

                          <div className="text-center py-5 border-y border-card-border mb-5">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-muted mb-1">{t("Your EU Shoe Size")}</p>
                            <p className="font-serif text-5xl font-bold text-gold">
                              {t("EU")} {user.sizeProfile.shoes.calculatedSizeEU}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 gap-3 text-center">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-muted">{t("Foot Length")}</span>
                              <span className="font-semibold text-xs">{user.sizeProfile.shoes.footLengthCM} {t("cm")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!user.sizeProfile?.clothing && user.sizeProfile?.shoes && (
                      <div className="luxury-card p-6 flex flex-col items-center justify-center gap-4 text-center border-dashed">
                        <Shirt className="h-8 w-8 text-muted/40" />
                        <p className="text-xs text-muted font-light">{t("No clothing profile calibrated yet.")}</p>
                        <Link
                          href="/size-guide"
                          className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline"
                        >
                          {t("Add Clothing Profile →")}
                        </Link>
                      </div>
                    )}

                    {!user.sizeProfile?.shoes && user.sizeProfile?.clothing && (
                      <div className="luxury-card p-6 flex flex-col items-center justify-center gap-4 text-center border-dashed">
                        <Footprints className="h-8 w-8 text-muted/40" />
                        <p className="text-xs text-muted font-light">{t("No footwear profile calibrated yet.")}</p>
                        <Link
                          href="/size-guide"
                          className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline"
                        >
                          {t("Add Shoe Profile →")}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="luxury-card p-12 flex flex-col items-center gap-6 text-center">
                    <div className="h-20 w-20 rounded-full bg-muted-light border border-card-border flex items-center justify-center">
                      <Ruler className="h-8 w-8 text-muted/50" />
                    </div>
                    <div className="max-w-sm">
                      <p className="font-serif text-lg font-semibold mb-2">{t("No Fit Profile Yet")}</p>
                      <p className="text-sm text-muted font-light leading-relaxed">
                        {t("You haven't calibrated your digital fit profile yet. Let our precision algorithm determine your ideal sizes in under a minute.")}
                      </p>
                    </div>
                    <Link
                      id="calibrate-now-btn"
                      href="/size-guide"
                      className="flex items-center gap-2.5 h-12 px-8 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5"
                    >
                      <Sparkles className="h-4 w-4" /> {t("Calibrate Now")}
                    </Link>
                  </div>
                )}

                {(user?.sizeProfile?.clothing || user?.sizeProfile?.shoes) && (
                  <div className="flex items-center justify-between luxury-card p-5">
                    <div>
                      <p className="font-semibold text-sm">{t("Update your measurements")}</p>
                      <p className="text-xs text-muted font-light mt-0.5">
                        {t("Re-calibrate anytime if your body measurements change.")}
                      </p>
                    </div>
                    <Link
                      href="/size-guide"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-all text-xs font-semibold uppercase tracking-widest shrink-0"
                    >
                      <Pencil className="h-3.5 w-3.5" /> {t("Edit Profile")}
                    </Link>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}