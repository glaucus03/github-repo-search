import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { Navigation, NotificationSystem, ErrorBoundary } from "@/components";

import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "GitHub Repository Search",
    template: "%s | GitHub Repository Search",
  },
  description:
    "GitHubリポジトリを効率的に検索し、お気に入りのプロジェクトを見つけるためのモダンなWebアプリケーション",
  keywords: [
    "GitHub",
    "Repository",
    "Search",
    "Development",
    "Open Source",
    "Programming",
    "Code",
    "Developer Tools",
    "Software Development",
    "開発",
    "プログラミング",
    "ソフトウェア開発",
    "オープンソース",
  ],
  authors: [{ name: "GitHub Search Team" }],
  creator: "@github-search",
  publisher: "GitHub Search",

  // Open Graph
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    title: "GitHub Repository Search",
    description:
      "GitHubリポジトリを効率的に検索し、お気に入りのプロジェクトを見つけるためのモダンなWebアプリケーション",
    siteName: "GitHub Repository Search",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GitHub Repository Search",
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "GitHub Repository Search",
    description:
      "GitHubリポジトリを効率的に検索し、お気に入りのプロジェクトを見つけるためのモダンなWebアプリケーション",
    creator: "@github-search",
    images: ["/og-image.png"],
  },

  // Favicon（App Routerのfavicon.icoを使用）
  icons: {
    icon: "/favicon.ico",
  },

  // その他（manifest.jsonは必要に応じて後で追加）
  // manifest: '/manifest.json',

  // 検索エンジン向け
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // 検証用（環境変数から設定）
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },

  // その他のメタデータ
  category: "technology",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              <main className="flex-1">{children}</main>
              <NotificationSystem />
            </div>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
