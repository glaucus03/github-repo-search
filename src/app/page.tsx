'use client'

// GitHub Repository Search ホームページ
import { useState } from 'react'
import { Button, Card, CardBody, Spinner } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlassIcon, StarIcon, EyeIcon } from '@heroicons/react/24/outline'
import { Pagination } from '@/components'
import { useLiveSearch } from '@/hooks'

// クライアントコンポーネントでは動的レンダリング設定を削除

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

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const ITEMS_PER_PAGE = 30
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  
  // リアルタイム検索結果数の取得
  const {
    totalCount: liveCount,
    loading: liveLoading,
    error: liveError,
  } = useLiveSearch(searchQuery)

  // 検索を実行（指定されたページで）
  const performSearch = async (page: number = 1) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)
    if (page === 1) {
      setCurrentQuery(searchQuery)
    }
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        sort: 'stars',
        order: 'desc',
        per_page: ITEMS_PER_PAGE.toString(),
        page: page.toString()
      })
      
      const response = await fetch(`/api/repositories/search?${params}`)
      
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }
      
      const data = await response.json()
      setRepositories(data.items || [])
      setTotalCount(data.total_count || 0)
      setCurrentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました')
      setRepositories([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // 新しい検索を実行
  const handleSearch = () => {
    performSearch(1)
  }

  // ページ変更ハンドラー
  const handlePageChange = (page: number) => {
    if (currentQuery) {
      setSearchQuery(currentQuery) // 現在の検索クエリを使用
      performSearch(page)
    }
  }

  // カードクリック時の詳細ページ遷移
  const handleCardClick = (repo: Repository, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const url = `/repository/${repo.owner.login}/${repo.name}`
    console.log('Card clicked:', repo.name)
    console.log('Navigating to:', url)
    console.log('Router object:', router)
    
    try {
      router.push(url)
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-6 text-gray-900 dark:text-white">
          GitHub Repository Search
        </h1>
        <p className="text-xl !text-black dark:text-gray-300 max-w-3xl mx-auto">
          GitHubリポジトリを検索して、お気に入りのプロジェクトを見つけましょう
        </p>
      </div>

      {/* 検索フォーム */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center gap-4">
          {/* 検索入力フィールド */}
          <div className="flex-1 relative">
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 h-14 px-6 focus-within:border-blue-500">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="リポジトリを検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 bg-transparent outline-none text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>
          
          {/* 検索ボタン */}
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full h-14 px-8 font-medium text-base min-w-[120px]"
          >
            検索する
          </Button>
        </div>
        
      </div>

      {/* 検索結果 */}
      <div className="max-w-6xl mx-auto">
        {loading && (
          <div className="text-center py-12">
            <Spinner size="lg" />
            <p className="mt-4 !text-black dark:text-gray-300">検索中...</p>
          </div>
        )}

        {error && (
          <Card className="border-red-200 dark:border-red-800">
            <CardBody className="text-center py-8">
              <div className="text-red-500 text-lg mb-2">⚠️ エラー</div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </CardBody>
          </Card>
        )}

        {!loading && !error && repositories.length === 0 && searchQuery && (
          <Card className="border-gray-300 dark:border-gray-600">
            <CardBody className="text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-black dark:text-gray-400" />
              
              {/* リアルタイム検索結果数またはエラーを表示 */}
              {liveLoading ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    検索中...
                  </h3>
                  <p className="!text-black dark:text-gray-300">
                    「{searchQuery}」を検索しています
                  </p>
                </>
              ) : liveError ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    検索エラー
                  </h3>
                  <p className="!text-black dark:text-gray-300">
                    {liveError}
                  </p>
                </>
              ) : liveCount > 0 ? (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    「{searchQuery}」の検索結果: {liveCount.toLocaleString()}件
                  </h3>
                  <p className="!text-black dark:text-gray-300">
                    検索ボタンを押して結果を表示してください
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    検索結果が見つかりませんでした
                  </h3>
                  <p className="!text-black dark:text-gray-300">
                    「{searchQuery}」に一致するリポジトリが見つかりませんでした
                  </p>
                </>
              )}
            </CardBody>
          </Card>
        )}

        {!loading && !error && repositories.length === 0 && !searchQuery && (
          <Card className="border-gray-300 dark:border-gray-600">
            <CardBody className="text-center py-12">
              <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-black dark:text-gray-400" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                検索を開始してください
              </h3>
              <p className="!text-black dark:text-gray-300">
                上の検索ボックスにキーワードを入力して、GitHubリポジトリを検索できます
              </p>
            </CardBody>
          </Card>
        )}

        {repositories.length > 0 && (
          <div className="max-w-4xl mx-auto space-y-4">
            {repositories.map((repo) => (
              <div
                key={repo.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer p-6"
                onClick={(event) => handleCardClick(repo, event)}
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
                          <h3 className="font-semibold text-xl text-blue-600 dark:text-blue-400 truncate">
                            {repo.name}
                          </h3>
                          <p className="text-sm text-black dark:text-gray-400">
                            {repo.owner.login}
                          </p>
                        </div>
                        
                        {/* 統計情報 */}
                        <div className="flex items-center gap-6 text-sm text-black dark:text-gray-400 flex-shrink-0">
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
                        <p className="text-gray-700 dark:text-gray-300 text-base line-clamp-2 leading-relaxed">
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
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}