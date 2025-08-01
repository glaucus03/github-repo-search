'use client'

// ローディングスピナーコンポーネント
import { Spinner, Card, CardBody } from '@heroui/react'

import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  variant?: 'default' | 'card' | 'fullscreen'
}

export function LoadingSpinner({ 
  message = '読み込み中...', 
  size = 'lg',
  className,
  variant = 'default'
}: LoadingSpinnerProps) {
  const spinnerContent = (
    <div className="flex flex-col items-center gap-3">
      <Spinner size={size} color="primary" />
      {message && (
        <p className={cn(
          'text-default-500',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          {message}
        </p>
      )}
    </div>
  )

  if (variant === 'fullscreen') {
    return (
      <div className={cn(
        'fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center',
        className
      )}>
        {spinnerContent}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn('mx-auto max-w-sm', className)}>
        <CardBody className="text-center py-12">
          {spinnerContent}
        </CardBody>
      </Card>
    )
  }

  return (
    <div className={cn('flex justify-center py-8', className)}>
      {spinnerContent}
    </div>
  )
}

// 検索結果用のスケルトンローダー
export function RepositoryCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="infinite-scroll-container">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="h-[200px]">
          <CardBody className="p-6">
            {/* ヘッダー */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 bg-default-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-default-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-default-200 rounded animate-pulse w-1/2" />
              </div>
            </div>

            {/* 説明文 */}
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-default-200 rounded animate-pulse w-full" />
              <div className="h-3 bg-default-200 rounded animate-pulse w-4/5" />
              <div className="h-3 bg-default-200 rounded animate-pulse w-3/5" />
            </div>

            {/* 統計情報 */}
            <div className="flex gap-4 mb-4">
              <div className="h-4 bg-default-200 rounded animate-pulse w-12" />
              <div className="h-4 bg-default-200 rounded animate-pulse w-12" />
              <div className="h-4 bg-default-200 rounded animate-pulse w-12" />
            </div>

            {/* タグ */}
            <div className="flex gap-2 mb-4">
              <div className="h-6 bg-default-200 rounded-full animate-pulse w-16" />
              <div className="h-6 bg-default-200 rounded-full animate-pulse w-20" />
              <div className="h-6 bg-default-200 rounded-full animate-pulse w-14" />
            </div>

            {/* 更新日時 */}
            <div className="h-3 bg-default-200 rounded animate-pulse w-32 mt-auto" />
          </CardBody>
        </Card>
      ))}
    </div>
  )
}

// 検索フォーム用のスケルトンローダー
export function SearchFormSkeleton() {
  return (
    <Card className="p-4 max-w-4xl mx-auto">
      <CardBody>
        <div className="flex gap-3 mb-4">
          <div className="flex-1 h-12 bg-default-200 rounded animate-pulse" />
          <div className="w-20 h-12 bg-default-200 rounded animate-pulse" />
          <div className="w-12 h-12 bg-default-200 rounded animate-pulse" />
        </div>
      </CardBody>
    </Card>
  )
}

// リポジトリ詳細用のスケルトンローダー
export function RepositoryDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <Card>
        <CardBody className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 bg-default-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-default-200 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-default-200 rounded animate-pulse w-1/3" />
            </div>
          </div>
          
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-default-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-default-200 rounded animate-pulse w-3/4" />
          </div>

          <div className="flex gap-6">
            <div className="h-8 bg-default-200 rounded animate-pulse w-20" />
            <div className="h-8 bg-default-200 rounded animate-pulse w-20" />
            <div className="h-8 bg-default-200 rounded animate-pulse w-20" />
          </div>
        </CardBody>
      </Card>

      {/* コンテンツエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardBody className="p-6">
              <div className="h-6 bg-default-200 rounded animate-pulse w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-4 bg-default-200 rounded animate-pulse w-full" />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          <Card>
            <CardBody className="p-6">
              <div className="h-5 bg-default-200 rounded animate-pulse w-24 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-default-200 rounded-full animate-pulse" />
                    <div className="h-4 bg-default-200 rounded animate-pulse flex-1" />
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-6">
              <div className="h-5 bg-default-200 rounded animate-pulse w-32 mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 bg-default-200 rounded animate-pulse" />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}