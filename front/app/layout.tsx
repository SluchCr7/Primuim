import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "./components/ReduxProvider";
import { ThemeProvider } from "./context/ThemeContext";
import SessionInitializer from "./components/SessionInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";

export const metadata: Metadata = {
  title: "Shop Premium | Bespoke Luxury E-Commerce Portal",
  description: "Experience a state-of-the-art premium and luxury e-commerce platform built for high-performance browsing, personalized recommendations, and secure checkout workflows.",
  metadataBase: new URL("http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Shop Premium | Bespoke Luxury E-Commerce Portal",
    description: "Shop premium products with high security, real-time analytics, and instant checkouts.",
    url: "/",
    siteName: "Shop Premium",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased font-sans">
        <ReduxProvider>
          <ThemeProvider>
            <ErrorBoundary>
              <ToastProvider>
                <SessionInitializer>
                  {children}
                </SessionInitializer>
              </ToastProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
