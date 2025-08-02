'use client'

import { Button, Spinner } from '@heroui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useLiveSearch } from '@/hooks'

interface SearchFormComponentProps {
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  onSearch: () => Promise<void>
  disabled?: boolean
}

export function SearchFormComponent({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  disabled = false
}: SearchFormComponentProps) {
  const {
    totalCount: liveCount,
    loading: liveLoading,
    error: liveError,
  } = useLiveSearch(searchQuery)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSearch()
    }
  }

  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="flex items-center gap-4">
        {/* 検索入力フィールド */}
        <div className="flex-1 relative">
          <div className="flex items-center border border-gray-600 rounded-full bg-gray-800 h-14 px-6 focus-within:border-blue-500">
            {liveLoading ? (
              <Spinner size="sm" className="mr-3" />
            ) : (
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
            )}
            <input
              type="text"
              placeholder="リポジトリを検索..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none text-base text-white placeholder-gray-400 disabled:opacity-50"
            />
          </div>
          
          {/* 検索中のスピナー表示 */}
          {searchQuery && liveLoading && (
            <div className="absolute top-full left-6 mt-2">
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <p className="text-sm text-gray-400">検索中...</p>
              </div>
            </div>
          )}
          
          {/* 検索結果数の表示 */}
          {searchQuery && !liveLoading && !liveError && liveCount > 0 && (
            <div className="absolute top-full left-6 mt-2">
              <p className="text-sm text-gray-400">
                「{searchQuery}」の検索結果は{liveCount.toLocaleString()}件です
              </p>
            </div>
          )}
        </div>
        
        {/* 検索ボタン */}
        <Button
          onClick={onSearch}
          disabled={!searchQuery.trim() || disabled}
          className="bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full h-14 px-8 font-medium text-base min-w-[120px]"
        >
          検索する
        </Button>
      </div>
    </div>
  )
}