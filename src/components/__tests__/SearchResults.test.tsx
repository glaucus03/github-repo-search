import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchResults } from '../SearchResults'

// Mock dependencies
const mockUseLiveSearch = {
  totalCount: 0,
  loading: false,
  error: null
}

jest.mock('@/hooks', () => ({
  useLiveSearch: jest.fn(() => mockUseLiveSearch)
}))

jest.mock('@/components', () => ({
  Pagination: ({ currentPage, totalPages, onPageChange, loading }: any) => (
    <div data-testid="pagination">
      <span>Page {currentPage} of {totalPages}</span>
      <button 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={loading}
        data-testid="next-page"
      >
        Next
      </button>
    </div>
  )
}))

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">{children}</div>
  ),
  CardBody: ({ children, className }: any) => (
    <div className={className} data-testid="card-body">{children}</div>
  ),
  Spinner: ({ size }: any) => (
    <div data-testid="spinner" data-size={size}>Loading...</div>
  )
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  MagnifyingGlassIcon: () => <svg data-testid="magnifying-glass-icon" />,
  StarIcon: () => <svg data-testid="star-icon" />,
  EyeIcon: () => <svg data-testid="eye-icon" />
}))

const { useLiveSearch } = require('@/hooks')

describe('SearchResults', () => {
  const mockRepository = {
    id: 1,
    name: 'test-repo',
    full_name: 'owner/test-repo',
    description: 'Test repository description',
    html_url: 'https://github.com/owner/test-repo',
    stargazers_count: 1500,
    watchers_count: 100,
    language: 'TypeScript',
    owner: {
      login: 'owner',
      avatar_url: 'https://example.com/avatar.png'
    }
  }

  const defaultProps = {
    searchQuery: '',
    currentQuery: '',
    repositories: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    onRepositoryClick: jest.fn(),
    onPageChange: jest.fn(),
    searchResultsRef: { current: null }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    useLiveSearch.mockReturnValue(mockUseLiveSearch)
  })

  describe('Loading states', () => {
    it('初期ローディング状態を表示する', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          loading={true}
        />
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
      expect(screen.getByText('検索中...')).toBeInTheDocument()
    })

    it('ライブサーチローディング状態を表示する', () => {
      useLiveSearch.mockReturnValue({
        ...mockUseLiveSearch,
        loading: true
      })

      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react"
        />
      )

      expect(screen.getByTestId('spinner')).toBeInTheDocument()
    })
  })

  describe('Error states', () => {
    it('エラー状態を表示する', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          error="検索エラーが発生しました"
        />
      )

      expect(screen.getByText('⚠️ エラー')).toBeInTheDocument()
      expect(screen.getByText('検索エラーが発生しました')).toBeInTheDocument()
    })

    it('ライブサーチエラーを表示する', () => {
      useLiveSearch.mockReturnValue({
        ...mockUseLiveSearch,
        error: 'ライブサーチエラー'
      })

      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react"
        />
      )

      expect(screen.getByText('検索エラー')).toBeInTheDocument()
      expect(screen.getByText('ライブサーチエラー')).toBeInTheDocument()
    })
  })

  describe('No results states', () => {
    it('検索クエリがない場合の初期状態を表示する', () => {
      render(<SearchResults {...defaultProps} />)

      expect(screen.getByText('検索を開始してください')).toBeInTheDocument()
      expect(screen.getByText('上の検索ボックスにキーワードを入力して、GitHubリポジトリを検索できます')).toBeInTheDocument()
    })

    it('検索結果がない場合のメッセージを表示する', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="nonexistent"
        />
      )

      expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument()
      expect(screen.getByText('「nonexistent」に一致するリポジトリが見つかりませんでした')).toBeInTheDocument()
    })

    it('ライブサーチで結果があるが実際の検索結果がない場合', () => {
      useLiveSearch.mockReturnValue({
        ...mockUseLiveSearch,
        totalCount: 150
      })

      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react"
        />
      )

      expect(screen.getByText('「react」の検索結果: 150件')).toBeInTheDocument()
      expect(screen.getByText('検索ボタンを押して結果を表示してください')).toBeInTheDocument()
    })
  })

  describe('Results display', () => {
    it('検索結果を正しく表示する', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={1}
        />
      )

      expect(screen.getByText('test-repo')).toBeInTheDocument()
      expect(screen.getByText('owner')).toBeInTheDocument()
      expect(screen.getByText('Test repository description')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('1,500')).toBeInTheDocument()
      expect(screen.getByText('100')).toBeInTheDocument()
    })

    it('アバター画像が正しく表示される', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={1}
        />
      )

      const avatar = screen.getByAltText('owner')
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
    })

    it('言語がない場合は表示されない', () => {
      const repoWithoutLanguage = { ...mockRepository, language: null }
      
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[repoWithoutLanguage]}
          searchQuery="react"
          totalCount={1}
        />
      )

      expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
    })

    it('説明がない場合は表示されない', () => {
      const repoWithoutDescription = { ...mockRepository, description: null }
      
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[repoWithoutDescription]}
          searchQuery="react"
          totalCount={1}
        />
      )

      expect(screen.queryByText('Test repository description')).not.toBeInTheDocument()
    })

    it('複数のリポジトリを表示する', () => {
      const repositories = [
        mockRepository,
        { ...mockRepository, id: 2, name: 'another-repo', owner: { ...mockRepository.owner, login: 'another-owner' } }
      ]

      render(
        <SearchResults 
          {...defaultProps} 
          repositories={repositories}
          searchQuery="react"
          totalCount={2}
        />
      )

      expect(screen.getByText('test-repo')).toBeInTheDocument()
      expect(screen.getByText('another-repo')).toBeInTheDocument()
      expect(screen.getByText('owner')).toBeInTheDocument()
      expect(screen.getByText('another-owner')).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('リポジトリクリック時にハンドラーが呼ばれる', () => {
      const onRepositoryClick = jest.fn()
      
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={1}
          onRepositoryClick={onRepositoryClick}
        />
      )

      const repoCard = screen.getByText('test-repo').closest('div')
      fireEvent.click(repoCard!)

      expect(onRepositoryClick).toHaveBeenCalledWith(mockRepository, expect.any(Object))
    })

    it('ページ変更時にハンドラーが呼ばれる', () => {
      const onPageChange = jest.fn()
      
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={1}
          totalPages={2}
          onPageChange={onPageChange}
        />
      )

      const nextButton = screen.getByTestId('next-page')
      fireEvent.click(nextButton)

      expect(onPageChange).toHaveBeenCalledWith(2)
    })
  })

  describe('Pagination', () => {
    it('ページネーションが表示される', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={50}
          totalPages={2}
        />
      )

      expect(screen.getByTestId('pagination')).toBeInTheDocument()
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument()
    })

    it('結果がない場合はページネーションが表示されない', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react"
        />
      )

      expect(screen.queryByTestId('pagination')).not.toBeInTheDocument()
    })
  })

  describe('Live search integration', () => {
    it('ライブサーチフックが正しいクエリで呼ばれる', () => {
      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react hooks"
        />
      )

      expect(useLiveSearch).toHaveBeenCalledWith('react hooks')
    })

    it('ライブサーチの結果数が表示される', () => {
      useLiveSearch.mockReturnValue({
        ...mockUseLiveSearch,
        totalCount: 1234
      })

      render(
        <SearchResults 
          {...defaultProps} 
          searchQuery="react"
        />
      )

      expect(screen.getByText('「react」の検索結果: 1,234件')).toBeInTheDocument()
    })
  })

  describe('Ref handling', () => {
    it('searchResultsRefが正しく設定される', () => {
      const ref = { current: null }
      
      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[mockRepository]}
          searchQuery="react"
          totalCount={1}
          searchResultsRef={ref}
        />
      )

      expect(ref.current).toBeTruthy()
    })
  })

  describe('Number formatting', () => {
    it('大きな数値が正しくフォーマットされる', () => {
      const repoWithLargeNumbers = {
        ...mockRepository,
        stargazers_count: 1234567,
        watchers_count: 9876
      }

      render(
        <SearchResults 
          {...defaultProps} 
          repositories={[repoWithLargeNumbers]}
          searchQuery="react"
          totalCount={1}
        />
      )

      expect(screen.getByText('1,234,567')).toBeInTheDocument()
      expect(screen.getByText('9,876')).toBeInTheDocument()
    })
  })
})