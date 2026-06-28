"use client";

import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { Sparkles, Heart, Shield, Gem, Award, Users, Globe, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-gold/20">
      <Header />

      <main className="flex-grow">
        {/* Breadcrumbs Container */}
        <div className="mx-auto max-w-7xl w-full px-6 pt-6">
          <Breadcrumbs items={[{ label: t("aboutAtelier"), url: "/about" }]} />
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-28 text-center border-b border-card-border">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />
          
          <div className="mx-auto max-w-4xl px-6 relative z-10">
            <span className="text-xs font-bold tracking-widest text-gold uppercase flex items-center justify-center gap-1.5 mb-4 animate-fade-in">
              <Sparkles className="h-4 w-4" /> {t("ourEditorialPhilosophy")}
            </span>
            <h1 className="font-serif text-4xl md:text-6xl font-extrabold max-w-3xl mx-auto leading-tight tracking-tight">
              {t("craftingStandardOf")} <span className="text-gold font-light italic">{t("luxury")}</span>
            </h1>
            <p className="text-base md:text-lg text-muted max-w-2xl mx-auto mt-6 leading-relaxed font-light">
              {t("heroDescription")}
            </p>
          </div>
        </section>

        {/* The Story Section (Split Layout) */}
        <section className="py-20 bg-card/30 border-b border-card-border">
          <div className="mx-auto max-w-7xl w-full px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">{t("theGenesis")}</span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold">{t("whereHeritageMeetsInnovation")}</h2>
              <p className="text-sm text-muted leading-relaxed font-light">
                {t("storyParagraph1")}
              </p>
              <p className="text-sm text-muted leading-relaxed font-light">
                {t("storyParagraph2")}
              </p>
            </div>
            {/* Placeholder for an Elegant Image */}
            <div className="relative aspect-[4/3] w-full bg-gradient-to-tr from-card-border to-card rounded-lg overflow-hidden border border-card-border shadow-2xl flex items-center justify-center group">
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />
              <span className="text-xs tracking-widest text-muted/60 uppercase font-serif">{t("studioLocation")}</span>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-20 mx-auto max-w-7xl w-full px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="font-serif text-3xl font-bold mb-4">{t("ourCorePillars")}</h2>
            <p className="text-xs text-muted font-light">{t("pillarsDescription")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="luxury-card p-8 flex flex-col gap-4 border border-card-border rounded-xl bg-card hover:border-gold/30 transition-all duration-300 shadow-sm">
              <div className="p-3 bg-gold/5 w-fit rounded-lg">
                <Gem className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl">{t("masterArtistry")}</h3>
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
                {t("masterArtistryDesc")}
              </p>
            </div>

            <div className="luxury-card p-8 flex flex-col gap-4 border border-card-border rounded-xl bg-card hover:border-gold/30 transition-all duration-300 shadow-sm">
              <div className="p-3 bg-gold/5 w-fit rounded-lg">
                <Shield className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl">{t("secureEscrowVaults")}</h3>
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
                {t("secureEscrowVaultsDesc")}
              </p>
            </div>

            <div className="luxury-card p-8 flex flex-col gap-4 border border-card-border rounded-xl bg-card hover:border-gold/30 transition-all duration-300 shadow-sm">
              <div className="p-3 bg-gold/5 w-fit rounded-lg">
                <Heart className="h-6 w-6 text-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl">{t("sustainedHeritage")}</h3>
              <p className="text-xs md:text-sm text-muted font-light leading-relaxed">
                {t("sustainedHeritageDesc")}
              </p>
            </div>
          </div>
        </section>

        {/* Brand Statistics / Accomplishments */}
        <section className="py-16 bg-card border-y border-card-border">
          <div className="mx-auto max-w-7xl w-full px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="font-serif text-3xl md:text-4xl font-bold text-gold">2026</div>
              <div className="text-xs text-muted uppercase tracking-wider font-medium">{t("established")}</div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-3xl md:text-4xl font-bold text-gold">45+</div>
              <div className="text-xs text-muted uppercase tracking-wider font-medium">{t("artisansCurated")}</div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-3xl md:text-4xl font-bold text-gold">1.2k</div>
              <div className="text-xs text-muted uppercase tracking-wider font-medium">{t("globalCollectors")}</div>
            </div>
            <div className="space-y-1">
              <div className="font-serif text-3xl md:text-4xl font-bold text-gold">100%</div>
              <div className="text-xs text-muted uppercase tracking-wider font-medium">{t("ethicalSourcing")}</div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 text-center relative overflow-hidden">
          <div className="mx-auto max-w-3xl px-6 relative z-10 space-y-6">
            <h2 className="font-serif text-3xl md:text-5xl font-bold">{t("experienceTrueExclusivity")}</h2>
            <p className="text-sm text-muted max-w-lg mx-auto font-light leading-relaxed">
              {t("ctaDescription")}
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <a href="/categories" className="bg-foreground text-background px-6 py-3 rounded-full text-xs font-semibold tracking-wider hover:bg-foreground/90 transition-colors inline-flex items-center gap-2">
                {t("browseCollection")} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a href="/contact" className="border border-card-border px-6 py-3 rounded-full text-xs font-semibold tracking-wider hover:bg-card transition-colors">
                {t("contactConcierge")}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}