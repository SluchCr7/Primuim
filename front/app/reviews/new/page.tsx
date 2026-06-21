"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  Loader2,
  Lock,
  MessageSquare
} from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useToast } from "../../components/Toast";
import { useAppSelector } from "../../../lib/store";
import { API_BASE_URL } from "../../../lib/api";

export default function NewReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user, accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  const [mounted, setMounted] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Validation states
  const minCharCount = 50;
  const maxCharCount = 500;
  const currentLength = reviewBody.length;
  const isLengthValid = currentLength >= minCharCount && currentLength <= maxCharCount;
  const isFormValid = isLengthValid && isAuthenticated;

  // Hydration tracking & Security redirection
  useEffect(() => {
    setMounted(true);
    if (mounted && !isAuthenticated) {
      showToast("Please log in to share your experience.", "error");
      router.push("/login");
    }
  }, [isAuthenticated, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !accessToken) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ body: reviewBody })
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Your review has been submitted for moderation!", "success");
        setSubmitSuccess(true);
      } else {
        showToast(data.message || "Failed to submit review.", "error");
      }
    } catch (error) {
      showToast("A network error occurred. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 py-20">
          <Lock className="h-12 w-12 text-amber-500 animate-pulse" />
          <h2 className="text-xl font-serif tracking-widest text-zinc-400 uppercase">Redirecting to Login...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans">
      <Header />

      <main className="flex-grow flex items-center justify-center px-6 py-16 relative overflow-hidden">
        {/* Background Decorative Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-zinc-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-xl relative z-10">
          <AnimatePresence mode="wait">
            {!submitSuccess ? (
              <motion.div
                key="form-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="bg-zinc-900/60 border border-zinc-800/80 rounded-[32px] p-8 md:p-10 backdrop-blur-md shadow-2xl"
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] block mb-2.5">
                    Client Voice
                  </span>
                  <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-zinc-100">
                    Share your experience with our platform.
                  </h1>
                  <p className="text-xs text-zinc-400 font-light mt-3 max-w-xs mx-auto leading-relaxed">
                    We appreciate your thoughts and insights to help us continuously refine our premium services.
                  </p>
                </div>

                {/* Info Notice Badge */}
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 mb-8 flex gap-3 items-start">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed text-amber-500/90 font-medium">
                    Your review will be evaluated by our curation team before appearing publicly on the homepage listing.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Write your testimonial
                    </label>
                    <div className="relative">
                      <textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder="Tell us what you liked about our products, store experiences, and delivery times..."
                        maxLength={maxCharCount}
                        disabled={isSubmitting}
                        className="w-full min-h-[160px] bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 text-sm font-light text-zinc-200 outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/20 placeholder-zinc-600 transition-all duration-300 resize-y"
                      />
                    </div>

                    {/* Footer Row (Counter & Validator) */}
                    <div className="flex justify-between items-center px-1 mt-1 text-[11px]">
                      <div>
                        {currentLength > 0 && (
                          <span className={`font-semibold ${isLengthValid ? "text-emerald-400" : "text-amber-500/80"}`}>
                            {isLengthValid ? (
                              "✓ Looks perfect"
                            ) : (
                              `Requires ${minCharCount - currentLength} more characters`
                            )}
                          </span>
                        )}
                      </div>
                      <div className="text-zinc-500 font-medium">
                        {currentLength} / {maxCharCount}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 items-center pt-2">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!isFormValid || isSubmitting}
                      className="flex-grow flex items-center justify-center gap-2 bg-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-widest py-3 rounded-2xl hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 disabled:opacity-30 disabled:hover:bg-amber-500 disabled:hover:shadow-none cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing
                        </>
                      ) : (
                        <>
                          Submit Review <Send className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
              >
                {/* Gold Success Ring Animation */}
                <div className="relative mx-auto w-20 h-20 mb-8 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.1 }}
                    className="absolute inset-0 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 100, damping: 12, delay: 0.25 }}
                    className="text-emerald-500"
                  >
                    <CheckCircle className="h-10 w-10" />
                  </motion.div>
                </div>

                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] block mb-2">
                  Feedback Received
                </span>
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-zinc-100">
                  Thank You for Your Feedback
                </h2>
                <p className="text-xs text-zinc-400 font-light mt-4 max-w-sm mx-auto leading-relaxed">
                  Your insights are incredibly valuable to us. Once our editorial curation team reviews your submission, it will be published to the community platform.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setReviewBody("");
                      setSubmitSuccess(false);
                    }}
                    className="px-6 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    Submit Another Review
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                  >
                    Go to Homepage <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
