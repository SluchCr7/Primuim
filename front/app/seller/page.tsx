"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAppSelector } from "../../lib/store";
import {
  useGetSellerStatsQuery,
  useGetSellerOrdersQuery,
  useUpdateSellerOrderStatusMutation,
  useRequestPayoutMutation,
  useGetMyProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useTogglePublishProductMutation,
  useGetCategoriesQuery,
  useGetMeQuery,
  useUpdateSellerStoreProfileMutation,
  useUploadStoreLogoMutation,
  useUploadStoreCoverMutation,
  useGetMyArticlesQuery,
  useCreateArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
  useGetMyApplicationStatusQuery,
} from "../../lib/api";
import { useToast } from "../components/Toast";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  Wallet,
  Star,
  Activity,
  Image as ImageIcon,
  ChevronRight,
  Upload,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Eye,
  Clock,
  Settings,
  BookOpen,
  FileText,
  PenTool,
  AlertCircle,
} from "lucide-react";

// Recharts dynamically imported to prevent SSR issues
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);

  // Active Tab: "analytics" | "products" | "orders" | "wallet" | "settings" | "articles"
  const [activeTab, setActiveTab] = useState<"analytics" | "products" | "orders" | "wallet" | "settings" | "articles">("analytics");

  // Onboarding Security check — only redirect completely unauthenticated users or non-sellers WITHOUT an application
  const { data: appStatusData, isLoading: appStatusLoading } = useGetMyApplicationStatusQuery(undefined, { skip: !isAuthenticated });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
    // If user has seller role, let them in
    // If user has a pending/rejected application, show the waiting screen (handled below)
    // If user has no application and is not a seller, redirect to dashboard
  }, [isAuthenticated, router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isApprovedSeller = user?.role === "seller" || user?.role === "admin";
  const hasPendingApp = appStatusData?.request && appStatusData.request.status === "pending";
  const hasRejectedApp = appStatusData?.request && appStatusData.request.status === "rejected";

  // RTK Queries — only fetch if approved seller
  const { data: statsData, refetch: refetchStats } = useGetSellerStatsQuery(undefined, { skip: !isApprovedSeller });
  const { data: ordersData, refetch: refetchOrders } = useGetSellerOrdersQuery(undefined, { skip: !isApprovedSeller });
  const { data: productsData, refetch: refetchProducts } = useGetMyProductsQuery(undefined, { skip: !isApprovedSeller });
  const { data: categoriesData } = useGetCategoriesQuery(undefined);
  const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  // Mutations
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [togglePublishProduct] = useTogglePublishProductMutation();
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateSellerOrderStatusMutation();
  const [requestPayout, { isLoading: isRequestingPayout }] = useRequestPayoutMutation();
  const [updateSellerStoreProfile, { isLoading: isUpdatingProfile }] = useUpdateSellerStoreProfileMutation();
  const [uploadStoreLogo, { isLoading: isUploadingLogo }] = useUploadStoreLogoMutation();
  const [uploadStoreCover, { isLoading: isUploadingCover }] = useUploadStoreCoverMutation();
  const { data: myArticlesData, refetch: refetchMyArticles } = useGetMyArticlesQuery(undefined, { skip: !user || (user.role !== "seller" && user.role !== "admin") });
  const [createArticle, { isLoading: isCreatingArticle }] = useCreateArticleMutation();
  const [updateArticle, { isLoading: isUpdatingArticle }] = useUpdateArticleMutation();
  const [deleteArticle] = useDeleteArticleMutation();

  // Create/Edit Product Forms states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [subcategoriesList, setSubcategoriesList] = useState<any[]>([]);
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [tags, setTags] = useState("");
  const [specifications, setSpecifications] = useState<{ name: string; value: string }[]>([]);
  const [specName, setSpecName] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  // Payout state
  const [payoutAmount, setPayoutAmount] = useState("");

  // Store Settings states
  const [storeName, setStoreName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeLogo, setStoreLogo] = useState("");
  const [storeCover, setStoreCover] = useState("");
  const [country, setCountry] = useState("");
  const [responseTime, setResponseTime] = useState("");

  // Article form states
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [artTitle, setArtTitle] = useState("");
  const [artSubtitle, setArtSubtitle] = useState("");
  const [artContent, setArtContent] = useState("");
  const [artCategory, setArtCategory] = useState("Lifestyle");
  const [artTags, setArtTags] = useState("");
  const [artFile, setArtFile] = useState<File | null>(null);
  const [artStatus, setArtStatus] = useState<"draft" | "pending">("pending");

  // Sync subcategories on category change
  useEffect(() => {
    if (category && categoriesData?.categories) {
      const selected = categoriesData.categories.find((cat: any) => cat._id === category);
      setSubcategoriesList(selected?.subcategories || []);
    } else {
      setSubcategoriesList([]);
    }
  }, [category, categoriesData]);

  // Sync store settings states with loaded user data
  useEffect(() => {
    if (meData?.user) {
      setStoreName(meData.user.storeName || "");
      setBrandName(meData.user.brandName || "");
      setStoreDescription(meData.user.storeDescription || "");
      setStoreLogo(meData.user.storeLogo || "");
      setStoreCover(meData.user.storeCover || "");
      setCountry(meData.user.country || "");
      setResponseTime(meData.user.responseTime || "Within 24 hours");
    }
  }, [meData]);

  const handleUpdateStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSellerStoreProfile({
        storeName,
        brandName,
        storeDescription,
        storeLogo,
        storeCover,
        country,
        responseTime,
      }).unwrap();
      showToast("Store settings updated successfully", "success");
      refetchMe();
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to update store settings", "error");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Logo image must be less than 2MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await uploadStoreLogo(formData).unwrap();
      setStoreLogo(res.storeLogo);
      showToast("Store logo updated successfully!", "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to upload store logo", "error");
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Cover image must be less than 5MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await uploadStoreCover(formData).unwrap();
      setStoreCover(res.storeCover);
      showToast("Store cover updated successfully!", "success");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to upload store cover", "error");
    }
  };

  const openCreateArticleModal = () => {
    setEditingArticleId(null);
    setArtTitle("");
    setArtSubtitle("");
    setArtContent("");
    setArtCategory("Lifestyle");
    setArtTags("");
    setArtFile(null);
    setArtStatus("pending");
    setShowArticleModal(true);
  };

  const openEditArticleModal = (art: any) => {
    setEditingArticleId(art._id);
    setArtTitle(art.title || "");
    setArtSubtitle(art.subtitle || "");
    setArtContent(art.content || "");
    setArtCategory(art.category || "Lifestyle");
    setArtTags(art.tags?.join(", ") || "");
    setArtFile(null);
    setArtStatus(art.status === "draft" ? "draft" : "pending");
    setShowArticleModal(true);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artContent) {
      showToast("Title and content are required.", "error");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", artTitle);
      formData.append("subtitle", artSubtitle);
      formData.append("content", artContent);
      formData.append("category", artCategory);
      formData.append("status", artStatus);

      if (artTags) {
        artTags.split(",").map(t => t.trim()).filter(Boolean).forEach(tag => {
          formData.append("tags", tag);
        });
      }

      if (artFile) {
        formData.append("image", artFile);
      }

      if (editingArticleId) {
        await updateArticle({ id: editingArticleId, formData }).unwrap();
        showToast("Article updated successfully", "success");
      } else {
        await createArticle(formData).unwrap();
        showToast("Article created successfully", "success");
      }
      setShowArticleModal(false);
      refetchMyArticles();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to save article", "error");
    }
  };

  const handleDeleteArticleAction = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteArticle(id).unwrap();
        showToast("Article deleted successfully", "success");
        refetchMyArticles();
      } catch (err: any) {
        showToast(err.data?.message || "Failed to delete article", "error");
      }
    }
  };

  const handleAddSpecification = () => {
    if (specName && specValue) {
      setSpecifications([...specifications, { name: specName, value: specValue }]);
      setSpecName("");
      setSpecValue("");
    }
  };

  const handleRemoveSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  const openAddModal = () => {
    setEditingProdId(null);
    setTitle("");
    setDescription("");
    setCategory(categoriesData?.categories?.[0]?._id || "");
    setSubcategory("");
    setBrand("");
    setPrice("");
    setComparePrice("");
    setStock("");
    setSku("");
    setIsPublished(true);
    setTags("");
    setSpecifications([]);
    setSelectedFiles(null);
    setShowProductModal(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProdId(prod._id);
    setTitle(prod.title || "");
    setDescription(prod.description || "");
    setCategory(prod.category?._id || prod.category || "");
    setSubcategory(prod.subcategory?._id || prod.subcategory || "");
    setBrand(prod.brand || "");
    setPrice(prod.price?.toString() || "");
    setComparePrice(prod.comparePrice?.toString() || "");
    setStock(prod.stock?.toString() || "");
    setSku(prod.sku || "");
    setIsPublished(prod.isPublished !== false);
    setTags(prod.tags?.join(", ") || "");
    setSpecifications(prod.specifications || []);
    setSelectedFiles(null);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      showToast("Please choose a product category", "error");
      return;
    }

    try {
      if (editingProdId) {
        // Edit flow (simple payload or multipart if files exist, let's keep it simple with JSON if no files)
        // Wait, updateProduct in backend accepts JSON updates. Let's send details.
        const productData = {
          title,
          description,
          category,
          subcategory: subcategory || null,
          brand,
          price: parseFloat(price),
          comparePrice: comparePrice ? parseFloat(comparePrice) : undefined,
          stock: parseInt(stock),
          sku,
          isPublished,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          specifications,
        };

        await updateProduct({ id: editingProdId, productData }).unwrap();
        showToast("Product updated successfully!", "success");
      } else {
        // Create flow (must support image upload, so we send FormData)
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("category", category);
        if (subcategory) formData.append("subcategory", subcategory);
        formData.append("brand", brand);
        formData.append("price", price);
        if (comparePrice) formData.append("comparePrice", comparePrice);
        formData.append("stock", stock);
        formData.append("sku", sku);
        formData.append("isPublished", String(isPublished));
        
        const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);
        tagsArray.forEach((t) => formData.append("tags[]", t));

        formData.append("specifications", JSON.stringify(specifications));

        if (selectedFiles) {
          for (let i = 0; i < selectedFiles.length; i++) {
            formData.append("images", selectedFiles[i]);
          }
        }

        await createProduct(formData).unwrap();
        showToast("Product created successfully and live!", "success");
      }

      setShowProductModal(false);
      refetchProducts();
      refetchStats();
    } catch (err: any) {
      showToast(err.data?.message || err.data?.errors?.[0] || "Failed to save product.", "error");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("Are you sure you want to permanently delete this product?")) {
      try {
        await deleteProduct(id).unwrap();
        showToast("Product deleted successfully", "success");
        refetchProducts();
        refetchStats();
      } catch (err) {
        showToast("Failed to delete product.", "error");
      }
    }
  };

  const handleTogglePublish = async (id: string) => {
    try {
      await togglePublishProduct(id).unwrap();
      showToast("Publish status toggled.", "success");
      refetchProducts();
    } catch (err) {
      showToast("Failed to toggle publish status.", "error");
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
      showToast(`Fulfillment status updated to: ${status}`, "success");
      refetchOrders();
      refetchStats();
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Failed to update order status.", "error");
    }
  };

  const handlePayoutRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(payoutAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast("Please specify a valid amount", "error");
      return;
    }

    try {
      await requestPayout({ amount: amountVal }).unwrap();
      showToast(`Payout request of ${amountVal} EGP submitted successfully!`, "success");
      setPayoutAmount("");
      refetchMe();
    } catch (err: any) {
      showToast(err.data?.message || "Insufficient balance or payout failed.", "error");
    }
  };

  // ── Loading state ──
  if (!mounted || appStatusLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent"></div>
            <span className="text-xs text-muted font-light tracking-widest uppercase">Loading Portal...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Not authenticated → redirect handled in useEffect ──
  if (!isAuthenticated) return null;

  // ── Pending or Rejected Application Screen ──
  if (!isApprovedSeller && (hasPendingApp || hasRejectedApp)) {
    const appReq = appStatusData!.request;
    const isPending = appReq.status === "pending";
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-grow flex items-center justify-center px-6 py-20">
          <div className="max-w-lg w-full">
            {/* Status Card */}
            <div className="luxury-card p-8 text-center border border-card-border relative overflow-hidden">
              {/* Background accent */}
              <div className={`absolute inset-0 opacity-5 ${isPending ? "bg-gold" : "bg-error"}`} />
              
              <div className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-6 mx-auto ${
                isPending ? "bg-gold/15 text-gold" : "bg-error/15 text-error"
              }`}>
                {isPending ? <Clock className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>

              <span className={`text-[10px] font-bold tracking-[0.3em] uppercase block mb-2 ${
                isPending ? "text-gold" : "text-error"
              }`}>
                {isPending ? "Application Under Review" : "Application Not Approved"}
              </span>
              <h1 className="font-serif text-2xl font-bold mb-3">
                {isPending ? "Your Store Is Being Reviewed" : "Application Rejected"}
              </h1>
              <p className="text-sm text-muted font-light leading-relaxed mb-6">
                {isPending
                  ? "Our admin team is reviewing your seller application. You will receive a notification once a decision is made."
                  : "Your seller application was reviewed and could not be approved at this time."
                }
              </p>

              {/* Store Info */}
              <div className="rounded border border-card-border bg-background/50 p-4 text-left mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-muted uppercase tracking-wider block">Store Name</span>
                    <span className="font-bold text-foreground">{appReq.storeName}</span>
                  </div>
                  <span className={`inline-flex font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider ${
                    isPending ? "bg-gold/20 text-gold" : "bg-error/20 text-error"
                  }`}>
                    {appReq.status}
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Description</span>
                  <span className="text-xs text-foreground/80 leading-relaxed">{appReq.storeDescription}</span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] text-muted uppercase tracking-wider block">Submitted</span>
                  <span className="text-xs text-muted">{new Date(appReq.createdAt).toLocaleDateString()}</span>
                </div>
                {appReq.adminNotes && (
                  <div className="mt-3 p-3 bg-error/10 border border-error/20 rounded">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-error block mb-1">Admin Feedback</span>
                    <span className="text-xs text-error/80 leading-relaxed">{appReq.adminNotes}</span>
                  </div>
                )}
              </div>

              {/* Timeline Steps */}
              {isPending && (
                <div className="flex items-center justify-center gap-2 mb-6">
                  {[
                    { label: "Applied", done: true },
                    { label: "Under Review", done: false, active: true },
                    { label: "Decision", done: false },
                    { label: "Launch", done: false },
                  ].map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="flex flex-col items-center gap-1">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          step.done
                            ? "bg-success text-white"
                            : step.active
                              ? "bg-gold text-luxury-black animate-pulse"
                              : "bg-card-border text-muted"
                        }`}>
                          {step.done ? "✓" : i + 1}
                        </div>
                        <span className="text-[8px] text-muted uppercase tracking-wider">{step.label}</span>
                      </div>
                      {i < 3 && <div className="h-px w-8 bg-card-border" />}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/dashboard"
                  className="px-6 py-2.5 border border-card-border rounded font-semibold text-xs uppercase tracking-wider hover:border-gold transition-all text-center"
                >
                  Back to Dashboard
                </a>
                {!isPending && (
                  <a
                    href="/dashboard"
                    className="px-6 py-2.5 bg-gold hover:bg-gold-hover text-luxury-black rounded font-bold text-xs uppercase tracking-wider transition-all text-center"
                  >
                    Resubmit Application
                  </a>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ── No application and not a seller → redirect to dashboard ──
  if (!isApprovedSeller && !appStatusData?.request) {
    router.push("/dashboard");
    return null;
  }

  const stats = statsData?.stats || {
    totalEarnings: 0,
    totalProducts: 0,
    activeOrdersCount: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    totalSoldUnits: 0,
    salesOverTime: [],
  };

  const orders = ordersData?.orders || [];
  const products = productsData?.products || [];

  // Fallback Charts Data
  const defaultSalesData = [
    { date: "Pending", amount: 0 },
    { date: new Date().toLocaleDateString(), amount: stats.totalEarnings }
  ];
  const chartSales = stats.salesOverTime && stats.salesOverTime.length > 0
    ? stats.salesOverTime
    : defaultSalesData;

  const activities = meData?.user?.activityLogs ? [...meData.user.activityLogs].reverse() : [];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12 md:py-16">
        {/* Banner Section */}
        <div className="relative overflow-hidden luxury-card p-8 mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-gold uppercase flex items-center gap-1.5 mb-1.5">
              <Activity className="h-3.5 w-3.5" /> Seller Central Dashboard
            </span>
            <h1 className="font-serif text-3xl font-bold">Manage Store Operations</h1>
            <p className="text-xs text-muted mt-1 font-light">Configure inventory listings, track customer order logistics, and request payouts.</p>
          </div>
          
          <button
            onClick={openAddModal}
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-gold hover:bg-gold-hover text-luxury-white px-5 text-xs font-semibold uppercase tracking-wider transition-all"
          >
            <Plus className="h-4.5 w-4.5" /> Add Product Listing
          </button>
        </div>

        {/* Navigation Tabs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* TAB NAVIGATION SIDEBAR */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setActiveTab("analytics");
                refetchStats();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "analytics" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <TrendingUp className="h-4 w-4" /> Store Analytics
            </button>

            <button
              onClick={() => {
                setActiveTab("products");
                refetchProducts();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "products" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <Package className="h-4 w-4" /> Products Catalog ({products.length})
            </button>

            <button
              onClick={() => {
                setActiveTab("orders");
                refetchOrders();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "orders" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <ShoppingBag className="h-4 w-4" /> Fulfillment Orders ({orders.length})
            </button>

            <button
              onClick={() => {
                setActiveTab("wallet");
                refetchMe();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "wallet" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <Wallet className="h-4 w-4" /> Store Balance Wallet
            </button>

            <button
              onClick={() => {
                setActiveTab("settings");
                refetchMe();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "settings" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <Settings className="h-4 w-4" /> Store Settings
            </button>

            <button
              onClick={() => {
                setActiveTab("articles");
                refetchMyArticles();
              }}
              className={`flex items-center gap-3.5 px-4 py-3 rounded text-sm font-semibold tracking-wide text-left transition-all ${
                activeTab === "articles" ? "bg-foreground text-background" : "hover:bg-muted-light"
              }`}
            >
              <FileText className="h-4 w-4" /> Editorial Articles ({myArticlesData?.articles?.length || 0})
            </button>
          </div>

          {/* TAB CONTENTS CONTAINER */}
          <div className="lg:col-span-3">
            {/* 1. ANALYTICS DASHBOARD */}
            {activeTab === "analytics" && (
              <div className="flex flex-col gap-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Revenue Card */}
                  <div className="luxury-card p-5 bg-card-bg">
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Total Revenue</span>
                    <span className="text-2xl font-serif font-bold text-gold mt-1 block">
                      {stats.totalEarnings.toFixed(2)} EGP
                    </span>
                    <span className="text-[9px] text-success font-semibold mt-1.5 block">From delivered fulfillments</span>
                  </div>

                  {/* Active Orders */}
                  <div className="luxury-card p-5 bg-card-bg">
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Active Orders</span>
                    <span className="text-2xl font-serif font-bold text-foreground mt-1 block">
                      {stats.activeOrdersCount}
                    </span>
                    <span className="text-[9px] text-muted font-light mt-1.5 block">Awaiting shipping status</span>
                  </div>

                  {/* Listed Products */}
                  <div className="luxury-card p-5 bg-card-bg">
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Listed Products</span>
                    <span className="text-2xl font-serif font-bold text-foreground mt-1 block">
                      {stats.totalProducts}
                    </span>
                    <span className="text-[9px] text-muted font-light mt-1.5 block">Total items in catalog</span>
                  </div>

                  {/* Stock Alert */}
                  <div className="luxury-card p-5 bg-card-bg">
                    <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Out Of Stock</span>
                    <span className={`text-2xl font-serif font-bold mt-1 block ${stats.outOfStockCount > 0 ? "text-error" : "text-success"}`}>
                      {stats.outOfStockCount}
                    </span>
                    <span className="text-[9px] text-muted font-light mt-1.5 block">{stats.lowStockCount} items running low</span>
                  </div>
                </div>

                {/* Sales Chart */}
                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-lg mb-6">Store Performance Chart</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartSales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#d4af37" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                        <XAxis dataKey="date" stroke="#888" fontSize={9} />
                        <YAxis stroke="#888" fontSize={9} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#141414", borderColor: "#d4af37", color: "#fff", fontSize: 11 }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* 2. PRODUCTS MANAGER */}
            {activeTab === "products" && (
              <div className="luxury-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif font-bold text-lg">My Product Listings</h3>
                  <button
                    onClick={openAddModal}
                    className="h-9 inline-flex items-center justify-center gap-1 bg-foreground text-background hover:bg-gold hover:text-luxury-white px-4 rounded text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-card-border">
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider">Product Info</th>
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider">SKU</th>
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider">Price (EGP)</th>
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider">Stock</th>
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider">Status</th>
                        <th className="py-3 px-3 font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted font-light">No products listed. Add your first product catalog above.</td>
                        </tr>
                      ) : (
                        products.map((prod: any) => (
                          <tr key={prod._id} className="border-b border-card-border/50 hover:bg-muted-light/10">
                            <td className="py-4 px-3 flex items-center gap-2.5">
                              <img
                                src={prod.images?.[0]?.url || "https://placehold.co/100x100"}
                                alt={prod.title}
                                className="h-10 w-10 object-cover rounded border border-card-border"
                              />
                              <div>
                                <span className="font-semibold block text-foreground truncate max-w-[150px]">{prod.title}</span>
                                <span className="text-[9px] text-muted block">{prod.category?.name || "No Category"}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3 font-mono text-[10px] text-muted">{prod.sku || "N/A"}</td>
                            <td className="py-4 px-3 font-semibold text-foreground">{prod.price.toFixed(2)}</td>
                            <td className="py-4 px-3">
                              <span className={`font-semibold ${prod.stock === 0 ? "text-error" : prod.stock <= prod.lowStockThreshold ? "text-gold" : "text-muted"}`}>
                                {prod.stock} units
                              </span>
                            </td>
                            <td className="py-4 px-3">
                              <button
                                onClick={() => handleTogglePublish(prod._id)}
                                className={`inline-flex font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider cursor-pointer ${
                                  prod.isPublished ? "bg-success/10 text-success" : "bg-muted-light/20 text-muted"
                                }`}
                              >
                                {prod.isPublished ? "Published" : "Draft"}
                              </button>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => openEditModal(prod)}
                                  className="p-1.5 border border-card-border hover:border-gold hover:text-gold rounded transition-colors text-muted"
                                  title="Edit Product"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod._id)}
                                  className="p-1.5 border border-card-border hover:border-error hover:text-error rounded transition-colors text-muted"
                                  title="Delete Product"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
            )}

            {/* 3. FULFILLMENT ORDERS */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-6">
                <h3 className="font-serif font-bold text-lg">Store Fulfillment Shipments</h3>

                {orders.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-card-border rounded p-6 text-muted text-sm font-light bg-card-bg">
                    No customer orders have been routed to your store catalog yet.
                  </div>
                ) : (
                  orders.map((order: any) => (
                    <div key={order._id} className="luxury-card p-6 flex flex-col gap-4">
                      {/* Meta info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-card-border">
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Order ID</span>
                          <span className="font-mono text-xs text-foreground font-semibold">{order._id}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Ship To</span>
                          <span className="text-xs text-foreground font-semibold">{order.shippingAddress?.fullName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">My Store Subtotal</span>
                          <span className="text-sm font-bold text-gold">{order.sellerSubtotal?.toFixed(2)} EGP</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Status</span>
                          <span className="inline-flex items-center gap-1.5">
                            {order.orderStatus === "pending" && <span className="text-[9px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded uppercase tracking-wider">Pending</span>}
                            {order.orderStatus === "processing" && <span className="text-[9px] font-bold text-success bg-success/10 px-2 py-0.5 rounded uppercase tracking-wider">Processing</span>}
                            {order.orderStatus === "shipped" && <span className="text-[9px] font-bold text-success bg-success/15 px-2 py-0.5 rounded uppercase tracking-wider"><Truck className="h-3 w-3" /> Shipped</span>}
                            {order.orderStatus === "delivered" && <span className="text-[9px] font-bold text-success bg-success/20 px-2 py-0.5 rounded uppercase tracking-wider">Delivered</span>}
                            {order.orderStatus === "cancelled" && <span className="text-[9px] font-bold text-error bg-error/10 px-2 py-0.5 rounded uppercase tracking-wider">Cancelled</span>}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="flex flex-col gap-3">
                        {order.orderItems.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center gap-4 text-xs">
                            <div className="flex items-center gap-2.5">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="h-8 w-8 rounded object-cover border border-card-border" />
                              )}
                              <span className="font-medium truncate max-w-[200px]">{item.title}</span>
                            </div>
                            <span className="text-muted">x{item.quantity}</span>
                            <span className="font-semibold text-foreground">{(item.price * item.quantity).toFixed(2)} EGP</span>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Logistics and Actions */}
                      <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-card-border mt-1 justify-between items-start sm:items-center">
                        <div className="text-xs text-muted font-light leading-relaxed">
                          <span className="font-semibold text-foreground uppercase block text-[9px] tracking-wider mb-0.5">Shipping Address:</span>
                          {order.shippingAddress?.street}, {order.shippingAddress?.city}, Egypt. Phone: {order.shippingAddress?.phone}
                        </div>

                        {order.orderStatus !== "delivered" && order.orderStatus !== "cancelled" && (
                          <div className="flex items-center gap-2 self-end">
                            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Update Status:</span>
                            <select
                              value={order.orderStatus}
                              disabled={isUpdatingStatus}
                              onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                              className="bg-card-bg border border-card-border text-xs text-foreground px-2 py-1 rounded outline-none cursor-pointer"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. WALLET & PAYOUTS */}
            {activeTab === "wallet" && (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Card */}
                  <div className="luxury-card p-6 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/5 via-card-bg to-card-bg border-gold/10">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[10px] text-muted uppercase tracking-wider block font-semibold">Store Wallet Balance</span>
                        <span className="text-3xl font-serif font-bold text-gold mt-1 block">
                          {(meData?.user?.walletBalance || 0).toFixed(2)} EGP
                        </span>
                      </div>
                      <div className="p-3 bg-gold/10 rounded-full text-gold">
                        <Wallet className="h-6 w-6" />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted font-light leading-relaxed">
                      Earnings are added to wallet balance once an order's fulfillment status is updated to "Delivered".
                    </p>
                  </div>

                  {/* Payout Form */}
                  <div className="luxury-card p-6">
                    <h3 className="font-serif font-bold text-base mb-4">Withdraw Store Funds</h3>
                    <form onSubmit={handlePayoutRequest} className="flex flex-col gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Amount to Withdraw (EGP)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={meData?.user?.walletBalance || 0}
                          value={payoutAmount}
                          onChange={(e) => setPayoutAmount(e.target.value)}
                          className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                          placeholder="e.g. 500"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isRequestingPayout || !payoutAmount}
                        className="w-full h-9 bg-gold text-luxury-white hover:bg-gold-hover rounded text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        {isRequestingPayout ? "Requesting Withdrawal..." : "Withdraw Funds"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Ledger Log */}
                <div className="luxury-card p-6">
                  <h3 className="font-serif font-bold text-base mb-4">Earning Logs & Payout History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Ledger Action</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Details</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activities.filter((act: any) => act.action.includes("earnings") || act.action.includes("payout")).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-8 text-center text-muted font-light">
                              No financial logs recorded.
                            </td>
                          </tr>
                        ) : (
                          activities
                            .filter((act: any) => act.action.includes("earnings") || act.action.includes("payout"))
                            .map((act: any, i: number) => (
                              <tr key={i} className="border-b border-card-border/50">
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                      act.action.includes("request")
                                        ? "text-error bg-error/10"
                                        : "text-success bg-success/10"
                                    }`}
                                  >
                                    {act.action}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-muted leading-relaxed truncate max-w-[350px]" title={act.details}>
                                  {act.details}
                                </td>
                                <td className="py-3 px-3 text-muted text-right">{new Date(act.createdAt).toLocaleString()}</td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 5. STORE SETTINGS */}
            {activeTab === "settings" && (
              <div className="luxury-card p-6 bg-card-bg">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-serif text-xl font-bold">Store Branding & Details</h2>
                    <p className="text-xs text-muted mt-1 font-light">Customize how your store appears to customers on the marketplace.</p>
                  </div>
                  {meData?.user?.storeSlug && (
                    <a
                      href={`/stores/${meData.user.storeSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded border border-gold hover:bg-gold/10 text-gold px-4 text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Live Store
                    </a>
                  )}
                </div>

                <form onSubmit={handleUpdateStoreProfile} className="flex flex-col gap-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Store Name */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Store Name</label>
                      <input
                        type="text"
                        required
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        placeholder="e.g. Diamond Luxury Store"
                      />
                    </div>

                    {/* Brand Name */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Brand / Company Name</label>
                      <input
                        type="text"
                        required
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        placeholder="e.g. Diamond Co."
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Country / Headquarters</label>
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                        placeholder="e.g. Egypt"
                      />
                    </div>

                    {/* Response Time */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Average Customer Response Time</label>
                      <select
                        value={responseTime}
                        onChange={(e) => setResponseTime(e.target.value)}
                        className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold text-foreground"
                      >
                        <option value="Within a few hours">Within a few hours</option>
                        <option value="Within 24 hours">Within 24 hours</option>
                        <option value="Within 48 hours">Within 48 hours</option>
                        <option value="Within a week">Within a week</option>
                      </select>
                    </div>
                  </div>

                  {/* Logo and Cover Upload Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 border border-card-border/40 rounded-2xl bg-card-bg/40 backdrop-blur-sm">
                    {/* Logo Upload Card */}
                    <div className="flex flex-col gap-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Store Logo</label>
                      <div className="flex items-center gap-5 p-4 rounded-xl border border-dashed border-card-border bg-background/50 hover:border-gold/50 transition-all duration-300">
                        <div className="relative h-20 w-20 rounded-full border-2 border-gold bg-background overflow-hidden shadow-md shrink-0 group">
                          <img
                            src={storeLogo || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                            alt="Store Logo"
                            className="h-full w-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                          {isUploadingLogo && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <p className="text-[11px] text-muted leading-relaxed font-light">
                            Recommend square shape (PNG/JPG). Max 2MB.
                          </p>
                          <label className="inline-flex items-center justify-center gap-1.5 h-8 rounded border border-gold hover:bg-gold/10 text-gold px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors max-w-max">
                            <Upload className="h-3 w-3" /> Upload Logo
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={isUploadingLogo}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Cover Upload Card */}
                    <div className="flex flex-col gap-3">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">Store Cover Banner</label>
                      <div className="flex flex-col gap-3 p-4 rounded-xl border border-dashed border-card-border bg-background/50 hover:border-gold/50 transition-all duration-300 justify-between min-h-[114px]">
                        <div className="relative h-14 w-full rounded-lg border border-card-border bg-background overflow-hidden group">
                          <img
                            src={storeCover || "https://via.placeholder.com/800x300"}
                            alt="Store Cover"
                            className="h-full w-full object-cover saturate-[0.6] group-hover:saturate-[0.9] transition-all duration-500"
                          />
                          {isUploadingCover && (
                            <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-[11px] text-muted font-light leading-none">
                            Aspect ratio 3:1 recommended. Max 5MB.
                          </p>
                          <label className="inline-flex items-center justify-center gap-1.5 h-8 rounded border border-gold hover:bg-gold/10 text-gold px-4 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors shrink-0">
                            <Upload className="h-3 w-3" /> Upload Cover
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleCoverUpload}
                              disabled={isUploadingCover}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Description */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Store Description</label>
                    <textarea
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      rows={4}
                      className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold resize-none"
                      placeholder="Tell customers about your store, brands, specialties and values..."
                    />
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="inline-flex h-11 items-center justify-center rounded bg-gold hover:bg-gold-hover text-luxury-white px-8 text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {isUpdatingProfile ? "Saving Settings..." : "Save Settings"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. EDITORIAL ARTICLES */}
            {activeTab === "articles" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-serif text-xl font-bold">Your Editorial Articles</h2>
                    <p className="text-xs text-muted mt-1 font-light">Compose lifestyle blogs, storyboards, and editorial listings to promote your brand.</p>
                  </div>
                  <button
                    onClick={openCreateArticleModal}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded bg-gold hover:bg-gold-hover text-luxury-white px-4 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" /> Create Article
                  </button>
                </div>

                <div className="luxury-card p-6 bg-card-bg">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-card-border">
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Article Title</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Category</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Status</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider">Performance</th>
                          <th className="py-2.5 px-3 font-semibold text-muted uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!myArticlesData?.articles || myArticlesData.articles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-muted font-light animate-pulse">
                              You haven't composed any articles yet. Click "Create Article" to write your first brand story.
                            </td>
                          </tr>
                        ) : (
                          myArticlesData.articles.map((art: any) => (
                            <tr key={art._id} className="border-b border-card-border/50 hover:bg-muted-light/10 transition-colors">
                              <td className="py-4 px-3">
                                <span className="font-bold text-foreground block truncate max-w-[200px]">{art.title}</span>
                                <span className="text-[9px] text-muted block italic mt-0.5">{art.subtitle || "No subtitle"}</span>
                              </td>
                              <td className="py-4 px-3 text-muted">{art.category}</td>
                              <td className="py-4 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    art.status === "approved"
                                      ? "text-success bg-success/10"
                                      : art.status === "pending"
                                        ? "text-gold bg-gold/10"
                                        : art.status === "rejected"
                                          ? "text-error bg-error/10"
                                          : "text-muted bg-muted-light/20"
                                  }`}
                                >
                                  {art.status}
                                </span>
                                {art.status === "rejected" && art.rejectionReason && (
                                  <span className="block text-[10px] text-error font-light mt-1 max-w-[180px] break-words" title={art.rejectionReason}>
                                    Reason: {art.rejectionReason}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-3 text-muted">
                                <span className="block font-semibold">{art.views || 0} Views</span>
                                <span className="text-[10px] block mt-0.5">{art.likes?.length || 0} Likes</span>
                              </td>
                              <td className="py-4 px-3 text-right">
                                <div className="flex justify-end gap-2.5">
                                  <button
                                    onClick={() => openEditArticleModal(art)}
                                    className="p-1 hover:text-gold text-muted transition-colors rounded cursor-pointer"
                                    title="Edit Article"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteArticleAction(art._id)}
                                    className="p-1 hover:text-error text-muted transition-colors rounded cursor-pointer"
                                    title="Delete Article"
                                  >
                                    <Trash2 className="h-4 w-4" />
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
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ARTICLE COMPOSE & EDIT DIALOG MODAL */}
      {showArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card-bg border border-card-border rounded-lg max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-serif font-bold text-xl mb-6 text-foreground">
              {editingArticleId ? "Edit Brand Editorial Article" : "Compose Brand Editorial Article"}
            </h3>

            <form onSubmit={handleSaveArticle} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Article Title</label>
                  <input
                    type="text"
                    required
                    value={artTitle}
                    onChange={(e) => setArtTitle(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                    placeholder="e.g. The Craftsmanship of Diamond Settings"
                  />
                </div>

                {/* Subtitle */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Subtitle / Brief Summary</label>
                  <input
                    type="text"
                    value={artSubtitle}
                    onChange={(e) => setArtSubtitle(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                    placeholder="Short summary detailing the main editorial hook"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Editorial Category</label>
                  <select
                    value={artCategory}
                    onChange={(e) => setArtCategory(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold text-foreground"
                  >
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Collections">Curated Collections</option>
                    <option value="Luxury Watch">Luxury Watch</option>
                    <option value="Brand Story">Brand Story</option>
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Tags (Comma Separated)</label>
                  <input
                    type="text"
                    value={artTags}
                    onChange={(e) => setArtTags(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                    placeholder="e.g. diamonds, jewelry, design"
                  />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Article Body Content</label>
                <textarea
                  rows={10}
                  required
                  value={artContent}
                  onChange={(e) => setArtContent(e.target.value)}
                  className="w-full rounded border border-card-border bg-background p-4 text-xs outline-none focus:border-gold resize-none leading-relaxed"
                  placeholder="Write article details here. You can use markdown syntax..."
                />
              </div>

              {/* Cover Image Upload */}
              <div className="border border-dashed border-card-border rounded p-4 text-center hover:border-gold transition-colors relative cursor-pointer mt-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArtFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="h-6 w-6 text-gold/60" />
                  <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Select Article Cover Image</span>
                  <span className="text-[9px] text-muted font-light">
                    {artFile ? artFile.name : "Drag and drop, or browse folder (Optional)"}
                  </span>
                </div>
              </div>

              {/* Status Choice */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Submission Action</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="artStatus"
                      value="pending"
                      checked={artStatus === "pending"}
                      onChange={() => setArtStatus("pending")}
                      className="text-gold focus:ring-gold"
                    />
                    Submit for Admin Approval & Publication
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="artStatus"
                      value="draft"
                      checked={artStatus === "draft"}
                      onChange={() => setArtStatus("draft")}
                      className="text-gold focus:ring-gold"
                    />
                    Save as Personal Draft
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowArticleModal(false)}
                  className="px-5 py-2 border border-card-border rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingArticle || isUpdatingArticle}
                  className="px-6 py-2 bg-gold text-luxury-white hover:bg-gold-hover rounded font-semibold uppercase tracking-wider text-[10px] cursor-pointer"
                >
                  {isCreatingArticle || isUpdatingArticle ? "Saving..." : "Save Article"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* PRODUCT LISTING DIALOG MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-luxury-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-card-bg border border-card-border rounded-lg max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-xl mb-6 text-foreground">
              {editingProdId ? "Edit Product Details" : "Create New Product Listing"}
            </h3>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Product Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                    placeholder="e.g. Signature Gold Filigree Signet"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">SKU Number</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-mono"
                    placeholder="e.g. RING-GOLD-FIL-01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Description</label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded border border-card-border bg-background p-3 text-xs outline-none focus:border-gold leading-relaxed"
                  placeholder="Provide details about the design heritage, dimensions, gemstones..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none text-foreground"
                  >
                    {!categoriesData?.categories ? (
                      <option value="">Loading categories...</option>
                    ) : (
                      categoriesData.categories.map((cat: any) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Subcategory</label>
                  <select
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none text-foreground"
                  >
                    <option value="">No Subcategory</option>
                    {subcategoriesList.map((sub: any) => (
                      <option key={sub._id} value={sub._id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Brand / Atelier Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                    placeholder="e.g. Khan el-Khalili"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">List Price (EGP)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold font-bold"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Compare Price (Optional Discount Reference)</label>
                  <input
                    type="number"
                    min={0}
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold text-muted"
                    placeholder="3000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">Search Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full rounded border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-gold"
                  placeholder="gold, signet, ring, luxury, cairo"
                />
              </div>

              {/* Specifications manager */}
              <div className="border border-card-border rounded p-3 bg-muted-light/10">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">Specifications / Details Grid</span>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={specName}
                    onChange={(e) => setSpecName(e.target.value)}
                    placeholder="Name (e.g. Weight)"
                    className="w-1/2 rounded border border-card-border bg-background px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    placeholder="Value (e.g. 12 grams)"
                    className="w-1/2 rounded border border-card-border bg-background px-2.5 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecification}
                    className="px-3 bg-foreground text-background rounded hover:bg-gold hover:text-luxury-white"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {specifications.map((spec, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-card-bg border border-card-border px-2 py-0.5 rounded">
                      <span className="font-semibold">{spec.name}:</span> {spec.value}
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecification(i)}
                        className="text-error font-bold hover:scale-110 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Upload Images - create workflow only */}
              {!editingProdId && (
                <div className="border border-dashed border-card-border rounded p-4 text-center hover:border-gold transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    <Upload className="h-6 w-6 text-gold/60" />
                    <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">Select Product Images (Max 5)</span>
                    <span className="text-[9px] text-muted font-light">
                      {selectedFiles ? `${selectedFiles.length} files selected` : "Drag and drop, or browse folder"}
                    </span>
                  </div>
                </div>
              )}

              <label className="flex items-center gap-2 text-xs mt-2">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="rounded border-card-border text-gold focus:ring-gold"
                />
                Publish directly to store catalog
              </label>

              <div className="flex gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-5 py-2 border border-card-border rounded font-semibold uppercase tracking-wider text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2 bg-gold text-luxury-white hover:bg-gold-hover rounded font-semibold uppercase tracking-wider text-[10px]"
                >
                  {isCreating || isUpdating ? "Saving..." : "Save Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
