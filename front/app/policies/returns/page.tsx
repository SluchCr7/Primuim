"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function ReturnsPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Policies", url: "/about" },
            { label: "Return Policy", url: "/policies/returns" },
          ]}
        />

        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Exchanges & Refunds</span>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold mt-1">Return & Refund Policy</h1>
          <p className="text-xs text-muted mt-1 font-light">Last updated: June 2026</p>
        </div>

        <div className="luxury-card p-6 md:p-8 flex flex-col gap-6 text-sm font-light leading-relaxed text-muted">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">1. 14-Day Returns Window</h3>
            <p>
              We allow returns on eligible products within 14 days of receipt. Items must be returned in their original packaging, showing zero signs of wear or customization changes.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">2. Final Sale Exclusions</h3>
            <p>
              Custom-built jewelry, bespoke couture sizing creations, and downloaded digital assets are not subject to return or refund rights.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">3. Refund Methods</h3>
            <p>
              Approved refunds can be returned as instant store credit inside your dashboard Wallet balance or refunded to the original credit card (which can take 5-10 business bank days).
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
