import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Header, HeaderFallback } from "@/components/Header";
import { Toaster } from "@/components/Toaster";
import { jsonLd, OG_DEFAULTS, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });
const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Bangladesh",
    "Dhaka",
    "best in Dhaka",
    "reviews Bangladesh",
    "phone repair Dhaka",
    "electrician Dhaka",
    "tour guide Bangladesh",
    "local recommendations",
    "বাংলাদেশ",
    "ঢাকা",
    "রিভিউ",
  ],
  category: "local business reviews",
  // No canonical here: it would be inherited by every page. Each indexable page sets its own.
  openGraph: { ...OG_DEFAULTS, title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  // Paste the tokens from Google Search Console / Bing Webmaster Tools into these env vars.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
};

const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      areaServed: { "@type": "Country", name: "Bangladesh" },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: ["en", "bn"],
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/explore?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hind.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(SITE_JSON_LD)} />
        <AuthProvider>
          {/* Navigation reads the current URL, so it streams in behind a static fallback */}
          <Suspense fallback={<HeaderFallback />}>
            <Header />
          </Suspense>
          <main className="flex-1 pb-10">{children}</main>
          <Suspense>
            <Footer />
          </Suspense>
          <Suspense>
            <BottomNav />
          </Suspense>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
