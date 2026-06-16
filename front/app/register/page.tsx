"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterMutation } from "../../lib/api";
import { UserPlus, Sparkles } from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%)"
    ),
  role: z.enum(["customer", "seller"]),
  referredByCode: z.string().max(8).optional().or(z.literal("")),
  brandName: z.string().optional().or(z.literal("")),
  storeName: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  storeDescription: z.string().optional().or(z.literal("")),
  storeLogo: z.string().optional().or(z.literal("")),
  storeCover: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  if (data.role === "seller") {
    if (!data.brandName || data.brandName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Brand Name is required for Sellers",
        path: ["brandName"],
      });
    }
    if (!data.storeName || data.storeName.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Store Name is required for Sellers",
        path: ["storeName"],
      });
    }
    if (!data.country || data.country.trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required for Sellers",
        path: ["country"],
      });
    }
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"customer" | "seller">("customer");

  const [registerCall, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer"
    }
  });

  const handleRoleToggle = (type: "customer" | "seller") => {
    setAccountType(type);
    setValue("role", type);
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    
    // Clean up optional fields if customer
    const payload = { ...data };
    if (payload.role === "customer") {
      delete payload.brandName;
      delete payload.storeName;
      delete payload.country;
      delete payload.storeDescription;
      delete payload.storeLogo;
      delete payload.storeCover;
    }

    try {
      const response = await registerCall(payload).unwrap();
      if (response) {
        if (payload.role === "seller") {
          setSuccessMsg(
            "Seller profile registered successfully! Admin approval is required. Please check your email for verification."
          );
        } else {
          setSuccessMsg(
            "VIP Profile created successfully! We have sent a verification link to your email. Please check your inbox."
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(
        err.data?.message || "Registration failed. Email might already be registered."
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.12),_transparent_45%)] pointer-events-none" />
      
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-6 relative z-10">
        <div className="w-full max-w-md backdrop-blur-md bg-white/70 dark:bg-[#131312]/80 border border-card-border/80 p-8 shadow-2xl rounded-[32px]">
          
          <div className="text-center mb-8">
            <span className="text-xs font-bold tracking-widest text-gold uppercase">VIP Sign Up</span>
            <h1 className="font-serif text-3xl font-bold mt-1">Create Profile</h1>
            <p className="text-sm text-muted mt-2">Choose account path and enter credentials</p>
          </div>

          {/* Role Toggle Switch */}
          <div className="flex bg-card-bg rounded-full p-1 border border-card-border/60 mb-6">
            <button
              type="button"
              onClick={() => handleRoleToggle("customer")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer ${
                accountType === "customer" 
                  ? "bg-foreground text-background" 
                  : "text-muted hover:text-foreground"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleRoleToggle("seller")}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer ${
                accountType === "seller" 
                  ? "bg-gold text-white" 
                  : "text-muted hover:text-foreground"
              }`}
            >
              Seller / Store
            </button>
          </div>

          {errorMsg && (
            <div className="mb-6 rounded border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {errorMsg}
            </div>
          )}

          {successMsg ? (
            <div className="mb-6 rounded border border-success/30 bg-success/10 px-4 py-4 text-sm text-success flex flex-col gap-4">
              <p>{successMsg}</p>
              <Link
                href="/login"
                className="w-full rounded bg-foreground py-2.5 text-center font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all text-xs uppercase tracking-widest"
              >
                Proceed to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              <input type="hidden" {...register("role")} />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  {...register("username")}
                  className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                  placeholder="alex_lux"
                />
                {errors.username && (
                  <p className="text-xs text-error mt-1">{errors.username.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                  placeholder="alex@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-error mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-xs text-error mt-1 leading-relaxed">{errors.password.message}</p>
                )}
              </div>

              {/* Dynamic Seller Form Fields */}
              {accountType === "seller" && (
                <>
                  <div className="border-t border-card-border pt-4 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold block mb-4">Store Identity</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      {...register("brandName")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="E.g. Nike Official"
                    />
                    {errors.brandName && (
                      <p className="text-xs text-error mt-1">{errors.brandName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      {...register("storeName")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="E.g. Nike Flagship Egypt"
                    />
                    {errors.storeName && (
                      <p className="text-xs text-error mt-1">{errors.storeName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      {...register("country")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="Egypt, UAE, USA..."
                    />
                    {errors.country && (
                      <p className="text-xs text-error mt-1">{errors.country.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Store Description (Optional)
                    </label>
                    <textarea
                      rows={3}
                      {...register("storeDescription")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="Briefly describe your catalog..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Store Logo URL (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("storeLogo")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                      Cover Image URL (Optional)
                    </label>
                    <input
                      type="text"
                      {...register("storeCover")}
                      className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {/* Referral Code (Customer only) */}
              {accountType === "customer" && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                      Referral Code (Optional)
                    </label>
                    <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                  </div>
                  <input
                    type="text"
                    {...register("referredByCode")}
                    className="w-full rounded border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold uppercase transition-colors"
                    placeholder="E.g. GOLD2026"
                  />
                  {errors.referredByCode && (
                    <p className="text-xs text-error mt-1">{errors.referredByCode.message}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded bg-foreground py-3 font-semibold text-background hover:bg-gold hover:text-luxury-white transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? "Enrolling..." : <><UserPlus className="h-4 w-4" /> Request Invitation</>}
              </button>
            </form>
          )}

          <div className="text-center mt-8 pt-6 border-t border-card-border text-sm text-muted">
            Already have a profile?{" "}
            <Link href="/login" className="text-gold font-medium hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
