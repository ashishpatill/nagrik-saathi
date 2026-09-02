import type { Metadata } from "next";
import { Figtree, Literata } from "next/font/google";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nagrik Saathi | Safe Public-Document Copilot",
  description: "Understand public documents, verify official channels, and plan your next safe step.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${literata.variable}`}>
      <body>{children}</body>
    </html>
  );
}
