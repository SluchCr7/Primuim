import React from "react";

/**
 * Standard Product Card Skeleton
 */
export const CardSkeleton: React.FC = () => {
  return (
    <div className="luxury-card overflow-hidden h-[410px] rounded-2xl animate-pulse flex flex-col justify-between border border-card-border/60 bg-card-bg/40">
      <div className="aspect-square bg-muted-light/60 dark:bg-muted-light/20 w-full" />
      <div className="p-4 sm:p-5 flex flex-col gap-3 flex-grow justify-between">
        <div className="space-y-2">
          <div className="h-2.5 bg-muted-light/70 dark:bg-muted-light/25 w-1/4 rounded-full" />
          <div className="h-4 bg-muted-light/70 dark:bg-muted-light/25 w-4/5 rounded-full" />
          <div className="h-3 bg-muted-light/50 dark:bg-muted-light/15 w-1/2 rounded-full" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-card-border/30">
          <div className="h-4 bg-muted-light/80 dark:bg-muted-light/30 w-1/3 rounded-full" />
          <div className="h-7 bg-muted-light/70 dark:bg-muted-light/25 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Category Card Skeleton (for Homepage & Categories Page)
 */
export const CategoryCardSkeleton: React.FC = () => {
  return (
    <div className="luxury-card min-h-[320px] rounded-[28px] overflow-hidden relative animate-pulse border border-card-border/60 bg-card-bg/40 flex flex-col justify-end p-6">
      <div className="absolute inset-0 bg-muted-light/50 dark:bg-muted-light/15" />
      <div className="relative z-10 flex flex-col gap-3">
        <div className="h-5 w-28 bg-muted-light/80 dark:bg-muted-light/35 rounded-full" />
        <div className="h-7 w-48 bg-muted-light/90 dark:bg-muted-light/40 rounded-full" />
        <div className="h-3 w-3/4 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
        <div className="h-4 w-32 bg-muted-light/70 dark:bg-muted-light/30 rounded-full mt-2" />
      </div>
    </div>
  );
};

/**
 * Category Navigation Links Skeleton (Header Desktop)
 */
export const CategoryNavSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const widths = ["w-16", "w-24", "w-20", "w-28", "w-18", "w-22"];
  return (
    <div className="flex items-center gap-6 h-12 animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded-full bg-muted-light/60 dark:bg-muted-light/25 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
};

/**
 * Mobile Category Menu Skeleton (Header Mobile Drawer)
 */
export const MobileCategoryNavSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-xl bg-card-bg/50 border border-card-border/40 p-3.5 flex items-center"
        >
          <div className="h-3.5 w-3/4 rounded-full bg-muted-light/60 dark:bg-muted-light/25" />
        </div>
      ))}
    </div>
  );
};

/**
 * Category Pill Filter Skeleton (Stores, Catalog filter bars)
 */
export const CategoryPillSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const widths = ["w-20", "w-24", "w-28", "w-18", "w-22"];
  return (
    <div className="flex items-center gap-2.5 overflow-hidden animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`h-8 rounded-full bg-card-bg/60 border border-card-border/50 shrink-0 ${widths[i % widths.length]}`}
        />
      ))}
    </div>
  );
};

/**
 * Sidebar Categories Skeleton (Products catalog filter sidebar)
 */
export const SidebarCategoriesSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  const widths = ["w-32", "w-24", "w-36", "w-28", "w-30"];
  return (
    <div className="flex flex-col gap-2 py-1 animate-pulse" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card-bg/40">
          <div className={`h-3.5 rounded-full bg-muted-light/60 dark:bg-muted-light/25 ${widths[i % widths.length]}`} />
        </div>
      ))}
    </div>
  );
};

/**
 * Seller Card Skeleton (Homepage & Stores List)
 */
export const SellerCardSkeleton: React.FC = () => {
  return (
    <div className="luxury-card overflow-hidden rounded-[24px] border border-card-border/60 bg-card-bg/40 p-6 flex flex-col justify-between h-[280px] animate-pulse">
      <div>
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 rounded-full bg-muted-light/70 dark:bg-muted-light/25 border border-card-border" />
          <div className="space-y-2 flex-grow pt-1">
            <div className="h-4 w-32 bg-muted-light/80 dark:bg-muted-light/30 rounded-full" />
            <div className="h-3 w-20 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
            <div className="h-3 w-28 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2.5 w-full bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
          <div className="h-2.5 w-4/5 bg-muted-light/40 dark:bg-muted-light/15 rounded-full" />
        </div>
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-card-border/30">
        <div className="h-3 w-16 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
        <div className="h-8 w-24 bg-muted-light/70 dark:bg-muted-light/30 rounded-full" />
      </div>
    </div>
  );
};

/**
 * Article / Editorial Card Skeleton
 */
export const ArticleCardSkeleton: React.FC = () => {
  return (
    <div className="luxury-card overflow-hidden rounded-[24px] border border-card-border/60 bg-card-bg/40 flex flex-col h-full animate-pulse">
      <div className="aspect-[16/10] bg-muted-light/60 dark:bg-muted-light/25 w-full" />
      <div className="p-6 flex flex-col justify-between flex-grow gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
            <div className="h-2.5 w-14 bg-muted-light/50 dark:bg-muted-light/15 rounded-full" />
          </div>
          <div className="h-5 w-4/5 bg-muted-light/80 dark:bg-muted-light/30 rounded-full" />
          <div className="h-3 w-full bg-muted-light/50 dark:bg-muted-light/15 rounded-full" />
          <div className="h-3 w-2/3 bg-muted-light/50 dark:bg-muted-light/15 rounded-full" />
        </div>
        <div className="h-4 w-24 bg-muted-light/70 dark:bg-muted-light/25 rounded-full mt-2" />
      </div>
    </div>
  );
};

/**
 * Testimonial Skeleton
 */
export const TestimonialSkeleton: React.FC = () => {
  return (
    <div className="luxury-card rounded-[24px] border border-card-border/60 bg-card-bg/40 p-8 flex flex-col justify-between animate-pulse">
      <div className="space-y-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-4 w-4 rounded-full bg-muted-light/60 dark:bg-muted-light/25" />
          ))}
        </div>
        <div className="h-3.5 w-full bg-muted-light/60 dark:bg-muted-light/25 rounded-full mt-4" />
        <div className="h-3.5 w-5/6 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
        <div className="h-3.5 w-2/3 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
      </div>
      <div className="flex items-center gap-3 mt-6 pt-6 border-t border-card-border/30">
        <div className="h-10 w-10 rounded-full bg-muted-light/70 dark:bg-muted-light/30" />
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 bg-muted-light/80 dark:bg-muted-light/35 rounded-full" />
          <div className="h-2.5 w-20 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Product Detail Page Skeleton (for product/[slug] and products/[id])
 */
export const DetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2 mb-8">
        <div className="h-3 w-16 bg-muted-light/70 dark:bg-muted-light/25 rounded-full" />
        <div className="h-3 w-3 bg-muted-light/40 dark:bg-muted-light/15 rounded-full" />
        <div className="h-3 w-24 bg-muted-light/70 dark:bg-muted-light/25 rounded-full" />
        <div className="h-3 w-3 bg-muted-light/40 dark:bg-muted-light/15 rounded-full" />
        <div className="h-3 w-32 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Gallery skeleton */}
        <div className="flex flex-col-reverse sm:flex-row gap-4">
          <div className="flex sm:flex-col gap-3 shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-muted-light/60 dark:bg-muted-light/20 border border-card-border/50"
              />
            ))}
          </div>
          <div className="flex-grow aspect-square rounded-2xl bg-muted-light/60 dark:bg-muted-light/20 border border-card-border/50 overflow-hidden" />
        </div>

        {/* Product info skeleton */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-muted-light/70 dark:bg-muted-light/25 rounded-full" />
              <div className="h-4 w-20 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
            </div>
            <div className="h-8 w-4/5 bg-muted-light/90 dark:bg-muted-light/35 rounded-xl" />
            <div className="h-4 w-1/3 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
          </div>

          <div className="h-10 w-40 bg-muted-light/80 dark:bg-muted-light/30 rounded-xl" />

          <div className="space-y-2 py-4 border-y border-card-border/40">
            <div className="h-3 w-full bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
            <div className="h-3 w-5/6 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
            <div className="h-3 w-3/4 bg-muted-light/40 dark:bg-muted-light/15 rounded-full" />
          </div>

          {/* Variants skeleton */}
          <div className="space-y-3">
            <div className="h-3 w-24 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-16 bg-muted-light/60 dark:bg-muted-light/20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Action buttons skeleton */}
          <div className="flex gap-4 pt-4">
            <div className="h-14 flex-grow bg-muted-light/80 dark:bg-muted-light/35 rounded-2xl" />
            <div className="h-14 w-14 shrink-0 bg-muted-light/60 dark:bg-muted-light/20 rounded-2xl" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="h-16 rounded-xl bg-card-bg/60 border border-card-border/40" />
            <div className="h-16 rounded-xl bg-card-bg/60 border border-card-border/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Category View Page Skeleton (for category/[slug] and categories/[id])
 */
export const CategoryPageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-pulse">
      <main className="flex-grow mx-auto max-w-7xl w-full px-6 py-10 space-y-10">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
          <div className="h-3 w-3 bg-muted-light/40 dark:bg-muted-light/15 rounded-full" />
          <div className="h-3 w-28 bg-muted-light/70 dark:bg-muted-light/25 rounded-full" />
        </div>

        {/* Hero Banner Skeleton */}
        <div className="h-[220px] rounded-3xl bg-muted-light/50 dark:bg-muted-light/15 border border-card-border/50 p-8 flex flex-col justify-end gap-3">
          <div className="h-4 w-28 bg-muted-light/80 dark:bg-muted-light/30 rounded-full" />
          <div className="h-8 w-64 bg-muted-light/90 dark:bg-muted-light/35 rounded-xl" />
          <div className="h-3 w-96 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
        </div>

        {/* Subcategories Pills Skeleton */}
        <div className="flex items-center gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 w-28 rounded-full bg-card-bg/60 border border-card-border/40 shrink-0" />
          ))}
        </div>

        {/* Products Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

/**
 * Store Profile Page Skeleton (for store/[slug])
 */
export const StoreProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-pulse">
      {/* Banner */}
      <div className="h-56 sm:h-72 w-full bg-muted-light/50 dark:bg-muted-light/15 border-b border-card-border/40" />

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 -mt-16 sm:-mt-20 relative z-10 space-y-10">
        {/* Header Card */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-card-border/60 bg-card-bg shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-muted-light/70 dark:bg-muted-light/30 border-2 border-gold/40 shrink-0" />
            <div className="space-y-2.5">
              <div className="h-6 w-48 bg-muted-light/90 dark:bg-muted-light/35 rounded-xl" />
              <div className="h-3 w-32 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
              <div className="h-3 w-64 bg-muted-light/50 dark:bg-muted-light/20 rounded-full" />
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="h-11 w-32 bg-muted-light/70 dark:bg-muted-light/30 rounded-full" />
            <div className="h-11 w-11 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
          </div>
        </div>

        {/* Filter bar skeleton */}
        <div className="flex justify-between items-center py-2">
          <div className="h-10 w-64 bg-card-bg/60 border border-card-border/40 rounded-full" />
          <div className="h-10 w-36 bg-card-bg/60 border border-card-border/40 rounded-full" />
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </main>
    </div>
  );
};

/**
 * Dashboard Page Skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground animate-pulse">
      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* User Card */}
        <div className="luxury-card rounded-3xl p-6 sm:p-8 border border-card-border/60 bg-card-bg flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-muted-light/70 dark:bg-muted-light/30 shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-40 bg-muted-light/90 dark:bg-muted-light/35 rounded-xl" />
              <div className="h-3 w-52 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-muted-light/60 dark:bg-muted-light/25 rounded-xl" />
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="luxury-card p-6 rounded-2xl border border-card-border/50 bg-card-bg flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted-light/60 dark:bg-muted-light/25 shrink-0" />
              <div className="space-y-2 flex-grow">
                <div className="h-3 w-20 bg-muted-light/60 dark:bg-muted-light/25 rounded-full" />
                <div className="h-5 w-28 bg-muted-light/80 dark:bg-muted-light/30 rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab content placeholder */}
        <div className="luxury-card p-8 rounded-3xl border border-card-border/50 bg-card-bg space-y-4">
          <div className="h-6 w-48 bg-muted-light/80 dark:bg-muted-light/30 rounded-xl mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-card-bg/60 border border-card-border/40 p-4 flex items-center justify-between">
                <div className="h-4 w-40 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
                <div className="h-4 w-20 bg-muted-light/60 dark:bg-muted-light/20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full flex flex-col gap-4 animate-pulse">
      <div className="h-8 bg-muted-light dark:bg-muted-light/10 rounded w-full"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 items-center justify-between py-3 border-b border-card-border">
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-1/3"></div>
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-10"></div>
          <div className="h-4 bg-muted-light dark:bg-muted-light/10 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
};

export const StatSkeleton: React.FC = () => {
  return (
    <div className="luxury-card p-5 flex items-center gap-4 animate-pulse w-full">
      <div className="rounded-full bg-muted-light dark:bg-muted-light/10 h-12 w-12 shrink-0"></div>
      <div className="flex-grow flex flex-col gap-2">
        <div className="h-2.5 bg-muted-light dark:bg-muted-light/10 w-1/2 rounded"></div>
        <div className="h-5 bg-muted-light dark:bg-muted-light/10 w-3/4 rounded"></div>
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 animate-pulse w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
          <div className="h-10 bg-muted-light dark:bg-muted-light/10 rounded"></div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
          <div className="h-10 bg-muted-light dark:bg-muted-light/10 rounded"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 bg-muted-light dark:bg-muted-light/10 w-1/4 rounded"></div>
        <div className="h-28 bg-muted-light dark:bg-muted-light/10 rounded"></div>
      </div>
    </div>
  );
};
