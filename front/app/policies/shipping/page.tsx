"use client";

import React from "react";
import Breadcrumbs from "../../components/Breadcrumbs";
import { useTranslation } from "react-i18next";

export default function ShippingPolicyPage() {
  const { t } = useTranslation(); // تفعيل دالة الترجمة
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">

      <main className="flex-grow mx-auto max-w-3xl w-full px-6 py-12">
        <Breadcrumbs
          items={[
            { label: "Policies", url: "/about" },
            { label: "Shipping Policy", url: "/policies/shipping" },
          ]}
        />

        <div className="mb-10">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">{t("Logistics & Transit")}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-extrabold mt-1">{t("Shipping & Transit Policy")}</h1>
          <p className="text-xs text-muted mt-1 font-light">{t("Last updated: June 2026")}</p>
        </div>

        <div className="luxury-card p-6 md:p-8 flex flex-col gap-6 text-sm font-light leading-relaxed text-muted">
          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">{t("1. Bespoke Courier Delivery")}</h3>
            <p>
              {t("Standard courier orders within the Cairo & Giza metropolitan areas are delivered within 3-5 business days. Express shipping delivers custom studio pieces in 1-2 days")}
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">{t("2. Free Allocation Threshold")}</h3>
            <p>
              {t("To maintain luxury standards, standard shipping is complimentary for order subtotals exceeding 10,000 EGP. Orders below this threshold incur a flat rate of 250 EGP.")}
            </p>
          </div>

          <div>
            <h3 className="font-serif font-bold text-base text-foreground mb-2">{t("3. Digital Deliveries")}</h3>
            <p>
              {t("Digital products (source files, blueprints, certificates) are not subject to shipping fees and are instantly whitelisted for download in the customer account dashboard upon payment confirmation.")}
            </p>
          </div>
        </div>
      </main>

    </div>
  );
}
