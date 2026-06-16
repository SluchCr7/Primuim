"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Policies", url: "/about" },
            { label: "Terms of Use", url: "/policies/terms" },
          ]}
        />

        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Terms & Security</span>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold mt-1">Terms of Use</h1>
          <p className="text-xs text-muted mt-1 font-light">Last updated: June 2026</p>
        </div>

        <div className="luxury-card p-6 md:p-8 flex flex-col gap-6 text-sm font-light leading-relaxed text-muted">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">1. Acceptance of Terms</h3>
            <p>
              By accessing and purchasing from Shop Premium, you agree to comply with and be bound by these Terms of Use, as well as all applicable local laws and safety standards.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">2. Purchase Allocations & Sales</h3>
            <p>
              All orders are subject to stock availability and validation checks. For custom pieces, shipping timelines are estimated and may vary depending on designer queue sizes.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">3. User Conduct & Security</h3>
            <p>
              Users are responsible for maintaining the confidentiality of their profile credentials. Any unauthorized use or security alerts must be immediately reported to our concierge desk.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">4. Intellectual Property</h3>
            <p>
              The editorial photography, design systems, layouts, brand representations, and product assets displayed on this portal are protected by international trademark and copyright regulations.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
