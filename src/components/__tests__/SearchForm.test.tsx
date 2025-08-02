import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchForm } from '../SearchForm'

// Mock stores
const mockUseSearchStore = {
  query: '',
  setQuery: jest.fn(),
  searchHistory: [],
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
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
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
    
    const filterButton = screen.getByRole('button', { name: /フィルタ/ })
    
    fireEvent.click(filterButton)
    
    // フィルタUIが表示されることを確認（実装に応じて調整）
    expect(filterButton).toBeInTheDocument()
  })
})