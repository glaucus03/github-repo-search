// エラーハンドリングユーティリティ
export type ErrorType =
  | "NETWORK_ERROR"
  | "API_ERROR"
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "RATE_LIMIT_ERROR"
  | "NOT_FOUND_ERROR"
  | "UNKNOWN_ERROR";

// エラータイプの判定
export function getErrorType(error: unknown): ErrorType {
  if (!error) return "UNKNOWN_ERROR";

  const errorObj = error as Record<string, unknown>;

  // ネットワークエラー
  if (errorObj.code === "NETWORK_ERROR" || !navigator.onLine) {
    return "NETWORK_ERROR";
  }

  // HTTPステータスコードベースの判定
  const response = errorObj.response as Record<string, unknown> | undefined;
  if (response?.status) {
    const status = response.status;
    switch (status) {
      case 401:
      case 403:
        return "AUTH_ERROR";
      case 404:
        return "NOT_FOUND_ERROR";
      case 422:
        return "VALIDATION_ERROR";
      case 429:
        return "RATE_LIMIT_ERROR";
      case 500:
      case 502:
      case 503:
      case 504:
        return "API_ERROR";
      default:
        return "API_ERROR";
    }
  }

  // エラーメッセージベースの判定
  const message =
    (typeof errorObj.message === "string"
      ? errorObj.message.toLowerCase()
      : "") || "";
  if (message.includes("network") || message.includes("fetch")) {
    return "NETWORK_ERROR";
  }
  if (message.includes("validation") || message.includes("invalid")) {
    return "VALIDATION_ERROR";
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "RATE_LIMIT_ERROR";
  }

  return "UNKNOWN_ERROR";
}

// エラーメッセージの生成
export function getErrorMessage(error: unknown): string {
  if (!error) return "不明なエラーが発生しました";

  const errorObj = error as Record<string, unknown>;
  const errorType = getErrorType(error);

  switch (errorType) {
    case "NETWORK_ERROR":
      return "ネットワーク接続に問題があります。インターネット接続を確認してください。";

    case "API_ERROR":
      const response = errorObj.response as Record<string, unknown> | undefined;
      if (response?.status === 500) {
        return "サーバーで問題が発生しています。しばらく時間をおいて再度お試しください。";
      }
      return "サーバーとの通信中にエラーが発生しました。";

    case "AUTH_ERROR":
      return "GitHub APIの認証に失敗しました。APIトークンを確認してください。";

    case "RATE_LIMIT_ERROR":
      const headers = (errorObj.response as Record<string, unknown> | undefined)
        ?.headers as Record<string, unknown> | undefined;
      const resetTime = headers?.["x-ratelimit-reset"];
      if (resetTime && typeof resetTime === "string") {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        const minutes = Math.ceil((resetDate.getTime() - Date.now()) / 60000);
        return `API利用制限に達しました。${minutes}分後に再度お試しください。`;
      }
      return "API利用制限に達しました。しばらく時間をおいて再度お試しください。";

    case "NOT_FOUND_ERROR":
      return "指定されたリソースが見つかりませんでした。";

    case "VALIDATION_ERROR":
      return (
        (typeof errorObj.message === "string" ? errorObj.message : null) ||
        "入力内容に問題があります。"
      );

    case "UNKNOWN_ERROR":
    default:
      return (
        (typeof errorObj.message === "string" ? errorObj.message : null) ||
        "予期しないエラーが発生しました。"
      );
  }
}

// カスタムエラークラス
export class AppError extends Error {
  type: ErrorType;
  statusCode?: number;
  details?: unknown;
  timestamp: Date;
  code?: string;

  constructor(
    message: string,
    type: ErrorType = "UNKNOWN_ERROR",
    statusCode?: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.code = type;
  }
}

// アプリエラーの作成
export function createAppError(
  message: string,
  type: ErrorType = "UNKNOWN_ERROR",
  statusCode?: number,
  details?: unknown,
): AppError {
  return new AppError(message, type, statusCode, details);
}

// エラーの再試行可能性判定
export function isRetryableError(error: unknown): boolean {
  const errorType = getErrorType(error);
  const retryableTypes: ErrorType[] = ["NETWORK_ERROR", "API_ERROR"];

  if (!retryableTypes.includes(errorType)) {
    return false;
  }

  // 特定のHTTPステータスコードは再試行不可
  const errorObj = error as Record<string, unknown>;
  const response = errorObj.response as Record<string, unknown> | undefined;
  if (response?.status && typeof response.status === "number") {
    const nonRetryableStatus = [400, 401, 403, 404, 422];
    return !nonRetryableStatus.includes(response.status);
  }

  return true;
}

// 指数バックオフでの再試行
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      // 指数バックオフ
      const delay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 0.1 * delay; // 10%のジッター

      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
    }
  }

  throw lastError;
}

// GitHub API固有のエラーハンドリング
export function handleGitHubAPIError(error: unknown): AppError {
  const errorObj = error as Record<string, unknown>;
  const response = errorObj.response as Record<string, unknown> | undefined;
  const data = response?.data as Record<string, unknown> | undefined;

  if (data?.message && typeof data.message === "string") {
    const apiMessage = data.message;

    // GitHub API固有のエラーメッセージを日本語に変換
    if (apiMessage.includes("rate limit exceeded")) {
      return createAppError(
        "GitHub API利用制限に達しました",
        "RATE_LIMIT_ERROR",
        response?.status as number,
        data,
      );
    }

    if (apiMessage.includes("Not Found")) {
      return createAppError(
        "リポジトリまたはユーザーが見つかりませんでした",
        "NOT_FOUND_ERROR",
        404,
        data,
      );
    }

    if (apiMessage.includes("Bad credentials")) {
      return createAppError(
        "GitHub APIトークンが無効です",
        "AUTH_ERROR",
        401,
        data,
      );
    }

    if (apiMessage.includes("Validation Failed")) {
      return createAppError(
        "検索クエリが無効です",
        "VALIDATION_ERROR",
        422,
        data,
      );
    }
  }

  // デフォルトのエラー処理
  const errorType = getErrorType(error);
  const message = getErrorMessage(error);

  return createAppError(message, errorType, response?.status as number, data);
}

// エラーログ出力
export function logError(error: unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : "";

  const errorObj = error as Record<string, unknown>;
  const response = errorObj.response as Record<string, unknown> | undefined;
  const config = errorObj.config as Record<string, unknown> | undefined;

  console.error(`${contextStr}Error at ${timestamp}:`, {
    message: errorObj.message,
    type: getErrorType(error),
    stack: errorObj.stack,
    statusCode: response?.status,
    url: config?.url,
    method: config?.method,
  });

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
  context?: string,
): Promise<T> {
  return promise.catch((error) => {
    logError(error, context);
    throw error;
  });
}
