import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FAITH : RE — Compagnon de JDR",
  description:
    "Table de jeu et fiches dynamiques pour la campagne FAITH : RE — 4 attributs Disco Elysium, système d'évolution, intégration Discord.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0a0c15] text-white">{children}</body>
    </html>
  );
}
