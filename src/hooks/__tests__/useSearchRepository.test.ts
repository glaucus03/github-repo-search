import { renderHook, act, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { useSearchRepository } from '../useSearchRepository'

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const mockPush = jest.fn()
const mockRouterMock = {
  push: mockPush,
  replace: jest.fn(),
  refresh: jest.fn(),
}

describe('useSearchRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouterMock)
  })

  it('初期状態が正しく設定される', () => {
    const { result } = renderHook(() => useSearchRepository())

    expect(result.current.repositories).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.currentQuery).toBe('')
    expect(result.current.totalPages).toBe(0)
  })

  it('検索が正常に実行される', async () => {
    const mockResponse = {
      items: [
        {
          id: 1,
          name: 'test-repo',
          full_name: 'owner/test-repo',
          description: 'Test repository',
          html_url: 'https://github.com/owner/test-repo',
          stargazers_count: 100,
          watchers_count: 50,
          language: 'JavaScript',
          owner: {
            login: 'owner',
            avatar_url: 'https://github.com/owner.png'
          }
        }
      ],
      total_count: 1
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useSearchRepository())

    await act(async () => {
      await result.current.performSearch('test')
    })

    await waitFor(() => {
      expect(result.current.repositories).toEqual(mockResponse.items)
      expect(result.current.totalCount).toBe(1)
      expect(result.current.currentQuery).toBe('test')
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe(null)
    })
  })

  it('検索エラーが正しく処理される', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useSearchRepository())

    await act(async () => {
      await result.current.performSearch('test')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('API Error')
      expect(result.current.repositories).toEqual([])
      expect(result.current.totalCount).toBe(0)
      expect(result.current.loading).toBe(false)
    })
  })

  it('リポジトリクリックで正しくナビゲートする', () => {
    const { result } = renderHook(() => useSearchRepository())
    
    const mockEvent = {
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as React.MouseEvent

    const repository = {
      id: 1,
      name: 'test-repo',
      full_name: 'owner/test-repo',
      description: 'Test repository',
      html_url: 'https://github.com/owner/test-repo',
      stargazers_count: 100,
      watchers_count: 50,
      language: 'JavaScript',
      owner: {
        login: 'owner',
        avatar_url: 'https://github.com/owner.png'
      }
    }

    act(() => {
      result.current.handleRepositoryClick(repository, mockEvent)
    })

    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockEvent.stopPropagation).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/repository/owner/test-repo')
  })

  it('ページ変更が正しく動作する', async () => {
    const mockResponse = {
      items: [
        {
          id: 2,
          name: 'test-repo-2',
          full_name: 'owner/test-repo-2',
          description: 'Test repository 2',
          html_url: 'https://github.com/owner/test-repo-2',
          stargazers_count: 200,
          watchers_count: 100,
          language: 'TypeScript',
          owner: {
            login: 'owner',
            avatar_url: 'https://github.com/owner.png'
          }
        }
      ],
      total_count: 50
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const { result } = renderHook(() => useSearchRepository())

    // 初期検索を実行してcurrentQueryを設定
    await act(async () => {
      await result.current.performSearch('test')
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    // ページ変更
    await act(async () => {
      result.current.handlePageChange(2)
    })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenLastCalledWith(
        '/api/repositories/search?q=test&sort=stars&order=desc&per_page=30&page=2'
      )
    })
  })

  it('状態リセットが正しく動作する', () => {
    const { result } = renderHook(() => useSearchRepository())

    // 初期状態を変更
    act(() => {
      result.current.resetState()
    })

    expect(result.current.repositories).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.totalCount).toBe(0)
    expect(result.current.currentQuery).toBe('')
  })
}