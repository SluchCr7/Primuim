"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
  useClearAllNotificationsMutation,
  useBroadcastNotificationMutation,
} from "../../lib/api";
import { useAppSelector } from "../../lib/store";
import { useToast } from "../components/Toast";
import {
  ShoppingBag,
  AlertTriangle,
  Star,
  BookOpen,
  Info,
  Trash2,
  CheckCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  BellOff,
  Megaphone,
  Radio,
  Send
} from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { isAuthenticated, user, socketConnected } = useAppSelector((state) => state.auth);
  const { showToast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");

  // Broadcast States
  const [broadcastNotification, { isLoading: isBroadcasting }] = useBroadcastNotificationMutation();
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastType, setBroadcastType] = useState("system");
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState("all");

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useGetNotificationsQuery(
    { page: currentPage, limit: 10 },
    { skip: !isAuthenticated }
  );

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [clearAllNotifications] = useClearAllNotificationsMutation();

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount || 0;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      showToast("Please fill in both title and message", "error");
      return;
    }

    try {
      await broadcastNotification({
        title: broadcastTitle,
        message: broadcastMessage,
        type: broadcastType,
        targetGroup: broadcastTargetGroup
      }).unwrap();
      showToast("Announcement broadcasted successfully!", "success");
      setBroadcastTitle("");
      setBroadcastMessage("");
    } catch (err) {
      showToast("Failed to send broadcast", "error");
    }
  };
  const totalPages = notificationsData?.pages || 1;

  // Filter notifications locally based on type
  const filteredNotifications = notifications.filter((notif: any) => {
    if (activeFilter === "all") return true;
    return notif.type === activeFilter;
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      showToast("Failed to mark notification as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(undefined).unwrap();
      showToast("All notifications marked as read", "success");
    } catch (err) {
      showToast("Failed to update notifications", "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent triggering mark-as-read click handler
    try {
      await deleteNotification(id).unwrap();
      showToast("Notification deleted", "success");
    } catch (err) {
      showToast("Failed to delete notification", "error");
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear all notifications? This cannot be undone.")) {
      try {
        await clearAllNotifications(undefined).unwrap();
        showToast("All notifications cleared", "success");
      } catch (err) {
        showToast("Failed to clear notifications", "error");
      }
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "order", label: "Orders" },
    { id: "review", label: "Reviews" },
    { id: "stock", label: "Stock" },
    { id: "article", label: "Articles" },
    { id: "system", label: "System" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-card-border/60 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
                Notification Center
              </h1>
              {isAuthenticated && (
                <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-colors duration-300 ${
                  socketConnected 
                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/25" 
                    : "bg-amber-500/10 text-amber-500 border-amber-500/25 animate-pulse"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {socketConnected ? "Live" : "Connecting"}
                </div>
              )}
            </div>
            <p className="text-sm text-muted mt-2">
              Stay updated with your orders, reviews, inventory alerts, and system activities.
            </p>
          </div>

          {isAuthenticated && notifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-2 text-xs font-bold text-gold hover:bg-gold/10 hover:border-gold transition-all duration-300 cursor-pointer"
                >
                  <CheckCheck className="h-4 w-4" /> Mark All as Read
                </button>
              )}
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/5 px-4 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 hover:border-destructive transition-all duration-300 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        {!isAuthenticated ? (
          <div className="text-center py-20 bg-card-bg/20 border border-card-border/60 rounded-3xl p-8 backdrop-blur">
            <BellOff className="h-16 w-16 text-muted mx-auto mb-4" />
            <h2 className="text-xl font-bold font-serif mb-2">Access Denied</h2>
            <p className="text-sm text-muted max-w-sm mx-auto mb-6">
              Please sign in to your premium cabinet account to view your notifications inbox.
            </p>
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-xs font-bold text-background hover:bg-gold hover:text-white transition-all"
            >
              Sign In Now
            </Link>
          </div>
        ) : (
          <div>
            {/* Admin Broadcast Announcement Section */}
            {isAuthenticated && (user?.role === "admin" || user?.role === "superadmin") && (
              <div className="mb-8 p-6 rounded-3xl border border-gold/20 bg-gold/5 backdrop-blur-md">
                <div className="flex items-center gap-2.5 mb-4">
                  <Megaphone className="h-5 w-5 text-gold animate-bounce" />
                  <h2 className="font-serif text-lg font-bold text-foreground">
                    Admin Announcement Broadcast
                  </h2>
                </div>
                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                        Announcement Title
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. System Upgrade Scheduled"
                        className="w-full h-11 px-4 rounded-xl border border-card-border bg-card-bg/40 text-xs focus:border-gold focus:outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                          Target Audience
                        </label>
                        <select
                          value={broadcastTargetGroup}
                          onChange={(e) => setBroadcastTargetGroup(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-card-border bg-card-bg/40 text-xs focus:border-gold focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="all">All Users</option>
                          <option value="sellers">Sellers Only</option>
                          <option value="buyers">Buyers/Customers Only</option>
                          <option value="admins">Admins Only</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                          Alert Category
                        </label>
                        <select
                          value={broadcastType}
                          onChange={(e) => setBroadcastType(e.target.value)}
                          className="w-full h-11 px-3 rounded-xl border border-card-border bg-card-bg/40 text-xs focus:border-gold focus:outline-none transition-all cursor-pointer"
                        >
                          <option value="system">System</option>
                          <option value="stock">Stock Alert</option>
                          <option value="order">Order Update</option>
                          <option value="article">Article Alert</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted mb-1.5">
                      Announcement Message
                    </label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Type the notification description details here..."
                      rows={3}
                      className="w-full p-4 rounded-xl border border-card-border bg-card-bg/40 text-xs focus:border-gold focus:outline-none transition-all resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isBroadcasting}
                      className="flex items-center gap-2 rounded-full bg-gold hover:bg-gold/90 text-white font-bold text-xs px-6 py-2.5 shadow-lg shadow-gold/10 hover:shadow-gold/20 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isBroadcasting ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Broadcasting...
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" /> Broadcast Announcement
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 border-b border-card-border/40 pb-4 mb-6">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveFilter(tab.id);
                    setCurrentPage(1); // Reset page on filter
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeFilter === tab.id
                      ? "bg-gold text-white shadow-md shadow-gold/10"
                      : "bg-card-bg/50 text-muted border border-card-border/40 hover:text-foreground hover:bg-card-bg"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-20 w-full animate-pulse rounded-2xl border border-card-border bg-card-bg/30"
                  />
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-16 bg-card-bg/10 border border-card-border/40 rounded-3xl p-6">
                <BellOff className="h-12 w-12 text-muted/60 mx-auto mb-3" />
                <h3 className="text-base font-bold font-serif text-foreground">No Notifications</h3>
                <p className="text-xs text-muted max-w-xs mx-auto mt-1">
                  You don't have any notifications under the "{filterTabs.find(t => t.id === activeFilter)?.label}" filter.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notif: any) => (
                  <div
                    key={notif._id}
                    onClick={() => {
                      if (!notif.isread) {
                        handleMarkAsRead(notif._id);
                      }
                    }}
                    className={`flex items-start gap-4 p-5 rounded-2xl border border-card-border/80 bg-card-bg/40 hover:bg-card-bg/70 hover:border-gold/30 transition-all duration-200 cursor-pointer relative group ${
                      !notif.isread ? "border-l-4 border-l-gold bg-gold/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      {notif.type === "order" && (
                        <div className="p-2.5 rounded-xl bg-success/15 text-success">
                          <ShoppingBag className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {notif.type === "stock" && (
                        <div className="p-2.5 rounded-xl bg-error/15 text-error">
                          <AlertTriangle className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {notif.type === "review" && (
                        <div className="p-2.5 rounded-xl bg-gold/15 text-gold">
                          <Star className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {notif.type === "article" && (
                        <div className="p-2.5 rounded-xl bg-info/15 text-info">
                          <BookOpen className="h-4.5 w-4.5" />
                        </div>
                      )}
                      {notif.type === "system" && (
                        <div className="p-2.5 rounded-xl bg-foreground/10 text-foreground">
                          <Info className="h-4.5 w-4.5" />
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-grow pr-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
                        <span className={`text-sm font-bold text-foreground`}>
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-muted shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-relaxed mt-1.5">
                        {notif.message}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={(e) => handleDelete(notif._id, e)}
                        className="p-2 rounded-xl text-muted hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-card-border/40 mt-8 pt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-full border border-card-border bg-card-bg/20 text-xs font-bold text-foreground hover:bg-card-bg disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <span className="text-xs text-muted">
                  Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong>
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-full border border-card-border bg-card-bg/20 text-xs font-bold text-foreground hover:bg-card-bg disabled:opacity-40 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
