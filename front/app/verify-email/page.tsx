"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useVerifyAccountMutation } from "../../lib/api"; // استيراد الـ Hook الجديد
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const token = searchParams.get("token");

  // استدعاء الـ Mutation Hook من RTK Query
  const [verifyAccount, { isLoading, isSuccess, error }] = useVerifyAccountMutation();

  useEffect(() => {
    // إرسال طلب التحقق تلقائياً بمجرد توفر الـ id والـ token في الرابط
    if (id && token) {
      verifyAccount({ id, token });
    }
  }, [id, token, verifyAccount]);

  // استخراج رسالة الخطأ بشكل احترافي بناءً على هيكلة خطأ RTK Query أو غياب المعاملات
  const getErrorMessage = () => {
    if (!id || !token) {
      return "Missing verification identifier or security token.";
    }
    if (error) {
      const errorData = error as any;
      return errorData?.data?.message || "Email verification failed. The link may have expired or is invalid.";
    }
    return "Could not connect to verification server. Please try again later.";
  };

  // لتحديد ما إذا كنا في حالة خطأ (إما فشل الطلب أو غياب الرموز الأساسية من الرابط)
  const isError = !id || !token || !!error;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Premium ambient light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.08),_transparent_45%)] pointer-events-none" />
      
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-card-bg/80 border border-card-border/80 p-8 shadow-2xl rounded-[32px] text-center luxury-shadow">
          
          <div className="mb-6">
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Profile Validation</span>
            <h1 className="font-serif text-3xl font-bold mt-1 text-foreground">Email Verification</h1>
          </div>

          {/* حالة التحميل والانتظار */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <Loader2 className="h-10 w-10 text-gold animate-spin" />
              <p className="text-sm text-muted font-light">Verifying credentials with secure directory...</p>
            </div>
          ) : isSuccess ? (
            /* حالة النجاح */
            <div className="flex flex-col items-center justify-center py-6 gap-5">
              <div className="inline-flex rounded-full bg-success/10 p-4 text-success border border-success/20 animate-pulse">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Account Verified</h3>
                <p className="text-sm text-muted font-light mt-2 px-2 leading-relaxed">
                  Thank you! Your profile has been validated. You can now access all marketplace features.
                </p>
              </div>
              <Link href="/login" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 text-xs font-semibold uppercase tracking-wider text-background hover:bg-gold-hover hover:shadow-lg hover:shadow-gold/10 transition-all">
                Sign In To Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : isError ? (
            /* حالة الفشل */
            <div className="flex flex-col items-center justify-center py-6 gap-5">
              <div className="inline-flex rounded-full bg-error/10 p-4 text-error border border-error/20">
                <XCircle className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Verification Failed</h3>
                <p className="text-sm text-error font-light mt-2 px-2 leading-relaxed">
                  {getErrorMessage()}
                </p>
              </div>
              <Link href="/login" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-card-border bg-background px-6 text-xs font-semibold uppercase tracking-wider text-muted hover:border-gold hover:text-gold transition-all">
                Back to Login
              </Link>
            </div>
          ) : null}

        </div>
      </main>

      <Footer />
    </div>
  );
}