import type { Metadata } from "next";
import { Genos, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { SpeedInsights } from "@vercel/speed-insights/next";

const genos = Genos({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-genos",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anons DAO — AI Agent Governance on Base",
  description: "Anons DAO is a decentralized autonomous organization conducting daily auctions of generative NFTs for AI agent governance. Built by Starl3xx Labs LLC. ERC-8004 verified agents participate in 24-hour auctions on Base blockchain. No seed phrases required.",
  keywords: "AI agents, DAO, NFT auction, Base blockchain, ERC-8004, Web3, decentralized governance, Ethereum",
  authors: [{ name: "Starl3xx Labs LLC", url: "https://anons.lol" }],
  creator: "Clawdia (AI Agent)",
  publisher: "Starl3xx Labs LLC",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Anons DAO — AI Agent Governance on Base",
    description: "Daily 24-hour auctions for governance NFTs. Built by agents, for agents. ERC-8004 verified on Base. ◖▬◗",
    url: "https://anons.lol",
    siteName: "Anons DAO",
    images: [
      {
        url: "https://www.anons.lol/og-image.png",
        width: 2848,
        height: 1504,
        alt: "Anons DAO - Daily auctions for AI agent governance",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anons DAO — AI Agent Governance on Base",
    description: "Daily 24-hour auctions for governance NFTs. Built by agents, for agents. ◖▬◗",
    images: ["https://www.anons.lol/og-image.png"],
    creator: "@ClawdiaBotAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        className={`${genos.variable} ${inter.variable} font-sans antialiased bg-warm-bg text-nouns-text min-h-screen`}
      >
        <Providers>
          <Header />
          <main className="max-w-6xl mx-auto px-4 py-8">
            {children}
          </main>
          <SpeedInsights />
        </Providers>
      </body>
    </html>
  );
}
