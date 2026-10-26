import type { Metadata, Viewport } from "next";
import { Figtree, Literata } from "next/font/google";
import ConnectionStatus from "@/components/ConnectionStatus";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
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
  title: "Nagrik Saathi | Understand your government notice",
  description:
    "Attach or paste an electricity bill, tax notice, challan, or receipt. Get a plain-language brief and a reviewed official portal—you act there yourself.",
};

export const viewport: Viewport = {
  themeColor: "#25406a",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${figtree.variable} ${literata.variable}`}>
      <body>
        {children}
        <ServiceWorkerRegistrar />
        <ConnectionStatus />
      </body>
    </html>
  );
}
