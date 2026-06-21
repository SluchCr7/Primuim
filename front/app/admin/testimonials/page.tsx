"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, 
  X, 
  Trash2, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle,
  Loader2,
  Lock,
  ArrowLeft
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useToast } from "../../components/Toast";
import { useAppSelector } from "../../../lib/store";
import { API_BASE_URL } from "../../../lib/api";

interface TestimonialUser {
  _id: string;
  name: string;
  email: string;
  avatar?: {
    url: string;
  };
}

interface Testimonial {
  _id: string;
  User: TestimonialUser;
  body: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export default function AdminTestimonialsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [mounted, setMounted] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // Status counts for metrics
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    approved: 0
  });

  // Action loading states by testimonial ID
  const [actionLoading, setActionLoading] = useState<Record<string, "approve" | "reject" | "delete" | null>>({});

  // Delete modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Tab filter
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Hydration tracking & Security redirection
  useEffect(() => {
    setMounted(true);
    if (mounted && (!isAuthenticated || user?.role !== "admin")) {
      showToast("Access Denied. Admins only.", "error");
      router.push("/dashboard");
    }
  }, [isAuthenticated, user, router, mounted]);

  // Fetch metrics (all testimonials to count status types)
  const fetchMetrics = async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials?limit=1000&adminView=true`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        const data: Testimonial[] = result.data || [];
        const pendingCount = data.filter(t => t.status === "pending").length;
        const approvedCount = data.filter(t => t.status === "approved").length;
        setMetrics({
          total: data.length,
          pending: pendingCount,
          approved: approvedCount
        });
      }
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  // Fetch paginated testimonials
  const fetchTestimonials = async (page: number) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/testimonials?page=${page}&limit=6&adminView=true`,
        {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        }
      );
      if (response.ok) {
        const result = await response.json();
        setTestimonials(result.data || []);
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1);
          setHasPrevPage(result.pagination.hasPrevPage || false);
          setHasNextPage(result.pagination.hasNextPage || false);
          setCurrentPage(result.pagination.currentPage || 1);
        }
      } else {
        showToast("Failed to fetch testimonials.", "error");
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      showToast("Network error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && isAuthenticated && user?.role === "admin" && accessToken) {
      fetchMetrics();
      fetchTestimonials(currentPage);
    }
  }, [mounted, isAuthenticated, user, accessToken, currentPage]);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    if (!accessToken) return;
    
    // Set action loading state
    setActionLoading(prev => ({ ...prev, [id]: status === "approved" ? "approve" : "reject" }));

    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status })
      });

      const resData = await response.json();

      if (response.ok) {
        showToast(`Testimonial status updated to ${status} successfully!`, "success");
        // Update local list
        setTestimonials(prev => 
          prev.map(item => item._id === id ? { ...item, status } : item)
        );
        fetchMetrics();
      } else {
        showToast(resData.message || "Failed to update status.", "error");
      }
    } catch (error) {
      showToast("Network error during status update.", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleDeleteTestimonial = async () => {
    if (!deleteId || !accessToken) return;

    setActionLoading(prev => ({ ...prev, [deleteId]: "delete" }));
    setDeleteId(null); // Close modal

    try {
      const response = await fetch(`${API_BASE_URL}/testimonials/${deleteId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      });

      const resData = await response.json();

      if (response.ok) {
        showToast("Testimonial deleted successfully.", "success");
        // Re-fetch current page or update local state
        setTestimonials(prev => prev.filter(item => item._id !== deleteId));
        fetchMetrics();
        // If current page is now empty and not the first page, go back a page
        if (testimonials.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          fetchTestimonials(currentPage);
        }
      } else {
        showToast(resData.message || "Failed to delete testimonial.", "error");
      }
    } catch (error) {
      showToast("Network error during testimonial deletion.", "error");
    } finally {
      setActionLoading(prev => ({ ...prev, [deleteId]: null }));
    }
  };

  // Helper for generating user initials placeholder
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map(part => part.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Filter list locally for smoother UX, fallback to default page content
  const filteredTestimonials = testimonials.filter(item => {
    if (statusFilter === "all") return true;
    return item.status === statusFilter;
  });

  if (!mounted || !isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 py-20">
          <Lock className="h-12 w-12 text-amber-500 animate-pulse" />
          <h2 className="text-xl font-serif tracking-widest text-zinc-400 uppercase">Verifying Authorization...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        {/* Breadcrumb / Back Navigation */}
        <div className="mb-8">
          <button 
            onClick={() => router.push("/admin")} 
            className="group inline-flex items-center gap-2 text-xs font-semibold text-amber-500/80 hover:text-amber-500 transition-colors uppercase tracking-[0.2em] cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </button>
        </div>

        {/* Header section */}
        <div className="mb-12">
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] block mb-2">Administrative Console</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-100 tracking-tight">Testimonial Moderation</h1>
          <p className="text-sm text-zinc-400 font-light mt-2 max-w-xl leading-relaxed">
            Review client-submitted testimonials, moderate approval status, or permanently remove reviews from output filters.
          </p>
        </div>

        {/* Metrics Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Total Submissions</p>
              <h3 className="text-3xl font-serif font-bold text-zinc-100 mt-2">{metrics.total}</h3>
            </div>
            <div className="p-3 bg-zinc-800/50 rounded-2xl border border-zinc-700/50">
              <MessageSquare className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="absolute right-0 top-0 h-full w-1 bg-zinc-700"></div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Pending Review</p>
              <div className="flex items-baseline gap-3 mt-2">
                <h3 className="text-3xl font-serif font-bold text-zinc-100">{metrics.pending}</h3>
                {metrics.pending > 0 && (
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </span>
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-950/20 rounded-2xl border border-amber-900/20">
              <Clock className="h-6 w-6 text-amber-500" />
            </div>
            <div className="absolute right-0 top-0 h-full w-1 bg-amber-500"></div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Approved Reviews</p>
              <h3 className="text-3xl font-serif font-bold text-emerald-400 mt-2">{metrics.approved}</h3>
            </div>
            <div className="p-3 bg-emerald-950/20 rounded-2xl border border-emerald-900/20">
              <CheckCircle className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500"></div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="mb-8 flex flex-wrap gap-2.5 border-b border-zinc-800 pb-5">
          {(["all", "pending", "approved", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border cursor-pointer ${
                statusFilter === status
                  ? "bg-amber-500 text-zinc-950 border-amber-500 shadow-md shadow-amber-500/10"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-100 hover:border-zinc-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Testimonials List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-3xl h-[280px] animate-pulse" />
            ))}
          </div>
        ) : filteredTestimonials.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
            <MessageSquare className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-serif font-bold text-zinc-400">No Testimonials</h3>
            <p className="text-xs text-zinc-500 font-light mt-1">There are no client testimonials matching this status.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredTestimonials.map((item) => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col justify-between h-full group hover:border-zinc-700/80 transition-colors"
                >
                  <div>
                    {/* User info row */}
                    <div className="flex items-center gap-4 mb-5">
                      <div className="h-10 w-10 rounded-full border border-zinc-800 bg-zinc-800 flex items-center justify-center text-xs font-bold text-amber-500 overflow-hidden shrink-0">
                        {item.User?.avatar?.url ? (
                          <img 
                            src={item.User.avatar.url} 
                            alt={item.User.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(item.User?.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-200 truncate">{item.User?.name || "Anonymous User"}</h4>
                        <p className="text-xs text-zinc-400 font-light truncate">{item.User?.email}</p>
                      </div>
                    </div>

                    {/* Blockquote Body */}
                    <blockquote className="relative bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/40 text-xs font-light text-zinc-300 leading-relaxed italic mb-5 flex-grow">
                      "{item.body}"
                    </blockquote>
                  </div>

                  <div>
                    {/* Date and Status Badge Row */}
                    <div className="flex items-center justify-between border-t border-zinc-800/60 pt-4 mb-4">
                      <span className="text-[10px] text-zinc-500 font-light">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>

                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        item.status === "pending"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : item.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {item.status === "pending" && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        )}
                        {item.status}
                      </span>
                    </div>

                    {/* Action buttons panel */}
                    <div className="flex gap-2">
                      {item.status !== "approved" && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, "approved")}
                          disabled={actionLoading[item._id] !== undefined && actionLoading[item._id] !== null}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 border border-emerald-500/25 disabled:opacity-40 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                          title="Approve Review"
                        >
                          {actionLoading[item._id] === "approve" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" /> Approve
                            </>
                          )}
                        </button>
                      )}

                      {item.status !== "rejected" && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, "rejected")}
                          disabled={actionLoading[item._id] !== undefined && actionLoading[item._id] !== null}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 bg-amber-500/5 text-amber-500/80 hover:bg-amber-500 hover:text-zinc-950 border border-amber-500/20 disabled:opacity-40 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                          title="Reject Review"
                        >
                          {actionLoading[item._id] === "reject" ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5" /> Reject
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteId(item._id)}
                        disabled={actionLoading[item._id] !== undefined && actionLoading[item._id] !== null}
                        className="inline-flex items-center justify-center bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-zinc-950 border border-rose-500/20 disabled:opacity-40 p-2 rounded-xl transition-all duration-200 cursor-pointer"
                        title="Delete Review"
                      >
                        {actionLoading[item._id] === "delete" ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && !loading && (
          <div className="mt-12 flex justify-center items-center gap-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!hasPrevPage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={!hasNextPage}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-all cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>

      <Footer />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-zinc-200">Delete Testimonial?</h3>
                  <p className="text-xs text-zinc-400 font-light mt-1.5 leading-relaxed">
                    This action is permanent and cannot be undone. The client's review will be permanently deleted from our database.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTestimonial}
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-zinc-950 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Permanently Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
