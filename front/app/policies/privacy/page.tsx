"use client";

import React from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Breadcrumbs from "../../components/Breadcrumbs";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Policies", url: "/about" },
            { label: "Privacy Policy", url: "/policies/privacy" },
          ]}
        />

        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Terms & Security</span>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold mt-1">Privacy Policy</h1>
          <p className="text-xs text-muted mt-1 font-light">Last updated: June 2026</p>
        </div>

        <div className="luxury-card p-6 md:p-8 flex flex-col gap-6 text-sm font-light leading-relaxed text-muted">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">1. Encryption & Data Safety</h3>
            <p>
              Your billing information is tokenized using PCI-compliant payment gateways (Stripe, Fawry). We never store raw credit card details or wallet PINs in our databases.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">2. Dynamic Tracking Cookies</h3>
            <p>
              We use system cookies solely to preserve active guest cart objects, track session authentication tokens, and persist dark mode theme selections.
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">3. Third Party Disclosures</h3>
            <p>
              Delivery addresses are shared strictly with certified logistic operators (DHL, Aramex) to facilitate transit tracking updates. We do not sell user profiles.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
