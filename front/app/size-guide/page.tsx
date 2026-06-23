"use client";

/**
 * /app/size-guide/page.tsx
 * -----------------------------------------------------------------------
 * Smart Fit & Size Guide — Multi-Step Wizard
 *
 * Step 1 → Category selection (Clothing | Footwear)
 * Step 2 → Interactive measurement inputs (sliders + fit preference)
 * Step 3 → Animated size reveal + Save to Profile CTA
 *
 * Design language:
 *   - Luxury minimalist: gold (#C5A880), Outfit + Playfair Display fonts
 *   - Dark/light adaptive via CSS custom properties
 *   - Framer Motion step transitions
 *   - Fully responsive (mobile-first)
 * -----------------------------------------------------------------------
 */

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAppSelector } from "../../lib/store";
import {
  useUpdateSizeProfileMutation,
  useGetMeQuery,
} from "../../lib/api";
import { useToast } from "../components/Toast";
import {
  Shirt,
  Footprints,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Ruler,
  Save,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Category = "clothing" | "shoes";
type FitPreference = "tight" | "regular" | "oversized";

// ---------------------------------------------------------------------------
// Client-side mirror of the server's sizing logic (for live preview only)
// The server always performs the authoritative calculation.
// ---------------------------------------------------------------------------
function previewClothingSize(
  height: number,
  weight: number,
  preference: FitPreference
): string {
  const labels = ["S", "M", "L", "XL", "XXL"];

  let hb =
    height <= 160 ? 0 : height <= 170 ? 1 : height <= 180 ? 2 : height <= 190 ? 3 : 4;
  let wb =
    weight <= 55 ? 0 : weight <= 70 ? 1 : weight <= 85 ? 2 : weight <= 100 ? 3 : 4;

  const matrix = [
    [0, 0, 1, 2, 3],
    [0, 1, 1, 2, 3],
    [0, 1, 2, 2, 3],
    [1, 1, 2, 3, 4],
    [1, 2, 2, 3, 4],
  ];

  let idx = matrix[hb][wb];
  if (preference === "tight") idx -= 1;
  if (preference === "oversized") idx += 1;
  return labels[Math.max(0, Math.min(4, idx))];
}

function previewShoeSize(footLengthCM: number): number {
  return Math.max(36, Math.min(46, Math.round((footLengthCM + 1.5) * 1.5)));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated step progress dots */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 28 : 8,
            backgroundColor:
              i < current
                ? "var(--success)"
                : i === current
                ? "var(--primary)"
                : "var(--card-border)",
          }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

/** Range slider with live value label */
function LuxurySlider({
  id,
  label,
  unit,
  min,
  max,
  value,
  onChange,
  tip,
}: {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  tip?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          {label}
        </label>
        <span className="text-sm font-bold text-gold font-mono">
          {value} <span className="text-[10px] font-normal text-muted">{unit}</span>
        </span>
      </div>

      {/* Track + thumb */}
      <div className="relative h-1.5 rounded-full bg-card-border">
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
          className="absolute left-0 top-0 h-full rounded-full bg-gold"
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>

      <div className="flex justify-between text-[9px] text-muted font-medium">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>

      {tip && (
        <p className="flex items-start gap-1.5 text-[10px] text-muted/80 mt-0.5">
          <Info className="h-3 w-3 shrink-0 mt-0.5 text-gold/70" />
          {tip}
        </p>
      )}
    </div>
  );
}

/** Foot measurement SVG line-art tip */
function FootMeasurementTip() {
  return (
    <div className="luxury-card p-5 flex flex-col sm:flex-row items-center gap-5 bg-gold/5 border-gold/15">
      {/* Minimal foot outline SVG */}
      <svg
        viewBox="0 0 80 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-16 h-24 shrink-0 opacity-80"
        aria-hidden="true"
      >
        {/* Foot silhouette */}
        <path
          d="M30 105 C10 105 8 80 10 55 C12 30 18 10 28 8 C34 7 40 12 42 20
             C44 28 42 35 40 40 C48 38 55 40 60 50 C65 60 62 75 55 88
             C48 100 40 107 30 105 Z"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="var(--primary)"
          fillOpacity="0.06"
        />
        {/* Length measurement arrow */}
        <line x1="8" y1="8" x2="8" y2="105" stroke="var(--primary)" strokeWidth="1" strokeDasharray="3 2" />
        <polyline points="5,14 8,8 11,14" fill="none" stroke="var(--primary)" strokeWidth="1" />
        <polyline points="5,99 8,105 11,99" fill="none" stroke="var(--primary)" strokeWidth="1" />
        {/* Label */}
        <text x="14" y="60" fill="var(--primary)" fontSize="7" fontFamily="Outfit" fontWeight="600">
          Length
        </text>
      </svg>

      <div className="text-xs text-muted leading-relaxed">
        <p className="font-bold text-foreground mb-1 text-[11px] uppercase tracking-wider">
          How to measure your foot
        </p>
        <ol className="list-decimal list-inside space-y-1 text-[10px]">
          <li>Place a blank sheet of paper on the floor.</li>
          <li>Stand on it with your heel touching a wall.</li>
          <li>Mark the tip of your longest toe.</li>
          <li>Measure from wall to mark in centimetres.</li>
        </ol>
        <p className="mt-2 text-[9px] text-gold/80 font-semibold">
          Tip: Measure in the evening when feet are largest.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------
export default function SizeGuidePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Fetch existing profile for pre-populating values
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const existingProfile = meData?.user?.sizeProfile;

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState(0);                           // 0, 1, 2
  const [category, setCategory] = useState<Category | null>(null);

  // Clothing inputs
  const [height, setHeight] = useState<number>(
    existingProfile?.clothing?.height ?? 172
  );
  const [weight, setWeight] = useState<number>(
    existingProfile?.clothing?.weight ?? 70
  );
  const [preference, setPreference] = useState<FitPreference>(
    (existingProfile?.clothing?.preference as FitPreference) ?? "regular"
  );

  // Shoe inputs
  const [footLength, setFootLength] = useState<number>(
    existingProfile?.shoes?.footLengthCM ?? 27
  );

  // Result state (populated after server responds)
  const [savedSize, setSavedSize] = useState<string | number | null>(null);

  const [updateSizeProfile, { isLoading: isSaving }] = useUpdateSizeProfileMutation();

  // ── Derived previews ──────────────────────────────────────────────────────
  const clothingPreview = previewClothingSize(height, weight, preference);
  const shoePreview = previewShoeSize(footLength);
  const livePreview = category === "clothing" ? clothingPreview : shoePreview;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCategorySelect = useCallback((cat: Category) => {
    setCategory(cat);
    setStep(1);
  }, []);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  /** Compute result client-side for the reveal, then persist to server */
  const handleCalculate = useCallback(async () => {
    // Show the result step immediately with the local preview
    setSavedSize(livePreview);
    setStep(2);
  }, [livePreview]);

  const handleSaveToProfile = useCallback(async () => {
    if (!isAuthenticated) {
      showToast("Please log in to save your size profile.", "error");
      router.push("/login");
      return;
    }

    try {
      const payload =
        category === "clothing"
          ? { clothing: { height, weight, preference } }
          : { shoes: { footLengthCM: footLength } };

      const res = await updateSizeProfile(payload).unwrap();
      const serverProfile = res.sizeProfile;

      // Update local display with server-authoritative result
      if (category === "clothing") {
        setSavedSize(serverProfile?.clothing?.calculatedSize ?? livePreview);
      } else {
        setSavedSize(serverProfile?.shoes?.calculatedSizeEU ?? livePreview);
      }

      showToast("Size profile saved successfully! ✨", "success");
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to save profile.", "error");
    }
  }, [
    isAuthenticated, category, height, weight, preference, footLength,
    livePreview, updateSizeProfile, showToast, router,
  ]);

  // ── Animation variants ────────────────────────────────────────────────────
  const stepVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
    center: { opacity: 1, x: 0 },
    exit:  (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
  };
  const [direction, setDirection] = useState(1);

  const goForward = () => { setDirection(1); handleCalculate(); };
  const goBack    = () => { setDirection(-1); handleBack(); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />

      <main className="flex-grow w-full mx-auto max-w-2xl px-5 py-14 sm:py-20">

        {/* ── Page headline ── */}
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold tracking-[0.28em] text-gold uppercase flex items-center justify-center gap-1.5 mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Smart Fit Technology
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
            Your Digital Fit Profile
          </h1>
          <p className="text-sm text-muted font-light mt-3 max-w-md mx-auto leading-relaxed">
            Answer two quick questions and our precision algorithm will determine
            your ideal size — saved automatically to your account.
          </p>
        </div>

        {/* ── Progress dots ── */}
        <StepDots current={step} total={3} />

        {/* ── Step panel ── */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ─────────── STEP 0: Category selection ─────────── */}
            {step === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-muted mb-6">
                  Step 1 of 3 — Select a category
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Clothing card */}
                  <button
                    id="category-clothing"
                    onClick={() => { setDirection(1); handleCategorySelect("clothing"); }}
                    className="group luxury-card p-8 flex flex-col items-center gap-5 text-center hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                      <Shirt className="h-7 w-7 text-gold" />
                    </div>
                    <div>
                      <p className="font-serif text-lg font-semibold">Clothing</p>
                      <p className="text-xs text-muted mt-1 font-light leading-snug">
                        T-shirts, dresses, jackets & all apparel
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>

                  {/* Footwear card */}
                  <button
                    id="category-footwear"
                    onClick={() => { setDirection(1); handleCategorySelect("shoes"); }}
                    className="group luxury-card p-8 flex flex-col items-center gap-5 text-center hover:border-gold hover:shadow-lg hover:shadow-gold/10 transition-all duration-300 cursor-pointer hover:-translate-y-1"
                  >
                    <div className="h-16 w-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-all">
                      <Footprints className="h-7 w-7 text-gold" />
                    </div>
                    <div>
                      <p className="font-serif text-lg font-semibold">Footwear</p>
                      <p className="text-xs text-muted mt-1 font-light leading-snug">
                        Sneakers, heels, boots & all shoes
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      Select <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─────────── STEP 1: Input measurements ─────────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-muted mb-6">
                  Step 2 of 3 — {category === "clothing" ? "Your body measurements" : "Your foot length"}
                </p>

                <div className="luxury-card p-7 sm:p-9 flex flex-col gap-7">

                  {/* ── Clothing inputs ── */}
                  {category === "clothing" && (
                    <>
                      <LuxurySlider
                        id="height-slider"
                        label="Height"
                        unit="cm"
                        min={140}
                        max={220}
                        value={height}
                        onChange={setHeight}
                        tip="Stand straight against a wall without shoes for the most accurate reading."
                      />

                      <LuxurySlider
                        id="weight-slider"
                        label="Weight"
                        unit="kg"
                        min={40}
                        max={150}
                        value={weight}
                        onChange={setWeight}
                      />

                      {/* Fit Preference radio group */}
                      <div className="flex flex-col gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                          Fit Preference
                        </span>
                        <div className="grid grid-cols-3 gap-3">
                          {(["tight", "regular", "oversized"] as FitPreference[]).map((pref) => (
                            <button
                              key={pref}
                              id={`pref-${pref}`}
                              onClick={() => setPreference(pref)}
                              className={`flex flex-col items-center gap-2 py-4 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                                preference === pref
                                  ? "border-gold bg-gold/10 text-gold shadow-sm shadow-gold/15"
                                  : "border-card-border hover:border-gold/40 text-muted"
                              }`}
                            >
                              {/* Fit visualisation icons */}
                              <span className="text-lg" aria-hidden="true">
                                {pref === "tight" ? "🤏" : pref === "regular" ? "👕" : "🧥"}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider capitalize">
                                {pref}
                              </span>
                              {preference === pref && (
                                <motion.div
                                  layoutId="pref-indicator"
                                  className="h-1 w-4 rounded-full bg-gold"
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live preview badge */}
                      <div className="flex items-center justify-center gap-3 py-4 border-t border-card-border">
                        <span className="text-xs text-muted font-light">Estimated size:</span>
                        <motion.span
                          key={clothingPreview}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-bold font-serif text-gold"
                        >
                          {clothingPreview}
                        </motion.span>
                      </div>
                    </>
                  )}

                  {/* ── Shoe inputs ── */}
                  {category === "shoes" && (
                    <>
                      <FootMeasurementTip />

                      <LuxurySlider
                        id="foot-length-slider"
                        label="Foot Length"
                        unit="cm"
                        min={22}
                        max={32}
                        value={footLength}
                        onChange={setFootLength}
                        tip="Use the paper method described above for accurate measurement."
                      />

                      {/* Live preview badge */}
                      <div className="flex items-center justify-center gap-3 py-4 border-t border-card-border">
                        <span className="text-xs text-muted font-light">Estimated EU size:</span>
                        <motion.span
                          key={shoePreview}
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-2xl font-bold font-serif text-gold"
                        >
                          EU {shoePreview}
                        </motion.span>
                      </div>
                    </>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 gap-4">
                  <button
                    onClick={goBack}
                    className="flex items-center gap-2 px-5 py-3 rounded-full border border-card-border text-xs font-semibold uppercase tracking-widest text-muted hover:border-gold/50 hover:text-gold transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </button>
                  <button
                    id="calculate-btn"
                    onClick={goForward}
                    className="flex-grow h-12 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5 cursor-pointer"
                  >
                    <Ruler className="h-4 w-4" /> Calculate My Size
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─────────── STEP 2: Result reveal ─────────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-muted mb-6">
                  Step 3 of 3 — Your precision result
                </p>

                {/* ── Result card ── */}
                <motion.div
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="luxury-card overflow-hidden"
                >
                  {/* Top gold band */}
                  <div className="h-1.5 gold-gradient w-full" />

                  <div className="p-8 sm:p-12 flex flex-col items-center gap-6 text-center">
                    <div className="h-20 w-20 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center">
                      {category === "clothing"
                        ? <Shirt className="h-9 w-9 text-gold" />
                        : <Footprints className="h-9 w-9 text-gold" />
                      }
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted mb-2">
                        Your Premium{" "}
                        {category === "clothing" ? "Fitted" : "Shoe"} Size
                      </p>
                      <motion.p
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                        className="font-serif text-6xl sm:text-7xl font-bold text-gold"
                      >
                        {category === "shoes" ? `EU ${savedSize}` : savedSize}
                      </motion.p>
                    </div>

                    {/* Measurement summary */}
                    <div className="w-full border-t border-card-border pt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {category === "clothing" ? (
                        <>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest text-muted">Height</span>
                            <span className="font-semibold text-sm">{height} cm</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[9px] uppercase tracking-widest text-muted">Weight</span>
                            <span className="font-semibold text-sm">{weight} kg</span>
                          </div>
                          <div className="flex flex-col items-center gap-0.5 col-span-2 sm:col-span-1">
                            <span className="text-[9px] uppercase tracking-widest text-muted">Fit Preference</span>
                            <span className="font-semibold text-sm capitalize">{preference}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center gap-0.5 col-span-2">
                            <span className="text-[9px] uppercase tracking-widest text-muted">Foot Length</span>
                            <span className="font-semibold text-sm">{footLength} cm</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ── Action buttons ── */}
                <div className="flex flex-col gap-3.5 mt-6">
                  {/* Save to Profile */}
                  <motion.button
                    id="save-profile-btn"
                    onClick={handleSaveToProfile}
                    disabled={isSaving}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full h-14 rounded-full bg-foreground text-background hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-widest shadow-md hover:-translate-y-0.5 disabled:opacity-60 cursor-pointer"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {isAuthenticated ? "Save to My Profile" : "Log In to Save"}
                      </>
                    )}
                  </motion.button>

                  {/* Shop Your Size CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42 }}
                  >
                    <Link
                      id="shop-your-size-btn"
                      href={
                        category === "clothing"
                          ? `/products?size=${savedSize}`
                          : `/products?shoeSize=${savedSize}`
                      }
                      className="w-full h-12 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-all flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Shop Your Size Now
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </motion.div>

                  {/* Start over */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    onClick={() => {
                      setStep(0);
                      setCategory(null);
                      setSavedSize(null);
                    }}
                    className="text-[10px] text-muted hover:text-gold transition-colors uppercase tracking-wider font-semibold text-center mt-1 cursor-pointer"
                  >
                    ← Recalibrate for another category
                  </motion.button>
                </div>

                {/* Profile save confirmation notice */}
                {savedSize && isAuthenticated && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ delay: 0.6 }}
                    className="mt-6 flex items-start gap-3 rounded-2xl bg-success/5 border border-success/20 p-4 text-xs text-success"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Your size profile is now visible in your{" "}
                      <Link href="/dashboard" className="font-bold underline underline-offset-2">
                        Dashboard → My Fit Profile
                      </Link>
                      . It will be used to pre-select sizes on product pages.
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
