// 共通の型定義をエクスポート
export * from './github'

// アプリケーション共通の型定義
export interface SearchState {
  query: string
  results: import('./github').GitHubRepository[]
  loading: boolean
  error: string | null
  hasMore: boolean
  page: number
  totalCount: number
}

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  isSearchFormExpanded: boolean
  selectedSortOption: 'stars' | 'forks' | 'updated' | 'best-match'
  selectedOrderOption: 'desc' | 'asc'
}

// ページコンポーネントのProps型
export interface HomePageProps {
  searchParams: Promise<{
    q?: string
    sort?: string
    order?: string
    page?: string
  }>
}

export interface RepositoryPageProps {
  params: Promise<{
    owner: string
    name: string
  }>
}

// コンポーネントの汎用Props型
export interface BaseComponentProps {
  children?: React.ReactNode
  className?: string
}

// 検索フォームのProps型
export interface SearchFormProps extends BaseComponentProps {
  initialQuery?: string
  onSearch: (query: string, options?: {
    sort?: 'stars' | 'forks' | 'updated'
    order?: 'desc' | 'asc'
  }) => void
  loading?: boolean
}

// リポジトリカードのProps型
export interface RepositoryCardProps extends BaseComponentProps {
  repository: import('./github').GitHubRepository
  onSelect?: (repository: import('./github').GitHubRepository) => void
}

// 無限スクロールコンテナのProps型
export interface InfiniteScrollProps extends BaseComponentProps {
  items: import('./github').GitHubRepository[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  renderItem: (item: import('./github').GitHubRepository, index: number) => React.ReactNode
}

// API レスポンスの共通型
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
  message?: string
}

// ページネーション情報の型
export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNext: boolean
  hasPrevious: boolean
}

// SWR設定用の型
export interface SWRConfig {
  revalidateOnFocus: boolean
  revalidateOnReconnect: boolean
  refreshInterval: number
  errorRetryCount: number
  errorRetryInterval: number
}

// テスト用のモック型
export interface MockRepository extends Partial<import('./github').GitHubRepository> {
  id: number
  name: string
  full_name: string
  owner: import('./github').GitHubUser
}

export interface MockUser extends Partial<import('./github').GitHubUser> {
  login: string
  id: number
  avatar_url: string
}