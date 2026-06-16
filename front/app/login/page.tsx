"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation, useSocialLoginMutation, useMergeCartMutation } from "../../lib/api";
import { useAppDispatch } from "../../lib/store";
import { setCredentials } from "../../lib/authSlice";
import { LogIn, Mail } from "lucide-react";
import { getGuestCartTotals, clearGuestCart } from "../../lib/cartUtils";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loginCall, { isLoading }] = useLoginMutation();
  const [socialLoginCall, { isLoading: socialLoading }] = useSocialLoginMutation();
  const [mergeCart] = useMergeCartMutation();

  const syncCartAfterLogin = async () => {
    const { items } = getGuestCartTotals();
    if (items.length > 0) {
      try {
        const guestItems = items.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        }));
        await mergeCart({ items: guestItems }).unwrap();
        clearGuestCart();
      } catch (err) {
        console.error("Failed to merge guest cart:", err);
      }
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    try {
      const response = await loginCall(data).unwrap();
      if (response && response.accessToken && response.user) {
        dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }));
        await syncCartAfterLogin();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg(err.data?.message || "Invalid credentials. Please try again.");
    }
  };

  const handleSocialMock = async (provider: "google" | "github") => {
    setErrorMsg(null);
    try {
      const mockPayload = {
        provider,
        id: `oauth_${provider}_${Date.now()}`,
        email: `vip.${provider}@example.com`,
        name: `VIP ${provider === "google" ? "Google Member" : "GitHub Developer"}`,
      };
      const response = await socialLoginCall(mockPayload).unwrap();
      if (response && response.accessToken && response.user) {
        dispatch(setCredentials({ user: response.user, accessToken: response.accessToken }));
        await syncCartAfterLogin();
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMsg("Social authentication failed.");
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
            <span className="text-xs font-bold tracking-widest text-gold uppercase">Session Init</span>
            <h1 className="font-serif text-3xl font-bold mt-1">Sign In</h1>
            <p className="text-sm text-muted mt-2">Enter your credential details to log into your portal</p>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                placeholder="vip.client@example.com"
              />
              {errors.email && (
                <p className="text-xs text-error mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-gold hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                {...register("password")}
                className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
              {errors.password && (
                <p className="text-xs text-error mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded bg-foreground py-3 font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? "Authenticating..." : <><LogIn className="h-4 w-4" /> Authenticate</>}
            </button>
          </form>

          {/* SOCIAL LOGIN STUBS */}
          <div className="mt-8">
            <div className="relative flex items-center justify-center mb-6">
              <hr className="w-full border-card-border" />
              <span className="absolute bg-card-bg px-4 text-xs font-semibold text-muted uppercase tracking-widest">
                or sign in with
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialMock("google")}
                disabled={socialLoading}
                className="flex items-center justify-center gap-2 rounded border border-card-border bg-background py-2.5 text-sm font-medium hover:border-gold transition-all"
              >
                <Mail className="h-4 w-4 text-gold" /> Google
              </button>
              <button
                onClick={() => handleSocialMock("github")}
                disabled={socialLoading}
                className="flex items-center justify-center gap-2 rounded border border-card-border bg-background py-2.5 text-sm font-medium hover:border-gold transition-all"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.82 1.102.82 2.222v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
                </svg> GitHub
              </button>
            </div>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-card-border text-sm text-muted">
            Don't have a VIP profile?{" "}
            <Link href="/register" className="text-gold font-medium hover:underline">
              Create account
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
