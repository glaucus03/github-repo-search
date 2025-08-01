// SEO・メタデータ管理ユーティリティ
import type { Metadata } from 'next'

import type { GitHubRepository } from '@/types/github'

// サイト基本情報
export const SITE_CONFIG = {
  name: 'GitHub Repository Search',
  description: 'GitHubリポジトリを効率的に検索し、お気に入りのプロジェクトを見つけるためのモダンなWebアプリケーション',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',
  author: 'GitHub Search Team',
  keywords: [
    'GitHub',
    'Repository',
    'Search',
    'Development',
    'Open Source',
    'Programming',
    'Code',
    'Developer Tools',
    'Software Development',
    '開発',
    'プログラミング',
    'ソフトウェア開発',
    'オープンソース'
  ],
  creator: '@github-search',
  publisher: 'GitHub Search',
}

// ベースメタデータ
export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.creator,
  publisher: SITE_CONFIG.publisher,
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_CONFIG.url,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: SITE_CONFIG.ogImage,
        width: 1200,
        height: 630,
        alt: SITE_CONFIG.name,
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    creator: SITE_CONFIG.creator,
    images: [SITE_CONFIG.ogImage],
  },
  
  // Favicon
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  
  // その他
  manifest: '/manifest.json',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  
  // 検索エンジン向け
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
  
  // 検証用
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_SITE_VERIFICATION,
  },
}

// ページ固有メタデータ生成関数

// ホームページ
export function generateHomeMetadata(): Metadata {
  return {
    title: 'ホーム',
    description: 'GitHubリポジトリを検索して、お気に入りのオープンソースプロジェクトを見つけましょう。',
    openGraph: {
      title: `${SITE_CONFIG.name} - GitHubリポジトリ検索`,
      description: 'GitHubリポジトリを検索して、お気に入りのオープンソースプロジェクトを見つけましょう。',
      url: SITE_CONFIG.url,
    },
    twitter: {
      title: `${SITE_CONFIG.name} - GitHubリポジトリ検索`,
      description: 'GitHubリポジトリを検索して、お気に入りのオープンソースプロジェクトを見つけましょう。',
    },
  }
}

// 検索結果ページ
export function generateSearchMetadata(query: string, resultCount?: number): Metadata {
  const title = `"${query}"の検索結果`
  const description = resultCount 
    ? `"${query}"の検索結果 ${resultCount.toLocaleString()}件のリポジトリが見つかりました。`
    : `"${query}"に関連するGitHubリポジトリを検索しています。`
  
  return {
    title,
    description,
    openGraph: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/?q=${encodeURIComponent(query)}`,
    },
    twitter: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
    },
    // 検索結果ページは検索エンジンにインデックスさせない
    robots: {
      index: false,
      follow: true,
    },
  }
}

// リポジトリ詳細ページ
export function generateRepositoryMetadata(repository: GitHubRepository): Metadata {
  const title = `${repository.owner.login}/${repository.name}`
  const description = repository.description || 
    `${repository.owner.login}による${repository.name}リポジトリの詳細情報。Stars: ${repository.stargazers_count.toLocaleString()}, Forks: ${repository.forks_count.toLocaleString()}`
  
  const keywords = [
    repository.name,
    repository.owner.login,
    ...(repository.topics || []),
    repository.language,
    'GitHub',
    'Repository',
  ].filter((keyword): keyword is string => Boolean(keyword))

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/repository/${repository.owner.login}/${repository.name}`,
      images: [
        {
          url: repository.owner.avatar_url,
          width: 460,
          height: 460,
          alt: `${repository.owner.login}のプロフィール画像`,
        },
      ],
    },
    twitter: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
      images: [repository.owner.avatar_url],
    },
  }
}

// お気に入りページ
export function generateFavoritesMetadata(favoriteCount: number): Metadata {
  const title = 'お気に入りリポジトリ'
  const description = favoriteCount > 0
    ? `${favoriteCount}件のお気に入りリポジトリを管理しています。`
    : 'お気に入りのGitHubリポジトリを管理しましょう。'

  return {
    title,
    description,
    openGraph: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/favorites`,
    },
    twitter: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
    },
    // 個人的なページなので検索エンジンにインデックスさせない
    robots: {
      index: false,
      follow: false,
    },
  }
}

// 履歴ページ
export function generateHistoryMetadata(historyCount: number): Metadata {
  const title = '検索履歴'
  const description = historyCount > 0
    ? `${historyCount}件の検索履歴があります。`
    : '検索履歴を管理して、効率的にリポジトリを見つけましょう。'

  return {
    title,
    description,
    openGraph: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
      url: `${SITE_CONFIG.url}/history`,
    },
    twitter: {
      title: `${title} - ${SITE_CONFIG.name}`,
      description,
    },
    // 個人的なページなので検索エンジンにインデックスさせない
    robots: {
      index: false,
      follow: false,
    },
  }
}

// JSON-LD構造化データ生成

// WebSite構造化データ
export function generateWebsiteStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.author,
    },
  }
}

// SoftwareApplication構造化データ
export function generateApplicationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
    },
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.author,
    },
  }
}

// リポジトリ用のSoftwareSourceCode構造化データ
export function generateRepositoryStructuredData(repository: GitHubRepository) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: repository.name,
    description: repository.description,
    url: repository.html_url,
    codeRepository: repository.html_url,
    programmingLanguage: repository.language,
    author: {
      '@type': 'Person',
      name: repository.owner.login,
      url: `https://github.com/${repository.owner.login}`,
    },
    dateCreated: repository.created_at,
    dateModified: repository.updated_at,
    license: repository.license?.name,
    keywords: repository.topics,
  }
}

// BreadcrumbList構造化データ
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.url,
    })),
  }
}

// SEO監査用の関数
export function generateSEOAudit(metadata: Metadata) {
  const audit = {
    hasTitle: !!metadata.title,
    hasDescription: !!metadata.description,
    hasKeywords: !!metadata.keywords,
    hasOpenGraph: !!metadata.openGraph,
    hasTwitterCard: !!metadata.twitter,
    titleLength: typeof metadata.title === 'string' ? metadata.title.length : 0,
    descriptionLength: typeof metadata.description === 'string' ? metadata.description.length : 0,
    recommendations: [] as string[],
  }

  // SEO推奨事項のチェック
  if (audit.titleLength === 0) {
    audit.recommendations.push('タイトルを設定してください')
  } else if (audit.titleLength > 60) {
    audit.recommendations.push('タイトルが長すぎます（60文字以内推奨）')
  }

  if (audit.descriptionLength === 0) {
    audit.recommendations.push('説明文を設定してください')
  } else if (audit.descriptionLength > 160) {
    audit.recommendations.push('説明文が長すぎます（160文字以内推奨）')
  }

  if (!audit.hasOpenGraph) {
    audit.recommendations.push('Open Graphタグを設定してください')
  }

  if (!audit.hasTwitterCard) {
    audit.recommendations.push('Twitter Cardタグを設定してください')
  }

  return audit
}