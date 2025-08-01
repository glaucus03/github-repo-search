'use client'

// エラーバウンダリーコンポーネント
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Card, CardBody, Button } from '@heroui/react'
import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  errorInfo?: React.ErrorInfo
}

// デフォルトのエラーフォールバックコンポーネント
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Card className="max-w-2xl w-full">
        <CardBody className="text-center py-12">
          <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-danger mb-6" />
          <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
          <p className="text-default-600 mb-6">
            申し訳ございません。予期しないエラーが発生しました。
            <br />
            ページを再読み込みするか、しばらく時間をおいて再度お試しください。
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left mb-6 p-4 bg-default-100 rounded-lg">
              <summary className="cursor-pointer font-semibold text-danger mb-2">
                開発者向け詳細情報
              </summary>
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                <strong>エラー:</strong> {error.message}
                {error.stack && (
                  <>
                    <br />
                    <strong>スタックトレース:</strong>
                    <br />
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              color="primary"
              size="lg"
              onClick={resetError}
              startContent={<ArrowPathIcon className="w-4 h-4" />}
            >
              再試行
            </Button>
            <Button
              variant="flat"
              size="lg"
              onClick={() => window.location.reload()}
            >
              ページを再読み込み
            </Button>
            <Button
              variant="light"
              size="lg"
              onClick={() => window.location.href = '/'}
            >
              ホームに戻る
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // エラーが発生した際にstateを更新してフォールバックUIを表示
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラー詳細をstateに保存
    this.setState({
      error,
      errorInfo,
    })

    // エラー情報をログに記録
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // カスタムエラーハンドラーがあれば実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 本来はここでエラー監視サービス（Sentry等）にエラーを送信する
    // if (typeof window !== 'undefined') {
    //   // エラー報告の例
    //   console.log('Error reported to monitoring service')
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      )
    }

    return this.props.children
  }
}

// 特定の用途向けのエラーバウンダリー
export function APIErrorBoundary({ children }: { children: React.ReactNode }) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // API関連のエラーの場合は特別な処理
    if (error.message.includes('API') || error.message.includes('fetch')) {
      console.error('API Error:', error, errorInfo)
      // API エラーの統計情報を収集するなど
    }
  }

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}

// React Hook form for error handling
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    console.error('Error handled by useErrorHandler:', error)
    setError(error)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    resetError,
    hasError: !!error,
  }
}