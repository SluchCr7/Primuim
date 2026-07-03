"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";

/* ─────────────────────────────────────────────────────────────────────────────
   Inline SVG icon helpers (no extra dependency needed)
───────────────────────────────────────────────────────────────────────────── */

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Trust / Payment badge icons (SVG paths)
───────────────────────────────────────────────────────────────────────────── */

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
  </svg>
);

const HeadphonesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 shrink-0" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Payment method logos (minimal SVG representations)
───────────────────────────────────────────────────────────────────────────── */

const VisaLogo = () => (
  <svg viewBox="0 0 48 16" className="h-5" aria-label="Visa" fill="none">
    <rect width="48" height="16" rx="3" fill="currentColor" fillOpacity={0.08} />
    <text x="50%" y="11" textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="Arial" fill="currentColor" letterSpacing="1">VISA</text>
  </svg>
);

const MastercardLogo = () => (
  <svg viewBox="0 0 40 26" className="h-5" aria-label="Mastercard">
    <rect width="40" height="26" rx="3" fill="currentColor" fillOpacity={0.08} />
    <circle cx="15" cy="13" r="7" fill="#EB001B" fillOpacity={0.85} />
    <circle cx="25" cy="13" r="7" fill="#F79E1B" fillOpacity={0.85} />
    <path d="M20 7.5a7 7 0 010 11 7 7 0 010-11z" fill="#FF5F00" fillOpacity={0.9} />
  </svg>
);

const PaypalLogo = () => (
  <svg viewBox="0 0 60 16" className="h-5" aria-label="PayPal" fill="none">
    <rect width="60" height="16" rx="3" fill="currentColor" fillOpacity={0.08} />
    <text x="50%" y="11" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial" fill="#003087" letterSpacing="0.5">PayPal</text>
  </svg>
);

const ApplePayLogo = () => (
  <svg viewBox="0 0 56 16" className="h-5" aria-label="Apple Pay" fill="none">
    <rect width="56" height="16" rx="3" fill="currentColor" fillOpacity={0.08} />
    <text x="50%" y="11" textAnchor="middle" fontSize="6.5" fontWeight="600" fontFamily="Arial" fill="currentColor" letterSpacing="0.3"> Pay</text>
  </svg>
);

const StripeLogo = () => (
  <svg viewBox="0 0 48 16" className="h-5" aria-label="Stripe" fill="none">
    <rect width="48" height="16" rx="3" fill="currentColor" fillOpacity={0.08} />
    <text x="50%" y="11" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial" fill="#635BFF" letterSpacing="0.3">stripe</text>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Data
───────────────────────────────────────────────────────────────────────────── */

const socialLinks = [
  { label: "Instagram", href: "https://instagram.com", icon: <InstagramIcon /> },
  { label: "X / Twitter", href: "https://x.com", icon: <TwitterXIcon /> },
  { label: "Facebook", href: "https://facebook.com", icon: <FacebookIcon /> },
  { label: "Pinterest", href: "https://pinterest.com", icon: <PinterestIcon /> },
  { label: "YouTube", href: "https://youtube.com", icon: <YoutubeIcon /> },
  { label: "TikTok", href: "https://tiktok.com", icon: <TiktokIcon /> },
];

const trustFeatures = [
  { icon: <ShieldCheckIcon />, title: "Secure Payments", desc: "256-bit SSL encryption on every transaction" },
  { icon: <TruckIcon />, title: "Free Global Shipping", desc: "On all orders above $150" },
  { icon: <RefreshIcon />, title: "30-Day Returns", desc: "Hassle-free return & exchange policy" },
  { icon: <HeadphonesIcon />, title: "24/7 Concierge", desc: "Dedicated luxury support team" },
  { icon: <AwardIcon />, title: "Authenticity Guaranteed", desc: "Every item curated & verified" },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────────── */

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer
      className="w-full text-foreground mt-auto"
      style={{ background: "var(--card-bg)" }}
      role="contentinfo"
      aria-label={t("Site Footer")}
    >
      {/* ── Top decorative gradient bar ─────────────────────────────────── */}
      <div
        className="h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--primary) 30%, var(--accent) 50%, var(--primary) 70%, transparent 100%)",
        }}
        aria-hidden="true"
      />

      {/* ── Trust / Feature strip ────────────────────────────────────────── */}
      <div
        className="w-full border-b"
        style={{ borderColor: "var(--card-border)", background: "var(--background)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {trustFeatures.map((f) => (
              <div
                key={f.title}
                className="group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all duration-300"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--card-border)";
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                }}
              >
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-300"
                  style={{ background: "var(--muted-light)", color: "var(--primary)" }}
                >
                  {f.icon}
                </span>
                <p className="text-xs font-semibold leading-snug" style={{ color: "var(--foreground)" }}>
                  {t(f.title)}
                </p>
                <p className="text-xs leading-snug hidden sm:block" style={{ color: "var(--muted)" }}>
                  {t(f.desc)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">

          {/* ── Brand & Newsletter column ────────────────────────────── */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
                  aria-hidden="true"
                >
                  <span className="text-xs font-black" style={{ color: "var(--luxury-black, #0B0B0A)" }}>SP</span>
                </div>
                <span
                  className="font-serif text-xl font-bold tracking-widest uppercase"
                  style={{ color: "var(--primary)" }}
                >
                  {t("Shop Premium")}
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {t(
                  "Curating the world's finest collections — where luxury meets precision engineering, bespoke design, and uncompromising quality."
                )}
              </p>
            </div>

            {/* Contact Info */}
            <div className="flex flex-col gap-2.5">
              <a
                href="mailto:concierge@shoppremium.com"
                className="flex items-center gap-2.5 text-sm group transition-colors duration-200"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
              >
                <MailIcon />
                concierge@shoppremium.com
              </a>
              <a
                href="tel:+201001234567"
                className="flex items-center gap-2.5 text-sm transition-colors duration-200"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
              >
                <PhoneIcon />
                +20 (100) 123-4567
              </a>
              <div className="flex items-start gap-2.5 text-sm" style={{ color: "var(--muted)" }}>
                <LocationIcon />
                <span>{t("Maadi, Cairo, Egypt — Global Shipping Available")}</span>
              </div>
            </div>

            {/* Social Icons */}
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold mb-3" style={{ color: "var(--muted)" }}>
                {t("Follow Our World")}
              </p>
              <div className="flex flex-wrap gap-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300"
                    style={{
                      background: "var(--muted-light)",
                      color: "var(--muted)",
                      border: "1px solid var(--card-border)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "var(--primary)";
                      el.style.color = "var(--luxury-white, #FCFCFA)";
                      el.style.borderColor = "var(--primary)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "var(--muted-light)";
                      el.style.color = "var(--muted)";
                      el.style.borderColor = "var(--card-border)";
                      el.style.transform = "translateY(0)";
                    }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Link Columns ─────────────────────────────────────────── */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8 sm:grid-cols-3">
            {/* Collections */}
            <nav aria-label={t("Collections navigation")}>
              <h3
                className="text-xs font-bold tracking-widest uppercase mb-5 pb-2"
                style={{
                  color: "var(--primary)",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                {t("Collections")}
              </h3>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "New Arrivals", href: "/new-arrivals" },
                  { label: "Best Sellers", href: "/best-sellers" },
                  { label: "Flash Sales", href: "/flash-sales" },
                  { label: "Digital Goods", href: "/products?isDigital=true" },
                  { label: "Bundled Deals", href: "/products?isBundle=true" },
                  { label: "All Products", href: "/products" },
                  { label: "All Brands", href: "/brands" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-1.5 text-sm transition-all duration-200"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.color = "var(--primary)";
                        el.style.paddingLeft = "4px";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.color = "var(--muted)";
                        el.style.paddingLeft = "0px";
                      }}
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Company */}
            <nav aria-label={t("Company navigation")}>
              <h3
                className="text-xs font-bold tracking-widest uppercase mb-5 pb-2"
                style={{
                  color: "var(--primary)",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                {t("Company")}
              </h3>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "About Us", href: "/about" },
                  { label: "Our Stores", href: "/stores" },
                  { label: "Blog & Articles", href: "/blog" },
                  { label: "Become a Seller", href: "/seller" },
                  { label: "Careers", href: "/about#careers" },
                  { label: "Sustainability", href: "/about#sustainability" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-all duration-200"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)";
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "4px";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "0px";
                      }}
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Support */}
            <nav aria-label={t("Support navigation")}>
              <h3
                className="text-xs font-bold tracking-widest uppercase mb-5 pb-2"
                style={{
                  color: "var(--primary)",
                  borderBottom: "1px solid var(--card-border)",
                }}
              >
                {t("Support")}
              </h3>
              <ul className="flex flex-col gap-3">
                {[
                  { label: "Help Center", href: "/faq" },
                  { label: "Contact Us", href: "/contact" },
                  { label: "Track Your Order", href: "/dashboard" },
                  { label: "Returns & Refunds", href: "/policies/returns" },
                  { label: "Size Guide", href: "/size-guide" },
                  { label: "Privacy Policy", href: "/policies/privacy" },
                  { label: "Terms of Service", href: "/policies/terms" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-all duration-200"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)";
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "4px";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)";
                        (e.currentTarget as HTMLAnchorElement).style.paddingLeft = "0px";
                      }}
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* ── Newsletter column ─────────────────────────────────────── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Newsletter card */}
            <div
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{
                background: "var(--muted-light)",
                border: "1px solid var(--card-border)",
              }}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">✦</span>
                  <h3
                    className="text-sm font-bold tracking-widest uppercase"
                    style={{ color: "var(--primary)" }}
                  >
                    {t("Private Circle")}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                  {t(
                    "Join our exclusive inner circle for first access to limited drops, private sale events, and curated style edits."
                  )}
                </p>
              </div>

              {subscribed ? (
                <div
                  className="rounded-xl px-4 py-4 text-sm text-center font-medium"
                  style={{
                    background: "var(--success)",
                    color: "#fff",
                  }}
                  role="status"
                  aria-live="polite"
                >
                  <span className="mr-1">✓</span>{" "}
                  {t("Welcome to the circle. We'll be in touch.")}
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col gap-3" noValidate>
                  <div
                    className="relative rounded-xl overflow-hidden transition-all duration-300"
                    style={{
                      border: `1.5px solid ${emailFocused ? "var(--primary)" : "var(--card-border)"}`,
                      background: "var(--card-bg)",
                    }}
                  >
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                      <MailIcon />
                    </div>
                    <input
                      id="footer-newsletter-email"
                      type="email"
                      placeholder={t("Your email address")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                      required
                      autoComplete="email"
                      className="w-full bg-transparent pl-10 pr-4 py-3 text-sm outline-none"
                      style={{ color: "var(--foreground)" }}
                    />
                  </div>
                  <button
                    type="submit"
                    id="footer-subscribe-btn"
                    className="group flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold tracking-wide transition-all duration-300"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), var(--accent))",
                      color: "var(--luxury-black, #0B0B0A)",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "0.9";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
                      (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                    }}
                  >
                    {t("Join the Inner Circle")}
                    <span className="transition-transform duration-200 group-hover:translate-x-1">
                      <ArrowRightIcon />
                    </span>
                  </button>
                  <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
                    {t("No spam, ever. Unsubscribe anytime.")}
                  </p>
                </form>
              )}
            </div>

            {/* App Store badges */}
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--muted)" }}>
                {t("Download the App")}
              </p>
              <div className="flex gap-2">
                <a
                  href="#"
                  aria-label={t("Download on the App Store")}
                  className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: "var(--muted-light)",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--card-border)";
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.06.04c-.22.15-2.19 1.28-2.17 3.82.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] opacity-70">{t("Download on the")}</span>
                    <span className="text-xs font-bold">App Store</span>
                  </div>
                </a>
                <a
                  href="#"
                  aria-label={t("Get it on Google Play")}
                  className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200"
                  style={{
                    background: "var(--muted-light)",
                    border: "1px solid var(--card-border)",
                    color: "var(--foreground)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--card-border)";
                  }}
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                    <path d="M3.18 23.76c.3.17.64.24.99.2l12.6-7.27-2.7-2.7-10.89 9.77zM.54 1.32C.2 1.66 0 2.19 0 2.88v18.24c0 .69.2 1.22.55 1.56l.08.08 10.22-10.22v-.24L.62 2.07l-.08.07-.0.07-.0.07zM20.46 10.37l-2.88-1.66-3.06 3.06 3.06 3.06 2.9-1.67c.83-.48.83-1.26-.02-1.79zM3.18.24l12.6 7.28-2.7 2.7L2.19.45c.3-.21.67-.27.99-.21z" />
                  </svg>
                  <div className="flex flex-col items-start">
                    <span className="text-[9px] opacity-70">{t("Get it on")}</span>
                    <span className="text-xs font-bold">Google Play</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        className="w-full border-t"
        style={{ borderColor: "var(--card-border)", background: "var(--muted-light)" }}
      >
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            {/* Copyright */}
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("© {{year}} Shop Premium Inc. — All rights reserved. Crafted with ♥ in Cairo, Egypt.", {
                year: new Date().getFullYear(),
              })}
            </p>

            {/* Payment logos */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs mr-1" style={{ color: "var(--muted)" }}>{t("We accept")}</span>
              <div className="flex items-center gap-1.5 flex-wrap" style={{ color: "var(--muted)" }}>
                <VisaLogo />
                <MastercardLogo />
                <PaypalLogo />
                <ApplePayLogo />
                <StripeLogo />
              </div>
            </div>

            {/* Legal links */}
            <nav className="flex gap-4" aria-label={t("Legal navigation")}>
              {[
                { label: "Privacy", href: "/policies/privacy" },
                { label: "Terms", href: "/policies/terms" },
                { label: "Cookies", href: "/policies/cookies" },
                { label: "Sitemap", href: "/sitemap.xml" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs transition-colors duration-200"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--primary)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "var(--muted)")}
                >
                  {t(link.label)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
