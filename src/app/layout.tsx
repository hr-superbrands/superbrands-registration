import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // ✅ prevents localhost links in OG/Twitter when deployed
  metadataBase: new URL(process.env.PUBLIC_APP_URL || "http://localhost:3000"),

  title: {
    default: "Superbrands Gala 2026",
    template: "%s | Superbrands Gala 2026",
  },

  description:
    "Official registration for Superbrands Gala 2026. Confirm your attendance and manage your invitation details.",

  openGraph: {
    title: "Superbrands Gala 2026",
    description:
      "Official registration for Superbrands Gala 2026. Confirm your attendance.",
    url: "/",
    siteName: "Superbrands Gala 2026",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Superbrands Gala 2026",
      },
    ],
    locale: "hr_HR",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Superbrands Gala 2026",
    description: "Official registration for Superbrands Gala 2026.",
    images: ["/og-image.jpg"],
  },

  icons: {
    icon: "/favicon.ico",
    // optional but recommended:
    apple: "/apple-touch-icon.png",
  },

  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body className="bg-neutral-950 text-white antialiased">{children}</body>
    </html>
  );
}
