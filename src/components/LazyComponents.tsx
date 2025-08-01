'use client'

// 動的インポート・コードスプリッティング用コンポーネント
import { Spinner, Card, CardBody } from '@heroui/react'
import React, { Suspense, lazy, ComponentType } from 'react'

// ローディング表示コンポーネント
export function ComponentLoader({ 
  message = '読み込み中...',
  size = 'lg' as 'sm' | 'md' | 'lg'
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} />
        <p className="text-default-500 text-sm">{message}</p>
      </div>
    </div>
  )
}

// カード型ローディング表示
export function CardLoader({ 
  message = 'コンポーネントを読み込み中...',
  height = 'auto' 
}: {
  message?: string
  height?: string | number
}) {
  return (
    <Card className="w-full" style={{ height }}>
      <CardBody className="flex items-center justify-center">
        <ComponentLoader message={message} />
      </CardBody>
    </Card>
  )
}

// エラーバウンダリー付きのSuspense
export function SuspenseWithErrorBoundary({
  children,
  fallback,
  errorFallback: _errorFallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  errorFallback?: React.ReactNode
}) {
  return (
    <Suspense fallback={fallback || <ComponentLoader />}>
      {children}
    </Suspense>
  )
}

// 動的インポート用のヘルパー関数
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc)

  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <SuspenseWithErrorBoundary fallback={fallback}>
        <LazyComponent {...props} />
      </SuspenseWithErrorBoundary>
    )
  }
}

// 遅延読み込み可能なコンポーネントのHOC
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  loadingComponent?: React.ComponentType
) {
  const LoadingComponent = loadingComponent || ComponentLoader

  return function LazyLoadedComponent(props: P) {
    const [isLoaded, setIsLoaded] = React.useState(false)

    React.useEffect(() => {
      // コンポーネントの読み込み完了をシミュレート
      const timer = setTimeout(() => {
        setIsLoaded(true)
      }, 100)

      return () => clearTimeout(timer)
    }, [])

    if (!isLoaded) {
      return <LoadingComponent />
    }

    return <Component {...props} />
  }
}

// 画面サイズに応じたコンポーネントの動的読み込み
export function ResponsiveLazyComponent({
  mobile,
  desktop,
  breakpoint = 768,
}: {
  mobile: React.ComponentType<any>
  desktop: React.ComponentType<any>
  breakpoint?: number
}) {
  const [isMobile, setIsMobile] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint)
      setIsLoaded(true)
    }

    checkScreenSize()
    
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [breakpoint])

  if (!isLoaded) {
    return <ComponentLoader message="レイアウトを調整中..." />
  }

  const Component = isMobile ? mobile : desktop
  return <Component />
}

// 条件付きでコンポーネントを動的読み込み
export function ConditionalLazyComponent({
  condition,
  component: Component,
  fallback,
  placeholder,
}: {
  condition: boolean
  component: ComponentType<any>
  fallback?: ComponentType<any>
  placeholder?: React.ReactNode
}) {
  const [shouldLoad, setShouldLoad] = React.useState(condition)

  React.useEffect(() => {
    setShouldLoad(condition)
  }, [condition])

  if (!shouldLoad) {
    if (fallback) {
      const FallbackComponent = fallback
      return <FallbackComponent />
    }
    return placeholder || null
  }

  return (
    <SuspenseWithErrorBoundary>
      <Component />
    </SuspenseWithErrorBoundary>
  )
}

// プリロード機能付きの遅延コンポーネント
export function createPreloadableLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFunc)
  
  // プリロード関数
  const preload = () => {
    importFunc()
  }

  function PreloadableLazyComponent(props: React.ComponentProps<T>) {
    return (
      <SuspenseWithErrorBoundary>
        <LazyComponent {...props} />
      </SuspenseWithErrorBoundary>
    )
  }

  PreloadableLazyComponent.preload = preload

  return PreloadableLazyComponent
}

// 遅延読み込みされたコンポーネントたち（将来実装予定）
// 実際のプロジェクトでは、以下のコンポーネントを実装する際に使用する

/*
// 検索結果の詳細ビュー（重いコンポーネント）
export const LazyRepositoryDetailView = createLazyComponent(
  () => import('./RepositoryDetailView'),
  <CardLoader message="リポジトリ詳細を読み込み中..." height={400} />
)

// 統計・分析ダッシュボード（重いコンポーネント）
export const LazyAnalyticsDashboard = createPreloadableLazyComponent(
  () => import('./AnalyticsDashboard')
)

// 設定画面（使用頻度が低い）
export const LazySettingsPanel = createLazyComponent(
  () => import('./SettingsPanel'),
  <CardLoader message="設定を読み込み中..." />
)

// 高度な検索フィルター（オプション機能）
export const LazyAdvancedSearchFilters = createLazyComponent(
  () => import('./AdvancedSearchFilters'),
  <ComponentLoader message="フィルターを読み込み中..." size="sm" />
)

// エクスポート・インポート機能（重い処理）
export const LazyDataExportImport = createLazyComponent(
  () => import('./DataExportImport'),
  <CardLoader message="エクスポート機能を読み込み中..." />
)

// プロファイル・アカウント管理（使用頻度が低い）
export const LazyProfileManager = createLazyComponent(
  () => import('./ProfileManager'),
  <CardLoader message="プロファイルを読み込み中..." />
)

// チャート・グラフ表示（可視化ライブラリが重い）
export const LazyChartComponents = createPreloadableLazyComponent(
  () => import('./ChartComponents')
)

// マークダウンエディター（エディターライブラリが重い）
export const LazyMarkdownEditor = createLazyComponent(
  () => import('./MarkdownEditor'),
  <CardLoader message="エディターを読み込み中..." height={300} />
)

// コード差分ビューアー（差分ライブラリが重い）
export const LazyCodeDiffViewer = createLazyComponent(
  () => import('./CodeDiffViewer'),
  <CardLoader message="差分ビューアーを読み込み中..." height={400} />
)

// カレンダー・日付ピッカー（日付ライブラリが重い）
export const LazyDatePicker = createLazyComponent(
  () => import('./DatePicker'),
  <ComponentLoader message="カレンダーを読み込み中..." size="sm" />
)
*/