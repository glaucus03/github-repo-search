'use client'

import { Card, CardBody, Spinner } from '@heroui/react'
import { MagnifyingGlassIcon, StarIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Pagination } from '@/components'
import { useLiveSearch } from '@/hooks'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  watchers_count: number
  language: string | null
  owner: {
    login: string
    avatar_url: string
  }
}

interface SearchResultsProps {
  // Search state
  searchQuery: string
  currentQuery: string
  repositories: Repository[]
  loading: boolean
  error: string | null
  
  // Pagination
  currentPage: number
  totalPages: number
  totalCount: number
  
  // Handlers
  onRepositoryClick: (repository: Repository, event: React.MouseEvent) => void
  onPageChange: (page: number) => void
  
  // Refs
  searchResultsRef: React.RefObject<HTMLDivElement | null>
}

export function SearchResults({
  searchQuery,
  currentQuery,
  repositories,
  loading,
  error,
  currentPage,
  totalPages,
  totalCount,
  onRepositoryClick,
  onPageChange,
  searchResultsRef
}: SearchResultsProps) {
  const {
    totalCount: liveCount,
    loading: liveLoading,
    error: liveError,
  } = useLiveSearch(searchQuery)

  // Loading state
  if (loading && repositories.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-300">検索中...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="border-red-200 dark:border-red-800">
          <CardBody className="text-center py-8">
            <div className="text-red-500 text-lg mb-2">⚠️ エラー</div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Show spinner while live search is loading
  if (!loading && !error && repositories.length === 0 && searchQuery && liveLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-20">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  // No results but search query exists (not loading)
  if (!loading && !error && repositories.length === 0 && searchQuery && !liveLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="border-gray-600">
          <CardBody className="text-center py-12">
            {liveError ? (
              <>
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  検索エラー
                </h3>
                <p className="text-gray-300">
                  {liveError}
                </p>
              </>
            ) : liveCount > 0 ? (
              <>
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  「{searchQuery}」の検索結果: {liveCount.toLocaleString()}件
                </h3>
                <p className="text-gray-300">
                  検索ボタンを押して結果を表示してください
                </p>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  検索結果が見つかりませんでした
                </h3>
                <p className="text-gray-300">
                  「{searchQuery}」に一致するリポジトリが見つかりませんでした
                </p>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    )
  }

  // No search query
  if (!loading && !error && repositories.length === 0 && !searchQuery) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="border-gray-600">
          <CardBody className="text-center py-12">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              検索を開始してください
            </h3>
            <p className="text-gray-300">
              上の検索ボックスにキーワードを入力して、GitHubリポジトリを検索できます
            </p>
          </CardBody>
        </Card>
      </div>
    )
  }

  // Results display
  return (
    <div className="max-w-6xl mx-auto">
      <div ref={searchResultsRef} className="max-w-4xl mx-auto space-y-4">
        {repositories.map((repo) => (
          <div
            key={repo.id}
            className="bg-gray-800 rounded-lg border border-gray-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer p-6"
            onClick={(event) => onRepositoryClick(repo, event)}
          >
            <div className="flex items-start gap-4">
              {/* アバター */}
              <img
                src={repo.owner.avatar_url}
                alt={repo.owner.login}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />
              
              {/* メインコンテンツ */}
              <div className="flex-1 min-w-0">
                {/* タイトル行 */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl text-blue-400 truncate">
                      {repo.name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {repo.owner.login}
                    </p>
                  </div>
                  
                  {/* 統計情報 */}
                  <div className="flex items-center gap-6 text-sm text-gray-400 flex-shrink-0">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <StarIcon className="w-4 h-4" />
                      {repo.stargazers_count.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-4 h-4" />
                      {repo.watchers_count.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 説明 */}
                {repo.description && (
                  <p className="text-gray-300 text-base line-clamp-2 leading-relaxed">
                    {repo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* ページネーション */}
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={30}
            onPageChange={onPageChange}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}