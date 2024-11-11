// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Script from 'next/script'
import { MapsProvider } from '@/contexts/MapsContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Go Guardian",
  description: "Your AI-powered safety companion",
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
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </MapsProvider>
      </body>
    </html>
  );
}