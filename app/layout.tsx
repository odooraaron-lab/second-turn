import type { Metadata, Viewport } from "next";
import { site } from "@/site.config";
import { shareImage } from "@/lib/seo";
import "./globals.css";
import "./collector-card.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.homeTitle, template: `%s | ${site.name}` },
  description: site.description,
  keywords: site.keywords,
  applicationName: site.name,
  authors: [{ name: site.name }],
  creator: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    title: site.homeTitle,
    description: site.description,
    url: "/",
    images: [shareImage],
  },
  twitter: { card: "summary_large_image", title: site.homeTitle, description: site.description, images: [shareImage.url] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b1a3a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" data-theme={site.theme}>
      <body id="top">{children}</body>
    </html>
  );
}
