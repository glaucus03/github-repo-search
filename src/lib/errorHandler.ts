// エラーハンドリングユーティリティ
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'API_ERROR' 
  | 'VALIDATION_ERROR'
  | 'AUTH_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'UNKNOWN_ERROR'


// エラータイプの判定
export function getErrorType(error: any): ErrorType {
  if (!error) return 'UNKNOWN_ERROR'

  // ネットワークエラー
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return 'NETWORK_ERROR'
  }

  // HTTPステータスコードベースの判定
  if (error.response?.status) {
    const status = error.response.status
    switch (status) {
      case 401:
      case 403:
        return 'AUTH_ERROR'
      case 404:
        return 'NOT_FOUND_ERROR'
      case 422:
        return 'VALIDATION_ERROR'
      case 429:
        return 'RATE_LIMIT_ERROR'
      case 500:
      case 502:
      case 503:
      case 504:
        return 'API_ERROR'
      default:
        return 'API_ERROR'
    }
  }

  // エラーメッセージベースの判定
  const message = error.message?.toLowerCase() || ''
  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR'
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR'
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'RATE_LIMIT_ERROR'
  }

  return 'UNKNOWN_ERROR'
}

// エラーメッセージの生成
export function getErrorMessage(error: any): string {
  if (!error) return '不明なエラーが発生しました'

  const errorType = getErrorType(error)

  switch (errorType) {
    case 'NETWORK_ERROR':
      return 'ネットワーク接続に問題があります。インターネット接続を確認してください。'
    
    case 'API_ERROR':
      if (error.response?.status === 500) {
        return 'サーバーで問題が発生しています。しばらく時間をおいて再度お試しください。'
      }
      return 'サーバーとの通信中にエラーが発生しました。'
    
    case 'AUTH_ERROR':
      return 'GitHub APIの認証に失敗しました。APIトークンを確認してください。'
    
    case 'RATE_LIMIT_ERROR':
      const resetTime = error.response?.headers?.['x-ratelimit-reset']
      if (resetTime) {
        const resetDate = new Date(parseInt(resetTime) * 1000)
        const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000)
        return `API利用制限に達しました。${minutes}分後に再度お試しください。`
      }
      return 'API利用制限に達しました。しばらく時間をおいて再度お試しください。'
    
    case 'NOT_FOUND_ERROR':
      return '指定されたリソースが見つかりませんでした。'
    
    case 'VALIDATION_ERROR':
      return error.message || '入力内容に問題があります。'
    
    case 'UNKNOWN_ERROR':
    default:
      return error.message || '予期しないエラーが発生しました。'
  }
}

// カスタムエラークラス
export class AppError extends Error {
  type: ErrorType
  statusCode?: number
  details?: any
  timestamp: Date
  code?: string

  constructor(
    message: string,
    type: ErrorType = 'UNKNOWN_ERROR',
    statusCode?: number,
    details?: any
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()
    this.code = type
  }
}

// アプリエラーの作成
export function createAppError(
  message: string,
  type: ErrorType = 'UNKNOWN_ERROR',
  statusCode?: number,
  details?: any
): AppError {
  return new AppError(message, type, statusCode, details)
}

// エラーの再試行可能性判定
export function isRetryableError(error: any): boolean {
  const errorType = getErrorType(error)
  const retryableTypes: ErrorType[] = ['NETWORK_ERROR', 'API_ERROR']
  
  if (!retryableTypes.includes(errorType)) {
    return false
  }

  // 特定のHTTPステータスコードは再試行不可
  if (error.response?.status) {
    const nonRetryableStatus = [400, 401, 403, 404, 422]
    return !nonRetryableStatus.includes(error.response.status)
  }

  return true
}

// 指数バックオフでの再試行
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error
      }

      // 指数バックオフ
      const delay = baseDelay * Math.pow(2, attempt)
      const jitter = Math.random() * 0.1 * delay // 10%のジッター
      
      await new Promise(resolve => setTimeout(resolve, delay + jitter))
    }
  }

  throw lastError
}

// GitHub API固有のエラーハンドリング
export function handleGitHubAPIError(error: any): AppError {
  if (error.response?.data?.message) {
    const apiMessage = error.response.data.message
    
    // GitHub API固有のエラーメッセージを日本語に変換
    if (apiMessage.includes('rate limit exceeded')) {
      return createAppError(
        'GitHub API利用制限に達しました',
        'RATE_LIMIT_ERROR',
        error.response.status,
        error.response.data
      )
    }
    
    if (apiMessage.includes('Not Found')) {
      return createAppError(
        'リポジトリまたはユーザーが見つかりませんでした',
        'NOT_FOUND_ERROR',
        404,
        error.response.data
      )
    }

    if (apiMessage.includes('Bad credentials')) {
      return createAppError(
        'GitHub APIトークンが無効です',
        'AUTH_ERROR',
        401,
        error.response.data
      )
    }

    if (apiMessage.includes('Validation Failed')) {
      return createAppError(
        '検索クエリが無効です',
        'VALIDATION_ERROR',
        422,
        error.response.data
      )
    }
  }

  // デフォルトのエラー処理
  const errorType = getErrorType(error)
  const message = getErrorMessage(error)
  
  return createAppError(
    message,
    errorType,
    error.response?.status,
    error.response?.data
  )
}

// エラーログ出力
export function logError(error: any, context?: string) {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ''
  
  console.error(`${contextStr}Error at ${timestamp}:`, {
    message: error.message,
    type: getErrorType(error),
    stack: error.stack,
    statusCode: error.response?.status,
    url: error.config?.url,
    method: error.config?.method,
  })

  // 本来はここでエラー監視サービスに送信
  // if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  //   sendToErrorService({
  //     message: error.message,
  //     type: getErrorType(error),
  //     timestamp,
  //     context,
  //     userAgent: navigator.userAgent,
  //     url: window.location.href,
  //   })
  // }
}

// Promise のエラーをキャッチしてログ出力
export function catchAndLog<T>(
  promise: Promise<T>,
  context?: string
): Promise<T> {
  return promise.catch((error) => {
    logError(error, context)
    throw error
  })
}