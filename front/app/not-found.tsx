"use client";

import React from "react";
import Link from "next/link";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { motion } from "framer-motion";
import { Compass, ArrowLeft, Home, Search, ShoppingBag, MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-background to-background">
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

        <div className="w-full max-w-2xl text-center flex flex-col items-center gap-8 z-10">
          
          {/* Animated Emblem */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-[0_0_30px_rgba(197,168,128,0.15)]">
              <Compass className="h-10 w-10 animate-[spin_12s_linear_infinite]" />
            </div>
            {/* Outer rings */}
            <div className="absolute -inset-4 rounded-full border border-dashed border-card-border animate-[spin_40s_linear_infinite]" />
            <div className="absolute -inset-8 rounded-full border border-gold/5 animate-[spin_60s_linear_infinite_reverse]" />
          </motion.div>

          {/* Typography */}
          <div className="flex flex-col gap-3">
            <motion.span
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xs font-bold tracking-widest text-gold uppercase"
            >
              Error 404 &bull; Lost in Splendor
            </motion.span>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="font-serif text-4xl md:text-5xl font-extrabold tracking-tight"
            >
              The Page Has <span className="italic text-gold">Vanished</span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm text-muted max-w-md mx-auto mt-2 leading-relaxed font-light"
            >
              Like a limited-edition run, the salon or showcase you are seeking is either temporary, relocated, or no longer exists.
            </motion.p>
          </div>

          {/* Interactive Navigation Hub */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-left"
          >
            <Link
              href="/"
              className="luxury-card p-4 flex items-center gap-4 hover:border-gold group transition-all"
            >
              <div className="rounded bg-gold/10 p-2.5 text-gold group-hover:bg-gold group-hover:text-luxury-white transition-colors">
                <Home className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Main Lobby</h3>
                <p className="text-[11px] text-muted mt-0.5">Return to the editorial homepage</p>
              </div>
            </Link>

            <Link
              href="/products"
              className="luxury-card p-4 flex items-center gap-4 hover:border-gold group transition-all"
            >
              <div className="rounded bg-gold/10 p-2.5 text-gold group-hover:bg-gold group-hover:text-luxury-white transition-colors">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Browse Catalog</h3>
                <p className="text-[11px] text-muted mt-0.5">Explore our curated collections</p>
              </div>
            </Link>

            <Link
              href="/cart"
              className="luxury-card p-4 flex items-center gap-4 hover:border-gold group transition-all"
            >
              <div className="rounded bg-gold/10 p-2.5 text-gold group-hover:bg-gold group-hover:text-luxury-white transition-colors">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Shopping Cart</h3>
                <p className="text-[11px] text-muted mt-0.5">Review items in your private bag</p>
              </div>
            </Link>

            <Link
              href="/contact"
              className="luxury-card p-4 flex items-center gap-4 hover:border-gold group transition-all"
            >
              <div className="rounded bg-gold/10 p-2.5 text-gold group-hover:bg-gold group-hover:text-luxury-white transition-colors">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Support Concierge</h3>
                <p className="text-[11px] text-muted mt-0.5">Speak with a client assistant</p>
              </div>
            </Link>
          </motion.div>

          {/* Quick Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-6"
          >
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted hover:text-gold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to previous page
            </button>
          </motion.div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
