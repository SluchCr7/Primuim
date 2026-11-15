import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "./components/ReduxProvider";
import { ThemeProvider } from "./context/ThemeContext";
import SessionInitializer from "./components/SessionInitializer";
import ErrorBoundary from "./components/ErrorBoundary";
import { ToastProvider } from "./components/Toast";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LanguageWrapper from "./components/LanguageWrapper";
import { SITE_URL } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "LUMIXA | Curated Style & Design",
  description: "Discover thoughtfully curated fashion, accessories, and design from trusted independent stores on LUMIXA.",
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LUMIXA | Curated Style & Design",
    description: "Shop considered collections from trusted independent stores.",
    url: "/",
    siteName: "LUMIXA",
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
            <LanguageWrapper>
              <ErrorBoundary>
                <ToastProvider>
                  <SessionInitializer>
                      <Header />
                      <main className="flex-grow flex flex-col">
                        {children}
                      </main>
                      <Footer />
                    </SessionInitializer>
                </ToastProvider>
              </ErrorBoundary>
            </LanguageWrapper>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
