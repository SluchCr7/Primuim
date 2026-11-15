"use client";

import { Quote } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetHomeTestimonialsQuery } from "@/redux/api/testimonialApi";

export default function HomeTestimonials() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useGetHomeTestimonialsQuery();
  const testimonials = data?.data ?? [];

  return (
    <section className="border-y border-card-border bg-[#f5f1ea] dark:bg-[#171613]">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-16 lg:px-12 xl:px-16">
        <div className="max-w-md">
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
            {t("home.testimonials_eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">
            {t("home.testimonials_title")}
          </h2>
        </div>

        {isLoading ? (
          <div
            role="status"
            aria-label={t("home.testimonials_loading")}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="min-h-56 animate-pulse border border-card-border bg-background/70 p-6">
                <div className="h-5 w-5 bg-muted-light" />
                <div className="mt-8 h-3 w-full bg-muted-light" />
                <div className="mt-3 h-3 w-4/5 bg-muted-light" />
                <div className="mt-8 h-3 w-2/5 bg-muted-light" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <p role="status" className="border border-card-border bg-background/70 px-6 py-8 text-sm text-muted">
            {t("home.testimonials_error")}
          </p>
        ) : testimonials.length === 0 ? (
          <p className="border border-card-border bg-background/70 px-6 py-8 text-sm text-muted">
            {t("home.testimonials_empty")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial) => {
              const name =
                testimonial.User?.name ||
                testimonial.User?.profileName ||
                testimonial.User?.username ||
                t("home.testimonials_customer");

              return (
                <article
                  key={testimonial._id}
                  className="flex min-h-56 flex-col border border-card-border bg-background/80 p-6 sm:p-7"
                >
                  <Quote aria-hidden="true" className="h-5 w-5 text-gold" strokeWidth={1.5} />
                  <blockquote className="mt-6 flex-1 font-serif text-lg leading-7 text-foreground">
                    {testimonial.body}
                  </blockquote>
                  <div className="mt-7 flex items-center gap-3 border-t border-card-border pt-5">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-muted-light font-serif text-sm text-foreground"
                    >
                      {name.trim().charAt(0).toUpperCase()}
                    </span>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">{name}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
