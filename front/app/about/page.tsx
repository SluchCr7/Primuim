"use client";

import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { Sparkles, Heart, Shield, Gem } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "About Atelier", url: "/about" }]} />

        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 mb-16 text-center border-b border-card-border">
          <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4" /> Editorial Philosophy
          </span>
          <h1 className="font-serif text-5xl font-extrabold max-w-2xl mx-auto leading-tight">
            Crafting the Standard of Luxury Design
          </h1>
          <p className="text-sm text-muted max-w-xl mx-auto mt-4 leading-relaxed font-light">
            Founded in Zamalek in 2026, our boutique platform bridges custom artisans with elite global collectors. We reject fast commerce, prioritizing single-batch runs and digital assets.
          </p>
        </section>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="luxury-card p-6 flex flex-col gap-3">
            <Gem className="h-7 w-7 text-gold" />
            <h3 className="font-serif font-bold text-lg">Master Artistry</h3>
            <p className="text-xs text-muted font-light leading-relaxed">
              Every ring, vase, and couture garment on our shelves is audited under micro-specifications. We source only certified, ethical materials.
            </p>
          </div>

          <div className="luxury-card p-6 flex flex-col gap-3">
            <Shield className="h-7 w-7 text-gold" />
            <h3 className="font-serif font-bold text-lg">Secure Escrow Vaults</h3>
            <p className="text-xs text-muted font-light leading-relaxed">
              Our tokenized checkout protects collectors. Funds are settled only after delivery validations are logged by DHL agents.
            </p>
          </div>

          <div className="luxury-card p-6 flex flex-col gap-3">
            <Heart className="h-7 w-7 text-gold" />
            <h3 className="font-serif font-bold text-lg">Sustained Heritage</h3>
            <p className="text-xs text-muted font-light leading-relaxed">
              We empower local independent designers by ensuring fair margin payouts and providing secure digital marketplace access.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
