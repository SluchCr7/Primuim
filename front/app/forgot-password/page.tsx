"use client";

import React, { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPasswordMutation } from "../../lib/api";
import { Mail, KeyRound, ArrowLeft } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [forgotPasswordCall, { isLoading }] = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setStatusMsg(null);
    try {
      const response = await forgotPasswordCall(data).unwrap();
      setStatusMsg({
        type: "success",
        text: response.message || "If your email is registered, we have sent a secure reset link.",
      });
      reset();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.data?.message || "Failed to initiate password reset. Please try again later.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Premium ambient light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.12),_transparent_45%)] pointer-events-none" />
      
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-white/70 dark:bg-[#131312]/80 border border-card-border/80 p-8 shadow-2xl rounded-[32px]">
          
          <div className="text-center mb-8">
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Credentials Recovery</span>
            <h1 className="font-serif text-3xl font-bold mt-1">Forgot Password</h1>
            <p className="text-sm text-muted mt-2">Provide your email address to receive a secure recovery credential link</p>
          </div>

          {statusMsg && (
            <div className={`mb-6 rounded border px-4 py-3 text-sm ${
              statusMsg.type === "success" 
                ? "border-success/30 bg-success/10 text-success" 
                : "border-error/30 bg-error/10 text-error"
            }`}>
              {statusMsg.text}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  {...register("email")}
                  className="w-full rounded border border-card-border bg-background pl-11 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                  placeholder="vip.client@example.com"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              </div>
              {errors.email && (
                <p className="text-xs text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded bg-foreground py-3 font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? "Sending secure link..." : <><KeyRound className="h-4 w-4" /> Request Reset Link</>}
            </button>
          </form>

          <div className="text-center mt-8 pt-6 border-t border-card-border text-sm text-muted">
            <Link href="/login" className="inline-flex items-center gap-2 text-gold font-medium hover:underline text-xs uppercase tracking-wider">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
