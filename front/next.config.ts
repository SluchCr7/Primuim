
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },

  async rewrites() {
    const configuredBackendUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!configuredBackendUrl && process.env.VERCEL) {
      throw new Error("NEXT_PUBLIC_API_URL must be configured for Vercel deployments.");
    }

    if (configuredBackendUrl && process.env.VERCEL) {
      const backendOrigin = new URL(configuredBackendUrl);
      if (
        backendOrigin.protocol !== "https:" ||
        ["localhost", "127.0.0.1", "::1"].includes(backendOrigin.hostname)
      ) {
        throw new Error("NEXT_PUBLIC_API_URL must use a public HTTPS backend URL on Vercel.");
      }
    }

    const backendUrl = configuredBackendUrl || "http://localhost:5000/api";

    // Remove trailing /api to avoid duplicating it
    const backendBase = backendUrl.replace(/\/api\/?$/, "");

    return [
      {
        source: "/api/:path*",
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
