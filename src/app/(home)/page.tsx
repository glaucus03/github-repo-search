'use client'

// ホームページ（検索ページ）
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

// 動的レンダリングを強制（API呼び出しがあるため）
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { SearchForm, RepositoryCard, InfiniteScrollGrid, RepositoryCardSkeleton } from '@/components'
import { StructuredData, SEOMonitor } from '@/components/SEO'
import { useRepositorySearch } from '@/hooks/useRepositorySearch'
import { generateWebsiteStructuredData, generateApplicationStructuredData } from '@/lib/seo'
import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store/uiStore'

export default function HomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const { setQuery } = useSearchStore()
  const { addNotification } = useUIStore()
  
  const {
    results,
    loading,
    error,
    hasMore,
    totalCount,
    search,
    loadMore,
    searchPopular,
  } = useRepositorySearch()

  // 初期クエリの設定
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      search(initialQuery)
    } else {
      // クエリがない場合は人気のリポジトリを表示
      searchPopular()
    }
  }, [initialQuery, setQuery, search, searchPopular])

  // 検索実行
  const handleSearch = async (query: string) => {
    try {
      await search(query)
      
      // URLを更新
      const url = new URL(window.location.href)
      if (query) {
        url.searchParams.set('q', query)
      } else {
        url.searchParams.delete('q')
      }
      router.replace(url.pathname + url.search)
      
      addNotification({
        type: 'success',
        message: `"${query}" の検索が完了しました`,
      })
    } catch {
      addNotification({
        type: 'error',
        message: '検索中にエラーが発生しました',
      })
    }
  }

  // リポジトリ選択
  const handleRepositorySelect = (repository: { owner: { login: string }; name: string }) => {
    router.push(`/repository/${repository.owner.login}/${repository.name}`)
  }

  // エラー時の再試行
  const handleRetry = () => {
    if (initialQuery) {
      search(initialQuery)
    } else {
      searchPopular()
    }
  }

  return (
    <>
      {/* 構造化データ */}
      <StructuredData data={generateWebsiteStructuredData()} />
      <StructuredData data={generateApplicationStructuredData()} />
      
      {/* SEO監視（開発環境のみ） */}
      <SEOMonitor />
      
      <div className="search-container">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            GitHub Repository Search
          </h1>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            GitHubリポジトリを検索して、お気に入りのプロジェクトを見つけましょう
          </p>
        </div>

      {/* 検索フォーム */}
      <div className="mb-8">
        <SearchForm onSearch={handleSearch} />
      </div>

      {/* 結果統計 */}
      {totalCount > 0 && !loading && (
        <div className="mb-6">
          <p className="text-center text-default-500">
            {totalCount.toLocaleString()}件の結果が見つかりました
          </p>
        </div>
      )}

      {/* 検索結果 */}
      {loading && results.length === 0 ? (
        <RepositoryCardSkeleton count={6} />
      ) : (
        <InfiniteScrollGrid
          items={results}
          loading={loading}
          hasMore={hasMore}
          error={error}
          onLoadMore={loadMore}
          errorRetryAction={handleRetry}
          renderItem={(repository, _index) => (
            <RepositoryCard
              key={repository.id}
              repository={repository}
              onSelect={handleRepositorySelect}
            />
          )}
          emptyMessage={
            initialQuery 
              ? `"${initialQuery}" に一致する結果が見つかりませんでした`
              : '検索キーワードを入力してください'
          }
        />
      )}
      </div>
    </>
  )
}