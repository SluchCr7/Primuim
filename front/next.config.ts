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

  // Proxy all /api/* requests to the real backend.
  // The browser only sees calls to the same origin → cookies are sent freely,
  // no CORS headers needed, and sameSite restrictions don't apply.
  async rewrites() {
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    // Strip trailing /api from the base URL if present so we can append it cleanly
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
