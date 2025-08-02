import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  watchers_count: number
  language: string | null
  owner: {
    login: string
    avatar_url: string
  }
}

interface UseSearchRepositoryReturn {
  // State
  repositories: Repository[]
  loading: boolean
  error: string | null
  currentPage: number
  totalCount: number
  currentQuery: string
  searchResultsRef: React.RefObject<HTMLDivElement>
  
  // Actions
  performSearch: (query: string, page?: number) => Promise<void>
  handlePageChange: (page: number) => void
  handleRepositoryClick: (repository: Repository, event: React.MouseEvent) => void
  resetState: () => void
  
  // Computed
  totalPages: number
}

export function useSearchRepository(): UseSearchRepositoryReturn {
  const router = useRouter()
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [currentQuery, setCurrentQuery] = useState('')
  const searchResultsRef = useRef<HTMLDivElement>(null)
  
  const ITEMS_PER_PAGE = 30
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  const performSearch = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    if (page === 1) {
      setCurrentQuery(query)
    }
    
    try {
      const params = new URLSearchParams({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: ITEMS_PER_PAGE.toString(),
        page: page.toString()
      })
      
      const response = await fetch(`/api/repositories/search?${params}`)
      
      if (!response.ok) {
        throw new Error('検索に失敗しました')
      }
      
      const data = await response.json()
      setRepositories(data.items || [])
      setTotalCount(data.total_count || 0)
      setCurrentPage(page)
      
      // ページ変更時は検索結果の先頭にスクロール
      if (searchResultsRef.current) {
        setTimeout(() => {
          searchResultsRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          })
        }, 100)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました')
      setRepositories([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (currentQuery) {
      performSearch(currentQuery, page)
    }
  }, [currentQuery, performSearch])

  const handleRepositoryClick = useCallback((repository: Repository, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const url = `/repository/${repository.owner.login}/${repository.name}`
    router.push(url)
  }, [router])

  const resetState = useCallback(() => {
    setRepositories([])
    setLoading(false)
    setError(null)
    setCurrentPage(1)
    setTotalCount(0)
    setCurrentQuery('')
  }, [])

  return {
    // State
    repositories,
    loading,
    error,
    currentPage,
    totalCount,
    currentQuery,
    searchResultsRef,
    
    // Actions
    performSearch,
    handlePageChange,
    handleRepositoryClick,
    resetState,
    
    // Computed
    totalPages,
  }
}