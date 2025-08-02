import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchFormComponent } from '../SearchFormComponent'
import { useLiveSearch } from '@/hooks'

// Mock hooks
jest.mock('@/hooks', () => ({
  useLiveSearch: jest.fn(),
}))

const mockUseLiveSearch = useLiveSearch as jest.Mock

describe('SearchFormComponent', () => {
  const mockProps = {
    searchQuery: '',
    onSearchQueryChange: jest.fn(),
    onSearch: jest.fn(),
    disabled: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLiveSearch.mockReturnValue({
      totalCount: 0,
      loading: false,
      error: null,
    })
  })

  it('正しくレンダリングされる', () => {
    render(<SearchFormComponent {...mockProps} />)
    
    expect(screen.getByPlaceholderText('リポジトリを検索...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '検索する' })).toBeInTheDocument()
  })

  it('検索クエリの変更が正しく処理される', () => {
    render(<SearchFormComponent {...mockProps} />)
    
    const input = screen.getByPlaceholderText('リポジトリを検索...')
    
    fireEvent.change(input, { target: { value: 'test query' } })
    
    expect(mockProps.onSearchQueryChange).toHaveBeenCalledWith('test query')
  })

  it('検索ボタンクリックが正しく処理される', () => {
    render(<SearchFormComponent {...mockProps} />)
    
    const button = screen.getByRole('button', { name: '検索する' })
    
    fireEvent.click(button)
    
    expect(mockProps.onSearch).toHaveBeenCalled()
  })

  it('Enterキー押下で検索が実行される', () => {
    render(<SearchFormComponent {...mockProps} />)
    
    const input = screen.getByPlaceholderText('リポジトリを検索...')
    
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })
    
    expect(mockProps.onSearch).toHaveBeenCalled()
  })

  it('disabled時は検索が実行されない', () => {
    render(<SearchFormComponent {...mockProps} disabled={true} />)
    
    const input = screen.getByPlaceholderText('リポジトリを検索...')
    const button = screen.getByRole('button', { name: '検索する' })
    
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 })
    fireEvent.click(button)
    
    expect(mockProps.onSearch).not.toHaveBeenCalled()
  })

  it('ライブ検索中にスピナーが表示される', () => {
    mockUseLiveSearch.mockReturnValue({
      totalCount: 0,
      loading: true,
      error: null,
    })

    render(<SearchFormComponent {...mockProps} searchQuery="test" />)
    
    expect(screen.getByText('検索中...')).toBeInTheDocument()
  })

  it('ライブ検索結果数が表示される', () => {
    mockUseLiveSearch.mockReturnValue({
      totalCount: 100,
      loading: false,
      error: null,
    })

    render(<SearchFormComponent {...mockProps} searchQuery="react" />)
    
    expect(screen.getByText('「react」の検索結果は100件です')).toBeInTheDocument()
  })

  it('空のクエリで検索ボタンが無効になる', () => {
    render(<SearchFormComponent {...mockProps} searchQuery="" />)
    
    const button = screen.getByRole('button', { name: '検索する' })
    
    expect(button).toBeDisabled()
  })

  it('クエリがある場合検索ボタンが有効になる', () => {
    render(<SearchFormComponent {...mockProps} searchQuery="test" />)
    
    const button = screen.getByRole('button', { name: '検索する' })
    
    expect(button).not.toBeDisabled()
  })
}