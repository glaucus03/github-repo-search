/**
 * 検索ドメインロジック
 * ビジネスルールと検索機能の中核を担当
 */

/**
 * 検索クエリのバリデーション
 */
export function validateSearchQuery(query: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!query || query.trim().length === 0) {
    errors.push('検索クエリを入力してください')
  }
  
  if (query.trim().length > 256) {
    errors.push('検索クエリは256文字以内で入力してください')
  }
  
  // 危険な文字列のチェック
  const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+=/i]
  if (dangerousPatterns.some(pattern => pattern.test(query))) {
    errors.push('無効な文字が含まれています')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * GitHub検索クエリの構築
 */
export function buildGitHubSearchQuery(params: {
  query: string
  language?: string | null
  minStars?: number | null
  maxStars?: number | null
  sort?: 'stars' | 'forks' | 'updated' | 'best-match'
  order?: 'asc' | 'desc'
}): string {
  let searchQuery = params.query.trim()

  // 言語フィルタ
  if (params.language) {
    searchQuery += ` language:${params.language}`
  }

  // スター数フィルタ
  if (params.minStars !== null && params.maxStars !== null) {
    searchQuery += ` stars:${params.minStars}..${params.maxStars}`
  } else if (params.minStars !== null) {
    searchQuery += ` stars:>=${params.minStars}`
  } else if (params.maxStars !== null) {
    searchQuery += ` stars:<=${params.maxStars}`
  }

  return searchQuery
}

/**
 * 人気のリポジトリクエリを生成
 */
export function createPopularRepositoryQuery(language?: string): string {
  let query = 'stars:>100'
  if (language) {
    query += ` language:${language}`
  }
  return query
}

/**
 * 最近更新されたリポジトリクエリを生成
 */
export function createRecentRepositoryQuery(language?: string): string {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
  const dateStr = oneMonthAgo.toISOString().split('T')[0]
  
  let query = `pushed:>${dateStr} stars:>10`
  if (language) {
    query += ` language:${language}`
  }
  return query
}

/**
 * 検索候補の生成
 */
export function generateSearchSuggestions(query: string): string[] {
  const suggestions: string[] = []
  
  if (query.length < 2) return suggestions
  
  const commonQueries = [
    'react typescript',
    'vue.js components',
    'machine learning python',
    'golang microservices',
    'rust performance',
    'node.js express',
    'django rest framework',
    'flutter mobile app',
    'docker kubernetes',
    'tensorflow pytorch'
  ]
  
  return commonQueries
    .filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5)
}

/**
 * リポジトリの品質スコア計算
 */
export function calculateRepositoryQuality(repo: {
  stargazers_count: number
  forks_count: number
  description: string | null
  language: string | null
  topics?: string[]
  license?: { name: string } | null
  updated_at: string
}): number {
  let score = 0
  
  // スター数によるスコア（最大30点）
  score += Math.min(repo.stargazers_count / 100, 30)
  
  // フォーク数によるスコア（最大20点）
  score += Math.min(repo.forks_count / 50, 20)
  
  // 説明の有無（10点）
  if (repo.description && repo.description.trim().length > 10) {
    score += 10
  }
  
  // ライセンスの有無（10点）
  if (repo.license) {
    score += 10
  }
  
  // トピックの数（最大10点）
  if (repo.topics) {
    score += Math.min(repo.topics.length * 2, 10)
  }
  
  // 最近の更新（20点）
  const updatedAt = new Date(repo.updated_at)
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  
  if (updatedAt > oneYearAgo) {
    score += 20
  }
  
  return Math.round(score)
}

/**
 * 検索結果の統計情報を計算
 */
export function calculateSearchStatistics(repositories: any[]): {
  totalCount: number
  averageStars: number
  averageForks: number
  languageDistribution: Map<string, number>
  qualityDistribution: {
    excellent: number // 80+
    good: number      // 60-79
    fair: number      // 40-59
    poor: number      // <40
  }
} {
  if (repositories.length === 0) {
    return {
      totalCount: 0,
      averageStars: 0,
      averageForks: 0,
      languageDistribution: new Map(),
      qualityDistribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
    }
  }
  
  const totalStars = repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0)
  const totalForks = repositories.reduce((sum, repo) => sum + repo.forks_count, 0)
  
  // 言語分布
  const languageDistribution = new Map<string, number>()
  repositories.forEach(repo => {
    const language = repo.language || 'その他'
    languageDistribution.set(language, (languageDistribution.get(language) || 0) + 1)
  })
  
  // 品質分布
  const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
  repositories.forEach(repo => {
    const quality = calculateRepositoryQuality(repo)
    if (quality >= 80) qualityDistribution.excellent++
    else if (quality >= 60) qualityDistribution.good++
    else if (quality >= 40) qualityDistribution.fair++
    else qualityDistribution.poor++
  })
  
  return {
    totalCount: repositories.length,
    averageStars: Math.round(totalStars / repositories.length),
    averageForks: Math.round(totalForks / repositories.length),
    languageDistribution,
    qualityDistribution
  }
}