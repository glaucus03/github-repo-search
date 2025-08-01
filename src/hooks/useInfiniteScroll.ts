// 無限スクロール用のカスタムHook
import { useEffect, useRef, useCallback, useState } from 'react'

interface UseInfiniteScrollOptions {
  threshold?: number // どれくらい手前で読み込みを開始するか（px）
  rootMargin?: string // Intersection Observer のrootMargin
  enabled?: boolean // 無限スクロールを有効にするか
  hasMore?: boolean // さらに読み込むデータがあるか
  loading?: boolean // 現在読み込み中か
  onLoadMore?: () => void | Promise<void> // 追加データを読み込む関数
}

export function useInfiniteScroll(options: UseInfiniteScrollOptions = {}) {
  const {
    threshold = 200,
    rootMargin = '0px',
    enabled = true,
    hasMore = true,
    loading = false,
    onLoadMore,
  } = options

  const [isIntersecting, setIsIntersecting] = useState(false)
  const triggerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isLoadingRef = useRef(loading)
  const hasMoreRef = useRef(hasMore)

  // Ref値を最新に保つ
  useEffect(() => {
    isLoadingRef.current = loading
  }, [loading])

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  // データを読み込む関数
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingRef.current || !hasMoreRef.current || !onLoadMore) {
      return
    }

    try {
      await onLoadMore()
    } catch (error) {
      console.error('無限スクロール読み込みエラー:', error)
    }
  }, [enabled, onLoadMore])

  // Intersection Observer の設定
  useEffect(() => {
    if (!enabled || !triggerRef.current) return

    const trigger = triggerRef.current

    // 既存のObserverを削除
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 新しいObserverを作成
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        setIsIntersecting(entry.isIntersecting)

        // 要素が見えた時に読み込みを実行
        if (entry.isIntersecting && hasMoreRef.current && !isLoadingRef.current) {
          loadMore()
        }
      },
      {
        rootMargin,
        threshold: 0.1,
      }
    )

    observerRef.current.observe(trigger)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enabled, rootMargin, loadMore])

  // スクロール位置ベースの読み込み判定（Intersection Observerのフォールバック）
  const handleScroll = useCallback(() => {
    if (!enabled || loading || !hasMore) return

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // 底から指定したthreshold分手前に来たら読み込み
    if (scrollTop + windowHeight >= documentHeight - threshold) {
      loadMore()
    }
  }, [enabled, loading, hasMore, threshold, loadMore])

  // スクロールイベントの登録（Intersection Observerが使えない場合のフォールバック）
  useEffect(() => {
    if (!enabled) return

    // パフォーマンスのためにスロットリング
    let timeoutId: NodeJS.Timeout
    const throttledHandleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [enabled, handleScroll])

  // 手動でのデータ読み込み
  const trigger = useCallback(() => {
    if (enabled && hasMore && !loading) {
      loadMore()
    }
  }, [enabled, hasMore, loading, loadMore])

  // スクロール位置をリセット
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // 特定の要素までスクロール
  const scrollToElement = useCallback((selector: string) => {
    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return {
    // トリガー要素用のref
    triggerRef,
    
    // 状態
    isIntersecting,
    
    // アクション
    trigger,
    scrollToTop,
    scrollToElement,
  }
}

// リスト項目のキー生成ヘルパー
export function generateItemKey(item: unknown, index: number, idField = 'id'): string {
  if (item && typeof item === 'object' && item !== null && idField in item) {
    return `${(item as Record<string, unknown>)[idField]}`
  }
  return `item-${index}`
}

// 仮想化対応の無限スクロール（大量データ向け）
export function useVirtualizedInfiniteScroll(options: UseInfiniteScrollOptions & {
  itemHeight?: number // 各アイテムの高さ（固定の場合）
  containerHeight?: number // コンテナの高さ
  overscan?: number // 画面外にレンダリングする要素数
}) {
  const {
    itemHeight = 200,
    containerHeight = 600,
    overscan = 5,
    ...infiniteScrollOptions
  } = options

  const infiniteScroll = useInfiniteScroll(infiniteScrollOptions)
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // スクロール位置の追跡
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // 表示範囲の計算
  const getVisibleRange = useCallback((itemCount: number) => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, overscan])

  return {
    ...infiniteScroll,
    containerRef,
    handleScroll,
    getVisibleRange,
    scrollTop,
  }
}