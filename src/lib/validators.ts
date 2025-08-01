// バリデーション関数
import { REGEX_PATTERNS, SEARCH } from './constants'

/**
 * 検索クエリのバリデーション
 */
export function validateSearchQuery(query: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!query || typeof query !== 'string') {
    errors.push('検索クエリを入力してください')
    return { isValid: false, errors }
  }

  const trimmedQuery = query.trim()

  if (trimmedQuery.length < SEARCH.MIN_QUERY_LENGTH) {
    errors.push(`検索クエリは${SEARCH.MIN_QUERY_LENGTH}文字以上で入力してください`)
  }

  if (trimmedQuery.length > SEARCH.MAX_QUERY_LENGTH) {
    errors.push(`検索クエリは${SEARCH.MAX_QUERY_LENGTH}文字以下で入力してください`)
  }

  // 危険な文字のチェック
  if (trimmedQuery.includes('<script>') || trimmedQuery.includes('</script>')) {
    errors.push('無効な文字が含まれています')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * GitHubリポジトリURLのバリデーション
 */
export function validateGitHubRepositoryUrl(url: string): {
  isValid: boolean
  owner?: string
  repo?: string
  error?: string
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URLを入力してください' }
  }

  const match = url.match(REGEX_PATTERNS.GITHUB_REPO_URL)
  
  if (!match) {
    return { isValid: false, error: '有効なGitHubリポジトリURLを入力してください' }
  }

  const [, owner, repo] = match

  return {
    isValid: true,
    owner,
    repo
  }
}

/**
 * GitHubユーザーURLのバリデーション
 */
export function validateGitHubUserUrl(url: string): {
  isValid: boolean
  username?: string
  error?: string
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URLを入力してください' }
  }

  const match = url.match(REGEX_PATTERNS.GITHUB_USER_URL)
  
  if (!match) {
    return { isValid: false, error: '有効なGitHubユーザーURLを入力してください' }
  }

  const [, username] = match

  return {
    isValid: true,
    username
  }
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): {
  isValid: boolean
  error?: string
} {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'メールアドレスを入力してください' }
  }

  const trimmedEmail = email.trim()

  if (!REGEX_PATTERNS.EMAIL.test(trimmedEmail)) {
    return { isValid: false, error: '有効なメールアドレスを入力してください' }
  }

  return { isValid: true }
}

/**
 * URLのバリデーション
 */
export function validateUrl(url: string): {
  isValid: boolean
  error?: string
} {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URLを入力してください' }
  }

  const trimmedUrl = url.trim()

  if (!REGEX_PATTERNS.URL.test(trimmedUrl)) {
    return { isValid: false, error: '有効なURLを入力してください' }
  }

  try {
    new URL(trimmedUrl)
    return { isValid: true }
  } catch {
    return { isValid: false, error: '有効なURLを入力してください' }
  }
}

/**
 * ページ番号のバリデーション
 */
export function validatePageNumber(page: number | string): {
  isValid: boolean
  value?: number
  error?: string
} {
  let pageNum: number

  if (typeof page === 'string') {
    pageNum = parseInt(page, 10)
    if (isNaN(pageNum)) {
      return { isValid: false, error: '有効なページ番号を入力してください' }
    }
  } else {
    pageNum = page
  }

  if (pageNum < 1) {
    return { isValid: false, error: 'ページ番号は1以上である必要があります' }
  }

  if (pageNum > 34) { // GitHub APIの制限（1000件 ÷ 30件/ページ ≈ 34ページ）
    return { isValid: false, error: 'ページ番号が大きすぎます' }
  }

  return {
    isValid: true,
    value: pageNum
  }
}

/**
 * ソートオプションのバリデーション
 */
export function validateSortOption(sort: string): {
  isValid: boolean
  error?: string
} {
  const validSortOptions = ['stars', 'forks', 'help-wanted-issues', 'updated']
  
  if (!validSortOptions.includes(sort)) {
    return { isValid: false, error: '無効なソートオプションです' }
  }

  return { isValid: true }
}

/**
 * 順序オプションのバリデーション
 */
export function validateOrderOption(order: string): {
  isValid: boolean
  error?: string
} {
  const validOrderOptions = ['asc', 'desc']
  
  if (!validOrderOptions.includes(order)) {
    return { isValid: false, error: '無効な順序オプションです' }
  }

  return { isValid: true }
}

/**
 * ページサイズのバリデーション
 */
export function validatePerPage(perPage: number | string): {
  isValid: boolean
  value?: number
  error?: string
} {
  let perPageNum: number

  if (typeof perPage === 'string') {
    perPageNum = parseInt(perPage, 10)
    if (isNaN(perPageNum)) {
      return { isValid: false, error: '有効なページサイズを入力してください' }
    }
  } else {
    perPageNum = perPage
  }

  if (perPageNum < 1) {
    return { isValid: false, error: 'ページサイズは1以上である必要があります' }
  }

  if (perPageNum > 100) { // GitHub APIの制限
    return { isValid: false, error: 'ページサイズは100以下である必要があります' }
  }

  return {
    isValid: true,
    value: perPageNum
  }
}

/**
 * ファイル名のバリデーション
 */
export function validateFileName(fileName: string): {
  isValid: boolean
  error?: string
} {
  if (!fileName || typeof fileName !== 'string') {
    return { isValid: false, error: 'ファイル名を入力してください' }
  }

  const trimmedName = fileName.trim()

  // 危険な文字のチェック
  const dangerousChars = /[<>:"/\\|?*]/
  if (dangerousChars.test(trimmedName)) {
    return { isValid: false, error: 'ファイル名に使用できない文字が含まれています' }
  }

  // 長さのチェック
  if (trimmedName.length > 255) {
    return { isValid: false, error: 'ファイル名は255文字以下である必要があります' }
  }

  // 予約語のチェック（Windows）
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
  if (reservedNames.includes(trimmedName.toUpperCase())) {
    return { isValid: false, error: 'このファイル名は使用できません' }
  }

  return { isValid: true }
}

/**
 * 汎用的なフォームバリデーター
 */
export class FormValidator {
  private errors: Record<string, string[]> = {}

  /**
   * フィールドにバリデーションルールを追加
   */
  validate(field: string, value: unknown, rules: ValidationRule[]): this {
    this.errors[field] = []

    for (const rule of rules) {
      const result = rule.validate(value)
      if (!result.isValid) {
        this.errors[field].push(result.error || 'バリデーションエラー')
      }
    }

    return this
  }

  /**
   * すべてのフィールドが有効かどうかを確認
   */
  isValid(): boolean {
    return Object.values(this.errors).every(fieldErrors => fieldErrors.length === 0)
  }

  /**
   * エラーメッセージを取得
   */
  getErrors(): Record<string, string[]> {
    return this.errors
  }

  /**
   * 特定のフィールドのエラーメッセージを取得
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] || []
  }

  /**
   * エラーをクリア
   */
  clear(): this {
    this.errors = {}
    return this
  }
}

/**
 * バリデーションルールのインターフェース
 */
export interface ValidationRule {
  validate: (value: unknown) => { isValid: boolean; error?: string }
}

/**
 * 必須フィールドのバリデーションルール
 */
export const required: ValidationRule = {
  validate: (value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return { isValid: false, error: 'この項目は必須です' }
    }
    return { isValid: true }
  }
}

/**
 * 最小長のバリデーションルール
 */
export const minLength = (min: number): ValidationRule => ({
  validate: (value: unknown) => {
    if (typeof value !== 'string') {
      return { isValid: false, error: '文字列である必要があります' }
    }
    if (value.length < min) {
      return { isValid: false, error: `${min}文字以上で入力してください` }
    }
    return { isValid: true }
  }
})

/**
 * 最大長のバリデーションルール
 */
export const maxLength = (max: number): ValidationRule => ({
  validate: (value: unknown) => {
    if (typeof value !== 'string') {
      return { isValid: false, error: '文字列である必要があります' }
    }
    if (value.length > max) {
      return { isValid: false, error: `${max}文字以下で入力してください` }
    }
    return { isValid: true }
  }
})

/**
 * パターンマッチのバリデーションルール
 */
export const pattern = (regex: RegExp, message: string): ValidationRule => ({
  validate: (value: unknown) => {
    if (typeof value !== 'string') {
      return { isValid: false, error: '文字列である必要があります' }
    }
    if (!regex.test(value)) {
      return { isValid: false, error: message }
    }
    return { isValid: true }
  }
})