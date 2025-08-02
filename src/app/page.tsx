'use client'

// GitHub Repository Search ホームページ
import { useEffect } from 'react'
import { SearchFormComponent } from '@/components/SearchFormComponent'
import { SearchResults } from '@/components/SearchResults'
import { useSearchRepository } from '@/hooks/useSearchRepository'
import { useSearchUI } from '@/hooks/useSearchUI'

export default function HomePage() {
  const searchRepository = useSearchRepository()
  const searchUI = useSearchUI()

  // 初期化処理
  useEffect(() => {
    searchUI.initializeFromURL(searchRepository.performSearch)
  }, [])

  // 検索実行ハンドラー
  const handleSearch = async () => {
    await searchUI.handleSearch(searchRepository.performSearch)
  }

  // リセットハンドラー
  const handleReset = () => {
    searchUI.resetToInitialState(searchRepository.resetState)
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
      <SearchFormComponent
        searchQuery={searchUI.searchQuery}
        onSearchQueryChange={searchUI.setSearchQuery}
        onSearch={handleSearch}
        disabled={searchRepository.loading}
      />

      {/* 検索結果 */}
      <SearchResults
        searchQuery={searchUI.searchQuery}
        currentQuery={searchRepository.currentQuery}
        repositories={searchRepository.repositories}
        loading={searchRepository.loading}
        error={searchRepository.error}
        currentPage={searchRepository.currentPage}
        totalPages={searchRepository.totalPages}
        totalCount={searchRepository.totalCount}
        onRepositoryClick={searchRepository.handleRepositoryClick}
        onPageChange={searchRepository.handlePageChange}
        searchResultsRef={searchRepository.searchResultsRef}
      />
    </div>
  )
}