'use client'

// SEO・構造化データコンポーネント
import Head from 'next/head'
import Script from 'next/script'
import { useEffect } from 'react'

interface StructuredDataProps {
  data: any
}

// JSON-LD構造化データコンポーネント
export function StructuredData({ data }: StructuredDataProps) {
  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// 複数の構造化データを組み合わせ
export function MultipleStructuredData({ dataList }: { dataList: any[] }) {
  return (
    <>
      {dataList.map((data, index) => (
        <StructuredData key={index} data={data} />
      ))}
    </>
  )
}

// パンくずリストコンポーネント
interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <>
      <nav aria-label="パンくずリスト" className={className}>
        <ol className="flex items-center space-x-2 text-sm text-default-600">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <svg className="w-4 h-4 mx-2 text-default-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {index === items.length - 1 ? (
                <span className="font-medium text-foreground">{item.name}</span>
              ) : (
                <a 
                  href={item.url}
                  className="hover:text-primary transition-colors"
                >
                  {item.name}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <StructuredData data={breadcrumbStructuredData} />
    </>
  )
}

// SEO監視・分析コンポーネント
export function SEOMonitor() {
  useEffect(() => {
    // 開発環境でのSEO検証
    if (process.env.NODE_ENV === 'development') {
      const checkSEO = () => {
        const title = document.title
        const description = document.querySelector('meta[name="description"]')?.getAttribute('content')
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content')
        
        const seoAudit = {
          title: {
            exists: !!title,
            length: title?.length || 0,
            valid: title && title.length > 0 && title.length <= 60,
          },
          description: {
            exists: !!description,
            length: description?.length || 0,
            valid: description && description.length > 0 && description.length <= 160,
          },
          openGraph: {
            title: !!ogTitle,
            description: !!ogDescription,
          },
        }
        
        console.group('🔍 SEO Audit')
        console.log('Title:', seoAudit.title)
        console.log('Description:', seoAudit.description)
        console.log('Open Graph:', seoAudit.openGraph)
        
        // 警告の表示
        if (!seoAudit.title.valid) {
          console.warn('⚠️ Title issues detected')
        }
        if (!seoAudit.description.valid) {
          console.warn('⚠️ Description issues detected')
        }
        if (!seoAudit.openGraph.title || !seoAudit.openGraph.description) {
          console.warn('⚠️ Open Graph tags missing')
        }
        
        console.groupEnd()
      }
      
      // ページ読み込み後にチェック
      setTimeout(checkSEO, 1000)
    }
  }, [])

  return null
}

// カノニカルURLコンポーネント
export function CanonicalUrl({ url }: { url: string }) {
  return (
    <Head>
      <link rel="canonical" href={url} />
    </Head>
  )
}

// 言語・地域設定
export function LanguageAlternates({ 
  languages 
}: { 
  languages: Array<{ lang: string; url: string }> 
}) {
  return (
    <Head>
      {languages.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
    </Head>
  )
}

// プリロードリンク
export function PreloadLinks({ 
  links 
}: { 
  links: Array<{ href: string; as: string; type?: string }> 
}) {
  return (
    <Head>
      {links.map(({ href, as, type }, index) => (
        <link
          key={index}
          rel="preload"
          href={href}
          as={as}
          type={type}
        />
      ))}
    </Head>
  )
}

// DNSプリフェッチ
export function DNSPrefetch({ domains }: { domains: string[] }) {
  return (
    <Head>
      {domains.map((domain) => (
        <link key={domain} rel="dns-prefetch" href={`//${domain}`} />
      ))}
    </Head>
  )
}

// ソーシャルメディア向けメタタグ
export function SocialMetaTags({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
}: {
  title: string
  description: string
  image: string
  url: string
  type?: string
  author?: string
}) {
  return (
    <Head>
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="GitHub Repository Search" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {author && <meta name="twitter:creator" content={author} />}
      
      {/* Facebook */}
      <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID} />
    </Head>
  )
}

// Rich Snippets用の評価・レビュー
export function ReviewStructuredData({
  itemName,
  rating,
  reviewCount: _reviewCount,
  author,
  datePublished,
  reviewBody,
}: {
  itemName: string
  rating: number
  reviewCount: number
  author: string
  datePublished: string
  reviewBody: string
}) {
  const reviewData = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: itemName,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: rating,
      bestRating: 5,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    reviewBody,
  }

  return <StructuredData data={reviewData} />
}

// FAQ構造化データ
export function FAQStructuredData({
  faqs
}: {
  faqs: Array<{ question: string; answer: string }>
}) {
  const faqData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return <StructuredData data={faqData} />
}

// 組織情報の構造化データ
export function OrganizationStructuredData({
  name,
  url,
  logo,
  description,
  sameAs,
}: {
  name: string
  url: string
  logo: string
  description: string
  sameAs: string[]
}) {
  const orgData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs,
  }

  return <StructuredData data={orgData} />
}