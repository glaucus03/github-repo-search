import { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface UseSearchUIReturn {
  // State
  searchQuery: string
  
  // Actions
  setSearchQuery: (query: string) => void
  handleSearch: (onSearch: (query: string) => Promise<void>) => Promise<void>
  resetToInitialState: (onReset: () => void) => void
  
  // Effects
  initializeFromURL: (onSearch: (query: string) => Promise<void>) => void
}

export function useSearchUI(): UseSearchUIReturn {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = useCallback(async (onSearch: (query: string) => Promise<void>) => {
    if (!searchQuery.trim()) return
    await onSearch(searchQuery)
  }, [searchQuery])

  const resetToInitialState = useCallback((onReset: () => void) => {
    setSearchQuery('')
    onReset()
  }, [])

  const initializeFromURL = useCallback((onSearch: (query: string) => Promise<void>) => {
    const initialQuery = searchParams.get('q') || ''
    if (initialQuery) {
      setSearchQuery(initialQuery)
      onSearch(initialQuery)
    }
  }, [searchParams])

  // URLパラメータの変更を監視してリセット
  useEffect(() => {
    const shouldReset = searchParams.get('reset')
    
    if (shouldReset === 'true') {
      setSearchQuery('')
      // URLからresetパラメータを削除
      router.replace('/')
    }
  }, [searchParams, router])

  // カスタムイベントを監視してリセット
  useEffect(() => {
    const handleReset = () => {
      setSearchQuery('')
    }
    
    window.addEventListener('resetToInitialState', handleReset)
    
    return () => {
      window.removeEventListener('resetToInitialState', handleReset)
    }
  }, [])

  return {
    // State
    searchQuery,
    
    // Actions
    setSearchQuery,
    handleSearch,
    resetToInitialState,
    
    // Effects
    initializeFromURL,
  }
}