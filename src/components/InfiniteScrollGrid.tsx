'use client'

// 無限スクロールグリッドコンポーネント
import { ExclamationTriangleIcon, ArrowUpIcon } from '@heroicons/react/24/outline'
import { Button, Spinner, Card, CardBody } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { cn } from '@/lib/utils'

interface InfiniteScrollGridProps<T> {
  items: T[]
  loading: boolean
  hasMore: boolean
  error?: string | null
  onLoadMore: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  gridClassName?: string
  emptyMessage?: string
  errorRetryAction?: () => void
  showScrollToTop?: boolean
}

export function InfiniteScrollGrid<T>({
  items,
  loading,
  hasMore,
  error,
  onLoadMore,
  renderItem,
  className,
  gridClassName,
  emptyMessage = '検索結果が見つかりませんでした',
  errorRetryAction,
  showScrollToTop = true,
}: InfiniteScrollGridProps<T>) {
  const scrollToTopRef = useRef<HTMLButtonElement>(null)

  const { triggerRef, scrollToTop, isIntersecting } = useInfiniteScroll({
    hasMore,
    loading,
    onLoadMore,
    threshold: 200,
  })

  // スクロール位置を監視してスクロールトップボタンの表示を制御
  const [showScrollButton, setShowScrollButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 500)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // エラー表示
  if (error && items.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <Card className="mx-auto max-w-md">
          <CardBody className="text-center py-12">
            <ExclamationTriangleIcon className="w-12 h-12 text-danger mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">エラーが発生しました</h3>
            <p className="text-default-500 mb-4">{error}</p>
            {errorRetryAction && (
              <Button
                onClick={errorRetryAction}
                color="primary"
                variant="flat"
              >
                再試行
              </Button>
            )}
          </CardBody>
        </Card>
      </div>
    )
  }

  // 空の状態
  if (!loading && items.length === 0) {
    return (
      <div className={cn('w-full', className)}>
        <Card className="mx-auto max-w-md">
          <CardBody className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-default-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">結果が見つかりません</h3>
            <p className="text-default-500">{emptyMessage}</p>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      {/* グリッド */}
      <div className={cn(
        'infinite-scroll-container',
        gridClassName
      )}>
        {items.map((item, index) => (
          <div key={index}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* ローディングスピナー */}
      {loading && (
        <div className="loading-spinner">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" color="primary" />
            <p className="text-default-500 text-sm">読み込み中...</p>
          </div>
        </div>
      )}

      {/* エラー表示（追加読み込み時） */}
      {error && items.length > 0 && (
        <div className="flex justify-center py-8">
          <Card className="max-w-md">
            <CardBody className="text-center py-6">
              <ExclamationTriangleIcon className="w-8 h-8 text-warning mx-auto mb-3" />
              <p className="text-default-500 mb-3">{error}</p>
              {errorRetryAction && (
                <Button
                  onClick={errorRetryAction}
                  color="primary"
                  variant="flat"
                  size="sm"
                >
                  再試行
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* 手動読み込みボタン */}
      {!loading && hasMore && !error && (
        <div className="flex justify-center py-8">
          <Button
            onClick={onLoadMore}
            color="primary"
            variant="flat"
            size="lg"
          >
            さらに読み込む
          </Button>
        </div>
      )}

      {/* 無限スクロールのトリガー */}
      <div
        ref={triggerRef}
        className="h-4 flex items-center justify-center"
        aria-hidden="true"
      >
        {/* 無限スクロールが有効でトリガーが見えている場合の視覚的フィードバック */}
        {isIntersecting && hasMore && !loading && (
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        )}
      </div>

      {/* 全件読み込み完了メッセージ */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8">
          <p className="text-default-500 text-sm">
            全ての結果を表示しました（{items.length}件）
          </p>
        </div>
      )}

      {/* スクロールトップボタン */}
      {showScrollToTop && showScrollButton && (
        <Button
          ref={scrollToTopRef}
          onClick={scrollToTop}
          isIconOnly
          color="primary"
          variant="shadow"
          className="fixed bottom-8 right-8 z-50 rounded-full"
          size="lg"
        >
          <ArrowUpIcon className="w-5 h-5" />
        </Button>
      )}
    </div>
  )
}

