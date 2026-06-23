"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterMutation, useUploadImageMutation } from "../../lib/api";
import {
  UserPlus,
  Sparkles,
  Upload,
  X,
  Image as ImageIcon,
  Store,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  FileText,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^\&\*])/,
      "Must contain uppercase, lowercase, number & special character"
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
    if (!data.brandName?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Brand Name is required for sellers", path: ["brandName"] });
    if (!data.storeName?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Store Name is required for sellers", path: ["storeName"] });
    if (!data.country?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Country is required for sellers", path: ["country"] });
  }
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Image Drop Zone Component ────────────────────────────────────────────────
interface ImageDropZoneProps {
  label: string;
  hint: string;
  aspectRatio: "square" | "wide";
  value: string;
  onUpload: (url: string) => void;
  onClear: () => void;
  isUploading: boolean;
}

function ImageDropZone({ label, hint, aspectRatio, value, onUpload, onClear, isUploading }: ImageDropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const formData = new FormData();
    formData.append("image", file);
    onUpload(URL.createObjectURL(file)); // optimistic preview
    // actual upload is handled by parent via formData ref
    (inputRef.current as any)._pendingFile = file;
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const heightClass = aspectRatio === "square" ? "h-36" : "h-36";

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        className={`
          relative ${heightClass} rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 group
          ${dragging ? "border-gold bg-gold/10 scale-[1.01]" : value ? "border-success/50 bg-success/5" : "border-card-border bg-background hover:border-gold/60 hover:bg-gold/5"}
        `}
      >
        {/* Preview */}
        {value && (
          <img
            src={value}
            alt={label}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Overlay on hover or no image */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${value ? "opacity-0 group-hover:opacity-100 bg-black/60" : "opacity-100"}`}>
          {isUploading ? (
            <Loader2 className="h-6 w-6 text-gold animate-spin" />
          ) : (
            <>
              {value ? (
                <CheckCircle className="h-6 w-6 text-success" />
              ) : (
                <Upload className={`h-6 w-6 transition-colors ${dragging ? "text-gold" : "text-muted"}`} />
              )}
              <span className={`text-[10px] font-semibold uppercase tracking-wider text-center px-3 ${value ? "text-white" : "text-muted"}`}>
                {value ? "Click to replace" : "Drop image or click to browse"}
              </span>
              {!value && <span className="text-[9px] text-muted/60">{hint}</span>}
            </>
          )}
        </div>

        {/* Clear button */}
        {value && !isUploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); if (inputRef.current) inputRef.current.value = ""; }}
            className="absolute top-2 right-2 z-10 h-6 w-6 bg-black/70 hover:bg-error rounded-full flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

// ─── Main Register Page ───────────────────────────────────────────────────────
export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"customer" | "seller">("customer");
  const [showPassword, setShowPassword] = useState(false);

  // Image upload state
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const logoFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);

  const [registerCall, { isLoading }] = useRegisterMutation();
  const [uploadImage] = useUploadImageMutation();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "customer" },
  });

  const handleRoleToggle = (type: "customer" | "seller") => {
    setAccountType(type);
    setValue("role", type);
  };

  // Upload a file to Cloudinary and return URL
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);
    const result = await uploadImage(formData).unwrap();
    return result.url;
  };

  // Handle logo selection - store file ref and show preview
  const handleLogoDrop = (previewUrl: string) => {
    setLogoPreview(previewUrl);
  };

  // Handle cover selection - store file ref and show preview  
  const handleCoverDrop = (previewUrl: string) => {
    setCoverPreview(previewUrl);
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) return;
    logoFileRef.current = file;
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = async (file: File | null) => {
    if (!file) return;
    coverFileRef.current = file;
    setCoverPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = { ...data };
    if (payload.role === "customer") {
      delete payload.brandName;
      delete payload.storeName;
      delete payload.country;
      delete payload.storeDescription;
      delete payload.storeLogo;
      delete payload.storeCover;
    }

    // If seller, upload logo & cover first
    if (payload.role === "seller") {
      try {
        if (logoFileRef.current) {
          setLogoUploading(true);
          const logoUrl = await uploadFile(logoFileRef.current);
          payload.storeLogo = logoUrl;
          setLogoUploading(false);
        }
        if (coverFileRef.current) {
          setCoverUploading(true);
          const coverUrl = await uploadFile(coverFileRef.current);
          payload.storeCover = coverUrl;
          setCoverUploading(false);
        }
      } catch (err) {
        setLogoUploading(false);
        setCoverUploading(false);
        setErrorMsg("Image upload failed. Please try again or skip the images.");
        return;
      }
    }

    try {
      await registerCall(payload).unwrap();
      if (payload.role === "seller") {
        setSuccessMsg("Seller profile registered! Admin approval is required. Please check your email for verification.");
      } else {
        setSuccessMsg("VIP Profile created! We sent a verification link to your email. Please check your inbox.");
      }
    } catch (err: any) {
      setErrorMsg(err.data?.message || "Registration failed. Email might already be registered.");
    }
  };

  const isSubmitting = isLoading || logoUploading || coverUploading;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(197,168,128,0.12),_transparent_45%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(197,168,128,0.05),_transparent_50%)] pointer-events-none" />

      <Header />

      <main className="flex-grow flex items-start justify-center py-16 px-4 relative z-10">
        <div className={`w-full transition-all duration-500 ${accountType === "seller" ? "max-w-2xl" : "max-w-md"}`}>
          <div className="backdrop-blur-md bg-card-bg/80 border border-card-border/80 shadow-2xl rounded-[32px] overflow-hidden">

            {/* Top gradient bar */}
            <div className={`h-1 w-full transition-all duration-500 ${accountType === "seller" ? "bg-gradient-to-r from-gold via-gold/60 to-gold/30" : "bg-foreground"}`} />

            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest text-gold uppercase">VIP Sign Up</span>
                <h1 className="font-serif text-3xl font-bold mt-1 text-foreground">Create Profile</h1>
                <p className="text-sm text-muted mt-2">Choose your account type and enter credentials</p>
              </div>

              {/* Role Toggle */}
              <div className="flex bg-background rounded-full p-1 border border-card-border mb-7">
                <button
                  type="button"
                  onClick={() => handleRoleToggle("customer")}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    accountType === "customer" ? "bg-foreground text-background shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  <User className="h-3.5 w-3.5" /> Customer
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleToggle("seller")}
                  className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    accountType === "seller" ? "bg-gold text-luxury-black shadow-sm" : "text-muted hover:text-foreground"
                  }`}
                >
                  <Store className="h-3.5 w-3.5" /> Seller / Store
                </button>
              </div>

              {/* Messages */}
              {errorMsg && (
                <div className="mb-5 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error">
                  {errorMsg}
                </div>
              )}

              {successMsg ? (
                <div className="mb-6 rounded-xl border border-success/20 bg-success/5 px-4 py-5 text-sm text-success flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{successMsg}</p>
                  </div>
                  <Link
                    href="/login"
                    className="w-full rounded-xl bg-foreground py-2.5 text-center font-semibold text-background hover:bg-gold hover:text-luxury-black transition-all text-xs uppercase tracking-widest"
                  >
                    Proceed to Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                  <input type="hidden" {...register("role")} />

                  {/* ── ACCOUNT IDENTITY SECTION ── */}
                  <div className={`grid gap-4 ${accountType === "seller" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                    {/* Username */}
                    <div className={accountType === "seller" ? "sm:col-span-2" : ""}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                        Full Name / Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                        <input
                          type="text"
                          {...register("username")}
                          className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                          placeholder="alex_lux"
                        />
                      </div>
                      {errors.username && <p className="text-xs text-error mt-1">{errors.username.message}</p>}
                    </div>

                    {/* Email */}
                    <div className={accountType === "seller" ? "" : ""}>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                        <input
                          type="email"
                          {...register("email")}
                          className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                          placeholder="alex@example.com"
                        />
                      </div>
                      {errors.email && <p className="text-xs text-error mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                        <input
                          type={showPassword ? "text" : "password"}
                          {...register("password")}
                          className="w-full rounded-xl border border-card-border bg-background pl-9 pr-10 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-error mt-1 leading-relaxed">{errors.password.message}</p>}
                    </div>

                    {/* Phone (seller only) */}
                    {accountType === "seller" && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Phone Number</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                          <input
                            type="text"
                            {...register("phone")}
                            className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                            placeholder="+20 100 123 4567"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── SELLER STORE SECTION ── */}
                  {accountType === "seller" && (
                    <>
                      {/* Divider */}
                      <div className="relative flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-card-border" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-1.5 whitespace-nowrap">
                          <Store className="h-3 w-3" /> Store Identity
                        </span>
                        <div className="flex-1 h-px bg-card-border" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Brand Name */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Brand Name *</label>
                          <input
                            type="text"
                            {...register("brandName")}
                            className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40 font-semibold"
                            placeholder="E.g. Nike Official"
                          />
                          {errors.brandName && <p className="text-xs text-error mt-1">{errors.brandName.message}</p>}
                        </div>

                        {/* Store Name */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Store Name *</label>
                          <input
                            type="text"
                            {...register("storeName")}
                            className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                            placeholder="E.g. Nike Flagship Cairo"
                          />
                          {errors.storeName && <p className="text-xs text-error mt-1">{errors.storeName.message}</p>}
                        </div>

                        {/* Country */}
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Country *</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted/50" />
                            <input
                              type="text"
                              {...register("country")}
                              className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40"
                              placeholder="Egypt, UAE, USA..."
                            />
                          </div>
                          {errors.country && <p className="text-xs text-error mt-1">{errors.country.message}</p>}
                        </div>

                        {/* Store Description */}
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">Store Description</label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted/50" />
                            <textarea
                              rows={3}
                              {...register("storeDescription")}
                              className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none focus:border-gold transition-all placeholder-muted/40 resize-none leading-relaxed"
                              placeholder="Briefly describe your brand, what you sell, and who you are..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* ── IMAGE UPLOADS ── */}
                      <div className="relative flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-card-border" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold flex items-center gap-1.5 whitespace-nowrap">
                          <ImageIcon className="h-3 w-3" /> Store Visuals
                        </span>
                        <div className="flex-1 h-px bg-card-border" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Logo Upload */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Store Logo</label>
                          <div
                            className={`relative h-36 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 group
                              ${logoPreview ? "border-success/50 bg-success/5" : "border-card-border bg-background hover:border-gold/60 hover:bg-gold/5"}`}
                            onClick={() => document.getElementById("logoInput")?.click()}
                          >
                            {logoPreview && (
                              <img src={logoPreview} alt="Store Logo" className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${logoPreview ? "opacity-0 group-hover:opacity-100 bg-black/60" : "opacity-100"}`}>
                              {logoUploading ? (
                                <Loader2 className="h-6 w-6 text-gold animate-spin" />
                              ) : logoPreview ? (
                                <>
                                  <CheckCircle className="h-6 w-6 text-white" />
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white">Click to replace</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-12 w-12 rounded-full border-2 border-dashed border-muted/30 flex items-center justify-center mb-1">
                                    <Upload className="h-5 w-5 text-muted" />
                                  </div>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted text-center px-3">Upload Logo</span>
                                  <span className="text-[9px] text-muted/50">Square · PNG or JPG · Max 5MB</span>
                                </>
                              )}
                            </div>
                            {logoPreview && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setLogoPreview(""); logoFileRef.current = null; setValue("storeLogo", ""); }}
                                className="absolute top-2 right-2 z-10 h-6 w-6 bg-black/70 hover:bg-error rounded-full flex items-center justify-center transition-colors">
                                <X className="h-3.5 w-3.5 text-white" />
                              </button>
                            )}
                          </div>
                          <input id="logoInput" type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) { logoFileRef.current = f; setLogoPreview(URL.createObjectURL(f)); }}} />
                          <span className="text-[9px] text-muted/60">Recommended: 400×400px square image</span>
                        </div>

                        {/* Cover Upload */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted">Store Cover Banner</label>
                          <div
                            className={`relative h-36 rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-all duration-300 group
                              ${coverPreview ? "border-success/50 bg-success/5" : "border-card-border bg-background hover:border-gold/60 hover:bg-gold/5"}`}
                            onClick={() => document.getElementById("coverInput")?.click()}
                          >
                            {coverPreview && (
                              <img src={coverPreview} alt="Store Cover" className="absolute inset-0 w-full h-full object-cover" />
                            )}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 transition-all duration-200 ${coverPreview ? "opacity-0 group-hover:opacity-100 bg-black/60" : "opacity-100"}`}>
                              {coverUploading ? (
                                <Loader2 className="h-6 w-6 text-gold animate-spin" />
                              ) : coverPreview ? (
                                <>
                                  <CheckCircle className="h-6 w-6 text-white" />
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-white">Click to replace</span>
                                </>
                              ) : (
                                <>
                                  <div className="h-10 w-20 rounded border-2 border-dashed border-muted/30 flex items-center justify-center mb-1">
                                    <ImageIcon className="h-5 w-5 text-muted" />
                                  </div>
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted text-center px-3">Upload Cover Banner</span>
                                  <span className="text-[9px] text-muted/50">Landscape · PNG or JPG · Max 5MB</span>
                                </>
                              )}
                            </div>
                            {coverPreview && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setCoverPreview(""); coverFileRef.current = null; setValue("storeCover", ""); }}
                                className="absolute top-2 right-2 z-10 h-6 w-6 bg-black/70 hover:bg-error rounded-full flex items-center justify-center transition-colors">
                                <X className="h-3.5 w-3.5 text-white" />
                              </button>
                            )}
                          </div>
                          <input id="coverInput" type="file" accept="image/*" className="hidden"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) { coverFileRef.current = f; setCoverPreview(URL.createObjectURL(f)); }}} />
                          <span className="text-[9px] text-muted/60">Recommended: 1200×400px landscape banner</span>
                        </div>
                      </div>

                      {/* Seller preview card */}
                      {(logoPreview || coverPreview) && (
                        <div className="rounded-xl border border-card-border overflow-hidden">
                          <div className="relative h-20 bg-gradient-to-r from-gold/20 to-card-bg">
                            {coverPreview && <img src={coverPreview} alt="cover" className="absolute inset-0 w-full h-full object-cover" />}
                            <div className="absolute -bottom-5 left-4">
                              <div className="h-10 w-10 rounded-full border-2 border-card-bg overflow-hidden bg-card-bg flex items-center justify-center">
                                {logoPreview ? (
                                  <img src={logoPreview} alt="logo" className="h-full w-full object-cover" />
                                ) : (
                                  <Store className="h-5 w-5 text-muted" />
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="pt-7 pb-3 px-4">
                            <span className="text-[10px] text-muted uppercase tracking-widest block">Store preview</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* ── REFERRAL CODE (Customer only) ── */}
                  {accountType === "customer" && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-muted">Referral Code (Optional)</label>
                        <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
                      </div>
                      <input
                        type="text"
                        {...register("referredByCode")}
                        className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm outline-none focus:border-gold uppercase transition-all placeholder-muted/40"
                        placeholder="E.g. GOLD2026"
                      />
                      {errors.referredByCode && <p className="text-xs text-error mt-1">{errors.referredByCode.message}</p>}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full rounded-xl py-3 font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 mt-2 ${
                      accountType === "seller"
                        ? "bg-gold hover:bg-gold-hover text-luxury-black"
                        : "bg-foreground hover:bg-gold hover:text-luxury-black text-background"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {logoUploading ? "Uploading Logo..." : coverUploading ? "Uploading Cover..." : "Creating Account..."}
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        {accountType === "seller" ? "Submit Store Application" : "Request Invitation"}
                      </>
                    )}
                  </button>

                  <div className="text-center pt-4 border-t border-card-border text-sm text-muted">
                    Already have a profile?{" "}
                    <Link href="/login" className="text-gold font-semibold hover:underline">
                      Sign In
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}