import { renderHook, act } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSearchUI } from '../useSearchUI'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

const mockReplace = jest.fn()
const mockRouterMock = {
  push: jest.fn(),
  replace: mockReplace,
  refresh: jest.fn(),
}

const mockSearchParamsMock = {
  get: jest.fn(),
}

describe('useSearchUI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouterMock)
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsMock)
  })

  it('初期状態が正しく設定される', () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())

    expect(result.current.searchQuery).toBe('')
  })

  it('URLから初期クエリを取得する', () => {
    mockSearchParamsMock.get.mockReturnValue('test-query')
    
    const { result } = renderHook(() => useSearchUI())
    const mockOnSearch = jest.fn()

    act(() => {
      result.current.initializeFromURL(mockOnSearch)
    })

    expect(result.current.searchQuery).toBe('test-query')
    expect(mockOnSearch).toHaveBeenCalledWith('test-query')
  })

  it('検索クエリの更新が正しく動作する', () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())

    act(() => {
      result.current.setSearchQuery('new query')
    })

    expect(result.current.searchQuery).toBe('new query')
  })

  it('検索実行が正しく動作する', async () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())
    const mockOnSearch = jest.fn().mockResolvedValue(undefined)

    // 検索クエリを設定
    act(() => {
      result.current.setSearchQuery('test query')
    })

    // 検索実行
    await act(async () => {
      await result.current.handleSearch(mockOnSearch)
    })

    expect(mockOnSearch).toHaveBeenCalledWith('test query')
  })

  it('空の検索クエリでは検索が実行されない', async () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())
    const mockOnSearch = jest.fn()

    // 検索実行（空のクエリ）
    await act(async () => {
      await result.current.handleSearch(mockOnSearch)
    })

    expect(mockOnSearch).not.toHaveBeenCalled()
  })

  it('初期状態リセットが正しく動作する', () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())
    const mockOnReset = jest.fn()

    // 検索クエリを設定
    act(() => {
      result.current.setSearchQuery('test query')
    })

    // リセット実行
    act(() => {
      result.current.resetToInitialState(mockOnReset)
    })

    expect(result.current.searchQuery).toBe('')
    expect(mockOnReset).toHaveBeenCalled()
  })

  it('resetパラメータでリセットされる', () => {
    mockSearchParamsMock.get.mockImplementation((param: string) => {
      if (param === 'reset') return 'true'
      return null
    })
    
    renderHook(() => useSearchUI())

    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('カスタムイベントでリセットされる', () => {
    mockSearchParamsMock.get.mockReturnValue(null)
    
    const { result } = renderHook(() => useSearchUI())

    // 検索クエリを設定
    act(() => {
      result.current.setSearchQuery('test query')
    })

    // カスタムイベントを発火
    act(() => {
      window.dispatchEvent(new CustomEvent('resetToInitialState'))
    })

    expect(result.current.searchQuery).toBe('')
  })
}