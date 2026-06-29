"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Link from "next/link"
import Footer from "../components/Footer";
import { useAppSelector } from "../../lib/store";
import {
  useGetAdminDashboardQuery,
  useGetAdminSalesQuery,
  useGetAdminInventoryQuery,
  useAdjustProductInventoryMutation,
  useGetFunnelAnalyticsQuery,
  useGetCohortAnalyticsQuery,
  useGetPendingReviewsQuery,
  useModerateReviewMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useGetAllUsersQuery,
  useUpdateUserRoleMutation,
  useGetSellerRequestsAdminQuery,
  useModerateSellerRequestAdminMutation,
  useGetAdminArticlesQuery,
  useCreateArticleMutation,
  useDeleteArticleMutation,
  useGetPendingArticlesQuery,
  useModerateArticleMutation,
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
  useGetAdminProductsQuery,
  useToggleAdminProductStatusMutation,
  useGetMediaAssetsQuery,
  useDeleteMediaAssetMutation,
  useUploadImageMutation,
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
} from "../../lib/api";
import { useToast } from "../components/Toast";
import {
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  DollarSign,
  ShoppingBag,
  Users,
  Star,
  Activity,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  Edit,
  Tag,
  Plus,
  Trash2,
  Lock,
  UserCheck,
  Upload,
  BookOpen,
  Image as ImageIcon,
  Copy,
  ListOrdered,
  Settings2,
  Eye,
  EyeOff,
  Globe
} from "lucide-react";

// Recharts components dynamically rendered to prevent SSR issues
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);
  const { showToast } = useToast();

  // Security Check: Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  // Track page hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Admin Active Tab: "analytics" | "inventory" | "reviews" | "coupons" | "roles" | "cms" | "seller-requests" | "orders" | "products" | "settings"
  const [activeTab, setActiveTab] = useState<"analytics" | "inventory" | "reviews" | "coupons" | "roles" | "cms" | "seller-requests" | "orders" | "products" | "settings" | "Testimonials">("analytics");

  // Order Management state
  const [ordersTabFilter, setOrdersTabFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderTrackingNumber, setOrderTrackingNumber] = useState<string>("");

  // Product Catalog Management state
  const [productsSearch, setProductsSearch] = useState<string>("");

  // System Customization Settings state
  const [settingsMaintenance, setSettingsMaintenance] = useState<boolean>(false);
  const [settingsCommission, setSettingsCommission] = useState<number>(10);
  const [settingsShippingFee, setSettingsShippingFee] = useState<number>(50);
  const [settingsTaxRate, setSettingsTaxRate] = useState<number>(14);
  const [settingsBanner, setSettingsBanner] = useState<string>("");

  // Inventory adjustment state
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustAction, setAdjustAction] = useState<"add" | "set">("add");
  const [adjustNote, setAdjustNote] = useState("");

  // Coupon Creation states
  const [couponCode, setCouponCode] = useState("");
  const [couponType, setCouponType] = useState<"percentage" | "fixed">("percentage");
  const [couponValue, setCouponValue] = useState(0);
  const [minOrder, setMinOrder] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState(0);
  const [showCouponForm, setShowCouponForm] = useState(false);

  // Article Moderation states
  const [moderatingArticle, setModeratingArticle] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // Seller Request Moderation states
  const [showSellerRejectionModal, setShowSellerRejectionModal] = useState(false);
  const [rejectingSellerRequestId, setRejectingSellerRequestId] = useState<string | null>(null);
  const [sellerRejectionNotes, setSellerRejectionNotes] = useState("");

  // CMS Blog state
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSubtitle, setBlogSubtitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogCategory, setBlogCategory] = useState("Lifestyle");
  const [blogImage, setBlogImage] = useState<File | null>(null);

  // Media gallery list
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // RTK Queries
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetAdminDashboardQuery(undefined, { skip: user?.role !== "admin" });
  const { data: salesData } = useGetAdminSalesQuery(undefined, { skip: user?.role !== "admin" });
  const { data: inventoryData, refetch: refetchInventory } = useGetAdminInventoryQuery(undefined, { skip: user?.role !== "admin" });
  const { data: funnelData } = useGetFunnelAnalyticsQuery(undefined, { skip: user?.role !== "admin" });
  const { data: cohortData } = useGetCohortAnalyticsQuery(undefined, { skip: user?.role !== "admin" });
  const { data: pendingReviewsData, refetch: refetchReviews } = useGetPendingReviewsQuery(undefined, { skip: user?.role !== "admin" });
  
  const { data: couponsData, refetch: refetchCoupons } = useGetCouponsQuery(undefined, { skip: user?.role !== "admin" });
  const { data: usersData, refetch: refetchUsers } = useGetAllUsersQuery(undefined, { skip: user?.role !== "admin" });
  const { data: sellerRequestsData, refetch: refetchRequests } = useGetSellerRequestsAdminQuery(undefined, { skip: user?.role !== "admin" });
  const { data: articlesData, refetch: refetchArticles } = useGetAdminArticlesQuery(undefined, { skip: user?.role !== "admin" });
  const { data: pendingArticles, refetch: refetchPendingArticles } = useGetPendingArticlesQuery(undefined, { skip: user?.role !== "admin" });

  const { data: adminOrdersData, refetch: refetchOrders } = useGetAdminOrdersQuery({ status: ordersTabFilter }, { skip: user?.role !== "admin" });
  const { data: adminProductsData, refetch: refetchProducts } = useGetAdminProductsQuery({ search: productsSearch }, { skip: user?.role !== "admin" });
  const { data: systemSettingsData, refetch: refetchSettings } = useGetSystemSettingsQuery(undefined, { skip: user?.role !== "admin" });
  const { data: mediaAssetsData, refetch: refetchMediaAssets } = useGetMediaAssetsQuery(undefined, { skip: user?.role !== "admin" });

  // Mutations
  const [adjustInventory, { isLoading: isAdjusting }] = useAdjustProductInventoryMutation();
  const [moderateReview] = useModerateReviewMutation();
  const [createCoupon] = useCreateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [updateUserRole] = useUpdateUserRoleMutation();
  const [moderateSellerRequest] = useModerateSellerRequestAdminMutation();
  const [createArticle, { isLoading: isCreatingArticle }] = useCreateArticleMutation();
  const [deleteArticle] = useDeleteArticleMutation();
  const [moderateArticle] = useModerateArticleMutation();

  const [updateOrderStatus, { isLoading: isUpdatingOrder }] = useUpdateAdminOrderStatusMutation();
  const [toggleProductStatus] = useToggleAdminProductStatusMutation();
  const [updateSystemSettings, { isLoading: isUpdatingSettings }] = useUpdateSystemSettingsMutation();
  const [deleteMediaAsset] = useDeleteMediaAssetMutation();
  const [uploadImage] = useUploadImageMutation();

  const handleAdjustInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      await adjustInventory({
        productId: selectedProduct._id,
        adjustData: {
          quantity: adjustQty,
          action: adjustAction,
          note: adjustNote || `Manual inventory override by admin`,
        },
      }).unwrap();
      showToast("Inventory adjusted successfully!", "success");
      setSelectedProduct(null);
      setAdjustQty(0);
      setAdjustNote("");
      refetchInventory();
      refetchDashboard();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to adjust inventory.", "error");
    }
  };

  const handleModerateReview = async (reviewId: string, approve: boolean) => {
    try {
      await moderateReview({
        reviewId,
        moderateData: { isApproved: approve },
      }).unwrap();
      showToast(approve ? "Review approved and published!" : "Review rejected and hidden!", "success");
      refetchReviews();
    } catch (err: any) {
      showToast(err.data?.message || "Moderation action failed.", "error");
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon({
        code: couponCode.toUpperCase(),
        type: couponType,
        value: couponValue,
        minOrderAmount: minOrder,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        usageLimit: usageLimit > 0 ? usageLimit : null,
      }).unwrap();
      showToast("Promo Coupon created successfully!", "success");
      setCouponCode("");
      setCouponValue(0);
      setMinOrder(0);
      setUsageLimit(0);
      setShowCouponForm(false);
      refetchCoupons();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to create coupon.", "error");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (confirm("Are you sure you want to permanently delete this coupon code?")) {
      try {
        await deleteCoupon(couponId).unwrap();
        showToast("Coupon code deleted.", "success");
        refetchCoupons();
      } catch (err: any) {
        showToast("Failed to delete coupon.", "error");
      }
    }
  };

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      await updateUserRole({ id: userId, role: targetRole }).unwrap();
      showToast("Staff user role updated successfully!", "success");
      refetchUsers();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update user role.", "error");
    }
  };

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      showToast("Title and content are required.", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", blogTitle);
      formData.append("subtitle", blogSubtitle);
      formData.append("content", blogContent);
      formData.append("category", blogCategory);
      formData.append("isPublished", "true");
      if (blogImage) {
        formData.append("image", blogImage);
      }

      await createArticle(formData).unwrap();
      showToast(`Blog post "${blogTitle}" published successfully!`, "success");
      setBlogTitle("");
      setBlogSubtitle("");
      setBlogContent("");
      setBlogImage(null);
      refetchArticles();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to publish article", "error");
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this article?")) {
      try {
        await deleteArticle(id).unwrap();
        showToast("Article deleted successfully", "success");
        refetchArticles();
      } catch (err) {
        showToast("Failed to delete article", "error");
      }
    }
  };

  const handleApproveArticle = async (id: string) => {
    try {
      await moderateArticle({ id, status: "approved" }).unwrap();
      showToast("Article approved and published successfully!", "success");
      refetchPendingArticles();
      refetchArticles();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to approve article", "error");
    }
  };

  const handleRejectPrompt = (art: any) => {
    setModeratingArticle(art);
    setRejectionReason("");
    setShowRejectionModal(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast("Rejection reason is required.", "error");
      return;
    }
    try {
      await moderateArticle({
        id: moderatingArticle._id,
        status: "rejected",
        rejectionReason: rejectionReason
      }).unwrap();
      showToast("Article rejected successfully", "success");
      setRejectionReason("");
      setModeratingArticle(null);
      setShowRejectionModal(false);
      refetchPendingArticles();
      refetchArticles();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to reject article", "error");
    }
  };

  const handleModerateSellerRequest = async (id: string, status: "approved" | "rejected") => {
    if (status === "rejected") {
      // Open our styled modal instead of the ugly native prompt()
      setRejectingSellerRequestId(id);
      setSellerRejectionNotes("");
      setShowSellerRejectionModal(true);
      return;
    }

    try {
      await moderateSellerRequest({ id, status, adminNotes: "" }).unwrap();
      showToast(`Seller application approved successfully.`, "success");
      refetchRequests();
    } catch (err) {
      showToast("Failed to moderate seller request.", "error");
    }
  };

  const handleSellerRejectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSellerRequestId) return;
    try {
      await moderateSellerRequest({
        id: rejectingSellerRequestId,
        status: "rejected",
        adminNotes: sellerRejectionNotes,
      }).unwrap();
      showToast("Seller application rejected.", "success");
      setShowSellerRejectionModal(false);
      setRejectingSellerRequestId(null);
      setSellerRejectionNotes("");
      refetchRequests();
    } catch (err) {
      showToast("Failed to reject seller application.", "error");
    }
  };

  // Synchronize system settings state
  useEffect(() => {
    if (systemSettingsData?.settings) {
      setSettingsMaintenance(!!systemSettingsData.settings.maintenanceMode);
      setSettingsCommission(systemSettingsData.settings.commissionRate ?? 10);
      setSettingsShippingFee(systemSettingsData.settings.shippingFee ?? 50);
      setSettingsTaxRate(systemSettingsData.settings.taxRate ?? 14);
      setSettingsBanner(systemSettingsData.settings.announcementBanner ?? "");
    }
  }, [systemSettingsData]);

  const handleUpdateOrderStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await updateOrderStatus({
        id: selectedOrder._id,
        orderStatus: selectedOrder.orderStatus,
        trackingNumber: orderTrackingNumber,
      }).unwrap();
      showToast("Order status updated successfully!", "success");
      setSelectedOrder(null);
      setOrderTrackingNumber("");
      refetchOrders();
      refetchDashboard();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update order status.", "error");
    }
  };

  const handleToggleProductFeatured = async (productId: string) => {
    try {
      await toggleProductStatus({ id: productId, action: "toggleFeatured" }).unwrap();
      showToast("Product featured status toggled!", "success");
      refetchProducts();
    } catch (err) {
      showToast("Failed to toggle product status.", "error");
    }
  };

  const handleToggleProductDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product from the platform catalog?")) {
      try {
        await toggleProductStatus({ id: productId, action: "toggleDelete" }).unwrap();
        showToast("Product deleted successfully!", "success");
        refetchProducts();
        refetchDashboard();
      } catch (err) {
        showToast("Failed to delete product.", "error");
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSystemSettings({
        maintenanceMode: settingsMaintenance,
        commissionRate: settingsCommission,
        shippingFee: settingsShippingFee,
        taxRate: settingsTaxRate,
        announcementBanner: settingsBanner,
      }).unwrap();
      showToast("System settings updated successfully!", "success");
      refetchSettings();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update settings.", "error");
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingMedia(true);
    setUploadProgress(30);
    try {
      const formData = new FormData();
      formData.append("image", file);
      setUploadProgress(70);
      await uploadImage(formData).unwrap();
      setUploadProgress(100);
      showToast("Asset uploaded to media storage!", "success");
      refetchMediaAssets();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to upload asset.", "error");
    } finally {
      setIsUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this asset from storage?")) {
      try {
        await deleteMediaAsset(id).unwrap();
        showToast("Asset deleted from storage.", "success");
        refetchMediaAssets();
      } catch (err) {
        showToast("Failed to delete asset.", "error");
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showToast("URL copied to clipboard!", "success");
  };

  if (user?.role !== "admin" || !mounted) {
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

  const chartSales = salesData?.salesOverTime && salesData.salesOverTime.length > 0
    ? salesData.salesOverTime.map((item: any) => ({ date: item.date, sales: item.amount }))
    : [];

  const stageLabels: Record<string, string> = {
    "product_view": "Product Views",
    "add_to_cart": "Cart Additions",
    "checkout_shipping": "Shipping Selection",
    "checkout_payment": "Payment Details",
    "purchase": "Order Paid"
  };

  const funnelStages = funnelData?.funnel && funnelData.funnel.length > 0
    ? funnelData.funnel.map((item: any) => ({
        stage: stageLabels[item.stage] || item.stage,
        count: item.count
      }))
    : [];

  const cohorts = cohortData?.cohorts && cohortData.cohorts.length > 0
    ? cohortData.cohorts.map((item: any) => ({
        cohort: item.cohortMonth,
        size: item.cohortSize,
        w1: 100,
        w2: item.retention?.[1]?.retentionRate ?? 0,
        w3: item.retention?.[2]?.retentionRate ?? 0,
        w4: item.retention?.[3]?.retentionRate ?? 0,
      }))
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        {/* Page Title */}
        <div className="mb-12 flex justify-between items-center flex-col md:flex-row gap-6 border-b border-card-border pb-6">
          <div>
            <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-gold" /> Admin Console
            </span>
            <h1 className="font-serif text-3xl font-bold mt-1">Management Portal</h1>
            <p className="text-xs text-muted mt-1 font-light">Monitor transactions, adjust catalogs, configure promotions, and moderate reviews</p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "analytics" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Analytics
            </button>
            <button
              onClick={() => {
                setActiveTab("orders");
                refetchOrders();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "orders" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Orders
            </button>
            <button
              onClick={() => {
                setActiveTab("products");
                refetchProducts();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "products" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Products
            </button>
            <button
              onClick={() => {
                setActiveTab("inventory");
                refetchInventory();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "inventory" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Inventory
            </button>
            <button
              onClick={() => {
                setActiveTab("reviews");
                refetchReviews();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "reviews" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Reviews
              {pendingReviewsData?.reviews && pendingReviewsData.reviews.length > 0 && (
                <span className="ml-1.5 bg-gold text-luxury-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">
                  {pendingReviewsData.reviews.length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("coupons");
                refetchCoupons();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "coupons" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Coupons
            </button>
            <button
              onClick={() => {
                setActiveTab("roles");
                refetchUsers();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "roles" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Staff Roles
            </button>
            <button
              onClick={() => {
                setActiveTab("seller-requests");
                refetchRequests();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "seller-requests" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Seller Requests
              {sellerRequestsData?.requests && sellerRequestsData.requests.filter((r: any) => r.status === "pending").length > 0 && (
                <span className="ml-1.5 bg-gold text-luxury-white rounded-full text-[9px] px-1.5 py-0.5 font-bold">
                  {sellerRequestsData.requests.filter((r: any) => r.status === "pending").length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("cms");
                refetchArticles();
                refetchMediaAssets();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "cms" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              CMS Blog
            </button>
            <button
              onClick={() => {
                setActiveTab("settings");
                refetchSettings();
              }}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all ${activeTab === "settings" ? "bg-foreground text-background" : "border-card-border hover:border-gold"}`}
            >
              Settings
            </button>
            <Link
              href={"/admin/testimonials"}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded border transition-all border-card-border hover:border-gold`}
            >
              Testimonials
            </Link>
          </div>
        </div>

        {/* TAB 1: ANALYTICS DASHBOARD */}
        {activeTab === "analytics" && (
          <div className="flex flex-col gap-10">
            
            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="luxury-card p-5 flex items-center gap-4">
                <div className="rounded bg-gold/10 p-3.5 text-gold">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Gross Revenue</span>
                  <span className="text-lg font-bold text-foreground">
                    {dashboardData?.analytics?.totalRevenue?.toFixed(2) || "420,500.00"} EGP
                  </span>
                </div>
              </div>

              <div className="luxury-card p-5 flex items-center gap-4">
                <div className="rounded bg-gold/10 p-3.5 text-gold">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Total Orders</span>
                  <span className="text-lg font-bold text-foreground">
                    {dashboardData?.analytics?.totalOrders || "245"}
                  </span>
                </div>
              </div>

              <div className="luxury-card p-5 flex items-center gap-4">
                <div className="rounded bg-gold/10 p-3.5 text-gold">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Conversion Rate</span>
                  <span className="text-lg font-bold text-foreground">
                    {dashboardData?.analytics?.conversionRate?.toFixed(2) || "5.45"}%
                  </span>
                </div>
              </div>

              <div className="luxury-card p-5 flex items-center gap-4">
                <div className="rounded bg-gold/10 p-3.5 text-gold">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Loyal Users</span>
                  <span className="text-lg font-bold text-foreground">
                    {dashboardData?.analytics?.totalUsers || "120"}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales Chart & Funnel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Sales Chart */}
              <div className="lg:col-span-2 luxury-card p-6 min-h-[350px]">
                <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gold" /> Sales Velocity (EGP)
                </h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c5a880" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#c5a880" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                      <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#1b1b1b", border: "1px solid #333", borderRadius: 4 }} labelClassName="text-gold font-bold" />
                      <Area type="monotone" dataKey="sales" stroke="#c5a880" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="luxury-card p-6">
                <h3 className="font-serif font-bold text-lg mb-6">Faceted Funnel Dropoffs</h3>
                <div className="flex flex-col gap-4">
                  {funnelStages.map((stage: any, idx: number) => {
                    const maxCount = funnelStages[0].count;
                    const percentage = Math.round((stage.count / maxCount) * 100);
                    return (
                      <div key={idx} className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">{stage.stage}</span>
                          <span className="text-muted">{stage.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-card-border h-2 rounded overflow-hidden">
                          <div className="bg-gold h-full rounded transition-all duration-500" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cohort Heatmap */}
            <div className="luxury-card p-6">
              <h3 className="font-serif font-bold text-lg mb-6">VIP Repeat Purchase Cohorts (Retention %)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Cohort Month</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Members</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Wk 1</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Wk 2</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Wk 3</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Wk 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((cohort: any, idx: number) => (
                      <tr key={idx} className="border-b border-card-border/50">
                        <td className="py-4 px-4 font-semibold text-foreground">{cohort.cohort}</td>
                        <td className="py-4 px-4 text-muted">{cohort.size} VIPs</td>
                        <td className="py-4 px-4 bg-gold/30 text-center font-bold text-gold">100%</td>
                        <td className="py-4 px-4 text-center" style={{ backgroundColor: `rgba(197, 168, 128, ${cohort.w2 / 100})` }}>{cohort.w2}%</td>
                        <td className="py-4 px-4 text-center" style={{ backgroundColor: `rgba(197, 168, 128, ${cohort.w3 / 100})` }}>{cohort.w3}%</td>
                        <td className="py-4 px-4 text-center" style={{ backgroundColor: `rgba(197, 168, 128, ${cohort.w4 / 100})` }}>{cohort.w4}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: INVENTORY LOGS & STOCK ADJUSTER */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Inventory adjustments form */}
            <div className="lg:col-span-1">
              <div className="luxury-card p-6 sticky top-24 border-gold/20">
                <h3 className="font-serif font-bold text-lg mb-4">Stock Override</h3>
                
                {selectedProduct ? (
                  <form onSubmit={handleAdjustInventory} className="flex flex-col gap-4">
                    <div>
                      <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Selected Product</span>
                      <h4 className="font-serif font-bold text-sm text-gold truncate mt-0.5">{selectedProduct.title}</h4>
                      <span className="text-xs text-muted font-light mt-0.5 block">Current Stock: <strong>{selectedProduct.stock}</strong> units</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Adjustment Action</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAdjustAction("add")}
                          className={`py-2 text-xs font-semibold uppercase tracking-wider rounded border ${adjustAction === "add" ? "border-gold bg-gold/10 text-gold" : "border-card-border"}`}
                        >
                          Add quantity
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustAction("set")}
                          className={`py-2 text-xs font-semibold uppercase tracking-wider rounded border ${adjustAction === "set" ? "border-gold bg-gold/10 text-gold" : "border-card-border"}`}
                        >
                          Set stock
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Quantity</label>
                      <input
                        type="number"
                        required
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        placeholder="E.g. 10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Adjustment Reason Log</label>
                      <input
                        type="text"
                        required
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        placeholder="Shipment delivery arrival"
                      />
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(null)}
                        className="w-1/2 h-10 border border-card-border rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAdjusting}
                        className="w-1/2 h-10 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider"
                      >
                        {isAdjusting ? "Updating..." : "Commit Change"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-12 text-xs text-muted font-light flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-gold/30" />
                    <span>Select a product from the list to update warehouse allocation stock.</span>
                  </div>
                )}
              </div>
            </div>

            {/* List of warehouse product allocations */}
            <div className="lg:col-span-2 luxury-card p-6">
              <h3 className="font-serif font-bold text-lg mb-6">Warehouse Stock Allocation</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Product details</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Price</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Sold</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Stock Status</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!inventoryData?.inventory || inventoryData.inventory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted font-light">No products registered.</td>
                      </tr>
                    ) : (
                      inventoryData.inventory.map((prod: any) => (
                        <tr key={prod._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                          <td className="py-4 px-4 font-medium">
                            <span className="block text-foreground truncate max-w-[150px]">{prod.title}</span>
                            <span className="text-[9px] font-mono text-muted block mt-0.5">{prod._id}</span>
                          </td>
                          <td className="py-4 px-4 text-gold font-semibold">{prod.price.toFixed(2)} EGP</td>
                          <td className="py-4 px-4 text-muted">{prod.sold || 0} sold</td>
                          <td className="py-4 px-4">
                            {prod.stock <= 5 ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-error bg-error/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                Low Stock ({prod.stock})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-success bg-success/10 px-2 py-0.5 rounded uppercase tracking-wider">
                                Adequate ({prod.stock})
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => setSelectedProduct(prod)}
                              className="p-1 text-gold hover:text-gold-hover transition-colors rounded hover:bg-gold/10"
                              title="Adjust Stock"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
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

        {/* TAB 3: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="luxury-card p-6">
            <h3 className="font-serif font-bold text-lg mb-6">Pending Reviews Moderation</h3>
            
            <div className="flex flex-col gap-6">
              {!pendingReviewsData?.reviews || pendingReviewsData.reviews.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-card-border rounded text-muted text-sm font-light">
                  No reviews are currently flagged for moderation approval.
                </div>
              ) : (
                pendingReviewsData.reviews.map((rev: any) => (
                  <div key={rev._id} className="p-5 border border-card-border rounded bg-card-bg flex flex-col sm:flex-row justify-between gap-6 items-start sm:items-center">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <span className="font-semibold text-sm">{rev.user?.username || "VIP Reviewer"}</span>
                        <span className="text-[10px] text-muted">({rev.user?.email})</span>
                        <ChevronRight className="h-3.5 w-3.5 text-card-border" />
                        <span className="font-serif font-bold text-sm text-gold">{rev.product?.title || "Product details"}</span>
                      </div>

                      <div className="flex gap-1.5 mb-2.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < rev.rating ? "fill-gold text-gold" : "text-card-border"}`} />
                        ))}
                      </div>

                      <p className="text-xs text-muted font-light leading-relaxed max-w-xl">{rev.comment}</p>
                    </div>

                    <div className="flex gap-3.5 flex-shrink-0 w-full sm:w-auto border-t sm:border-none border-card-border pt-4 sm:pt-0">
                      <button
                        onClick={() => handleModerateReview(rev._id, false)}
                        className="w-1/2 sm:w-auto px-4 py-2 border border-error text-error hover:bg-error/10 font-semibold rounded text-[10px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleModerateReview(rev._id, true)}
                        className="w-1/2 sm:w-auto px-4 py-2 bg-gold text-luxury-white hover:bg-gold-hover font-semibold rounded text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="h-4 w-4" /> Approve
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MARKETING COUPONS */}
        {activeTab === "coupons" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Create Coupon Form */}
            <div className="lg:col-span-1">
              <div className="luxury-card p-6 sticky top-24 border-gold/20">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                    <Tag className="h-5 w-5 text-gold" /> Create Promo
                  </h3>
                  <button
                    onClick={() => setShowCouponForm(!showCouponForm)}
                    className="p-1 hover:bg-gold/10 text-gold rounded"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                {showCouponForm ? (
                  <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Coupon Code</label>
                      <input
                        type="text"
                        required
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-mono font-bold tracking-wider"
                        placeholder="E.g. VIP25"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Type</label>
                        <select
                          value={couponType}
                          onChange={(e: any) => setCouponType(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (EGP)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Value</label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={couponValue}
                          onChange={(e) => setCouponValue(parseFloat(e.target.value) || 0)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                          placeholder="E.g. 15"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Min Order (EGP)</label>
                        <input
                          type="number"
                          value={minOrder}
                          onChange={(e) => setMinOrder(parseFloat(e.target.value) || 0)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Usage Limit</label>
                        <input
                          type="number"
                          value={usageLimit}
                          onChange={(e) => setUsageLimit(parseInt(e.target.value) || 0)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                          placeholder="Unlimited"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Start Date</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">End Date</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full h-10 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider transition-all mt-2"
                    >
                      Save Coupon Code
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-12 text-xs text-muted font-light flex flex-col items-center gap-2">
                    <Tag className="h-8 w-8 text-gold/30" />
                    <span>Click the plus icon to create and publish promo vouchers for catalog products.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Coupons list */}
            <div className="lg:col-span-2 luxury-card p-6">
              <h3 className="font-serif font-bold text-lg mb-6">Published Promo Codes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Coupon Code</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Benefit</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Limits</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Period</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!couponsData?.coupons || couponsData.coupons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted font-light">No coupons registered yet.</td>
                      </tr>
                    ) : (
                      couponsData.coupons.map((cp: any) => (
                        <tr key={cp._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                          <td className="py-4 px-4 font-mono font-bold text-gold tracking-wider">{cp.code}</td>
                          <td className="py-4 px-4 font-semibold text-foreground">
                            {cp.type === "percentage" ? `${cp.value}% Off` : `${cp.value.toFixed(2)} EGP Off`}
                            {cp.minOrderAmount > 0 && <span className="block text-[9px] text-muted font-normal mt-0.5">Min spend: {cp.minOrderAmount} EGP</span>}
                          </td>
                          <td className="py-4 px-4 text-muted">
                            {cp.usageLimit ? `${cp.usedCount}/${cp.usageLimit} claims` : `${cp.usedCount} claims`}
                          </td>
                          <td className="py-4 px-4 text-muted font-light">
                            {new Date(cp.startDate).toLocaleDateString()} - {new Date(cp.endDate).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleDeleteCoupon(cp._id)}
                              className="p-1 hover:text-error text-muted transition-colors rounded"
                              title="Delete Coupon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* TAB 5: STAFF ROLES MAPPER */}
        {activeTab === "roles" && (
          <div className="luxury-card p-6">
            <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
              <UserCheck className="h-5.5 w-5.5 text-gold" /> VIP User Roles & Permissions Map
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Username</th>
                    <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Email Address</th>
                    <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Permissions Role</th>
                    <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Promote Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {!usersData?.users || usersData.users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted font-light">No users indexed.</td>
                    </tr>
                  ) : (
                    usersData.users.map((usr: any) => (
                      <tr key={usr._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                        <td className="py-4 px-4 font-medium text-foreground">{usr.username}</td>
                        <td className="py-4 px-4 text-muted font-mono text-[11px]">{usr.email}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center text-[9px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                              usr.role === "admin"
                                ? "bg-gold/20 text-gold"
                                : usr.role === "seller"
                                  ? "bg-foreground/15 text-foreground"
                                  : "bg-muted-light/20 text-muted"
                            }`}
                          >
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {usr.isBlocked ? (
                            <span className="text-[10px] text-error font-semibold uppercase tracking-wider flex items-center gap-1">
                              <XCircle className="h-3.5 w-3.5" /> Blocked
                            </span>
                          ) : (
                            <span className="text-[10px] text-success font-semibold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" /> Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <select
                            value={usr.role}
                            onChange={(e) => handleUpdateRole(usr._id, e.target.value)}
                            className="bg-background rounded border border-card-border px-2.5 py-1 text-xs text-foreground outline-none"
                          >
                            <option value="customer">Customer</option>
                            <option value="seller">Seller</option>
                            <option value="moderator">Moderator Staff</option>
                            <option value="admin">Admin Staff</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: CMS BLOG & MEDIA */}
        {activeTab === "cms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Blog Post Composer */}
            <div className="luxury-card p-6">
              <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" /> Compose Editorial Article
              </h3>

              <form onSubmit={handleCreateBlog} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                    placeholder="Luxury Design Trends 2026"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Subtitle / Summary</label>
                  <input
                    type="text"
                    value={blogSubtitle}
                    onChange={(e) => setBlogSubtitle(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                    placeholder="Short description of the editorial content"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Category</label>
                    <select
                      value={blogCategory}
                      onChange={(e) => setBlogCategory(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none"
                    >
                      <option value="Lifestyle">Lifestyle</option>
                      <option value="Collections">Curated Collections</option>
                      <option value="Luxury Watch">Luxury Watch</option>
                      <option value="Brand Story">Brand Story</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Banner Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setBlogImage(e.target.files?.[0] || null)}
                      className="w-full rounded border border-card-border bg-background px-3 py-1.5 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Article Body Content</label>
                  <textarea
                    rows={8}
                    required
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    className="w-full rounded border border-card-border bg-background p-4 text-xs outline-none focus:border-gold leading-relaxed"
                    placeholder="Create official platform articles and insights. Add article details using rich markdown syntax here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingArticle}
                  className="w-full h-11 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-bold uppercase tracking-[0.2em] transition-all mt-2 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isCreatingArticle ? "Publishing…" : "PUBLISH ADMIN ARTICLE"}
                </button>
              </form>
            </div>

            {/* Media Asset Manager */}
            <div className="luxury-card p-6 flex flex-col gap-6">
              <div>
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-gold" /> Media Asset Library
                </h3>
                <p className="text-xs text-muted font-light mt-1">Upload and acquire URLs for blog and product pictures</p>
              </div>

              {/* Uploader Dropzone */}
              <div className="border border-dashed border-card-border rounded p-6 text-center hover:border-gold transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isUploadingMedia}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-gold/60" />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Upload new image file</span>
                  <span className="text-[10px] text-muted font-light">Drag and drop file, or select directory</span>
                </div>
              </div>

              {isUploadingMedia && (
                <div className="w-full bg-card-border h-2 rounded overflow-hidden">
                  <div className="bg-gold h-full rounded transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {/* Media gallery grid */}
              <div className="grid grid-cols-2 gap-4 flex-grow overflow-y-auto max-h-[350px] pr-1">
                {!mediaAssetsData?.assets || mediaAssetsData.assets.length === 0 ? (
                  <div className="col-span-2 py-8 text-center text-muted font-light">No media assets cataloged.</div>
                ) : (
                  mediaAssetsData.assets.map((media: any) => (
                    <div key={media._id} className="rounded border border-card-border bg-card-bg overflow-hidden flex flex-col justify-between">
                      <div className="relative aspect-video bg-muted-light">
                        <img src={media.url} alt={media.name} className="h-full w-full object-cover saturate-50 animate-fade-in" />
                      </div>
                      <div className="p-3">
                        <span className="block text-[10px] font-semibold text-foreground truncate">{media.name}</span>
                        <span className="block text-[9px] text-muted font-light mt-0.5">{media.size}</span>
                        <div className="flex gap-1.5 mt-2.5">
                          <button
                            onClick={() => handleCopyUrl(media.url)}
                            className="flex-grow py-1.5 border border-card-border hover:border-gold hover:text-gold rounded text-[9px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
                          >
                            <Copy className="h-3 w-3" /> Copy URL
                          </button>
                          <button
                            onClick={() => handleDeleteAsset(media._id)}
                            className="p-1.5 border border-card-border hover:border-error hover:text-error rounded text-muted transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Articles Moderation Table */}
            <div className="lg:col-span-2 luxury-card p-6 mt-10">
              <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-gold" /> Articles Moderation Queue ({pendingArticles?.articles?.length || 0})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Article Title</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Author</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Submitted On</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider text-right">Moderate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!pendingArticles?.articles || pendingArticles.articles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-muted font-light">No articles currently pending review.</td>
                      </tr>
                    ) : (
                      pendingArticles.articles.map((art: any) => (
                        <tr key={art._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                          <td className="py-4 px-3">
                            <span className="font-bold text-foreground block truncate max-w-[250px]">{art.title}</span>
                            <span className="text-[9px] text-muted uppercase tracking-wide block">{art.category}</span>
                          </td>
                          <td className="py-4 px-3 text-muted">
                            <span className="block font-semibold">{art.authorName || art.author?.storeName || art.author?.username || "Staff"}</span>
                            <span className="text-[9px] text-muted">{art.author?.email}</span>
                          </td>
                          <td className="py-4 px-3 text-muted">{new Date(art.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleApproveArticle(art._id)}
                                className="px-3 py-1.5 bg-success/15 hover:bg-success hover:text-white text-success rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectPrompt(art)}
                                className="px-3 py-1.5 bg-error/15 hover:bg-error hover:text-white text-error rounded text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Listed Articles Table */}
            <div className="lg:col-span-2 luxury-card p-6 mt-10">
              <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold" /> Published Editorial Articles ({articlesData?.articles?.length || 0})
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Title</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Author</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Views</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Comments</th>
                      <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!articlesData?.articles || articlesData.articles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted font-light">No articles composing.</td>
                      </tr>
                    ) : (
                      articlesData.articles.map((art: any) => (
                        <tr key={art._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                          <td className="py-4 px-3">
                            <span className="font-bold text-foreground block truncate max-w-[180px]">{art.title}</span>
                            <span className="text-[9px] text-muted uppercase tracking-wide block">{art.category}</span>
                          </td>
                          <td className="py-4 px-3 text-muted">{art.authorName || art.author?.username || "Staff"}</td>
                          <td className="py-4 px-3 text-muted font-semibold">{art.views || 0}</td>
                          <td className="py-4 px-3 text-muted font-semibold">{art.comments?.length || 0} comments</td>
                          <td className="py-4 px-3 text-right">
                            <button
                              onClick={() => handleDeleteArticle(art._id)}
                              className="p-1 hover:text-error text-muted transition-colors rounded"
                              title="Delete Article"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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

        {/* TAB 7: SELLER ONBOARDING REQUESTS */}
        {activeTab === "seller-requests" && (
          <div className="flex flex-col gap-6">

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="luxury-card p-4 flex flex-col gap-1">
                <span className="text-[10px] text-muted uppercase tracking-wider">Total Applications</span>
                <span className="text-2xl font-bold">{sellerRequestsData?.requests?.length || 0}</span>
              </div>
              <div className="luxury-card p-4 flex flex-col gap-1">
                <span className="text-[10px] text-gold uppercase tracking-wider">Pending Review</span>
                <span className="text-2xl font-bold text-gold">{sellerRequestsData?.requests?.filter((r: any) => r.status === "pending").length || 0}</span>
              </div>
              <div className="luxury-card p-4 flex flex-col gap-1">
                <span className="text-[10px] text-success uppercase tracking-wider">Approved</span>
                <span className="text-2xl font-bold text-success">{sellerRequestsData?.requests?.filter((r: any) => r.status === "approved").length || 0}</span>
              </div>
              <div className="luxury-card p-4 flex flex-col gap-1">
                <span className="text-[10px] text-error uppercase tracking-wider">Rejected</span>
                <span className="text-2xl font-bold text-error">{sellerRequestsData?.requests?.filter((r: any) => r.status === "rejected").length || 0}</span>
              </div>
            </div>

            <div className="luxury-card p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-gold" /> Store Applications
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "approved", "rejected"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => {/* filter handled inline below */}}
                      className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border border-card-border hover:border-gold transition-all"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Applicant</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Store Details</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Contact / Location</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Submitted</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!sellerRequestsData?.requests || sellerRequestsData.requests.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-muted">
                            <ShoppingBag className="h-10 w-10 opacity-20" />
                            <span className="font-light text-sm">No seller onboarding requests found.</span>
                            <span className="text-[11px]">Applications submitted from the dashboard will appear here.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sellerRequestsData.requests.map((req: any) => (
                        <tr key={req._id} className="border-b border-card-border/50 hover:bg-gold/5 transition-colors">
                          <td className="py-4 px-4">
                            <span className="font-semibold text-foreground block">{req.user?.username || "Unknown User"}</span>
                            <span className="font-mono text-[10px] text-muted">{req.user?.email}</span>
                            <span className="text-[9px] text-muted/60 block mt-0.5 capitalize">{req.user?.role || "customer"}</span>
                          </td>
                          <td className="py-4 px-4 max-w-[200px]">
                            <span className="font-bold text-gold block">{req.storeName}</span>
                            <span className="text-muted leading-relaxed block text-[11px] truncate" title={req.storeDescription}>
                              {req.storeDescription || <span className="italic opacity-50">No description</span>}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-muted">
                            <span className="block">{req.storePhone}</span>
                            <span className="block text-[10px] leading-relaxed truncate" title={req.storeAddress}>{req.storeAddress}</span>
                          </td>
                          <td className="py-4 px-4 text-muted">
                            <span className="block">{new Date(req.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px]">{new Date(req.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex font-bold px-2.5 py-0.5 rounded uppercase text-[9px] tracking-wider ${
                              req.status === "pending"
                                ? "bg-gold/20 text-gold"
                                : req.status === "approved"
                                  ? "bg-success/20 text-success"
                                  : "bg-error/20 text-error"
                            }`}>
                              {req.status}
                            </span>
                            {req.adminNotes && req.status === "rejected" && (
                              <span className="block text-[10px] text-error/70 mt-1 max-w-[120px] truncate" title={req.adminNotes}>
                                Note: {req.adminNotes}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {req.status === "pending" ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleModerateSellerRequest(req._id, "approved")}
                                  className="px-3 py-1.5 bg-success text-luxury-white rounded font-bold uppercase text-[9px] tracking-wider transition-colors hover:bg-success/80"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleModerateSellerRequest(req._id, "rejected")}
                                  className="px-3 py-1.5 bg-error text-luxury-white rounded font-bold uppercase text-[9px] tracking-wider transition-colors hover:bg-error/80"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted italic capitalize">{req.status}</span>
                            )}
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

        {/* TAB 8: ORDERS MANAGEMENT */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="luxury-card p-5">
                <span className="text-[10px] text-muted uppercase tracking-wider block">Total Orders</span>
                <span className="text-xl font-bold text-foreground mt-1">{adminOrdersData?.orders?.length || 0}</span>
              </div>
              <div className="luxury-card p-5">
                <span className="text-[10px] text-gold uppercase tracking-wider block">Pending Processing</span>
                <span className="text-xl font-bold text-gold mt-1">
                  {adminOrdersData?.orders?.filter((o: any) => o.orderStatus === "pending" || o.orderStatus === "processing").length || 0}
                </span>
              </div>
              <div className="luxury-card p-5">
                <span className="text-[10px] text-success uppercase tracking-wider block">Shipped / Delivered</span>
                <span className="text-xl font-bold text-success mt-1">
                  {adminOrdersData?.orders?.filter((o: any) => o.orderStatus === "shipped" || o.orderStatus === "delivered").length || 0}
                </span>
              </div>
              <div className="luxury-card p-5">
                <span className="text-[10px] text-error uppercase tracking-wider block">Cancelled</span>
                <span className="text-xl font-bold text-error mt-1">
                  {adminOrdersData?.orders?.filter((o: any) => o.orderStatus === "cancelled").length || 0}
                </span>
              </div>
            </div>

            <div className="luxury-card p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-gold" /> Transactions Catalog
                </h3>
                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "processing", "shipped", "delivered", "cancelled"] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setOrdersTabFilter(filter)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${ordersTabFilter === filter ? "bg-gold text-luxury-white border-gold" : "border-card-border hover:border-gold"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Order Reference</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Customer</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Date</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Value</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Payment</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Status</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!adminOrdersData?.orders || adminOrdersData.orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted font-light">No platform transactions found.</td>
                      </tr>
                    ) : (
                      adminOrdersData.orders.map((ord: any) => (
                        <tr key={ord._id} className="border-b border-card-border/50 hover:bg-gold/5 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-foreground">
                            #{ord._id.toString().slice(-8).toUpperCase()}
                          </td>
                          <td className="py-4 px-4">
                            <span className="font-semibold block">{ord.user?.username || "Guest Buyer"}</span>
                            <span className="text-[10px] text-muted font-mono">{ord.user?.email || ord.shippingAddress?.email}</span>
                          </td>
                          <td className="py-4 px-4 text-muted">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 font-bold text-gold">
                            {ord.totalPrice?.toFixed(2)} EGP
                          </td>
                          <td className="py-4 px-4 text-muted font-light uppercase">
                            {ord.paymentMethod}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex font-bold px-2 py-0.5 rounded uppercase text-[9px] tracking-wider ${
                              ord.orderStatus === "pending"
                                ? "bg-gold/20 text-gold"
                                : ord.orderStatus === "processing"
                                  ? "bg-foreground/15 text-foreground"
                                  : ord.orderStatus === "shipped"
                                    ? "bg-info/20 text-info"
                                    : ord.orderStatus === "delivered"
                                      ? "bg-success/20 text-success"
                                      : "bg-error/20 text-error"
                            }`}>
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedOrder(ord);
                                setOrderTrackingNumber(ord.trackingNumber || "");
                              }}
                              className="px-3 py-1 border border-card-border hover:border-gold hover:text-gold rounded text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Manage
                            </button>
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

        {/* TAB 9: PRODUCTS CATALOG MANAGEMENT */}
        {activeTab === "products" && (
          <div className="flex flex-col gap-6">
            <div className="luxury-card p-6">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-gold" /> Platform Catalog Products
                </h3>
                <input
                  type="text"
                  placeholder="Search products by title..."
                  value={productsSearch}
                  onChange={(e) => setProductsSearch(e.target.value)}
                  className="rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold w-64 text-foreground"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Product</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Seller Store</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Stock</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Sold</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Price</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider">Featured</th>
                      <th className="py-3 px-4 font-semibold text-muted uppercase tracking-wider text-right">Decommission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!adminProductsData?.products || adminProductsData.products.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted font-light">No platform products registered.</td>
                      </tr>
                    ) : (
                      adminProductsData.products.map((prod: any) => (
                        <tr key={prod._id} className="border-b border-card-border/50 hover:bg-gold/5 transition-colors">
                          <td className="py-4 px-4 flex items-center gap-3">
                            {prod.images?.[0] && (
                              <img src={prod.images[0]} alt={prod.title} className="h-9 w-9 object-cover rounded border border-card-border" />
                            )}
                            <div>
                              <span className="font-semibold block truncate max-w-[150px]">{prod.title}</span>
                              <span className="text-[9px] font-mono text-muted block mt-0.5">{prod._id}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-muted">
                            {prod.seller?.storeName || prod.seller?.username || "Platform Boutique"}
                          </td>
                          <td className="py-4 px-4">
                            {prod.stock <= 5 ? (
                              <span className="text-error font-bold">{prod.stock} (Low)</span>
                            ) : (
                              <span>{prod.stock}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-muted">
                            {prod.sold || 0} units
                          </td>
                          <td className="py-4 px-4 font-bold text-gold">
                            {prod.price?.toFixed(2)} EGP
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleToggleProductFeatured(prod._id)}
                              className="p-1 hover:text-gold transition-colors cursor-pointer"
                              title="Toggle Featured"
                            >
                              <Star className={`h-4.5 w-4.5 ${prod.isFeatured ? "fill-gold text-gold" : "text-card-border"}`} />
                            </button>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => handleToggleProductDelete(prod._id)}
                              className="p-1 hover:text-error text-muted transition-colors cursor-pointer"
                              title="Ban Product"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
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

        {/* TAB 10: SYSTEM SETTINGS CUSTOMIZATION */}
        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 luxury-card p-6">
              <h3 className="font-serif font-bold text-lg mb-6 flex items-center gap-2">
                <Settings2 className="h-5.5 w-5.5 text-gold" /> System Settings & Controls
              </h3>

              <form onSubmit={handleSaveSettings} className="flex flex-col gap-6">
                {/* Maintenance Mode */}
                <div className="flex items-center justify-between border-b border-card-border pb-4">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide">Maintenance Mode</h4>
                    <p className="text-[11px] text-muted font-light mt-0.5">Toggle to lock public site access and display a maintenance page</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsMaintenance(!settingsMaintenance)}
                    className={`w-12 h-6 rounded-full p-1 transition-all cursor-pointer ${settingsMaintenance ? "bg-gold flex justify-end" : "bg-card-border flex justify-start"}`}
                  >
                    <span className="w-4 h-4 bg-luxury-white rounded-full shadow-md" />
                  </button>
                </div>

                {/* Announcement Banner */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Announcement Header Banner Message</label>
                  <input
                    type="text"
                    value={settingsBanner}
                    onChange={(e) => setSettingsBanner(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold text-foreground"
                    placeholder="E.g. Free shipping on all orders over 1000 EGP!"
                  />
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Platform commission fee (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={settingsCommission}
                      onChange={(e) => setSettingsCommission(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">VAT / Sales Tax rate (%)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsTaxRate}
                      onChange={(e) => setSettingsTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Standard Shipping fee (EGP)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={settingsShippingFee}
                      onChange={(e) => setSettingsShippingFee(parseFloat(e.target.value) || 0)}
                      className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold text-foreground"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingSettings}
                  className="h-10 bg-gold text-luxury-white hover:bg-gold-hover font-semibold uppercase tracking-wider text-xs rounded transition-all mt-4 cursor-pointer"
                >
                  {isUpdatingSettings ? "Updating system configuration..." : "Apply Configuration settings"}
                </button>
              </form>
            </div>

            {/* Quick Preview panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="luxury-card p-6 border-gold/20 flex flex-col gap-4">
                <h4 className="font-serif font-bold text-sm text-gold flex items-center gap-1">
                  <Globe className="h-4.5 w-4.5" /> Client Store Live Preview
                </h4>
                <div className="border border-card-border rounded p-4 bg-background flex flex-col gap-3">
                  {settingsBanner && (
                    <div className="bg-gold/10 text-gold text-[9px] font-bold py-1.5 px-2.5 text-center uppercase tracking-wider rounded border border-gold/20">
                      {settingsBanner}
                    </div>
                  )}
                  <div className="h-12 flex items-center justify-center border border-card-border border-dashed text-[10px] text-muted">
                    {settingsMaintenance ? "Storefront Offline (Maintenance)" : "Storefront Online & Selling"}
                  </div>
                  <div className="flex justify-between text-[10px] text-muted border-t border-card-border pt-2 mt-1">
                    <span>Shipping: {settingsShippingFee} EGP</span>
                    <span>VAT: {settingsTaxRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details drawer/modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/85 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-card-bg border border-card-border rounded-lg max-w-2xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] text-gold font-bold uppercase tracking-widest block">Transaction details</span>
                  <h3 className="font-serif font-bold text-lg text-foreground mt-0.5">Order Reference</h3>
                  <span className="text-[9px] font-mono text-muted">{selectedOrder._id}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-gold/10 text-muted hover:text-gold rounded transition-colors cursor-pointer"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-card-border pb-6 mb-6 text-xs">
                {/* Shipping info */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-bold uppercase tracking-wider text-muted">Shipping Address</h4>
                  <p className="font-bold text-foreground">{selectedOrder.shippingAddress?.fullName}</p>
                  <p className="text-muted leading-relaxed">
                    {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.building && `Bld ${selectedOrder.shippingAddress.building}, `}
                    {selectedOrder.shippingAddress?.city}, Egypt
                  </p>
                  <p className="text-muted font-mono mt-1">Phone: {selectedOrder.shippingAddress?.phone}</p>
                </div>

                {/* Status management */}
                <form onSubmit={handleUpdateOrderStatus} className="flex flex-col gap-3 bg-muted-light/10 p-4 rounded border border-card-border">
                  <h4 className="font-bold uppercase tracking-wider text-gold">Fulfillment status</h4>
                  
                  <div>
                    <label className="block text-[9px] uppercase tracking-wide text-muted mb-1.5">Fulfillment Status</label>
                    <select
                      value={selectedOrder.orderStatus}
                      onChange={(e) => setSelectedOrder({ ...selectedOrder, orderStatus: e.target.value })}
                      className="bg-background rounded border border-card-border px-3 py-1.5 text-xs text-foreground outline-none w-full"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wide text-muted mb-1.5">Courier Tracking number</label>
                    <input
                      type="text"
                      value={orderTrackingNumber}
                      onChange={(e) => setOrderTrackingNumber(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-3 py-1.5 text-xs outline-none focus:border-gold font-mono text-foreground"
                      placeholder="E.g. DHL-98234-EG"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingOrder}
                    className="w-full py-2 bg-gold text-luxury-white hover:bg-gold-hover font-semibold rounded text-[10px] uppercase tracking-wider transition-all mt-1 cursor-pointer"
                  >
                    {isUpdatingOrder ? "Updating order..." : "Update Transaction"}
                  </button>
                </form>
              </div>

              {/* Order Items list */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted">Items purchased</h4>
                <div className="flex flex-col gap-3">
                  {selectedOrder.orderItems?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center gap-4 border border-card-border bg-card-bg p-3 rounded">
                      <div className="flex items-center gap-3">
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.title} className="h-10 w-10 object-cover rounded border border-card-border" />
                        ) : (
                          <div className="h-10 w-10 bg-muted-light/20 border border-card-border rounded" />
                        )}
                        <div>
                          <span className="block font-bold text-foreground truncate max-w-[250px]">{item.product?.title || "Item details"}</span>
                          <span className="text-[10px] text-muted">Quantity: {item.quantity} units</span>
                        </div>
                      </div>
                      <span className="font-bold text-gold text-xs">{item.price?.toFixed(2)} EGP</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-card-border pt-4 mt-6 text-xs flex flex-col gap-1.5 items-end text-foreground">
                <div className="flex justify-between w-48 text-muted">
                  <span>Subtotal:</span>
                  <span>{selectedOrder.itemsPrice?.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between w-48 text-muted">
                  <span>Shipping fee:</span>
                  <span>{selectedOrder.shippingPrice?.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between w-48 text-muted">
                  <span>Tax (VAT):</span>
                  <span>{selectedOrder.taxPrice?.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between w-48 font-bold border-t border-card-border pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span className="text-gold text-sm">{selectedOrder.totalPrice?.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Seller Rejection Modal */}
        {showSellerRejectionModal && rejectingSellerRequestId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/80 backdrop-blur-sm p-4">
            <div className="bg-card-bg border border-card-border rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-serif font-bold text-lg mb-4 text-foreground">Reject Seller Application</h3>
              <p className="text-xs text-muted mb-4 font-light leading-relaxed">
                Provide a reason for rejecting this seller application. The applicant will be notified with your feedback.
              </p>
              <form onSubmit={handleSellerRejectionSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Rejection Reason / Admin Notes</label>
                  <textarea
                    rows={4}
                    required
                    value={sellerRejectionNotes}
                    onChange={(e) => setSellerRejectionNotes(e.target.value)}
                    className="w-full rounded border border-card-border bg-background p-3 text-xs outline-none focus:border-gold resize-none leading-relaxed"
                    placeholder="e.g. Your store description is too vague. Please provide more detail about your products and brand identity."
                  />
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSellerRejectionModal(false);
                      setRejectingSellerRequestId(null);
                      setSellerRejectionNotes("");
                    }}
                    className="px-4 py-2 border border-card-border rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-error text-luxury-white hover:bg-error/80 rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    Reject Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Article Rejection Reason Modal */}
        {showRejectionModal && moderatingArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/80 backdrop-blur-sm p-4">
            <div className="bg-card-bg border border-card-border rounded-lg max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
              <h3 className="font-serif font-bold text-lg mb-4 text-foreground">Reject Article Submission</h3>
              <p className="text-xs text-muted mb-4 font-light leading-relaxed">
                Provide a reason for rejecting the article <strong className="text-foreground">"{moderatingArticle.title}"</strong>. The author will be notified.
              </p>
              <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Rejection Reason</label>
                  <textarea
                    rows={4}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded border border-card-border bg-background p-3 text-xs outline-none focus:border-gold resize-none leading-relaxed"
                    placeholder="e.g. Content does not meet our style guidelines. Please add more descriptive images."
                  />
                </div>
                <div className="flex gap-3 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectionModal(false);
                      setModeratingArticle(null);
                      setRejectionReason("");
                    }}
                    className="px-4 py-2 border border-card-border rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-error text-luxury-white hover:bg-error-hover rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                  >
                    Reject Article
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
