import { MetadataRoute } from "next";

const BASE_URL = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/seller/",
        "/cart",
        "/checkout",
        "/dashboard",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
        "/api/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
