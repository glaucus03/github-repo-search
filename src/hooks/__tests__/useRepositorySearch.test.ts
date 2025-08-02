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

// Mock stores
const mockUseSearchStore = {
  getState: jest.fn(() => ({
    query: 'react',
    page: 1,
    searchOptions: {
      sort: 'best-match',
      order: 'desc',
    },
  })),
  query: 'react',
  results: [],
  loading: false,
  error: null,
  hasMore: true,
  totalCount: 0,
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
}

const mockUseUIStore = {
  addNotification: jest.fn(),
}

jest.mock('@/store/searchStore', () => ({
  useSearchStore: jest.fn(() => mockUseSearchStore),
  buildSearchQuery: jest.fn((store) => ({
    q: store.query,
    sort: store.searchOptions.sort === 'best-match' ? undefined : store.searchOptions.sort,
    order: store.searchOptions.sort === 'best-match' ? undefined : store.searchOptions.order,
    per_page: 30,
    page: store.page,
  })),
}))

// Mock the store's getState method properly
Object.defineProperty(mockUseSearchStore, 'getState', {
  value: jest.fn(() => ({
    query: 'react',
    page: 1,
    searchOptions: {
      sort: 'best-match',
      order: 'desc',
    },
  })),
  writable: true,
})

jest.mock('@/store/uiStore', () => ({
  useUIStore: () => mockUseUIStore,
}))

// Mock search domain functions
jest.mock('@/lib/search-domain', () => ({
  validateSearchQuery: jest.fn(() => ({ isValid: true, errors: [] })),
  buildGitHubSearchQuery: jest.fn((params) => params.query),
  createPopularRepositoryQuery: jest.fn(() => 'stars:>1000'),
  createRecentRepositoryQuery: jest.fn(() => 'pushed:>2023-01-01'),
}))

describe('useRepositorySearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.search('react')
    })
    
    expect(mockUseSearchStore.setQuery).toHaveBeenCalledWith('react')
    expect(mockUseSearchStore.resetResults).toHaveBeenCalled()
    expect(mockUseSearchStore.addToHistory).toHaveBeenCalledWith('react')
  })

  it('searchPopular関数が正しく動作する', async () => {
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.searchPopular('javascript')
    })
    
    expect(mockUseSearchStore.setQuery).toHaveBeenCalled()
    expect(mockUseSearchStore.resetResults).toHaveBeenCalled()
  })

  it('searchRecent関数が正しく動作する', async () => {
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.searchRecent('python')
    })
    
    expect(mockUseSearchStore.setQuery).toHaveBeenCalled()
    expect(mockUseSearchStore.resetResults).toHaveBeenCalled()
  })

  it('loadMore関数が正しく動作する', async () => {
    // hasMore が true の場合のテスト
    mockUseSearchStore.hasMore = true
    
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.loadMore()
    })
    
    expect(mockUseSearchStore.incrementPage).toHaveBeenCalled()
  })

  it('バリデーションエラーの処理が正しく動作する', async () => {
    // モックでバリデーションエラーを発生させる
    const mockValidateSearchQuery = require('@/lib/search-domain').validateSearchQuery
    mockValidateSearchQuery.mockReturnValueOnce({
      isValid: false,
      errors: ['クエリが無効です']
    })
    
    const { result } = renderHook(() => useRepositorySearch())
    
    await act(async () => {
      await result.current.search('')
    })
    
    expect(mockUseUIStore.addNotification).toHaveBeenCalledWith({
      type: 'error',
      message: 'クエリが無効です',
      duration: 3000,
    })
  })

  it('オプションでenabled=falseの場合、自動実行されない', () => {
    const { result } = renderHook(() => 
      useRepositorySearch({ enabled: false })
    )
    
    expect(result.current.results).toEqual([])
  })
})