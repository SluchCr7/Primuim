const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

if (!configuredSiteUrl && process.env.VERCEL) {
  throw new Error("NEXT_PUBLIC_SITE_URL must be configured for Vercel deployments.");
}

const siteUrl = configuredSiteUrl || "http://localhost:3000";
const parsedSiteUrl = new URL(siteUrl);

if (
  process.env.VERCEL &&
  (parsedSiteUrl.protocol !== "https:" ||
    ["localhost", "127.0.0.1", "::1"].includes(parsedSiteUrl.hostname))
) {
  throw new Error("NEXT_PUBLIC_SITE_URL must use a public HTTPS URL on Vercel.");
}

export const SITE_URL = siteUrl.replace(/\/+$/, "");
