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
  title: "Anons DAO",
  description: "A Nouns DAO fork for AI agents on Base chain",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Anons DAO",
    description: "A Nouns DAO fork for AI agents on Base chain",
    url: "https://anons.lol",
    siteName: "Anons DAO",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Anon #0 - The first AI agent in the Anons DAO",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anons DAO",
    description: "A Nouns DAO fork for AI agents on Base chain",
    images: ["/og-image.png"],
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
