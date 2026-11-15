"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Clock3, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGetArticlesQuery } from "@/redux/api";

interface ArticlePreview {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  image?: { url?: string } | null;
  authorName?: string;
  author?: { storeName?: string; brandName?: string } | null;
  createdAt?: string;
  publishedAt?: string;
  readTime?: number;
}

function getReadTime(article: ArticlePreview) {
  return article.readTime || Math.max(1, Math.ceil(article.content.trim().split(/\s+/).length / 200));
}

export default function HomeArticles() {
  const { t, i18n } = useTranslation();
  const { data, isLoading, isError } = useGetArticlesQuery({ limit: 3 });
  const articles = (data?.data || []) as ArticlePreview[];
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <section className="border-y border-card-border bg-[#f5f1ea] dark:bg-[#171613]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-16">
        <div className="mb-9 flex flex-col gap-5 sm:mb-11 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {t("articles.home_eyebrow")}
            </p>
            <h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">
              {t("articles.home_title")}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-muted">
              {t("articles.home_description")}
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex min-h-11 w-fit items-center gap-2 border-b border-gold pb-1 text-xs font-medium uppercase tracking-[0.16em] text-foreground transition-colors hover:text-gold"
          >
            {t("articles.view_all")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className={`grid gap-5 ${articles.length > 1 ? "lg:grid-cols-[1.2fr_0.8fr]" : ""}`}>
            <div className="aspect-[16/10] animate-pulse bg-muted-light" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="flex min-h-32 animate-pulse gap-4 border border-card-border bg-background/70 p-4">
                  <div className="w-2/5 bg-muted-light" />
                  <div className="flex flex-1 flex-col justify-center gap-3">
                    <div className="h-3 w-1/3 bg-muted-light" />
                    <div className="h-4 w-full bg-muted-light" />
                    <div className="h-3 w-2/3 bg-muted-light" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <p role="status" className="border border-card-border bg-background/70 px-6 py-8 text-sm text-muted">
            {t("articles.load_error")}
          </p>
        ) : articles.length === 0 ? (
          <p className="border border-card-border bg-background/70 px-6 py-8 text-sm text-muted">
            {t("articles.empty")}
          </p>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            {articles.slice(0, 1).map((article) => (
              <article key={article._id} className="group min-w-0">
                <Link
                  href={`/blog/${article._id}`}
                  className="relative block aspect-[16/10] overflow-hidden bg-muted-light"
                >
                  {article.image?.url ? (
                    <Image
                      src={article.image.url}
                      alt={article.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d8c6aa] to-[#89765f] text-white">
                      <BookOpen aria-hidden="true" className="h-10 w-10 opacity-80" strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-7">
                    <span className="inline-flex border border-white/40 bg-black/20 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.18em] backdrop-blur-sm">
                      {article.category || t("articles.editorial")}
                    </span>
                    <h3 className="mt-3 max-w-2xl font-serif text-2xl leading-tight sm:text-3xl">
                      {article.title}
                    </h3>
                    <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/85">
                      {t("articles.read_story")} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] uppercase tracking-[0.13em] text-muted">
                  <span>{article.author?.storeName || article.author?.brandName || article.authorName || t("articles.editorial_team")}</span>
                  {article.createdAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
                      {dateFormatter.format(new Date(article.publishedAt || article.createdAt))}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
                    {t("articles.read_time", { count: getReadTime(article) })}
                  </span>
                </div>
              </article>
            ))}

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {articles.slice(1).map((article) => (
                <article key={article._id} className="group flex min-h-32 min-w-0 border border-card-border bg-background/80">
                  <Link href={`/blog/${article._id}`} className="relative w-[38%] shrink-0 overflow-hidden bg-muted-light">
                    {article.image?.url ? (
                      <Image
                        src={article.image.url}
                        alt={article.title}
                        fill
                        sizes="(max-width: 1024px) 38vw, 20vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d8c6aa] to-[#89765f] text-white">
                        <BookOpen aria-hidden="true" className="h-7 w-7 opacity-80" strokeWidth={1} />
                      </div>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                    <p className="text-[9px] font-medium uppercase tracking-[0.16em] text-gold">
                      {article.category || t("articles.editorial")}
                    </p>
                    <Link
                      href={`/blog/${article._id}`}
                      className="mt-2 line-clamp-2 font-serif text-lg leading-6 transition-colors group-hover:text-gold"
                    >
                      {article.title}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                      {article.subtitle || article.content.replace(/[#*`]/g, "").slice(0, 110)}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-foreground">
                      {t("articles.read_story")} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
