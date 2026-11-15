import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";

const BASE_URL = SITE_URL;
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!configuredApiUrl && process.env.VERCEL) {
  throw new Error("NEXT_PUBLIC_API_URL must be configured for Vercel deployments.");
}

const backendUrl = (configuredApiUrl || "http://localhost:5000/api").replace(/\/+$/, "");
const API_URL = backendUrl.endsWith("/api") ? backendUrl : `${backendUrl}/api`;

interface SitemapRecord {
  _id?: string;
  slug?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/products`, lastModified: new Date() },
    { url: `${BASE_URL}/categories`, lastModified: new Date() },
    { url: `${BASE_URL}/blog`, lastModified: new Date() },
    { url: `${BASE_URL}/about`, lastModified: new Date() },
    { url: `${BASE_URL}/contact`, lastModified: new Date() },
    { url: `${BASE_URL}/compare`, lastModified: new Date() },
    { url: `${BASE_URL}/wishlist`, lastModified: new Date() },
  ];

  let productPaths: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/products?limit=100`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to generate dynamic product sitemap (HTTP ${res.status}).`);
    } else {
      const data = (await res.json()) as { success?: boolean; products?: SitemapRecord[] };
      if (data.success && Array.isArray(data.products)) {
        productPaths = data.products.flatMap((prod) =>
          typeof prod.slug === "string" && prod.slug.length > 0
            ? [{
                url: `${BASE_URL}/product/${prod.slug}`,
                lastModified: new Date(prod.updatedAt || prod.createdAt || Date.now()),
              }]
            : []
        );
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic product sitemaps:", err);
  }

  let categoryPaths: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories?tree=false`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to generate dynamic category sitemap (HTTP ${res.status}).`);
    } else {
      const data = (await res.json()) as { success?: boolean; categories?: SitemapRecord[] };
      if (data.success && Array.isArray(data.categories)) {
        categoryPaths = data.categories.flatMap((cat) =>
          typeof cat.slug === "string" && cat.slug.length > 0
            ? [{
                url: `${BASE_URL}/category/${cat.slug}`,
                lastModified: new Date(cat.updatedAt || cat.createdAt || Date.now()),
              }]
            : []
        );
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic category sitemaps:", err);
  }

  let articlePaths: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/articles`, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error(`Failed to generate dynamic article sitemap (HTTP ${res.status}).`);
    } else {
      const data = (await res.json()) as { success?: boolean; articles?: SitemapRecord[] };
      if (data.success && Array.isArray(data.articles)) {
        articlePaths = data.articles.flatMap((article) => {
          const slug =
            typeof article.slug === "string" && article.slug.length > 0
              ? article.slug
              : article._id;
          return slug
            ? [{
                url: `${BASE_URL}/blog/${slug}`,
                lastModified: new Date(article.updatedAt || article.createdAt || Date.now()),
              }]
            : [];
        });
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic article sitemaps:", err);
  }

  return [...staticPaths, ...productPaths, ...categoryPaths, ...articlePaths];
}
