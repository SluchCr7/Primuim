import { MetadataRoute } from "next";

const BASE_URL = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        productPaths = data.products.map((prod: any) => ({
          url: `${BASE_URL}/product/${prod.slug}`,
          lastModified: new Date(prod.updatedAt || prod.createdAt || Date.now()),
        }));
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic product sitemaps:", err);
  }

  let categoryPaths: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/categories?tree=false`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.categories)) {
        categoryPaths = data.categories.map((cat: any) => ({
          url: `${BASE_URL}/category/${cat.slug}`,
          lastModified: new Date(cat.updatedAt || cat.createdAt || Date.now()),
        }));
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic category sitemaps:", err);
  }

  let articlePaths: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API_URL}/articles`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.articles)) {
        articlePaths = data.articles.map((art: any) => ({
          url: `${BASE_URL}/blog/${art.slug || art._id}`,
          lastModified: new Date(art.updatedAt || art.createdAt || Date.now()),
        }));
      }
    }
  } catch (err) {
    console.error("Failed to generate dynamic article sitemaps:", err);
  }

  return [...staticPaths, ...productPaths, ...categoryPaths, ...articlePaths];
}
