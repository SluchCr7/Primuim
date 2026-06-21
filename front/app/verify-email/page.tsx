"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../../lib/api";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const verifyUserEmail = async () => {
      if (!id || !token) {
        setLoading(false);
        setErrorMsg("Missing verification identifier or security token.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify/${id}/${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok && data.message) {
          setSuccess(true);
        } else {
          setErrorMsg(data.message || "Email verification failed. The link may have expired or is invalid.");
        }
      } catch (err) {
        setErrorMsg("Could not connect to verification server. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    verifyUserEmail();
  }, [id, token]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Premium ambient light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.12),_transparent_45%)] pointer-events-none" />
      
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-white/70 dark:bg-[#131312]/80 border border-card-border/80 p-8 shadow-2xl rounded-[32px] text-center">
          
          <div className="mb-6">
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Profile Validation</span>
            <h1 className="font-serif text-3xl font-bold mt-1">Email Verification</h1>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="h-10 w-10 text-gold animate-spin" />
              <p className="text-sm text-muted font-light">Verifying credentials with secure directory...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-6 gap-5">
              <div className="inline-flex rounded-full bg-success/15 p-4 text-success border border-success/15 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Account Verified</h3>
                <p className="text-sm text-muted font-light mt-2 px-2">
                  Thank you! Your profile has been validated. You can now access all MERN eCommerce marketplace features.
                </p>
              </div>
              <Link href="/login" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-6 text-xs font-semibold uppercase tracking-wider text-background hover:bg-gold hover:text-white transition-all shadow-md">
                Sign In To Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-5">
              <div className="inline-flex rounded-full bg-error/15 p-4 text-error border border-error/15">
                <XCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Verification Failed</h3>
                <p className="text-sm text-error font-light mt-2 px-2">
                  {errorMsg}
                </p>
              </div>
              <Link href="/login" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-card-border px-6 text-xs font-semibold uppercase tracking-wider text-muted hover:border-gold hover:text-gold transition-all">
                Back to Login
              </Link>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
