'use client'

// 仮想化対応のグリッドコンポーネント
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Card, CardBody, Button, Spinner } from '@heroui/react'
import React, { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react'

import { useVirtualization, useIntersectionObserver, usePerformanceMonitor } from '@/hooks/usePerformance'
import type { GitHubRepository } from '@/types/github'

// import { RepositoryCardSkeleton } from './LoadingSpinner'
import { OptimizedRepositoryCard } from './OptimizedRepositoryCard'

interface VirtualizedGridProps<T> {
  items: T[]
  loading: boolean
  hasMore: boolean
  error: string | null
  onLoadMore: () => void
  renderItem: (item: T, index: number) => React.ReactNode
  errorRetryAction?: () => void
  emptyMessage?: string
  itemHeight?: number
  gridColumns?: number
  className?: string
}

// 仮想化対応のアイテムコンテナ
const VirtualizedItem = memo(({ 
  children, 
  height, 
  index 
}: { 
  children: React.ReactNode
  height: number
  index: number 
}) => {
  return (
    <div 
      className="virtualised-item"
      style={{
        height: `${height}px`,
        transform: `translateY(${index * height}px)`,
      }}
    >
      {children}
    </div>
  )
})

VirtualizedItem.displayName = 'VirtualizedItem'

// エラー表示コンポーネント
const ErrorDisplay = memo(({ 
  error, 
  onRetry 
}: { 
  error: string
  onRetry?: () => void 
}) => (
  <Card className="max-w-2xl mx-auto">
    <CardBody className="text-center py-12">
      <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-danger mb-4" />
      <h3 className="text-xl font-semibold mb-2">エラーが発生しました</h3>
      <p className="text-default-500 mb-6">{error}</p>
      {onRetry && (
        <Button
          color="primary"
          onClick={onRetry}
          startContent={<ArrowPathIcon className="w-4 h-4" />}
        >
          再試行
        </Button>
      )}
    </CardBody>
  </Card>
))

ErrorDisplay.displayName = 'ErrorDisplay'

// 空状態表示コンポーネント
const EmptyState = memo(({ message }: { message: string }) => (
  <Card className="max-w-2xl mx-auto">
    <CardBody className="text-center py-12">
      <div className="text-6xl mb-4">🔍</div>
      <h3 className="text-xl font-semibold mb-2">結果が見つかりません</h3>
      <p className="text-default-500">{message}</p>
    </CardBody>
  </Card>
))

EmptyState.displayName = 'EmptyState'

// メインの仮想化グリッドコンポーネント
function VirtualizedGridComponent<T>({
  items,
  loading,
  hasMore,
  error,
  onLoadMore,
  renderItem,
  errorRetryAction,
  emptyMessage = '項目がありません',
  itemHeight = 250,
  gridColumns = 3,
  className,
}: VirtualizedGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(800)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // パフォーマンス監視
  const metrics = usePerformanceMonitor('VirtualizedGrid')

  // コンテナサイズの監視
  useEffect(() => {
    const updateContainerHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setContainerHeight(rect.height || 800)
      }
    }

    updateContainerHeight()
    window.addEventListener('resize', updateContainerHeight)
    return () => window.removeEventListener('resize', updateContainerHeight)
  }, [])

  // 仮想化の設定
  const { 
    visibleItems, 
    totalHeight, 
    offsetY, 
    onScroll 
  } = useVirtualization({
    items,
    itemHeight: Math.ceil(itemHeight / gridColumns), // グリッド行の高さ
    containerHeight,
    overscan: 2,
  })

  // 無限スクロール用のセンチネル要素
  const sentinelRef = useRef<HTMLDivElement>(null)
  const { isIntersecting } = useIntersectionObserver(sentinelRef as React.RefObject<Element | null>, {
    threshold: 0.1,
    rootMargin: '100px',
  })

  // 無限スクロールのトリガー
  useEffect(() => {
    if (isIntersecting && hasMore && !loading && !isLoadingMore) {
      setIsLoadingMore(true)
      onLoadMore()
      
      // ローディング状態をリセット
      const timeout = setTimeout(() => {
        setIsLoadingMore(false)
      }, 1000)
      
      return () => clearTimeout(timeout)
    }
  }, [isIntersecting, hasMore, loading, isLoadingMore, onLoadMore])

  // グリッドアイテムをグループ化
  useMemo(() => {
    const rows: T[][] = []
    for (let i = 0; i < items.length; i += gridColumns) {
      rows.push(items.slice(i, i + gridColumns))
    }
    return rows
  }, [items, gridColumns])

  // 可視行のレンダリング
  const renderVisibleRows = useCallback(() => {
    return visibleItems.map(({ item: rowItems, index }) => (
      <VirtualizedItem 
        key={index} 
        height={itemHeight} 
        index={index}
      >
        <div className={`grid grid-cols-${gridColumns} gap-6 mb-6`}>
          {(rowItems as T[]).map((item, colIndex) => (
            <div key={`${index}-${colIndex}`}>
              {renderItem(item, index * gridColumns + colIndex)}
            </div>
          ))}
        </div>
      </VirtualizedItem>
    ))
  }, [visibleItems, itemHeight, gridColumns, renderItem])

  // エラー状態
  if (error && items.length === 0) {
    return <ErrorDisplay error={error} onRetry={errorRetryAction} />
  }

  // 空状態
  if (!loading && items.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <div className={className}>
      {/* 仮想化コンテナ */}
      <div
        ref={containerRef}
        className="virtual-scroll-container overflow-auto"
        onScroll={onScroll}
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {renderVisibleRows()}
          </div>
        </div>

        {/* 無限スクロールセンチネル */}
        <div 
          ref={sentinelRef} 
          className="flex justify-center py-8"
        >
          {loading || isLoadingMore ? (
            <div className="flex items-center gap-3">
              <Spinner size="sm" />
              <span className="text-default-500 text-sm">読み込み中...</span>
            </div>
          ) : hasMore ? (
            <Button
              variant="flat"
              onClick={onLoadMore}
              className="text-default-600"
            >
              さらに読み込む
            </Button>
          ) : items.length > 0 ? (
            <p className="text-default-400 text-sm">すべての結果を表示しました</p>
          ) : null}
        </div>
      </div>

      {/* 開発環境でのパフォーマンス情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity">
          <div>Renders: {metrics.updateCount}</div>
          <div>Visible Items: {visibleItems.length}</div>
          <div>Total Items: {items.length}</div>
        </div>
      )}
    </div>
  )
}

// Repository専用の仮想化グリッド
export const VirtualizedRepositoryGrid = memo(({
  repositories,
  loading,
  hasMore,
  error,
  onLoadMore,
  onRepositorySelect,
  errorRetryAction,
  emptyMessage,
  variant = 'default',
}: {
  repositories: GitHubRepository[]
  loading: boolean
  hasMore: boolean
  error: string | null
  onLoadMore: () => void
  onRepositorySelect: (repository: GitHubRepository) => void
  errorRetryAction?: () => void
  emptyMessage?: string
  variant?: 'default' | 'compact'
}) => {
  const renderRepository = useCallback(
    (repository: GitHubRepository, _index: number) => (
      <OptimizedRepositoryCard
        repository={repository}
        onSelect={onRepositorySelect}
        variant={variant}
        isVisible={true}
      />
    ),
    [onRepositorySelect, variant]
  )

  return (
    <VirtualizedGridComponent
      items={repositories}
      loading={loading}
      hasMore={hasMore}
      error={error}
      onLoadMore={onLoadMore}
      renderItem={renderRepository}
      errorRetryAction={errorRetryAction}
      emptyMessage={emptyMessage}
      itemHeight={variant === 'compact' ? 180 : 250}
      gridColumns={3}
    />
  )
})

VirtualizedRepositoryGrid.displayName = 'VirtualizedRepositoryGrid'

// 汎用の仮想化グリッド
export const VirtualizedGrid = memo(VirtualizedGridComponent) as typeof VirtualizedGridComponent