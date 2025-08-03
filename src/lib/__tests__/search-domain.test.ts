import {
  validateSearchQuery,
  buildGitHubSearchQuery,
  createPopularRepositoryQuery,
  createRecentRepositoryQuery,
  generateSearchSuggestions,
  calculateRepositoryQuality,
  calculateSearchStatistics
} from '../search-domain'

describe('search-domain', () => {
  describe('validateSearchQuery', () => {
    it('有効なクエリを受け入れる', () => {
      const result = validateSearchQuery('react typescript')
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('空のクエリを拒否する', () => {
      const result = validateSearchQuery('')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('検索クエリを入力してください')
    })

    it('空白のみのクエリを拒否する', () => {
      const result = validateSearchQuery('   ')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('検索クエリを入力してください')
    })

    it('256文字を超えるクエリを拒否する', () => {
      const longQuery = 'a'.repeat(257)
      const result = validateSearchQuery(longQuery)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('検索クエリは256文字以内で入力してください')
    })

    it('危険なスクリプトタグを拒否する', () => {
      const result = validateSearchQuery('<script>alert("xss")</script>')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無効な文字が含まれています')
    })

    it('javascriptプロトコルを拒否する', () => {
      const result = validateSearchQuery('javascript:alert("xss")')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無効な文字が含まれています')
    })

    it('onイベントハンドラーを拒否する', () => {
      const result = validateSearchQuery('onclick=alert("xss")')
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('無効な文字が含まれています')
    })

    it('複数のエラーを正しく報告する', () => {
      const result = validateSearchQuery('')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('buildGitHubSearchQuery', () => {
    it('基本的なクエリを構築する', () => {
      const result = buildGitHubSearchQuery({ 
        query: 'react',
        minStars: null,
        maxStars: null
      })
      expect(result).toBe('react')
    })

    it('言語フィルターを追加する', () => {
      const result = buildGitHubSearchQuery({
        query: 'react',
        language: 'typescript',
        minStars: null,
        maxStars: null
      })
      expect(result).toBe('react language:typescript')
    })

    it('最小スター数フィルターを追加する', () => {
      const result = buildGitHubSearchQuery({
        query: 'vue',
        minStars: 100,
        maxStars: null
      })
      expect(result).toBe('vue stars:>=100')
    })

    it('最大スター数フィルターを追加する', () => {
      const result = buildGitHubSearchQuery({
        query: 'angular',
        minStars: null,
        maxStars: 1000
      })
      expect(result).toBe('angular stars:<=1000')
    })

    it('スター数の範囲フィルターを追加する', () => {
      const result = buildGitHubSearchQuery({
        query: 'svelte',
        minStars: 50,
        maxStars: 500
      })
      expect(result).toBe('svelte stars:50..500')
    })

    it('複数のフィルターを組み合わせる', () => {
      const result = buildGitHubSearchQuery({
        query: 'nextjs',
        language: 'javascript',
        minStars: 100,
        maxStars: null,
        sort: 'stars',
        order: 'desc'
      })
      expect(result).toBe('nextjs language:javascript stars:>=100')
    })

    it('空白をトリムする', () => {
      const result = buildGitHubSearchQuery({
        query: '  react hooks  ',
        language: 'typescript',
        minStars: null,
        maxStars: null
      })
      expect(result).toBe('react hooks language:typescript')
    })

    it('nullの言語フィルターを無視する', () => {
      const result = buildGitHubSearchQuery({
        query: 'react',
        language: null,
        minStars: null,
        maxStars: null
      })
      expect(result).toBe('react')
    })

    it('nullのスター数フィルターを無視する', () => {
      const result = buildGitHubSearchQuery({
        query: 'vue',
        minStars: null,
        maxStars: null
      })
      expect(result).toBe('vue')
    })
  })

  describe('createPopularRepositoryQuery', () => {
    it('言語なしの人気リポジトリクエリを生成する', () => {
      const result = createPopularRepositoryQuery()
      expect(result).toBe('stars:>100')
    })

    it('言語ありの人気リポジトリクエリを生成する', () => {
      const result = createPopularRepositoryQuery('javascript')
      expect(result).toBe('stars:>100 language:javascript')
    })

    it('TypeScript言語の人気リポジトリクエリを生成する', () => {
      const result = createPopularRepositoryQuery('typescript')
      expect(result).toBe('stars:>100 language:typescript')
    })
  })

  describe('createRecentRepositoryQuery', () => {
    beforeEach(() => {
      // Date.prototype.setMonth をモック
      jest.spyOn(Date.prototype, 'setMonth').mockImplementation(function(this: Date, month: number) {
        // 2023年12月1日から1ヶ月前 = 2023年11月1日
        this.setFullYear(2023, 10, 1) // 月は0ベースなので10 = 11月
        return this.getTime()
      })
      
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2023-11-01T00:00:00.000Z')
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('言語なしの最近更新されたリポジトリクエリを生成する', () => {
      const result = createRecentRepositoryQuery()
      expect(result).toBe('pushed:>2023-11-01 stars:>10')
    })

    it('言語ありの最近更新されたリポジトリクエリを生成する', () => {
      const result = createRecentRepositoryQuery('python')
      expect(result).toBe('pushed:>2023-11-01 stars:>10 language:python')
    })
  })

  describe('generateSearchSuggestions', () => {
    it('短いクエリでは空の配列を返す', () => {
      expect(generateSearchSuggestions('')).toEqual([])
      expect(generateSearchSuggestions('a')).toEqual([])
    })

    it('マッチする候補を返す', () => {
      const result = generateSearchSuggestions('react')
      expect(result).toContain('react typescript')
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('大文字小文字を区別しない', () => {
      const result = generateSearchSuggestions('REACT')
      expect(result).toContain('react typescript')
    })

    it('部分マッチする候補を返す', () => {
      const result = generateSearchSuggestions('node')
      expect(result).toContain('node.js express')
    })

    it('最大5件まで返す', () => {
      const result = generateSearchSuggestions('a') // 多くの候補にマッチする可能性がある
      expect(result.length).toBeLessThanOrEqual(5)
    })

    it('マッチしない場合は空の配列を返す', () => {
      const result = generateSearchSuggestions('xyz123nonexistent')
      expect(result).toEqual([])
    })
  })

  describe('calculateRepositoryQuality', () => {
    const mockRepo = {
      stargazers_count: 1000,
      forks_count: 200,
      description: 'A great repository with detailed description',
      language: 'TypeScript',
      topics: ['react', 'typescript', 'ui'],
      license: { name: 'MIT' },
      updated_at: new Date().toISOString() // 現在時刻
    }

    it('高品質なリポジトリに高いスコアを付ける', () => {
      const score = calculateRepositoryQuality(mockRepo)
      expect(score).toBeGreaterThan(50)
    })

    it('スター数によるスコアを正しく計算する', () => {
      const highStarRepo = { ...mockRepo, stargazers_count: 5000 }
      const lowStarRepo = { ...mockRepo, stargazers_count: 100 }
      
      const highScore = calculateRepositoryQuality(highStarRepo)
      const lowScore = calculateRepositoryQuality(lowStarRepo)
      
      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('フォーク数によるスコアを正しく計算する', () => {
      const highForkRepo = { ...mockRepo, forks_count: 1000 }
      const lowForkRepo = { ...mockRepo, forks_count: 10 }
      
      const highScore = calculateRepositoryQuality(highForkRepo)
      const lowScore = calculateRepositoryQuality(lowForkRepo)
      
      expect(highScore).toBeGreaterThan(lowScore)
    })

    it('説明の有無でスコアが変わる', () => {
      const withDescRepo = { ...mockRepo, description: 'Detailed description' }
      const withoutDescRepo = { ...mockRepo, description: null }
      
      const withScore = calculateRepositoryQuality(withDescRepo)
      const withoutScore = calculateRepositoryQuality(withoutDescRepo)
      
      expect(withScore).toBeGreaterThan(withoutScore)
    })

    it('短い説明では加点されない', () => {
      const shortDescRepo = { ...mockRepo, description: 'short' }
      const longDescRepo = { ...mockRepo, description: 'This is a long description' }
      
      const shortScore = calculateRepositoryQuality(shortDescRepo)
      const longScore = calculateRepositoryQuality(longDescRepo)
      
      expect(longScore).toBeGreaterThan(shortScore)
    })

    it('ライセンスの有無でスコアが変わる', () => {
      const withLicenseRepo = { ...mockRepo, license: { name: 'MIT' } }
      const withoutLicenseRepo = { ...mockRepo, license: null }
      
      const withScore = calculateRepositoryQuality(withLicenseRepo)
      const withoutScore = calculateRepositoryQuality(withoutLicenseRepo)
      
      expect(withScore).toBeGreaterThan(withoutScore)
    })

    it('トピック数でスコアが変わる', () => {
      const manyTopicsRepo = { ...mockRepo, topics: ['a', 'b', 'c', 'd', 'e'] }
      const fewTopicsRepo = { ...mockRepo, topics: ['a'] }
      
      const manyScore = calculateRepositoryQuality(manyTopicsRepo)
      const fewScore = calculateRepositoryQuality(fewTopicsRepo)
      
      expect(manyScore).toBeGreaterThan(fewScore)
    })

    it('最近更新されたリポジトリに加点する', () => {
      const recentRepo = { ...mockRepo, updated_at: new Date().toISOString() }
      const oldRepo = { ...mockRepo, updated_at: '2020-01-01T00:00:00Z' }
      
      const recentScore = calculateRepositoryQuality(recentRepo)
      const oldScore = calculateRepositoryQuality(oldRepo)
      
      expect(recentScore).toBeGreaterThan(oldScore)
    })

    it('スコアを整数で返す', () => {
      const score = calculateRepositoryQuality(mockRepo)
      expect(Number.isInteger(score)).toBe(true)
    })
  })

  describe('calculateSearchStatistics', () => {
    const mockRepositories = [
      {
        stargazers_count: 1000,
        forks_count: 200,
        language: 'TypeScript',
        description: 'Great repo',
        topics: ['react'],
        license: { name: 'MIT' },
        updated_at: new Date().toISOString()
      },
      {
        stargazers_count: 500,
        forks_count: 100,
        language: 'JavaScript',
        description: 'Another repo',
        topics: ['vue'],
        license: { name: 'Apache-2.0' },
        updated_at: new Date().toISOString()
      },
      {
        stargazers_count: 250,
        forks_count: 50,
        language: 'TypeScript',
        description: 'Third repo',
        topics: ['angular'],
        license: null,
        updated_at: '2020-01-01T00:00:00Z'
      }
    ]

    it('空の配列で正しいデフォルト値を返す', () => {
      const stats = calculateSearchStatistics([])
      
      expect(stats.totalCount).toBe(0)
      expect(stats.averageStars).toBe(0)
      expect(stats.averageForks).toBe(0)
      expect(stats.languageDistribution.size).toBe(0)
      expect(stats.qualityDistribution).toEqual({
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0
      })
    })

    it('統計情報を正しく計算する', () => {
      const stats = calculateSearchStatistics(mockRepositories)
      
      expect(stats.totalCount).toBe(3)
      expect(stats.averageStars).toBe(Math.round((1000 + 500 + 250) / 3))
      expect(stats.averageForks).toBe(Math.round((200 + 100 + 50) / 3))
    })

    it('言語分布を正しく計算する', () => {
      const stats = calculateSearchStatistics(mockRepositories)
      
      expect(stats.languageDistribution.get('TypeScript')).toBe(2)
      expect(stats.languageDistribution.get('JavaScript')).toBe(1)
    })

    it('言語がnullの場合は「その他」に分類する', () => {
      const reposWithNull = [
        { ...mockRepositories[0], language: null }
      ]
      
      const stats = calculateSearchStatistics(reposWithNull)
      expect(stats.languageDistribution.get('その他')).toBe(1)
    })

    it('品質分布を正しく計算する', () => {
      const stats = calculateSearchStatistics(mockRepositories)
      
      const { excellent, good, fair, poor } = stats.qualityDistribution
      expect(excellent + good + fair + poor).toBe(mockRepositories.length)
    })

    it('高品質リポジトリが正しく分類される', () => {
      const highQualityRepo = {
        stargazers_count: 10000, // 高スター数
        forks_count: 2000,       // 高フォーク数
        language: 'TypeScript',
        description: 'Excellent repository with detailed documentation',
        topics: ['react', 'typescript', 'ui', 'components', 'library'],
        license: { name: 'MIT' },
        updated_at: new Date().toISOString()
      }
      
      const stats = calculateSearchStatistics([highQualityRepo])
      expect(stats.qualityDistribution.excellent).toBeGreaterThan(0)
    })
  })
})