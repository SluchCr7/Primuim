"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPasswordMutation } from "../../lib/api";
import { KeyRound, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [resetPasswordCall, { isLoading }] = useResetPasswordMutation();

  useEffect(() => {
    if (!token) {
      setStatusMsg({
        type: "error",
        text: "Invalid request. Missing security reset token. Please request another password reset link.",
      });
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    setStatusMsg(null);
    try {
      const response = await resetPasswordCall({ token, newPassword: data.password }).unwrap();
      setStatusMsg({
        type: "success",
        text: response.message || "Password reset successful! Redirecting to sign in...",
      });
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.data?.message || "Failed to reset password. The link might have expired.",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Premium ambient light effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.08),_transparent_45%)] pointer-events-none" />
      
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-card-bg/80 border border-card-border/80 p-8 shadow-2xl rounded-[32px] luxury-shadow">
          
          <div className="text-center mb-8">
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Credentials Recovery</span>
            <h1 className="font-serif text-3xl font-bold mt-1 text-foreground">Reset Password</h1>
            <p className="text-sm text-muted mt-2">Enter your new premium security credentials below</p>
          </div>

          {statusMsg && (
            <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              statusMsg.type === "success" 
                ? "border-success/20 bg-success/5 text-success" 
                : "border-error/20 bg-error/5 text-error"
            }`}>
              {statusMsg.text}
            </div>
          )}

          {token && (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    {...register("password")}
                    className="w-full rounded-xl border border-card-border bg-background pl-11 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all placeholder-muted/50"
                    placeholder="••••••••"
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                </div>
                {errors.password && (
                  <p className="text-xs text-error mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    {...register("confirmPassword")}
                    className="w-full rounded-xl border border-card-border bg-background pl-11 pr-4 py-2.5 text-sm text-foreground outline-none focus:border-gold transition-all placeholder-muted/50"
                    placeholder="••••••••"
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-error mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-foreground py-3 font-semibold text-background hover:bg-gold-hover hover:shadow-lg hover:shadow-gold/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating Credentials...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Reset Password
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-8 pt-6 border-t border-card-border text-sm text-muted">
            <Link href="/login" className="inline-flex items-center gap-2 text-gold font-medium hover:underline text-xs uppercase tracking-wider">
              Return to login page <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}