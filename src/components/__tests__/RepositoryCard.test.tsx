import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepositoryCard } from '../RepositoryCard'
import type { GitHubRepository } from '@/types/github'
import { createMockGitHubUser, createMockGitHubRepository } from '../../test-utils'

// Mock dependencies
jest.mock('@/lib/constants', () => ({
  LANGUAGE_COLORS: {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5'
  }
}))

jest.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  formatNumber: (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  },
  formatRelativeTime: (date: Date) => '2時間前',
  truncateText: (text: string, maxLength: number) => 
    text.length <= maxLength ? text : text.slice(0, maxLength) + '...'
}))

// Mock UI store
const mockUIStore = {
  isFavorite: jest.fn(() => false),
  addToFavorites: jest.fn(),
  removeFromFavorites: jest.fn(),
  addNotification: jest.fn()
}

jest.mock('@/store/uiStore', () => ({
  useUIStore: () => mockUIStore
}))

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Card: ({ children, className, isPressable, onPress }: any) => (
    <div 
      className={className} 
      onClick={onPress}
      data-testid="card"
      role={isPressable ? "button" : undefined}
    >
      {children}
    </div>
  ),
  CardBody: ({ children, className }: any) => (
    <div className={className} data-testid="card-body">{children}</div>
  ),
  CardFooter: ({ children, className }: any) => (
    <div className={className} data-testid="card-footer">{children}</div>
  ),
  Avatar: ({ src, alt, size, className }: any) => (
    <img src={src} alt={alt} className={className} data-testid="avatar" />
  ),
  Chip: ({ children, size, variant, color, className }: any) => (
    <span className={className} data-testid="chip">{children}</span>
  ),
  Button: ({ children, onClick, isIconOnly, size, variant, color, ...props }: any) => {
    const { as, ...buttonProps } = props
    return (
      <button onClick={onClick} data-testid="button" {...buttonProps}>
        {children}
      </button>
    )
  },
  Link: ({ children, href, ...props }: any) => (
    <a href={href} role="link" {...props}>{children}</a>
  )
}))

// Mock Heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  StarIcon: () => <svg data-testid="star-icon" />,
  EyeIcon: () => <svg data-testid="eye-icon" />,
  CodeBracketIcon: () => <svg data-testid="code-icon" />,
  CalendarDaysIcon: () => <svg data-testid="calendar-icon" />,
  ArrowTopRightOnSquareIcon: () => <svg data-testid="external-link-icon" />,
  HeartIcon: () => <svg data-testid="heart-icon" />
}))

jest.mock('@heroicons/react/24/solid', () => ({
  HeartIcon: () => <svg data-testid="heart-icon-solid" />
}))

describe('RepositoryCard', () => {
  const mockRepository: GitHubRepository = createMockGitHubRepository({
    name: 'test-repo',
    full_name: 'test-user/test-repo',
    description: 'A test repository',
    stargazers_count: 1500,
    forks_count: 200,
    language: 'TypeScript',
    topics: ['react', 'typescript', 'ui'],
    updated_at: '2023-01-01T00:00:00Z',
    default_branch: 'main',
    private: false
  })

  const mockOnSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUIStore.isFavorite.mockReturnValue(false)
  })

  it('リポジトリ情報を正しく表示する', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    expect(screen.getByText('test-repo')).toBeInTheDocument()
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('A test repository')).toBeInTheDocument()
    expect(screen.getByText('1.5k')).toBeInTheDocument() // スター数
    expect(screen.getByText('200')).toBeInTheDocument() // フォーク数
    expect(screen.getByText('5')).toBeInTheDocument() // ウォッチャー数
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('アバター画像が正しく表示される', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const avatar = screen.getByTestId('avatar')
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png')
    expect(avatar).toHaveAttribute('alt', 'test-user')
  })

  it('トピックが表示される', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    expect(screen.getByText('react')).toBeInTheDocument()
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.getByText('ui')).toBeInTheDocument()
  })

  it('カードクリック時にonSelectが呼ばれる', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const card = screen.getByTestId('card')
    fireEvent.click(card)

    expect(mockOnSelect).toHaveBeenCalledWith(mockRepository)
  })

  it('お気に入りボタンが正しく動作する', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const favoriteButton = screen.getByLabelText('お気に入りに追加')
    fireEvent.click(favoriteButton)

    expect(mockUIStore.addToFavorites).toHaveBeenCalledWith(mockRepository)
    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'success',
      message: 'お気に入りに追加しました'
    })
  })

  it('お気に入り済みの場合は削除ボタンが表示される', () => {
    mockUIStore.isFavorite.mockReturnValue(true)
    
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const favoriteButton = screen.getByLabelText('お気に入りから削除')
    expect(favoriteButton).toBeInTheDocument()
    expect(screen.getByTestId('heart-icon-solid')).toBeInTheDocument()

    fireEvent.click(favoriteButton)

    expect(mockUIStore.removeFromFavorites).toHaveBeenCalledWith(mockRepository.id)
    expect(mockUIStore.addNotification).toHaveBeenCalledWith({
      type: 'success',
      message: 'お気に入りから削除しました'
    })
  })

  it('プライベートリポジトリバッジが表示される', () => {
    const privateRepo = { ...mockRepository, private: true }
    
    render(<RepositoryCard repository={privateRepo} onSelect={mockOnSelect} />)

    expect(screen.getByText('Private')).toBeInTheDocument()
  })

  it('ライセンス情報が表示される', () => {
    const repoWithLicense = createMockGitHubRepository({
      ...mockRepository,
      license: { 
        key: 'mit', 
        name: 'MIT License', 
        spdx_id: 'MIT', 
        url: 'https://api.github.com/licenses/mit',
        node_id: 'MDc6TGljZW5zZW1pdA=='
      }
    })
    
    render(<RepositoryCard repository={repoWithLicense} onSelect={mockOnSelect} />)

    expect(screen.getByText('MIT License')).toBeInTheDocument()
  })

  it('アーカイブ済みバッジが表示される', () => {
    const archivedRepo = { ...mockRepository, archived: true }
    
    render(<RepositoryCard repository={archivedRepo} onSelect={mockOnSelect} />)

    expect(screen.getByText('Archived')).toBeInTheDocument()
  })

  it('テンプレートバッジが表示される', () => {
    const templateRepo = { ...mockRepository, is_template: true }
    
    render(<RepositoryCard repository={templateRepo} onSelect={mockOnSelect} />)

    expect(screen.getByText('Template')).toBeInTheDocument()
  })

  it('コンパクトバリアントが正しく動作する', () => {
    render(
      <RepositoryCard 
        repository={mockRepository} 
        onSelect={mockOnSelect} 
        variant="compact" 
      />
    )

    // コンパクト版では説明が短縮される
    expect(screen.getByText('A test repository')).toBeInTheDocument()
    
    // コンパクト版ではフッターが表示されない
    expect(screen.queryByTestId('card-footer')).not.toBeInTheDocument()
  })

  it('説明がない場合は表示されない', () => {
    const repoWithoutDescription = { ...mockRepository, description: null }
    
    render(<RepositoryCard repository={repoWithoutDescription} onSelect={mockOnSelect} />)

    expect(screen.queryByText('Test repository description')).not.toBeInTheDocument()
  })

  it('言語がない場合は表示されない', () => {
    const repoWithoutLanguage = { ...mockRepository, language: null }
    
    render(<RepositoryCard repository={repoWithoutLanguage} onSelect={mockOnSelect} />)

    expect(screen.queryByText('TypeScript')).not.toBeInTheDocument()
  })

  it('外部リンクボタンが正しく動作する', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const externalLinkIcon = screen.getByTestId('external-link-icon')
    expect(externalLinkIcon).toBeInTheDocument()
    
    // 外部リンクボタンが存在することを確認
    const buttons = screen.getAllByTestId('button')
    const externalButton = buttons.find(button => button.getAttribute('href') === 'https://github.com/test-user/test-repo')
    expect(externalButton).toBeDefined()
    expect(externalButton).toHaveAttribute('target', '_blank')
    expect(externalButton).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('お気に入りボタンクリック時にイベント伝播が停止される', () => {
    render(<RepositoryCard repository={mockRepository} onSelect={mockOnSelect} />)

    const favoriteButton = screen.getByLabelText('お気に入りに追加')
    fireEvent.click(favoriteButton)

    // お気に入りボタンをクリックしてもonSelectは呼ばれない
    expect(mockOnSelect).not.toHaveBeenCalled()
  })

  it('カスタムクラス名が適用される', () => {
    render(
      <RepositoryCard 
        repository={mockRepository} 
        onSelect={mockOnSelect} 
        className="custom-class" 
      />
    )

    const card = screen.getByTestId('card')
    expect(card).toHaveClass('custom-class')
  })

  describe('数値フォーマット', () => {
    it('大きな数値が正しくフォーマットされる', () => {
      const repoWithLargeNumbers = {
        ...mockRepository,
        stargazers_count: 1234567,
        forks_count: 12345,
        watchers_count: 9876
      }
      
      render(<RepositoryCard repository={repoWithLargeNumbers} onSelect={mockOnSelect} />)

      expect(screen.getByText('1.2M')).toBeInTheDocument() // スター数
      expect(screen.getByText('12.3k')).toBeInTheDocument() // フォーク数
      expect(screen.getByText('9.9k')).toBeInTheDocument() // ウォッチャー数
    })
  })

  describe('トピック表示制限', () => {
    it('通常版では3つまでのトピックを表示する', () => {
      const repoWithManyTopics = {
        ...mockRepository,
        topics: ['react', 'typescript', 'ui', 'components', 'library']
      }
      
      render(<RepositoryCard repository={repoWithManyTopics} onSelect={mockOnSelect} />)

      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
      expect(screen.getByText('ui')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument() // 残りのトピック数
      expect(screen.queryByText('components')).not.toBeInTheDocument()
    })

    it('コンパクト版では2つまでのトピックを表示する', () => {
      const repoWithManyTopics = {
        ...mockRepository,
        topics: ['react', 'typescript', 'ui', 'components']
      }
      
      render(
        <RepositoryCard 
          repository={repoWithManyTopics} 
          onSelect={mockOnSelect} 
          variant="compact" 
        />
      )

      expect(screen.getByText('react')).toBeInTheDocument()
      expect(screen.getByText('typescript')).toBeInTheDocument()
      expect(screen.getByText('+2')).toBeInTheDocument() // 残りのトピック数
      expect(screen.queryByText('ui')).not.toBeInTheDocument()
    })
  })
})