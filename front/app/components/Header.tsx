"use client";

import React, { useState, useEffect, useRef } from "react";
import LinkNext from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useAppDispatch, useAppSelector } from "../../lib/store";
import { logOut, setCurrency } from "../../lib/authSlice";
import {
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetSearchSuggestionsQuery,
  useGetTrendingSearchesQuery,
  useLogoutMutation,
  useGetWishlistQuery,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation,
} from "../../lib/api";
import { useTranslation } from "react-i18next";
import "../i18next"; // تأكد من ضبط المسار الصحيح لملف i18next.ts الخاص بك
import {
  ShoppingBag,
  User,
  Search,
  Sun,
  Moon,
  LogOut,
  Sliders,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Heart,
  Globe,
  Bell,
  AlertTriangle,
  Star,
  BookOpen,
  Info,
  Check,
  Sparkles
} from "lucide-react";

import { getGuestCartTotals } from "../../lib/cartUtils";
import Flag from 'react-world-flags';
import { languages } from "@/lib/data";

export const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation(); // <-- أضف هذا السطر هنا

  
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const { user, isAuthenticated, currency } = useAppSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  
  // لغة افتراضية من المصفوفة
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  const { data: categoriesData } = useGetCategoriesQuery({ tree: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Notifications state
  const socketConnected = useAppSelector((state) => state.auth.socketConnected);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const notificationsDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);
  
  const [logoutCall] = useLogoutMutation();
  // تحديث الـ State لتقرأ اللغة الحالية المخزنة أو الافتراضية بالـ UpperCase
  const [currentLangCode, setCurrentLangCode] = useState(
    i18n.language ? i18n.language.toUpperCase() : "EN"
  );
  
  // لضمان تزامن الـ State لو تم تغيير اللغة من أي مكان آخر أو عند أول تحميل
  useEffect(() => {
    if (i18n.language) {
      setCurrentLangCode(i18n.language.toUpperCase());
      
      // كود إضافي اختياري: لقلب اتجاه الصفحة تلقائياً RTL / LTR بناءً على اللغة
      const dir = i18n.language === "ar" ? "rtl" : "ltr";
      document.documentElement.dir = dir;
      document.documentElement.lang = i18n.language;
    }
  }, [i18n.language]);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      const updateCount = () => {
        const { totalItems } = getGuestCartTotals();
        setGuestCartCount(totalItems);
      };
      updateCount();
      window.addEventListener("guest-cart-updated", updateCount);
      return () => window.removeEventListener("guest-cart-updated", updateCount);
    }
  }, [isAuthenticated]);

  const suggestionsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const { data: suggestionsData } = useGetSearchSuggestionsQuery(debouncedQuery, {
    skip: debouncedQuery.trim().length < 2,
  });

  const { data: trendingSearchesData } = useGetTrendingSearchesQuery(undefined, {
    skip: !showSuggestions,
  });

  const { data: notificationsData } = useGetNotificationsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [markAsReadCall] = useMarkNotificationAsReadMutation();
  const [markAllAsReadCall] = useMarkAllNotificationsAsReadMutation();

  const notifications = notificationsData?.notifications || [];
  const unreadNotificationsCount = notificationsData?.unreadCount || 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target as Node)) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    return `${diffDay}d ago`;
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutCall(undefined).unwrap();
      dispatch(logOut());
      router.push("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  const cartItemsCount = isAuthenticated ? (cartData?.cart?.totalItems ?? 0) : guestCartCount;

  // إيجاد بيانات اللغة الحالية المختارة لعرض علمها واسمها في الهيدر
  const activeLanguage = languages.find(l => l.value === currentLangCode) || languages[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border/50 bg-background/70 backdrop-blur-md transition-all duration-300">
      
      {/* MAIN HEADER BAR */}
      <div className="mx-auto flex h-20 max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* LOGO */}
        <LinkNext href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/luxury_store_logo.png" alt="PREMIUM Logo" className="h-8 w-8 object-contain rounded-md border border-gold/30" />
          <span className="font-serif text-2xl sm:text-3xl font-black tracking-[0.25em] text-gold hover:opacity-90 transition-opacity">
            PREMIUM
          </span>
        </LinkNext>

        {/* SEARCH BAR (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-full max-w-md lg:max-w-xl mx-4 lg:mx-8">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder={t('header.search_placeholder', 'Search catalog, luxury designers...')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-full border border-card-border/80 bg-card-bg/30 py-2.5 pl-6 pr-12 text-sm text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all duration-300"
            />
            <button type="submit" className="absolute right-4 text-muted hover:text-gold transition-colors duration-200" aria-label={t('header.search_aria', 'Submit search')}>
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 mt-2 w-full rounded-2xl border border-card-border bg-card-bg/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-1 duration-200"
            >
              {/* Case 1: Empty input -> Show Trending Searches */}
              {!searchQuery.trim() && trendingSearchesData?.trending && trendingSearchesData.trending.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-bold text-gold/80 tracking-wider uppercase flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5" /> {t('search.trending_title', 'Trending Searches')}
                  </div>
                  <div className="flex flex-wrap gap-2 px-3 pb-2">
                    {trendingSearchesData.trending.map((t: any, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSearchQuery(t.term);
                          setShowSuggestions(false);
                          router.push(`/products?search=${encodeURIComponent(t.term)}`);
                        }}
                        className="rounded-full bg-foreground/5 hover:bg-gold/10 hover:text-gold border border-card-border/50 px-3.5 py-1.5 text-xs font-semibold text-foreground transition-all duration-200 cursor-pointer"
                      >
                        {t.term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Case 2: Active input and we have suggestions */}
              {searchQuery.trim().length >= 2 && suggestionsData?.suggestions ? (
                (() => {
                  const suggestions = suggestionsData.suggestions || { products: [], keywords: [] };
                  const hasProducts = Array.isArray(suggestions.products) && suggestions.products.length > 0;
                  const hasKeywords = Array.isArray(suggestions.keywords) && suggestions.keywords.length > 0;

                  if (!hasProducts && !hasKeywords) {
                    return (
                      <div className="text-center py-6 text-xs text-muted">
                        {t('search.no_results_title', 'No matches found')} for "{searchQuery}"
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Keywords Column */}
                      {hasKeywords && (
                        <div className="md:col-span-1 border-r border-card-border/40 pr-4">
                          <div className="px-2 py-1 text-xs font-bold text-gold/80 tracking-wider uppercase mb-2">
                            {t('search.suggestions_title', 'Suggested Matches')}
                          </div>
                          <ul className="space-y-1">
                            {suggestions.keywords.map((item: any, idx: number) => (
                              <li key={idx}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchQuery(item.title);
                                    setShowSuggestions(false);
                                    router.push(`/products?search=${encodeURIComponent(item.title)}`);
                                  }}
                                  className="w-full text-left rounded-xl px-3 py-2 text-xs font-medium text-foreground hover:bg-foreground/5 hover:text-gold transition-all duration-150 flex items-center gap-2"
                                >
                                  <Search className="h-3 w-3 text-muted/60" />
                                  {item.title}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Products Column */}
                      {hasProducts && (
                        <div className={`${hasKeywords ? 'md:col-span-2' : 'md:col-span-3'}`}>
                          <div className="px-2 py-1 text-xs font-bold text-gold/80 tracking-wider uppercase mb-2">
                            {t('compare.title', 'Matching Products')}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {suggestions.products.map((p: any) => (
                              <LinkNext
                                key={p.id}
                                href={p.url}
                                onClick={() => setShowSuggestions(false)}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/5 group transition-all duration-200 border border-transparent hover:border-card-border/30"
                              >
                                <div className="w-12 h-12 rounded-lg bg-card-bg border border-card-border/60 overflow-hidden flex-shrink-0 relative">
                                  {p.image ? (
                                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-[10px] text-muted font-bold">PREMIUM</div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-grow">
                                  <div className="text-xs font-bold text-foreground truncate group-hover:text-gold transition-colors">{p.title}</div>
                                  {p.brand && <div className="text-[10px] text-muted truncate">{p.brand}</div>}
                                  <div className="text-xs font-black text-gold mt-1">
                                    {p.price.toLocaleString()} EGP
                                    {p.comparePrice && p.comparePrice > p.price && (
                                      <span className="text-[10px] text-muted line-through font-normal ml-1.5">
                                        {p.comparePrice.toLocaleString()} EGP
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </LinkNext>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : searchQuery.trim().length >= 2 ? (
                <div className="text-center py-6 text-xs text-muted">
                  Searching suggestions...
                </div>
              ) : null}
            </div>
          )}
        </form>

        {/* CONTROLS & ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-2.5">
          
          {/* MOBILE SEARCH REDIRECT */}
          <button 
            onClick={() => router.push('/products')} 
            className="md:hidden rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* CUSTOM LANGUAGE SELECTOR (احترافي ومطابق للعملة) */}
          <div className="relative hidden md:flex" ref={langDropdownRef}>
            <button
              onClick={() => { setShowLangDropdown(!showLangDropdown); setShowCurrencyDropdown(false); }}
              className="flex items-center gap-1.5 border border-card-border/50 hover:border-gold rounded-full px-3 py-1.5 text-xs font-bold text-foreground bg-card-bg/10 hover:bg-card-bg/30 transition-all cursor-pointer"
            >
              <div className="w-4 h-3 overflow-hidden rounded-[2px] flex items-center shadow-sm">
                <Flag code={activeLanguage?.flag || 'US'} className="w-full h-full object-cover" />
              </div>
              <span className="uppercase tracking-wider">{activeLanguage?.label || 'EN'}</span>
              <ChevronDown className={`h-3 w-3 text-muted transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-card-border bg-card-bg p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      i18n.changeLanguage(lang.value.toLowerCase()); // <-- سطر التغيير الفعلي
                      setCurrentLangCode(lang.value);
                      setShowLangDropdown(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all hover:bg-foreground/5 ${currentLangCode === lang.value ? 'text-gold bg-gold/5' : 'text-foreground'}`}
                  >
                    <div className="w-4 h-3 overflow-hidden rounded-[2px] flex items-center shrink-0 shadow-sm">
                      <Flag code={lang.flag} className="w-full h-full object-cover" />
                    </div>
                    <span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM CURRENCY SELECTOR */}
          <div className="relative hidden md:flex" ref={currencyDropdownRef}>
            <button
              onClick={() => { setShowCurrencyDropdown(!showCurrencyDropdown); setShowLangDropdown(false); }}
              className="flex items-center gap-1 border border-card-border/50 hover:border-gold rounded-full px-3 py-1.5 text-xs font-bold text-foreground bg-card-bg/10 hover:bg-card-bg/30 transition-all cursor-pointer"
            >
              <span className="tracking-wider">{currency}</span>
              <ChevronDown className={`h-3 w-3 text-muted transition-transform duration-200 ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showCurrencyDropdown && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl border border-card-border bg-card-bg p-1 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {["EGP", "USD", "EUR"].map((cur) => (
                  <button
                    key={cur}
                    onClick={() => {
                      dispatch(setCurrency(cur as any));
                      setShowCurrencyDropdown(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-xs font-semibold rounded-lg text-left transition-all hover:bg-foreground/5 ${currency === cur ? 'text-gold bg-gold/5' : 'text-foreground'}`}
                  >
                    {cur} {cur === "EGP" ? "(L.E)" : cur === "USD" ? "($)" : "(€)"}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* THEME TOGGLER */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 text-foreground hover:bg-foreground/5 transition-all w-9 h-9 flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-gold" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-muted" />
              )
            ) : (
              <div className="h-4.5 w-4.5" />
            )}
          </button>
            
          {/* WISHLIST */}
          <LinkNext
            href="/wishlist"
            className="relative rounded-full p-2 text-foreground hover:bg-foreground/5 transition-all"
            aria-label="Wishlist"
          >
            <Heart className="h-4.5 w-4.5 text-foreground hover:text-gold transition-colors" />
            {isAuthenticated && wishlistData?.wishlist && wishlistData.wishlist.length > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[8px] font-black text-white ring-2 ring-background animate-pulse">
                {wishlistData.wishlist.length}
              </span>
            )}
          </LinkNext>

          {/* SHOPPING CART */}
          <LinkNext
            href="/cart"
            className="relative rounded-full p-2 text-foreground hover:bg-foreground/5 transition-all"
          >
            <ShoppingBag className="h-4.5 w-4.5 text-foreground" />
            {cartItemsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[8px] font-black text-white ring-2 ring-background">
                {cartItemsCount}
              </span>
            )}
          </LinkNext>

          {/* NOTIFICATION BELL */}
          {isAuthenticated && (
            <div className="relative" ref={notificationsDropdownRef}>
              <button
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  setShowUserMenu(false);
                  setShowLangDropdown(false);
                  setShowCurrencyDropdown(false);
                }}
                className="relative rounded-full p-2 text-foreground hover:bg-foreground/5 transition-all w-9 h-9 flex items-center justify-center cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-4.5 w-4.5 text-foreground hover:text-gold transition-colors" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gold text-[8px] font-black text-white ring-2 ring-background animate-pulse">
                    {unreadNotificationsCount}
                  </span>
                )}
                {/* Socket Connection Status Dot */}
                <span 
                  className={`absolute bottom-0.5 left-0.5 block h-2 w-2 rounded-full ring-1 ring-background ${
                    socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`} 
                  title={socketConnected ? "Real-time Connected" : "Disconnected / Reconnecting"} 
                />
              </button>

              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-card-border bg-card-bg p-2 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-card-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="font-serif text-sm font-bold text-foreground">{t('dashboard.notifications', 'Notifications')}</span>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                      <span className="text-[9px] uppercase tracking-wider text-muted font-sans font-semibold">
                        {socketConnected ? "Live" : "Offline"}
                      </span>
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        onClick={async () => {
                          try {
                            await markAllAsReadCall(undefined).unwrap();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="text-[10px] font-bold text-gold hover:underline cursor-pointer"
                      >
                        {t('dashboard.mark_all_read', 'Mark all as read')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-muted">
                        {t('dashboard.no_notifications', 'No notifications yet')}
                      </div>
                    ) : (
                      <div className="divide-y divide-card-border/20">
                        {notifications.slice(0, 5).map((notif: any) => (
                          <div
                            key={notif._id}
                            onClick={async () => {
                              if (!notif.isread) {
                                try {
                                  await markAsReadCall(notif._id).unwrap();
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                              setShowNotificationsDropdown(false);
                              router.push("/notifications");
                            }}
                            className={`flex items-start gap-3 p-3 hover:bg-foreground/5 cursor-pointer transition-all duration-150 ${!notif.isread ? 'bg-gold/5' : ''}`}
                          >
                            <div className="flex-shrink-0 mt-0.5">
                              {notif.type === "order" && (
                                <div className="p-1.5 rounded-lg bg-success/10 text-success">
                                  <ShoppingBag className="h-3.5 w-3.5" />
                                </div>
                              )}
                              {notif.type === "stock" && (
                                <div className="p-1.5 rounded-lg bg-error/10 text-error">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                </div>
                              )}
                              {notif.type === "review" && (
                                <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                                  <Star className="h-3.5 w-3.5" />
                                </div>
                              )}
                              {notif.type === "article" && (
                                <div className="p-1.5 rounded-lg bg-info/10 text-info">
                                  <BookOpen className="h-3.5 w-3.5" />
                                </div>
                              )}
                              {notif.type === "system" && (
                                <div className="p-1.5 rounded-lg bg-foreground/10 text-foreground">
                                  <Info className="h-3.5 w-3.5" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-grow">
                              <div className="flex items-center justify-between gap-1">
                                <span className={`text-xs font-bold truncate ${!notif.isread ? 'text-foreground' : 'text-foreground/80'}`}>
                                  {notif.title}
                                </span>
                                <span className="text-[9px] text-muted whitespace-nowrap shrink-0">
                                  {formatRelativeTime(notif.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted leading-relaxed mt-0.5 line-clamp-2">
                                {notif.message}
                              </p>
                            </div>

                            {!notif.isread && (
                              <div className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 self-center"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-card-border/40 p-1">
                    <LinkNext
                      href="/notifications"
                      onClick={() => setShowNotificationsDropdown(false)}
                      className="flex w-full items-center justify-center py-2 text-xs font-bold text-foreground hover:text-gold hover:bg-foreground/5 rounded-xl transition-all"
                    >
                      {t('dashboard.view_all_notifications', 'View All Notifications')}
                    </LinkNext>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* USER ACCOUNT DROPDOWN (Desktop) */}
          <div className="relative hidden md:block" ref={userMenuRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full border border-card-border bg-card-bg/20 px-4 py-2 hover:border-gold hover:bg-card-bg transition-all duration-300"
                >
                  <User className="h-4 w-4 text-gold" />
                  <span className="text-xs font-bold text-foreground max-w-[90px] truncate">
                    {user?.username}
                  </span>
                  <ChevronDown className={`h-3 w-3 text-muted transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-card-border bg-card-bg p-2 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <LinkNext
                      href="/dashboard"
                      onClick={() => setShowUserMenu(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5 transition-all"
                    >
                      <User className="h-4 w-4 text-muted" />
                      {t('header.dashboard', 'My Dashboard')}
                    </LinkNext>
                    {user?.role === "admin" && (
                      <LinkNext
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gold bg-gold/5 hover:bg-gold/10 transition-all font-bold"
                      >
                        <Sliders className="h-4 w-4" />
                        {t('header.admin_panel', 'Admin Panel')}
                      </LinkNext>
                    )}
                    <hr className="border-card-border/40 my-1.5" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-all text-left font-medium"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('header.logout', 'Sign Out')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <LinkNext
                href="/login"
                className="rounded-full bg-foreground px-5 py-2 text-xs font-bold text-background hover:bg-gold hover:text-white transition-all duration-300 shadow-sm block"
              >
                {t('header.login', 'Sign In')}
              </LinkNext>
            )}
          </div>

          {/* MOBILE MENU TRIGGER */}
          <button 
            className="rounded-full p-2 text-foreground hover:bg-foreground/5 transition-all md:hidden w-9 h-9 flex items-center justify-center" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
        
      {/* LUXURY MEGA MENU NAVIGATION (Desktop) */}
      <nav 
        ref={navRef}
        className="border-t w-full border-card-border/30 bg-background/20 hidden md:block"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="mx-auto flex max-w-9xl w-full items-center justify-between px-8 py-0.5 text-sm">
          <div className="flex items-center gap-6 h-12">
            <LinkNext href="/products" className="text-foreground text-xs hover:text-gold transition-colors font-bold relative h-full flex items-center">
              {t('header.all_categories', 'All Collections')}
            </LinkNext>
            <LinkNext href="/stores" className="text-foreground text-xs hover:text-gold transition-colors font-bold relative h-full flex items-center">
              {t('nav.stores', 'Flagship Stores')}
            </LinkNext>
            
            {categoriesData?.categories &&
              categoriesData.categories.map((cat: any) => (
                <div 
                  key={cat._id}
                  className="h-full flex items-center"
                  onMouseEnter={() => setActiveMegaMenu(cat._id)}
                >
                  <LinkNext
                    href={`/products?category=${cat._id}`}
                    className={`text-foreground/90 text-xs hover:text-gold transition-colors h-full flex items-center font-semibold relative ${activeMegaMenu === cat._id ? 'text-gold' : ''}`}
                  >
                    {cat.name}
                    {activeMegaMenu === cat._id && (
                      <span className="absolute bottom-0 left-0 w-full h-[3px] bg-gold rounded-full animate-in fade-in duration-200"></span>
                    )}
                  </LinkNext>
                </div>
              ))}
          </div>
        </div>

        {/* Dynamic Mega Menu Dropdown */}
        {activeMegaMenu && categoriesData?.categories && (
          (() => {
            const currentCat = categoriesData.categories.find((c: any) => c._id === activeMegaMenu);
            if (!currentCat || !currentCat.subcategories || currentCat.subcategories.length === 0) return null;

            return (
              <div className="absolute left-0 w-full bg-card-bg/95 backdrop-blur-2xl border-b border-card-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="mx-auto max-w-9xl p-8 grid grid-cols-4 gap-8">
                  {currentCat.subcategories.map((sub: any) => (
                    <div key={sub._id} className="space-y-3">
                      <LinkNext 
                        href={`/products?category=${sub._id}`}
                        className="font-bold text-foreground hover:text-gold text-base block border-b border-card-border/40 pb-1"
                      >
                        {sub.name}
                      </LinkNext>
                      
                      {sub.subcategories && sub.subcategories.length > 0 && (
                        <ul className="space-y-2">
                          {sub.subcategories.map((deepSub: any) => (
                            <li key={deepSub._id}>
                              <LinkNext 
                                href={`/products?category=${deepSub._id}`}
                                className="text-sm text-muted hover:text-gold font-medium transition-colors"
                              >
                                {deepSub.name}
                              </LinkNext>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  <div className="col-span-1 bg-gradient-to-br from-gold/10 to-transparent rounded-2xl p-6 flex flex-col justify-between border border-gold/10">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-gold tracking-wide">{t('header.seasonal_drop', 'Seasonal Drop')}</h4>
                      <p className="text-xs text-muted mt-1">{t('header.seasonal_desc', 'Explore carefully tailored artisanal aesthetics.')}</p>
                    </div>
                    <LinkNext href="/products" className="text-xs font-bold underline text-foreground hover:text-gold flex items-center gap-1 mt-4">
                      {t('footer.new_arrivals', 'Shop New Arrivals')} <ArrowRight className="h-3 w-3" />
                    </LinkNext>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </nav>

      {/* MOBILE SLIDEOUT DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[80px] bg-background/95 backdrop-blur-2xl border-b border-card-border shadow-2xl z-40 p-5 space-y-6 animate-in slide-in-from-top duration-300 max-h-[calc(100vh-6rem)] overflow-y-auto">
          
          {/* Mobile Auth & Account links */}
          <div className="border-b border-card-border/40 pb-4">
            {isAuthenticated ? (
              <div className="bg-card-bg/60 border border-card-border/50 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-black text-gold uppercase tracking-widest">{t('header.account', 'Account Details')}</div>
                <div className="text-sm font-bold text-foreground truncate">{t('common.user', 'User')}: {user?.username}</div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <LinkNext href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-background border border-card-border text-xs font-semibold hover:text-gold">
                    <User className="h-4 w-4 text-gold" /> {t('header.dashboard', 'Dashboard')}
                  </LinkNext>
                  <LinkNext href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-background border border-card-border text-xs font-semibold hover:text-gold">
                    <Heart className="h-4 w-4 text-gold" /> {t('header.wishlist', 'Wishlist')}
                  </LinkNext>
                  {user?.role === "admin" && (
                    <LinkNext href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold/10 text-xs font-bold text-gold col-span-2">
                      <Sliders className="h-4 w-4" /> {t('header.admin_panel', 'Admin Panel')}
                    </LinkNext>
                  )}
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-center py-2.5 text-xs font-bold text-destructive bg-destructive/5 rounded-xl border border-destructive/10 mt-1">
                  {t('header.logout', 'Sign Out')}
                </button>
              </div>
            ) : (
              <LinkNext
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-foreground py-3.5 text-sm font-bold text-background block shadow-md hover:bg-gold hover:text-white transition-all"
              >
                {t('header.login_to_account', 'Sign In to Account')}
              </LinkNext>
            )}
          </div>

          {/* REGIONAL SETTINGS (Language & Currency - Row Layout) */}
          <div className="grid grid-cols-2 gap-4 border-b border-card-border/40 pb-5">
            
            {/* MOBILE LANGUAGE SELECTOR */}
            <div className="relative" ref={langDropdownRef}>
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5 px-1">{t('header.language', 'Language')}</div>
              <button
                onClick={() => { setShowLangDropdown(!showLangDropdown); setShowCurrencyDropdown(false); }}
                className="flex w-full items-center justify-between border border-card-border/60 hover:border-gold rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground bg-card-bg/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 overflow-hidden rounded-[2px] flex items-center shadow-sm shrink-0">
                    <Flag code={activeLanguage?.flag || 'US'} className="w-full h-full object-cover" />
                  </div>
                  <span className="uppercase tracking-wider">{activeLanguage?.label || 'EN'}</span>
                </div>
                <ChevronDown className={`h-3 w-3 text-muted transition-transform duration-200 ${showLangDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showLangDropdown && (
                <div className="absolute left-0 mt-2 w-full rounded-xl border border-card-border bg-card-bg p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        i18n.changeLanguage(lang.value.toLowerCase()); // <-- سطر التغيير الفعلي
                        setCurrentLangCode(lang.value);
                        setShowLangDropdown(false);
                      }}
                      className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold rounded-lg text-left transition-all ${currentLangCode === lang.value ? 'text-gold bg-gold/5 font-bold' : 'text-foreground hover:bg-foreground/5'}`}
                    >
                      <div className="w-4 h-3 overflow-hidden rounded-[2px] flex items-center shrink-0 shadow-sm">
                        <Flag code={lang.flag} className="w-full h-full object-cover" />
                      </div>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* MOBILE CURRENCY SELECTOR */}
            <div className="relative" ref={currencyDropdownRef}>
              <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1.5 px-1">{t('header.currency', 'Currency')}</div>
              <button
                onClick={() => { setShowCurrencyDropdown(!showCurrencyDropdown); setShowLangDropdown(false); }}
                className="flex w-full items-center justify-between border border-card-border/60 hover:border-gold rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground bg-card-bg/20 transition-all cursor-pointer"
              >
                <span className="tracking-wider uppercase">{currency}</span>
                <ChevronDown className={`h-3 w-3 text-muted transition-transform duration-200 ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCurrencyDropdown && (
                <div className="absolute right-0 mt-2 w-full rounded-xl border border-card-border bg-card-bg p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {["EGP", "USD", "EUR"].map((cur) => (
                    <button
                      key={cur}
                      onClick={() => {
                        dispatch(setCurrency(cur as any));
                        setShowCurrencyDropdown(false);
                      }}
                      className={`flex w-full items-center px-3 py-2.5 text-xs font-semibold rounded-lg text-left transition-all ${currency === cur ? 'text-gold bg-gold/5 font-bold' : 'text-foreground hover:bg-foreground/5'}`}
                    >
                      {cur} {cur === "EGP" ? "(L.E)" : cur === "USD" ? "($)" : "(€)"}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Shop Categories (Mobile) */}
          <div>
            <div className="text-xs font-black text-muted uppercase tracking-widest mb-3 px-1">{t('header.all_categories', 'Shop Collections')}</div>
            <div className="grid grid-cols-2 gap-3">
              <LinkNext 
                href="/products" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-xl bg-card-bg/40 border border-card-border text-sm font-bold hover:border-gold transition-all"
              >
                {t('header.shop_all', 'All Products')}
              </LinkNext>
              <LinkNext 
                href="/stores" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-xl bg-card-bg/40 border border-card-border text-sm font-bold hover:border-gold transition-all"
              >
                {t('nav.stores', 'Flagship Stores')}
              </LinkNext>
              {categoriesData?.categories &&
                categoriesData.categories.map((cat: any) => (
                  <LinkNext
                    key={cat._id}
                    href={`/products?category=${cat._id}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-3.5 rounded-xl bg-card-bg/40 border border-card-border text-sm font-semibold hover:border-gold transition-all truncate"
                  >
                    {cat.name}
                  </LinkNext>
                ))}
            </div>
          </div>

        </div>
      )}
    </header>
  );
};

export default Header;