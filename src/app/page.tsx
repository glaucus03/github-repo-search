'use client'

// GitHub Repository Search ホームページ
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { SearchForm, SearchResults } from '@/components'
import { useRepositorySearch } from '@/hooks/useRepositorySearch'
import { useSearchStore } from '@/store/searchStore'
import { useUIStore } from '@/store/uiStore'

function HomePageContent() {
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

  // リセットハンドラー
  const handleReset = () => {
    setQuery('')
    router.replace('/')
    searchPopular()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <h1 
          className="text-5xl font-bold mb-6 text-white cursor-pointer hover:text-blue-400 transition-colors"
          onClick={handleReset}
          title="クリックして初期状態に戻る"
        >
          GitHub Repository Search
        </h1>
      </div>

      {/* 検索フォーム */}
      <SearchForm onSearch={handleSearch} />

      {/* 検索結果 */}
      <SearchResults
        searchQuery={initialQuery}
        currentQuery={initialQuery}
        repositories={results}
        loading={loading}
        error={error}
        currentPage={1}
        totalPages={Math.ceil(totalCount / 30)}
        totalCount={totalCount}
        onRepositoryClick={(repository, event) => {
          event.preventDefault()
          handleRepositorySelect(repository)
        }}
        onPageChange={(page) => {
          // ページングは無限スクロールで処理
          loadMore()
        }}
        searchResultsRef={{ current: null }}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-white">
            GitHub Repository Search
          </h1>
        </div>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}