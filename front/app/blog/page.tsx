"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, Search, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import Breadcrumbs from "../components/Breadcrumbs";
import { useGetArticlesQuery } from "@/redux/api";

interface ArticlePreview {
  _id: string;
  title: string;
  subtitle?: string;
  content: string;
  category?: string;
  image?: { url?: string } | null;
  authorName?: string;
  author?: { storeName?: string; brandName?: string; username?: string } | null;
  createdAt?: string;
  publishedAt?: string;
  views?: number;
}

const categories = [
  ["Lifestyle", "articles.category_lifestyle"],
  ["Collections", "articles.category_collections"],
  ["Luxury Watch", "articles.category_watches"],
  ["Brand Story", "articles.category_brand_story"],
] as const;

function getExcerpt(article: ArticlePreview) {
  const excerpt = (article.subtitle || article.content).replace(/[#*`]/g, "").trim();
  return excerpt.length > 180 ? `${excerpt.slice(0, 180).trimEnd()}…` : excerpt;
}

function ArticleImage({
  article,
  priority = false,
  sizes,
}: {
  article: ArticlePreview;
  priority?: boolean;
  sizes: string;
}) {
  return article.image?.url ? (
    <Image
      src={article.image.url}
      alt={article.title}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
    />
  ) : (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#d8c6aa] to-[#89765f] text-white">
      <BookOpen aria-hidden="true" className="h-10 w-10 opacity-80" strokeWidth={1} />
    </div>
  );
}

export default function BlogListingPage() {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useGetArticlesQuery({
    search: submittedSearch,
    category: selectedCategory,
    page,
    limit: 10,
  });
  const articles = (data?.data || []) as ArticlePreview[];
  const dateFormatter = new Intl.DateTimeFormat(i18n.language, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(searchTerm.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSubmittedSearch("");
    setSelectedCategory("");
    setPage(1);
  };

  const renderDate = (article: ArticlePreview) => {
    const date = article.publishedAt || article.createdAt;
    return date ? dateFormatter.format(new Date(date)) : null;
  };

  return (
    <main className="min-h-screen flex-1 bg-background text-foreground">
      <section className="relative isolate overflow-hidden border-b border-card-border bg-[#eee8df] dark:bg-[#191814]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full bg-gold/15 blur-3xl"
        />
        <div className="relative mx-auto max-w-[1440px] px-5 pb-14 pt-8 sm:px-8 sm:pb-20 lg:px-12">
          <Breadcrumbs items={[{ label: t("articles.blog"), url: "/blog" }]} />
          <div className="mx-auto max-w-4xl py-12 text-center sm:py-16">
            <p className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.3em] text-gold">
              <Sparkles aria-hidden="true" className="h-4 w-4" />
              {t("articles.blog_eyebrow")}
            </p>
            <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              {t("articles.blog_title")}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-muted sm:text-base">
              {t("articles.blog_description")}
            </p>
          </div>

          <div className="mx-auto flex max-w-3xl flex-col gap-3 border border-card-border bg-background/90 p-3 shadow-[0_18px_50px_rgba(16,16,15,0.06)] sm:flex-row dark:shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
            <form onSubmit={handleSearchSubmit} className="flex min-h-12 min-w-0 flex-1 items-center border-b border-card-border sm:border-b-0 sm:border-r sm:pr-3">
              <Search aria-hidden="true" className="mx-3 h-4 w-4 shrink-0 text-gold" />
              <label htmlFor="article-search" className="sr-only">{t("articles.search_label")}</label>
              <input
                id="article-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t("articles.search_placeholder")}
                className="min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                className="px-3 text-[10px] font-medium uppercase tracking-[0.13em] text-gold transition-colors hover:text-foreground"
              >
                {t("articles.search_button")}
              </button>
            </form>
            <label className="sr-only" htmlFor="article-category">{t("articles.category_filter")}</label>
            <select
              id="article-category"
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setPage(1);
              }}
              className="min-h-12 bg-transparent px-3 text-xs text-foreground outline-none sm:min-w-48"
            >
              <option value="">{t("articles.all_categories")}</option>
              {categories.map(([category, translationKey]) => (
                <option key={category} value={category}>{t(translationKey)}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gold">
              {t("articles.latest_eyebrow")}
            </p>
            <h2 className="mt-2 font-serif text-3xl font-medium sm:text-4xl">{t("articles.latest_title")}</h2>
          </div>
          {(submittedSearch || selectedCategory) && (
            <button
              type="button"
              onClick={clearFilters}
              className="pb-1 text-xs text-muted underline decoration-card-border underline-offset-4 transition-colors hover:text-gold"
            >
              {t("articles.clear_filters")}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="aspect-[16/10] animate-pulse bg-muted-light" />
            <div className="grid gap-6 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="aspect-[4/3] bg-muted-light" />
                  <div className="mt-5 h-3 w-1/4 bg-muted-light" />
                  <div className="mt-3 h-5 w-4/5 bg-muted-light" />
                  <div className="mt-3 h-3 w-full bg-muted-light" />
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div role="status" className="border border-card-border px-6 py-10 text-center">
            <p className="font-serif text-xl">{t("articles.load_error_title")}</p>
            <p className="mt-2 text-sm text-muted">{t("articles.load_error")}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-gold underline underline-offset-4"
            >
              {t("articles.try_again")}
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="border border-card-border px-6 py-16 text-center">
            <BookOpen aria-hidden="true" className="mx-auto h-8 w-8 text-gold" strokeWidth={1} />
            <p className="mt-5 font-serif text-2xl">{t("articles.empty_title")}</p>
            <p className="mt-2 text-sm text-muted">{t("articles.empty_description")}</p>
            {(submittedSearch || selectedCategory) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-gold underline underline-offset-4"
              >
                {t("articles.clear_filters")}
              </button>
            )}
          </div>
        ) : (
          <div>
            {articles.slice(0, 1).map((article) => (
              <article key={article._id} className="group grid overflow-hidden border border-card-border bg-card-bg lg:grid-cols-[1.15fr_0.85fr]">
                <Link href={`/blog/${article._id}`} className="relative block aspect-[16/10] overflow-hidden bg-muted-light lg:aspect-auto lg:min-h-[480px]">
                  <ArticleImage article={article} priority sizes="(max-width: 1024px) 100vw, 58vw" />
                </Link>
                <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-12">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold">
                    {article.category || t("articles.editorial")}
                  </p>
                  {renderDate(article) && (
                    <p className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.13em] text-muted">
                      <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-gold" />
                      {renderDate(article)}
                    </p>
                  )}
                  <h2 className="mt-4 font-serif text-3xl font-medium leading-tight sm:text-4xl">
                    <Link href={`/blog/${article._id}`} className="transition-colors hover:text-gold">{article.title}</Link>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted">{getExcerpt(article)}</p>
                  <p className="mt-5 text-[10px] uppercase tracking-[0.13em] text-muted">
                    {t("articles.by")} {article.author?.storeName || article.author?.brandName || article.authorName || t("articles.editorial_team")}
                  </p>
                  <Link
                    href={`/blog/${article._id}`}
                    className="mt-8 inline-flex min-h-11 w-fit items-center gap-3 bg-foreground px-5 text-[10px] font-medium uppercase tracking-[0.16em] text-background transition-colors hover:bg-gold"
                  >
                    {t("articles.read_story")} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                </div>
              </article>
            ))}

            {articles.length > 1 && (
              <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {articles.slice(1).map((article) => (
                  <article key={article._id} className="group min-w-0">
                    <Link href={`/blog/${article._id}`} className="relative block aspect-[4/3] overflow-hidden bg-muted-light">
                      <ArticleImage article={article} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                    </Link>
                    <div className="pt-5">
                      <div className="flex items-center justify-between gap-3 text-[9px] font-medium uppercase tracking-[0.16em] text-gold">
                        <span>{article.category || t("articles.editorial")}</span>
                        {renderDate(article) && <span className="text-muted">{renderDate(article)}</span>}
                      </div>
                      <h3 className="mt-3 font-serif text-xl leading-7">
                        <Link href={`/blog/${article._id}`} className="transition-colors hover:text-gold">{article.title}</Link>
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-muted">{getExcerpt(article)}</p>
                      <Link
                        href={`/blog/${article._id}`}
                        className="mt-5 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.15em] text-foreground transition-colors hover:text-gold"
                      >
                        {t("articles.read_story")} <ArrowRight aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {(data?.totalPages || 0) > 1 && (
              <nav
                aria-label={t("articles.pagination")}
                className="mt-12 flex items-center justify-between border-t border-card-border pt-6"
              >
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="inline-flex min-h-10 items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {t("articles.previous")}
                </button>
                <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  {t("articles.page_count", { page, total: data?.totalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(data?.totalPages || current, current + 1))}
                  disabled={page >= (data?.totalPages || 1)}
                  className="inline-flex min-h-10 items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted transition-colors hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {t("articles.next")} <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </nav>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
