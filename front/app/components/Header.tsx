"use client";

import React, { useState, useEffect, useRef } from "react";
import LinkNext from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/ThemeContext";
import { useAppDispatch, useAppSelector } from "../../lib/store";
import { logOut } from "../../lib/authSlice";
import {
  useGetCartQuery,
  useGetCategoriesQuery,
  useGetSearchSuggestionsQuery,
  useLogoutMutation,
  useGetWishlistQuery,
} from "../../lib/api";
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
  BookOpen,
  Info,
  ArrowRight,
  Heart
} from "lucide-react";

import { getGuestCartTotals } from "../../lib/cartUtils";

export const Header: React.FC = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { data: cartData } = useGetCartQuery(undefined, { skip: !isAuthenticated });
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !isAuthenticated });
  
  // جلب التصنيفات كـ Tree شجرية مجهزة من الـ Backend
  const { data: categoriesData } = useGetCategoriesQuery({ tree: true });

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const [logoutCall] = useLogoutMutation();

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
  const navRef = useRef<HTMLElement>(null);

  const { data: suggestionsData } = useGetSearchSuggestionsQuery(searchQuery, {
    skip: searchQuery.trim().length < 2,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border/50 bg-background/70 backdrop-blur-md transition-all duration-300">
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="w-full bg-foreground text-background py-2 px-4 text-center text-xs font-medium tracking-wider uppercase select-none flex items-center justify-center gap-2">
        <span>✨ Free worldwide shipping on luxury orders over $150</span>
        <ArrowRight className="h-3 w-3 inline" />
      </div>

      {/* 2. MAIN HEADER BAR */}
      <div className="mx-auto flex h-20 max-w-9xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        
        {/* LOGO */}
        <LinkNext href="/" className="flex items-center gap-2.5 shrink-0">
          <img src="/luxury_store_logo.png" alt="PREMIUM Logo" className="h-8 w-8 object-contain rounded-md border border-gold/30" />
          <span className="font-serif text-2xl sm:text-3xl font-black tracking-[0.25em] text-gold hover:opacity-90 transition-opacity">
            PREMIUM
          </span>
        </LinkNext>

        {/* SEARCH BAR (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-full max-w-md lg:max-w-xl mx-8">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Search catalog, luxury designers..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full rounded-full border border-card-border/80 bg-card-bg/30 py-2.5 pl-6 pr-12 text-sm text-foreground outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all duration-300"
            />
            <button type="submit" className="absolute right-4 text-muted hover:text-gold transition-colors duration-200">
              <Search className="h-4 w-4" />
            </button>
          </div>

          {/* SUGGESTIONS DROPDOWN */}
          {showSuggestions && suggestionsData?.suggestions && suggestionsData.suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 mt-2 w-full rounded-2xl border border-card-border bg-card-bg/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="px-3 py-1.5 text-xs font-bold text-gold/80 tracking-wider uppercase">
                Suggested Matches
              </div>
              <ul className="space-y-0.5 mt-1">
                {suggestionsData.suggestions.map((item: string, idx: number) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery(item);
                        setShowSuggestions(false);
                        router.push(`/products?search=${encodeURIComponent(item)}`);
                      }}
                      className="w-full text-left rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-foreground/5 hover:text-gold transition-all duration-150 flex items-center gap-2"
                    >
                      <Search className="h-3.5 w-3.5 text-muted/60" />
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>

        {/* CONTROLS & CONTROLLER ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-3">
          
          {/* MOBILE SEARCH REDIRECT */}
          <button 
            onClick={() => router.push('/products')} 
            className="md:hidden rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* THEME TOGGLER */}
          <button
            onClick={toggleTheme}
            className="rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            {mounted ? (
              resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5 text-gold" />
              ) : (
                <Moon className="h-5 w-5 text-muted" />
              )
            ) : (
              <div className="h-5 w-5" />
            )}
          </button>
            
          {/* WISHLIST */}
          <LinkNext
            href="/wishlist"
            className="relative rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all mr-1"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5 text-foreground hover:text-gold transition-colors" />
            {isAuthenticated && wishlistData?.wishlist && wishlistData.wishlist.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-black text-white ring-2 ring-background animate-pulse">
                {wishlistData.wishlist.length}
              </span>
            )}
          </LinkNext>

          {/* SHOPPING CART */}
          <LinkNext
            href="/cart"
            className="relative rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all"
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {cartItemsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-black text-white ring-2 ring-background">
                {cartItemsCount}
              </span>
            )}
          </LinkNext>

          {/* USER ACCOUNT DROPDOWN */}
          <div className="relative hidden sm:block" ref={userMenuRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full border border-card-border bg-card-bg/20 px-4 py-2 hover:border-gold hover:bg-card-bg transition-all duration-300"
                >
                  <User className="h-4 w-4 text-gold" />
                  <span className="text-sm font-semibold text-foreground max-w-[90px] truncate">
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
                      My Dashboard
                    </LinkNext>
                    {user?.role === "admin" && (
                      <LinkNext
                        href="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-gold bg-gold/5 hover:bg-gold/10 transition-all font-bold"
                      >
                        <Sliders className="h-4 w-4" />
                        Admin Panel
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
                      Sign Out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <LinkNext
                href="/login"
                className="rounded-full bg-foreground px-6 py-2.5 text-sm font-bold text-background hover:bg-gold hover:text-white transition-all duration-300 shadow-sm block"
              >
                Sign In
              </LinkNext>
            )}
          </div>

          {/* MOBILE MENU TRIGGER */}
          <button 
            className="rounded-full p-2.5 text-foreground hover:bg-foreground/5 transition-all md:hidden" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
        
      {/* 3. LUXURY MEGA MENU NAVIGATION (Desktop) */}
      <nav 
        ref={navRef}
        className="border-t w-full border-card-border/30 bg-background/20 hidden md:block"
        onMouseLeave={() => setActiveMegaMenu(null)}
      >
        <div className="mx-auto flex max-w-9xl w-full items-center justify-between px-8 py-0.5 text-sm">
          
          {/* Main Links */}
          <div className="flex items-center gap-8 h-12">
            <LinkNext href="/products" className="text-foreground hover:text-gold transition-colors font-bold relative h-full flex items-center">
              All Collections
            </LinkNext>
            <LinkNext href="/stores" className="text-foreground hover:text-gold transition-colors font-bold relative h-full flex items-center">
              Flagship Stores
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
                    className={`text-foreground/90 hover:text-gold transition-colors h-full flex items-center font-semibold relative ${activeMegaMenu === cat._id ? 'text-gold' : ''}`}
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
                      
                      {/* Sub-subcategories (Level 2) */}
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

                  {/* Luxury Promo Banner inside the Mega Menu */}
                  <div className="col-span-1 bg-gradient-to-br from-gold/10 to-transparent rounded-2xl p-6 flex flex-col justify-between border border-gold/10">
                    <div>
                      <h4 className="font-serif text-lg font-bold text-gold tracking-wide">Seasonal Drop</h4>
                      <p className="text-xs text-muted mt-1">Explore carefully tailored artisanal aesthetics.</p>
                    </div>
                    <LinkNext href="/products" className="text-xs font-bold underline text-foreground hover:text-gold flex items-center gap-1 mt-4">
                      Shop New Arrivals <ArrowRight className="h-3 w-3" />
                    </LinkNext>
                  </div>

                </div>
              </div>
            );
          })()
        )}
      </nav>

      {/* 4. MOBILE SLIDEOUT DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[112px] bg-background/95 backdrop-blur-2xl border-b border-card-border shadow-2xl z-40 p-5 space-y-6 animate-in slide-in-from-top duration-300 max-h-[calc(100vh-7rem)] overflow-y-auto">
          
          {/* Mobile Auth */}
          <div className="sm:hidden border-b border-card-border/40 pb-4">
            {isAuthenticated ? (
              <div className="bg-card-bg/60 border border-card-border/50 rounded-2xl p-4 space-y-3">
                <div className="text-[10px] font-black text-gold uppercase tracking-widest">Account Details</div>
                <div className="text-sm font-bold text-foreground truncate">User: {user?.username}</div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <LinkNext href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-background border border-card-border text-xs font-semibold hover:text-gold">
                    <User className="h-4 w-4 text-gold" /> Dashboard
                  </LinkNext>
                  <LinkNext href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-background border border-card-border text-xs font-semibold hover:text-gold">
                    <Heart className="h-4 w-4 text-gold" /> Wishlist
                  </LinkNext>
                  {user?.role === "admin" && (
                    <LinkNext href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gold/10 text-xs font-bold text-gold col-span-2">
                      <Sliders className="h-4 w-4" /> Admin
                    </LinkNext>
                  )}
                </div>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full text-center py-2.5 text-xs font-bold text-destructive bg-destructive/5 rounded-xl border border-destructive/10 mt-1">
                  Sign Out
                </button>
              </div>
            ) : (
              <LinkNext
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center rounded-xl bg-foreground py-3.5 text-sm font-bold text-background block shadow-md"
              >
                Sign In to Account
              </LinkNext>
            )}
          </div>
          
          {/* Shop Categories (Mobile) */}
          <div>
            <div className="text-xs font-black text-muted uppercase tracking-widest mb-3 px-1">Shop Collections</div>
            <div className="grid grid-cols-2 gap-3">
              <LinkNext 
                href="/products" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-xl bg-card-bg/40 border border-card-border text-sm font-bold hover:border-gold transition-all"
              >
                All Products
              </LinkNext>
              <LinkNext 
                href="/stores" 
                onClick={() => setMobileMenuOpen(false)}
                className="p-3.5 rounded-xl bg-card-bg/40 border border-card-border text-sm font-bold hover:border-gold transition-all"
              >
                Flagship Stores
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