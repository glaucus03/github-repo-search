'use client'

// リアルタイム検索結果数表示コンポーネント
import { Card } from '@heroui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface LiveSearchIndicatorProps {
  query: string
  totalCount: number
  loading: boolean
  error: string | null
  className?: string
}

export function LiveSearchIndicator({
  query,
  totalCount,
  loading,
  error,
  className,
}: LiveSearchIndicatorProps) {
  // クエリが空の場合は何も表示しない
  if (!query.trim()) {
    return (
      <div className={cn('w-full max-w-4xl mx-auto mt-4', className)}>
        <div className="text-center text-sm text-default-400">
          キーワードを入力すると検索結果数が表示されます
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full max-w-4xl mx-auto mt-4', className)}>
      <Card className="p-3 bg-default-50 border-default-200">
        <div className="flex items-center gap-3">
          <MagnifyingGlassIcon className="w-4 h-4 text-default-500 flex-shrink-0" />
          
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-default-600">検索中...</span>
              </div>
            ) : error ? (
              <span className="text-sm text-danger">{error}</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-default-600">
                  「<span className="font-medium text-default-800">{query}</span>」
                </span>
                <span className="text-sm text-default-500">の検索結果:</span>
                <span className="text-sm font-semibold text-primary">
                  {totalCount.toLocaleString()}件
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}