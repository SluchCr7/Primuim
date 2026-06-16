"use client";

import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Breadcrumbs from "../components/Breadcrumbs";
import { Mail, Phone, MapPin, CheckCircle, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSuccess(true);
    setName("");
    setEmail("");
    setMessage("");
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-12">
        <Breadcrumbs items={[{ label: "Contact Us", url: "/contact" }]} />

        <div className="mb-12">
          <span className="text-xs font-bold tracking-widest text-gold uppercase">Inquiries</span>
          <h1 className="font-serif text-4xl font-extrabold mt-1">Connect with Concierge</h1>
          <p className="text-sm text-muted mt-2">Get in touch with support, designer alliances, or PR departments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* LEFT COLUMN: CONTACT DETAILS */}
          <div className="flex flex-col gap-6">
            <div className="luxury-card p-6 flex flex-col gap-6">
              <h3 className="font-serif font-bold text-lg border-b border-card-border pb-3">HQ Studio Location</h3>
              
              <div className="flex gap-4">
                <MapPin className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted">Zamalek Atelier</h4>
                  <p className="text-sm font-light mt-1 leading-relaxed">
                    9 El-Gezira St, Zamalek, Cairo <br />
                    Second Floor, Studio 12
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Phone className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted">Concierge Desk</h4>
                  <p className="text-sm font-mono mt-1 font-semibold text-gold">
                    +20 (2) 2736 1234
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Mail className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-xs uppercase tracking-wider text-muted">Email Inquiries</h4>
                  <p className="text-sm font-light mt-1">
                    concierge@premium-boutique.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div className="lg:col-span-2">
            <div className="luxury-card p-8 shadow-sm">
              <h3 className="font-serif font-bold text-xl mb-6">Send an Inquiry</h3>
              
              {success && (
                <div className="mb-6 rounded border border-success/30 bg-success/10 px-4 py-3 text-xs text-success flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Thank you. Your ticket has been logged. Our concierge will email you within 2 hours.
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="Alex Mercer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold"
                      placeholder="alex@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Message</label>
                  <textarea
                    rows={5}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded border border-card-border bg-background p-4 text-sm outline-none focus:border-gold"
                    placeholder="Provide details about your custom size requirements or orders..."
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded bg-foreground px-8 font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all uppercase tracking-wider text-xs shadow-md"
                >
                  <Send className="h-4 w-4" /> Dispatch message
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
