import { renderHook, act } from '@testing-library/react'
import { useRepositorySearch } from '../useRepositorySearch'

// Mock SWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: null,
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  })),
}))

// Mock search domain functions
jest.mock('@/lib/search-domain', () => ({
  validateSearchQuery: jest.fn(() => ({ isValid: true, errors: [] })),
  buildGitHubSearchQuery: jest.fn((params) => params.query),
  createPopularRepositoryQuery: jest.fn(() => 'stars:>1000'),
  createRecentRepositoryQuery: jest.fn(() => 'pushed:>2023-01-01'),
}))

// Mock stores
jest.mock('@/store/searchStore')
jest.mock('@/store/uiStore')

describe('useRepositorySearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // モックストアの設定
    const searchStore = require('@/store/searchStore')
    searchStore.useSearchStore.mockReturnValue({
      query: 'react',
      results: [],
      loading: false,
      error: null,
      hasMore: true,
      totalCount: 0,
      page: 1,
      setQuery: jest.fn(),
      setResults: jest.fn(),
      addResults: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setTotalCount: jest.fn(),
      setHasMore: jest.fn(),
      incrementPage: jest.fn(),
      resetResults: jest.fn(),
      addToHistory: jest.fn(),
    })
    
    searchStore.useSearchStore.getState = jest.fn(() => ({
      query: 'react',
      page: 1,
      searchOptions: {
        sort: 'best-match',
        order: 'desc',
      },
      setQuery: jest.fn(),
    }))
    
    searchStore.buildSearchQuery = jest.fn(() => ({
      q: 'react',
      per_page: 30,
      page: 1,
    }))
    
    const uiStore = require('@/store/uiStore')
    uiStore.useUIStore.mockReturnValue({
      addNotification: jest.fn(),
    })
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useRepositorySearch())
    
    expect(result.current.results).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.hasMore).toBe(true)
    expect(result.current.totalCount).toBe(0)
  })

  it('search関数が正しく動作する', async () => {
    const searchStore = require('@/store/searchStore')
    const mockSetQuery = jest.fn()
    const mockResetResults = jest.fn()
    const mockAddToHistory = jest.fn()
    
    searchStore.useSearchStore.getState.mockReturnValue({
      query: 'react',
      page: 1,
      searchOptions: {
        sort: 'best-match',
        order: 'desc',
      },
      setQuery: mockSetQuery,
    })
    
    searchStore.useSearchStore.mockReturnValue({
      query: 'react',
      results: [],
      loading: false,
      error: null,
      hasMore: true,
      totalCount: 0,
      page: 1,
      setQuery: mockSetQuery,
      setResults: jest.fn(),
      addResults: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setTotalCount: jest.fn(),
      setHasMore: jest.fn(),
      incrementPage: jest.fn(),
      resetResults: mockResetResults,
      addToHistory: mockAddToHistory,
    })
    
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.search('react')
    })
    
    expect(mockSetQuery).toHaveBeenCalledWith('react')
    expect(mockResetResults).toHaveBeenCalled()
    expect(mockAddToHistory).toHaveBeenCalledWith('react')
  })

  it('バリデーションエラーの処理が正しく動作する', async () => {
    const searchDomain = require('@/lib/search-domain')
    const searchStore = require('@/store/searchStore')
    const mockSetError = jest.fn()
    
    searchDomain.validateSearchQuery.mockReturnValueOnce({
      isValid: false,
      errors: ['クエリが無効です']
    })
    
    searchStore.useSearchStore.mockReturnValue({
      query: '',
      results: [],
      loading: false,
      error: null,
      hasMore: true,
      totalCount: 0,
      page: 1,
      setQuery: jest.fn(),
      setResults: jest.fn(),
      addResults: jest.fn(),
      setLoading: jest.fn(),
      setError: mockSetError,
      setTotalCount: jest.fn(),
      setHasMore: jest.fn(),
      incrementPage: jest.fn(),
      resetResults: jest.fn(),
      addToHistory: jest.fn(),
    })
    
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.search('')
    })
    
    expect(mockSetError).toHaveBeenCalledWith('クエリが無効です')
  })

  it('loadMore関数が正しく動作する', async () => {
    const searchStore = require('@/store/searchStore')
    const mockIncrementPage = jest.fn()
    
    searchStore.useSearchStore.mockReturnValue({
      query: 'react',
      results: [],
      loading: false,
      error: null,
      hasMore: true,
      totalCount: 100,
      page: 1,
      setQuery: jest.fn(),
      setResults: jest.fn(),
      addResults: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      setTotalCount: jest.fn(),
      setHasMore: jest.fn(),
      incrementPage: mockIncrementPage,
      resetResults: jest.fn(),
      addToHistory: jest.fn(),
    })
    
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.loadMore()
    })
    
    expect(mockIncrementPage).toHaveBeenCalled()
  })

  it('オプションでenabled=falseの場合、自動実行されない', () => {
    const { result } = renderHook(() => 
      useRepositorySearch({ enabled: false })
    )
    
    expect(result.current.results).toEqual([])
  })
})