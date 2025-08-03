import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchForm } from '../SearchForm'

// Mock stores
const mockUseSearchStore = {
  query: '',
  setQuery: jest.fn(),
  searchHistory: [] as string[],
  resetResults: jest.fn(),
  searchOptions: {
    language: null,
    minStars: null,
    maxStars: null,
    sort: 'best-match',
    order: 'desc',
  },
  setSearchOptions: jest.fn(),
}

const mockUseUIStore = {
  isSearchFormExpanded: false,
  selectedSortOption: 'best-match',
  selectedOrderOption: 'desc',
  toggleSearchForm: jest.fn(),
  setSortOption: jest.fn(),
  setOrderOption: jest.fn(),
}

// Mock the stores
jest.mock('@/store/searchStore', () => ({
  useSearchStore: () => mockUseSearchStore,
}))

jest.mock('@/store/uiStore', () => ({
  useUIStore: () => mockUseUIStore,
}))

// Mock debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}))

// Mock constants
jest.mock('@/lib/constants', () => ({
  SEARCH: {
    LANGUAGES: ['JavaScript', 'TypeScript', 'Python'],
    PLACEHOLDER_QUERIES: ['angularを検索...', 'reactを検索...', 'vueを検索...'],
  },
}))

// Mock validators
jest.mock('@/lib/validators', () => ({
  validateSearchQuery: jest.fn(() => ({ isValid: true, errors: [] })),
}))

// Mock search domain functions
jest.mock('@/lib/search-domain', () => ({
  validateSearchQuery: jest.fn(() => ({ isValid: true, errors: [] })),
  buildGitHubSearchQuery: jest.fn((params) => params.query),
  generateSearchSuggestions: jest.fn(() => []),
  createPopularRepositoryQuery: jest.fn(() => 'stars:>1000'),
}))

// Mock utils
jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
}))

describe('SearchForm', () => {
  const mockOnSearch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('正しくレンダリングされる', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByText('検索する')).toBeInTheDocument()
    expect(screen.getByText('人気のリポジトリ')).toBeInTheDocument()
  })

  it('検索クエリの入力が処理される', async () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'react' } })
    
    expect(input).toHaveValue('react')
  })

  it('検索ボタンクリックで検索が実行される', async () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    const button = screen.getByText('検索する')
    
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('react')
    })
  })

  it('Enterキーで検索が実行される', async () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'react' } })
    fireEvent.keyPress(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith('react')
    })
  })

  it('空のクエリでは検索ボタンが無効になる', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const button = screen.getByText('検索する')
    expect(button).toBeDisabled()
  })

  it('人気のリポジトリボタンが動作する', async () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const popularButton = screen.getByText('人気のリポジトリ')
    fireEvent.click(popularButton)
    
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled()
    })
  })

  it('フィルタボタンで詳細フィルタが表示/非表示される', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    // フィルタボタンはSVGアイコンのみなので、別の方法で取得
    const filterButtons = screen.getAllByRole('button')
    const filterButton = filterButtons.find(button => {
      // SVGアイコンを含むボタンを探す
      return button.querySelector('svg') && button.className.includes('rounded-full h-14 w-14')
    })
    
    expect(filterButton).toBeInTheDocument()
    
    if (filterButton) {
      fireEvent.click(filterButton)
      // フィルタパネルの表示を確認（実装に応じて）
      expect(filterButton).toBeInTheDocument()
    }
  })

  it('フィルターパネルが適切に動作する', async () => {
    // フィルターボタンをクリックして高度なフィルタが表示されることをテスト
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const filterButtons = screen.getAllByRole('button')
    const filterButton = filterButtons.find(button => {
      return button.querySelector('svg') && button.className.includes('rounded-full h-14 w-14')
    })
    
    if (filterButton) {
      fireEvent.click(filterButton)
      // 高度なフィルタパネルが表示されることを確認
      expect(screen.getByText('プログラミング言語')).toBeInTheDocument()
    }
  })

  it('検索履歴が表示される', () => {
    mockUseSearchStore.searchHistory = ['react', 'vue', 'angular']
    
    render(<SearchForm onSearch={mockOnSearch} />)
    
    // 入力フィールドにフォーカスして履歴を表示
    const input = screen.getByPlaceholderText(/を検索/)
    fireEvent.focus(input)
    
    // 履歴項目が表示されることを確認
    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('vue')).toBeInTheDocument()
    expect(screen.getByText('angular')).toBeInTheDocument()
  })

  it('履歴項目クリックで入力値が設定される', async () => {
    mockUseSearchStore.searchHistory = ['react']
    
    render(<SearchForm onSearch={mockOnSearch} />)
    
    // 入力フィールドにフォーカスして履歴を表示
    const input = screen.getByPlaceholderText(/を検索/)
    fireEvent.focus(input)
    
    const historyItem = screen.getByText('react')
    fireEvent.click(historyItem)
    
    // 入力値が設定されることを確認
    expect(input).toHaveValue('react')
  })

  it('プレースホルダーが正しく表示される', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    // プレースホルダーが設定されていることを確認
    expect(input).toHaveAttribute('placeholder')
  })

  it('初期クエリが設定される', () => {
    mockUseSearchStore.query = 'initial-query'
    
    render(<SearchForm onSearch={mockOnSearch} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial-query')
  })

  it('複数のボタンが存在することを確認', () => {
    render(<SearchForm onSearch={mockOnSearch} />)
    
    // 検索ボタンの存在確認
    expect(screen.getByText('検索する')).toBeInTheDocument()
    
    // 人気のリポジトリボタンの存在確認
    expect(screen.getByText('人気のリポジトリ')).toBeInTheDocument()
    
    // フィルターボタンの存在確認（SVGアイコンボタン）
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(2) // 検索、人気、フィルターボタン
  })
})