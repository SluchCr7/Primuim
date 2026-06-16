"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { AlertCircle, RefreshCw, PhoneCall } from "lucide-react";

export default function CheckoutFailurePage() {
  const searchParams = useSearchParams();
  const errorMsg = searchParams.get("message") || "Payment verification failed or card was declined.";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-16 flex items-center justify-center">
        <div className="w-full max-w-lg luxury-card p-8 text-center flex flex-col items-center gap-6 shadow-xl border-error/20">
          <div className="rounded-full bg-error/10 p-5 text-error">
            <AlertCircle className="h-12 w-12 animate-pulse" />
          </div>

          <div>
            <span className="text-[10px] font-bold tracking-widest text-error uppercase">Checkout Terminated</span>
            <h1 className="font-serif text-3xl font-bold mt-1">Transaction Failed</h1>
            <p className="text-xs text-muted mt-2 max-w-sm mx-auto leading-relaxed">
              We were unable to process authorization request. No charges have been made to your billing account.
            </p>
          </div>

          <div className="w-full bg-error/5 p-4 rounded border border-error/20 text-xs text-error font-medium text-left">
            <strong>Gateway Reason:</strong> {errorMsg}
          </div>

          <div className="w-full border-t border-card-border pt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/checkout"
              className="inline-flex h-11 items-center justify-center gap-2 rounded bg-foreground px-6 text-background hover:bg-gold hover:text-luxury-white font-semibold text-xs uppercase tracking-wider transition-all shadow-md"
            >
              <RefreshCw className="h-4 w-4" /> Retry Checkout
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded border border-card-border px-5 text-muted hover:text-foreground font-semibold text-xs uppercase tracking-wider transition-colors"
            >
              <PhoneCall className="h-4 w-4" /> Help Desk
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
