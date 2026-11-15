"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

const linkGroups = [
  {
    title: "Discover",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Collections", href: "/categories" },
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Best Sellers", href: "/best-sellers" },
      { label: "Stores", href: "/stores" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About LUMIXA", href: "/about" },
      { label: "Journal", href: "/blog" },
      { label: "Become a Seller", href: "/seller" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Help Center", href: "/faq" },
      { label: "Shipping", href: "/policies/shipping" },
      { label: "Returns", href: "/policies/returns" },
      { label: "Privacy", href: "/policies/privacy" },
      { label: "Terms", href: "/policies/terms" },
    ],
  },
];

export const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer
      className="mt-auto w-full border-t border-card-border bg-card-bg text-foreground"
      aria-label={t("Site Footer")}
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[1.4fr_3fr] lg:gap-16 lg:py-16">
        <div className="max-w-sm">
          <Link
            href="/"
            className="font-serif text-2xl font-semibold tracking-[0.22em] text-gold"
            aria-label="LUMIXA home"
          >
            LUMIXA
          </Link>
          <p className="mt-4 text-sm leading-6 text-muted">
            {t(
              "A considered edit across fashion, home, technology, and everyday finds."
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={t(`${group.title} links`)}>
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                {t(group.title)}
              </h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted transition-colors hover:text-gold"
                    >
                      {t(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-card-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} LUMIXA</p>
          <Link href="/sitemap.xml" className="transition-colors hover:text-gold">
            {t("Sitemap")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
