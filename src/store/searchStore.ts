// 検索状態管理用のZustandストア
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { SearchHistoryStorage } from '@/lib/storage'
import { validateSearchQuery, calculateRepositoryQuality, calculateSearchStatistics } from '@/lib/search-domain'
import type { SearchState } from '@/types'
import type { GitHubRepository, GitHubSearchQuery } from '@/types/github'

interface SearchStore extends SearchState {
  // アクション
  setQuery: (query: string) => void
  setResults: (results: GitHubRepository[]) => void
  addResults: (results: GitHubRepository[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setHasMore: (hasMore: boolean) => void
  setPage: (page: number) => void
  incrementPage: () => void
  setTotalCount: (totalCount: number) => void
  
  // 検索オプション
  searchOptions: {
    sort: 'stars' | 'forks' | 'updated' | 'best-match'
    order: 'desc' | 'asc'
    language?: string
    minStars?: number
    maxStars?: number
  }
  setSearchOptions: (options: Partial<SearchStore['searchOptions']>) => void
  
  // 履歴管理
  searchHistory: string[]
  addToHistory: (query: string) => void
  removeFromHistory: (query: string) => void
  clearHistory: () => void
  loadHistory: () => void
  
  // ドメインロジック統合
  queryValidation: { isValid: boolean; errors: string[] }
  validateQuery: (query: string) => boolean
  getRepositoryQuality: (repository: GitHubRepository) => number
  getSearchStatistics: () => {
    totalCount: number
    averageStars: number
    averageForks: number
    languageDistribution: Map<string, number>
    qualityDistribution: {
      excellent: number
      good: number
      fair: number
      poor: number
    }
  }
  
  // リセット機能
  resetSearch: () => void
  resetResults: () => void
}

const initialState: Pick<SearchStore, keyof SearchState> = {
  query: '',
  results: [],
  loading: false,
  error: null,
  hasMore: true,
  page: 1,
  totalCount: 0,
}

const initialQueryValidation = {
  isValid: true,
  errors: []
}

const initialSearchOptions: SearchStore['searchOptions'] = {
  sort: 'best-match',
  order: 'desc',
}

export const useSearchStore = create<SearchStore>()(
  devtools(
    (set, get) => ({
      ...initialState,
      queryValidation: initialQueryValidation,
      searchOptions: initialSearchOptions,
      searchHistory: [],

      // 基本的なセッター
      setQuery: (query) =>
        set({ query }, false, 'search/setQuery'),

      setResults: (results) =>
        set({ results }, false, 'search/setResults'),

      addResults: (newResults) =>
        set(
          (state) => ({
            results: [...state.results, ...newResults],
          }),
          false,
          'search/addResults'
        ),

      setLoading: (loading) =>
        set({ loading }, false, 'search/setLoading'),

      setError: (error) =>
        set({ error }, false, 'search/setError'),

      setHasMore: (hasMore) =>
        set({ hasMore }, false, 'search/setHasMore'),

      setPage: (page) =>
        set({ page }, false, 'search/setPage'),

      incrementPage: () =>
        set(
          (state) => ({ page: state.page + 1 }),
          false,
          'search/incrementPage'
        ),

      setTotalCount: (totalCount) =>
        set({ totalCount }, false, 'search/setTotalCount'),

      // 検索オプション
      setSearchOptions: (options) =>
        set(
          (state) => ({
            searchOptions: { ...state.searchOptions, ...options },
          }),
          false,
          'search/setSearchOptions'
        ),

      // 履歴管理
      loadHistory: () =>
        set(
          () => ({
            searchHistory: SearchHistoryStorage.getHistory(),
          }),
          false,
          'search/loadHistory'
        ),

      addToHistory: (query) =>
        set(
          (state) => {
            const trimmedQuery = query.trim()
            if (!trimmedQuery) return state

            SearchHistoryStorage.addToHistory(trimmedQuery)
            const newHistory = SearchHistoryStorage.getHistory()
            return { searchHistory: newHistory }
          },
          false,
          'search/addToHistory'
        ),

      removeFromHistory: (query) =>
        set(
          () => {
            SearchHistoryStorage.removeFromHistory(query)
            const newHistory = SearchHistoryStorage.getHistory()
            return { searchHistory: newHistory }
          },
          false,
          'search/removeFromHistory'
        ),

      clearHistory: () =>
        set(
          () => {
            SearchHistoryStorage.clearHistory()
            return { searchHistory: [] }
          },
          false,
          'search/clearHistory'
        ),

      // リセット機能
      resetSearch: () =>
        set(
          {
            ...initialState,
            searchHistory: get().searchHistory, // 履歴は保持
          },
          false,
          'search/resetSearch'
        ),

      resetResults: () =>
        set(
          {
            results: [],
            hasMore: true,
            page: 1,
            totalCount: 0,
            error: null,
          },
          false,
          'search/resetResults'
        ),

      // ドメインロジック統合機能
      validateQuery: (query) => {
        const validation = validateSearchQuery(query)
        set({ queryValidation: validation }, false, 'search/validateQuery')
        return validation.isValid
      },

      getRepositoryQuality: (repository) => {
        return calculateRepositoryQuality(repository)
      },

      getSearchStatistics: () => {
        const { results } = get()
        return calculateSearchStatistics(results)
      },
    }),
    {
      name: 'search-store',
    }
  )
)

// セレクター関数（パフォーマンス最適化用）
export const selectSearchState = (state: SearchStore) => ({
  query: state.query,
  results: state.results,
  loading: state.loading,
  error: state.error,
  hasMore: state.hasMore,
  page: state.page,
  totalCount: state.totalCount,
})

export const selectSearchOptions = (state: SearchStore) => state.searchOptions

export const selectSearchHistory = (state: SearchStore) => state.searchHistory

// 検索クエリを構築するヘルパー関数
export const buildSearchQuery = (store: SearchStore): GitHubSearchQuery => {
  const { query, page, searchOptions } = store
  
  return {
    q: query,
    sort: searchOptions.sort === 'best-match' ? undefined : searchOptions.sort,
    order: searchOptions.sort === 'best-match' ? undefined : searchOptions.order,
    per_page: 30, // デフォルトのページサイズ
    page,
  }
}