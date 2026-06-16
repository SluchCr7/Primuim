"use client";

import React from "react";
import { Hammer, ShieldCheck, Mail } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-screen flex flex-col bg-background text-foreground items-center justify-center p-6 text-center">
      <div className="luxury-card p-10 max-w-md flex flex-col items-center gap-6 shadow-2xl border-gold/20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-card-bg to-card-bg">
        <div className="rounded-full bg-gold/10 p-5 text-gold animate-bounce">
          <Hammer className="h-10 w-10" />
        </div>

        <div>
          <span className="text-[10px] font-bold tracking-widest text-gold uppercase">Systems Upgrade</span>
          <h1 className="font-serif text-3xl font-bold mt-1">Atelier offline</h1>
          <p className="text-xs text-muted font-light leading-relaxed mt-3">
            We are performing scheduled inventory audits and ledger balancing. The collections portal will return shortly.
          </p>
        </div>

        <div className="w-full border-t border-card-border pt-6 flex flex-col gap-3.5 text-xs text-muted">
          <div className="flex items-center justify-center gap-2">
            <Mail className="h-4 w-4 text-gold" />
            <span>concierge@premium-boutique.com</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-[9px]">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span>Bespoke Security Engine Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
