"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { useTranslation } from "react-i18next";

interface BreadcrumbItem {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const { t } = useTranslation();
  // Generate Breadcrumb Structured Schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.url ? `http://localhost:3000${item.url}` : undefined,
    })),
  };

  return (
    <nav className="flex flex-col gap-2 mb-6" aria-label="Breadcrumb">
      {/* JSON-LD Schema injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      <ol className="flex items-center flex-wrap gap-2 text-xs text-muted font-medium">
        <li className="flex items-center gap-1.5">
          <Link
            href="/"
            className="hover:text-gold transition-colors flex items-center gap-1 focus-visible:ring-1 focus-visible:ring-gold outline-none rounded p-0.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">{t('breadcrumb.home', 'Home')}</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-muted/60" />
              {isLast || !item.url ? (
                <span className="text-foreground/80 font-semibold truncate max-w-[150px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-gold transition-colors truncate max-w-[150px] focus-visible:ring-1 focus-visible:ring-gold outline-none rounded p-0.5"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
