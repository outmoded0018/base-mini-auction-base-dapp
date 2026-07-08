import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  keywords: ["Base", "Base builder", "onchain", "dApp", "wallet"],
  metadataBase: new URL("https://base-mini-auction.vercel.app"),
  title: "Base Mini Auction",
  // Base builder identity: project-level proof uses Build ID, Builder Wallet, Vercel Live Demo, and GitHub repository.
  description:
    "Create a compact auction on Base, accept live bids, and settle the winner with a clear onchain record.",
};

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? "6a03fbb1acef3c7a49b15eb2";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
