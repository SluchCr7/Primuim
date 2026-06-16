"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer className="w-full border-t border-card-border bg-card-bg text-foreground mt-auto">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          
          {/* BRAND COLUMN */}
          <div className="flex flex-col gap-4">
            <span className="font-serif text-xl font-bold tracking-widest text-gold">
              SHOP PREMIUM
            </span>
            <p className="text-sm text-muted leading-relaxed">
              Curating the world's finest collections with unmatched luxury design, enterprise-grade security, and absolute execution speed.
            </p>
            <div className="flex items-center gap-4 text-muted mt-2">
              <a href="#" className="hover:text-gold transition-colors" aria-label="Instagram">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Twitter">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a href="#" className="hover:text-gold transition-colors" aria-label="Facebook">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gold mb-4">Collections</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li><Link href="/new-arrivals" className="hover:text-gold transition-colors">New Arrivals</Link></li>
              <li><Link href="/best-sellers" className="hover:text-gold transition-colors">Best Sellers</Link></li>
              <li><Link href="/products?isDigital=true" className="hover:text-gold transition-colors">Digital Goods</Link></li>
              <li><Link href="/products?isBundle=true" className="hover:text-gold transition-colors">Bundled Deals</Link></li>
            </ul>
          </div>

          {/* INFORMATION & HELP */}
          <div>
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gold mb-4">SupportDesk</h4>
            <ul className="flex flex-col gap-3 text-sm text-muted">
              <li><Link href="/faq" className="hover:text-gold transition-colors">FAQ & Support</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact US</Link></li>
              <li><Link href="/policies/terms" className="hover:text-gold transition-colors">Terms of Use</Link></li>
              <li><Link href="/policies/privacy" className="hover:text-gold transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-semibold tracking-widest uppercase text-gold">Mailing List</h4>
            <p className="text-sm text-muted leading-relaxed">
              Subscribe to receive private invitations to exclusive collections and seasonal promotions.
            </p>
            
            {subscribed ? (
              <div className="rounded border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-gold">
                Thank you! You are now subscribed to our private list.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-colors"
                />
                <button
                  type="submit"
                  className="rounded bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all"
                >
                  Join Invitation List
                </button>
              </form>
            )}
          </div>

        </div>

        {/* BOTTOM METADATA */}
        <div className="border-t border-card-border mt-16 pt-8 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-muted">
          <div>
            &copy; {new Date().getFullYear()} Shop Premium Inc. All rights reserved.
          </div>
          <div className="flex gap-6">
            <span>Cairo, Egypt</span>
            <span>Secure SSL Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
