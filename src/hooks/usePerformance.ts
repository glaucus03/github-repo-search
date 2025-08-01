// パフォーマンス監視・最適化フック
import { useEffect, useRef, useState, useCallback } from 'react'

// パフォーマンス指標の型定義
interface PerformanceMetrics {
  renderTime: number
  mountTime: number
  updateCount: number
  lastUpdate: Date
}

// コンポーネントのパフォーマンスを監視
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const mountTime = useRef<number>(0)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    mountTime: 0,
    updateCount: 0,
    lastUpdate: new Date(),
  })

  useEffect(() => {
    // マウント時間を記録
    mountTime.current = performance.now()
    
    return () => {
      // アンマウント時のクリーンアップ
      const unmountTime = performance.now()
      const totalLifetime = unmountTime - mountTime.current
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} Performance:`, {
          lifetime: `${totalLifetime.toFixed(2)}ms`,
          renders: renderCount.current,
          avgRenderTime: `${(totalLifetime / renderCount.current).toFixed(2)}ms`,
        })
      }
    }
  }, [componentName])

  useEffect(() => {
    // レンダー毎にカウントを更新
    const renderStart = performance.now()
    renderCount.current += 1

    // 非同期でレンダー時間を計測
    const timeoutId = setTimeout(() => {
      const renderTime = performance.now() - renderStart
      setMetrics(_prev => ({
        renderTime,
        mountTime: mountTime.current,
        updateCount: renderCount.current,
        lastUpdate: new Date(),
      }))
    }, 0)

    return () => clearTimeout(timeoutId)
  })

  return metrics
}

// 重い計算の結果をメモ化
export function useExpensiveCalculation<T>(
  calculation: () => T,
  dependencies: any[]
): T {
  const lastDeps = useRef<any[]>([])
  const lastResult = useRef<T | undefined>(undefined)
  const isFirstRun = useRef<boolean>(true)

  // 依存関係が変更されたかチェック
  const depsChanged = isFirstRun.current || 
    dependencies.length !== lastDeps.current.length ||
    dependencies.some((dep, index) => !Object.is(dep, lastDeps.current[index]))

  if (depsChanged) {
    const start = performance.now()
    lastResult.current = calculation()
    const end = performance.now()
    
    if (process.env.NODE_ENV === 'development' && (end - start) > 10) {
      console.warn(`Expensive calculation took ${(end - start).toFixed(2)}ms`)
    }
    
    lastDeps.current = dependencies
    isFirstRun.current = false
  }

  return lastResult.current!
}

// デバウンス機能付きコールバック
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef<T>(callback)
  
  // callbackを常に最新の状態に保つ
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  return useCallback(
    ((...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )
}

// スロットリング機能付きコールバック
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const callbackRef = useRef<T>(callback)
  
  // callbackを常に最新の状態に保つ
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])
  
  return useCallback(
    ((...args: any[]) => {
      const now = Date.now()
      
      if (now - lastRun.current >= delay) {
        callbackRef.current(...args)
        lastRun.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args)
          lastRun.current = Date.now()
        }, delay - (now - lastRun.current))
      }
    }) as T,
    [delay]
  )
}

// Intersection Observer を使った仮想化
export function useIntersectionObserver(
  elementRef: React.RefObject<Element | null>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [intersectionRatio, setIntersectionRatio] = useState(0)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
        setIntersectionRatio(entry.intersectionRatio)
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        ...options,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return { isIntersecting, intersectionRatio }
}

// リストアイテムの仮想化
export function useVirtualization<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  )

  const startIndex = Math.max(0, visibleStart - overscan)
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan)

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index,
  }))

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
  }
}

// メモリ使用量の監視
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    // Performance API でメモリ情報を取得（Chrome のみ）
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        setMemoryInfo({
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // 5秒ごとに更新

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// 画像の遅延読み込み
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const { isIntersecting } = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px',
  })

  useEffect(() => {
    if (isIntersecting && src && !isLoaded) {
      const img = new Image()
      
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
        setHasError(false)
      }
      
      img.onerror = () => {
        setHasError(true)
      }
      
      img.src = src
    }
  }, [isIntersecting, src, isLoaded])

  return {
    imgRef,
    src: imageSrc,
    isLoaded,
    hasError,
  }
}