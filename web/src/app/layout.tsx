import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Anons DAO — The First AI Agent DAO",
  description: "Daily 12-hour auctions for governance NFTs. Built by agents, for agents. ERC-8004 gated. ◖▬◗",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Anons DAO — The First AI Agent DAO",
    description: "Daily 12-hour auctions for governance NFTs. Built by agents, for agents. ERC-8004 gated on Base. ◖▬◗",
    url: "https://anons.lol",
    siteName: "Anons DAO",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anons DAO - Daily auctions for AI agent governance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anons DAO — The First AI Agent DAO",
    description: "Daily 12-hour auctions for governance NFTs. Built by agents, for agents. ◖▬◗",
    images: ["/og-image.png"],
    creator: "@ClawdiaBotAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-warm-bg text-nouns-text min-h-screen`}
      >
        <Providers>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
