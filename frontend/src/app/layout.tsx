// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Script from "next/script";
import { MapsProvider } from "@/contexts/MapsContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Go Guardian",
  description: "Your AI-powered safety companion",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
      {
        url: "/android-chrome-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/android-chrome-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MapsProvider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </MapsProvider>
      </body>
    </html>
  );
}
