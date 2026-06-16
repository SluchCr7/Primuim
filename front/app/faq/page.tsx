"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { Plus, Minus, HelpCircle } from "lucide-react";

export default function FAQPage() {
  const faqs = [
    {
      q: "Are all items on your portal authentic?",
      a: "Yes, every single piece in our curation catalog is audited, certified, and sourced directly from whitelisted partner designers or authorized distribution houses. Every order includes a signed authenticity document.",
    },
    {
      q: "What local payment options do you support in Egypt?",
      a: "We support Stripe (international card processing), Fawry (at any neighborhood retail outlet), Vodafone Cash mobile wallet transfers, and Cash on Delivery (COD) via our courier agents.",
    },
    {
      q: "How does the escrow payment system work?",
      a: "For all electronic transactions, funds are authorized and held in escrow state. Allocation is confirmed to you immediately, and the payment is settled only once your bespoke courier logs delivery verification.",
    },
    {
      q: "What is your refund policy?",
      a: "We offer a 14-day return window for luxury home decor and couture. Customized jewelry or digital downloads are final sale. Refunds can be requested as store credit (Loyalty Wallet) or chargeback.",
    },
    {
      q: "Can I track my delivery transit?",
      a: "Absolutely. Once the order leaves the designer studio, you will receive real-time notifications in your dashboard. Bespoke Express delivery takes 1-2 days, Cairo metro area takes 3-5 days.",
    },
  ];

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Support FAQ", url: "/faq" }]} />

        <div className="mb-12 text-center">
          <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center justify-center gap-1.5">
            <HelpCircle className="h-4 w-4" /> Concierge Support
          </span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Frequently Asked Questions</h1>
          <p className="text-sm text-muted mt-2">Find instant answers about allocations, logistics, and wallets</p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <div
                key={idx}
                className="luxury-card overflow-hidden bg-card-bg/40 hover:border-gold/30 transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex justify-between items-center p-5 font-serif font-bold text-base text-left outline-none focus-visible:ring-1 focus-visible:ring-gold"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <Minus className="h-4 w-4 text-gold flex-shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-gold flex-shrink-0" />
                  )}
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-muted font-light leading-relaxed border-t border-card-border/30 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
