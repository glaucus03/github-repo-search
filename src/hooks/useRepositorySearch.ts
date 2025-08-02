// リポジトリ検索用のカスタムHook
import { useCallback, useEffect } from 'react'
import useSWR from 'swr'

import { 
  validateSearchQuery, 
  buildGitHubSearchQuery, 
  createPopularRepositoryQuery, 
  createRecentRepositoryQuery 
} from '@/lib/search-domain'
import { useSearchStore, buildSearchQuery } from '@/store/searchStore'
import type { GitHubSearchResponse } from '@/types/github'

interface UseRepositorySearchOptions {
  enabled?: boolean
  revalidateOnFocus?: boolean
  revalidateOnReconnect?: boolean
  refreshInterval?: number
  onSuccess?: (data: GitHubSearchResponse) => void
  onError?: (error: Error) => void
}

export function useRepositorySearch(options: UseRepositorySearchOptions = {}) {
  const {
    enabled = true,
    revalidateOnFocus = false,
    revalidateOnReconnect = true,
    refreshInterval = 0,
    onSuccess,
    onError,
  } = options

  const {
    query,
    results,
    loading,
    error,
    hasMore,
    page,
    totalCount,
    setResults,
    addResults,
    setLoading,
    setError,
    setHasMore,
    setTotalCount,
    incrementPage,
    resetResults,
    addToHistory,
  } = useSearchStore()

  // SWR用のキー生成
  const getSearchKey = useCallback(() => {
    if (!query.trim() || !enabled) return null
    
    const state = useSearchStore.getState()
    const searchQuery = buildSearchQuery(state)
    console.log('SWR search query:', searchQuery)
    
    const urlParams = new URLSearchParams({
      q: searchQuery.q,
      ...(searchQuery.sort && searchQuery.sort !== 'best-match' && { sort: searchQuery.sort }),
      ...(searchQuery.order && searchQuery.sort !== 'best-match' && { order: searchQuery.order }),
      per_page: (searchQuery.per_page || 30).toString(),
      page: (searchQuery.page || 1).toString(),
    })
    
    const apiUrl = `/api/repositories/search?${urlParams.toString()}`
    console.log('API URL:', apiUrl)
    
    return [apiUrl]
  }, [query, page, enabled])

  // SWR フェッチャー関数（API Routeを使用）
  const fetcher = useCallback(
    async (url: string) => {
      const response = await fetch(url)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'APIエラーが発生しました')
      }
      
      return response.json()
    },
    []
  )

  // SWR設定
  const {
    data,
    error: swrError,
    isLoading,
    mutate,
    isValidating,
  } = useSWR<GitHubSearchResponse>(getSearchKey(), fetcher, {
    revalidateOnFocus,
    revalidateOnReconnect,
    refreshInterval,
    onSuccess: (data) => {
      onSuccess?.(data)
    },
    onError: (error) => {
      setError(error.message)
      onError?.(error)
    },
  })

  // データ更新の処理
  useEffect(() => {
    if (data) {
      if (page === 1) {
        // 新しい検索の場合は結果をリセット
        setResults(data.items)
      } else {
        // ページング時は結果を追加
        addResults(data.items)
      }

      setTotalCount(data.total_count)
      setHasMore(data.items.length === 30 && results.length + data.items.length < data.total_count)
      setError(null)
    }
  }, [data, page, addResults, setResults, setTotalCount, setHasMore, setError, results.length])

  // ローディング状態の管理
  useEffect(() => {
    setLoading(isLoading || isValidating)
  }, [isLoading, isValidating, setLoading])

  // エラー状態の管理
  useEffect(() => {
    if (swrError) {
      setError(swrError.message)
    }
  }, [swrError, setError])

  // 検索実行関数
  const search = useCallback(
    async (searchQuery: string, resetPage = true) => {
      // ドメインロジックによるバリデーション
      const validation = validateSearchQuery(searchQuery)
      if (!validation.isValid) {
        setError(validation.errors[0] || '無効な検索クエリです')
        return
      }

      if (resetPage) {
        resetResults()
      }

      // 検索履歴に追加
      addToHistory(searchQuery)

      // 検索実行（SWRのmutateを使用）
      await mutate()
    },
    [mutate, resetResults, addToHistory, setError]
  )

  // 次のページを読み込む関数
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return

    incrementPage()
    await mutate()
  }, [hasMore, loading, incrementPage, mutate])

  // 高度な検索関数
  const advancedSearch = useCallback(
    async (
      searchQuery: string,
      options: {
        language?: string
        minStars?: number
        maxStars?: number
        sort?: 'stars' | 'forks' | 'updated'
        order?: 'desc' | 'asc'
      } = {}
    ) => {
      // ドメインロジックを使用してクエリを構築
      const enhancedQuery = buildGitHubSearchQuery({
        query: searchQuery,
        language: options.language,
        minStars: options.minStars,
        maxStars: options.maxStars,
        sort: options.sort || 'best-match',
        order: options.order || 'desc'
      })
      await search(enhancedQuery)
    },
    [search]
  )

  // 人気のリポジトリを取得（ドメインロジック使用）
  const searchPopular = useCallback(
    async (language?: string) => {
      try {
        setLoading(true)
        const query = createPopularRepositoryQuery(language)
        const url = `/api/repositories/search?${new URLSearchParams({
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: '30',
        }).toString()}`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('人気のリポジトリの取得に失敗しました')
        }
        
        const data: GitHubSearchResponse = await response.json()
        setResults(data.items)
        setTotalCount(data.total_count)
        setHasMore(false)
        setError(null)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '人気のリポジトリの取得に失敗しました'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setResults, setTotalCount, setHasMore, setError]
  )

  // 最近更新されたリポジトリを取得（ドメインロジック使用）
  const searchRecent = useCallback(
    async (language?: string) => {
      try {
        setLoading(true)
        const query = createRecentRepositoryQuery(language)
        const url = `/api/repositories/search?${new URLSearchParams({
          q: query,
          sort: 'updated',
          order: 'desc',
          per_page: '30',
        }).toString()}`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('最近のリポジトリの取得に失敗しました')
        }
        
        const data: GitHubSearchResponse = await response.json()
        setResults(data.items)
        setTotalCount(data.total_count)
        setHasMore(false)
        setError(null)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '最近のリポジトリの取得に失敗しました'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setResults, setTotalCount, setHasMore, setError]
  )

  // 検索状態のリセット
  const reset = useCallback(() => {
    resetResults()
    setError(null)
  }, [resetResults, setError])

  return {
    // 状態
    query,
    results,
    loading,
    error,
    hasMore,
    page,
    totalCount,
    isValidating,
    
    // アクション
    search,
    loadMore,
    advancedSearch,
    searchPopular,
    searchRecent,
    reset,
    
    // SWR操作
    mutate,
  }
}