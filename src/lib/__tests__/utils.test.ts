import {
  cn,
  formatNumber,
  formatRelativeTime,
  formatDate,
  formatDateTime,
  formatBytes,
  truncateText,
  isValidUrl,
  stripHtmlTags,
  toKebabCase,
  toCamelCase,
  shuffleArray,
  uniqueArray,
  pick,
  omit,
  deepClone,
  sleep,
  throttle,
  safeLog,
  safeError,
  getEnvVar,
  localStorage
} from '../utils'

// Mock dependencies
jest.mock('clsx', () => ({
  clsx: jest.fn((inputs) => inputs.filter(Boolean).join(' '))
}))

jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((classes) => classes)
}))

describe('ユーティリティ関数', () => {
  describe('cn', () => {
    it('クラス名を結合する', () => {
      const result = cn('class1', 'class2', false && 'class3')
      expect(result).toBe('class1 class2')
    })
  })

  describe('formatNumber', () => {
    it('1000未満の数値をそのまま返す', () => {
      expect(formatNumber(999)).toBe('999')
      expect(formatNumber(0)).toBe('0')
      expect(formatNumber(500)).toBe('500')
    })

    it('1000以上の数値をk形式でフォーマットする', () => {
      expect(formatNumber(1000)).toBe('1.0k')
      expect(formatNumber(1500)).toBe('1.5k')
      expect(formatNumber(999999)).toBe('1000.0k')
    })

    it('1000000以上の数値をM形式でフォーマットする', () => {
      expect(formatNumber(1000000)).toBe('1.0M')
      expect(formatNumber(1500000)).toBe('1.5M')
      expect(formatNumber(12345678)).toBe('12.3M')
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.clearAllTimers()
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2023-01-01T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('秒単位の相対時間を返す', () => {
      const pastDate = new Date('2023-01-01T11:59:30Z')
      expect(formatRelativeTime(pastDate)).toBe('30秒前')
    })

    it('分単位の相対時間を返す', () => {
      const pastDate = new Date('2023-01-01T11:55:00Z')
      expect(formatRelativeTime(pastDate)).toBe('5分前')
    })

    it('時間単位の相対時間を返す', () => {
      const pastDate = new Date('2023-01-01T10:00:00Z')
      expect(formatRelativeTime(pastDate)).toBe('2時間前')
    })

    it('日単位の相対時間を返す', () => {
      const pastDate = new Date('2022-12-30T12:00:00Z')
      expect(formatRelativeTime(pastDate)).toBe('2日前')
    })

    it('月単位の相対時間を返す', () => {
      const pastDate = new Date('2022-11-01T12:00:00Z')
      expect(formatRelativeTime(pastDate)).toBe('2ヶ月前')
    })

    it('年単位の相対時間を返す', () => {
      const pastDate = new Date('2021-01-01T12:00:00Z')
      expect(formatRelativeTime(pastDate)).toBe('2年前')
    })
  })

  describe('formatDate', () => {
    it('Date オブジェクトを日本語形式でフォーマットする', () => {
      const date = new Date('2023-01-15T10:30:00Z')
      const result = formatDate(date)
      expect(result).toMatch(/2023年1月15日/)
    })

    it('文字列の日付を日本語形式でフォーマットする', () => {
      const result = formatDate('2023-01-15T10:30:00Z')
      expect(result).toMatch(/2023年1月15日/)
    })
  })

  describe('formatDateTime', () => {
    it('Date オブジェクトを詳細な日本語形式でフォーマットする', () => {
      const date = new Date('2023-01-15T10:30:00Z')
      const result = formatDateTime(date)
      expect(result).toMatch(/2023年1月15日/)
      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('文字列の日付を詳細な日本語形式でフォーマットする', () => {
      const result = formatDateTime('2023-01-15T10:30:00Z')
      expect(result).toMatch(/2023年1月15日/)
    })
  })

  describe('formatBytes', () => {
    it('0バイトを正しくフォーマットする', () => {
      expect(formatBytes(0)).toBe('0 B')
    })

    it('バイト単位でフォーマットする', () => {
      expect(formatBytes(512)).toBe('512 B')
    })

    it('KB単位でフォーマットする', () => {
      expect(formatBytes(1024)).toBe('1 KB')
      expect(formatBytes(1536)).toBe('1.5 KB')
    })

    it('MB単位でフォーマットする', () => {
      expect(formatBytes(1048576)).toBe('1 MB')
      expect(formatBytes(1572864)).toBe('1.5 MB')
    })

    it('GB単位でフォーマットする', () => {
      expect(formatBytes(1073741824)).toBe('1 GB')
    })
  })

  describe('truncateText', () => {
    it('最大長以下のテキストをそのまま返す', () => {
      expect(truncateText('短いテキスト', 20)).toBe('短いテキスト')
    })

    it('最大長を超えるテキストを切り詰める', () => {
      expect(truncateText('これは非常に長いテキストです', 10)).toBe('これは非常に長いテキ...')
    })

    it('最大長と同じ長さのテキストをそのまま返す', () => {
      const text = '12345'
      expect(truncateText(text, 5)).toBe(text)
    })
  })

  describe('isValidUrl', () => {
    it('有効なURLでtrueを返す', () => {
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://test.org')).toBe(true)
      expect(isValidUrl('https://sub.domain.com/path?query=value')).toBe(true)
    })

    it('無効なURLでfalseを返す', () => {
      expect(isValidUrl('not-a-url')).toBe(false)
      expect(isValidUrl('://invalid')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })
  })

  describe('stripHtmlTags', () => {
    it('HTMLタグを除去する', () => {
      expect(stripHtmlTags('<p>テキスト</p>')).toBe('テキスト')
      expect(stripHtmlTags('<div><span>ネストされた</span>タグ</div>')).toBe('ネストされたタグ')
    })

    it('HTMLタグがない場合はそのまま返す', () => {
      expect(stripHtmlTags('普通のテキスト')).toBe('普通のテキスト')
    })

    it('複雑なHTMLタグを処理する', () => {
      const html = '<a href="https://example.com" class="link">リンク</a>'
      expect(stripHtmlTags(html)).toBe('リンク')
    })
  })

  describe('toKebabCase', () => {
    it('キャメルケースをケバブケースに変換する', () => {
      expect(toKebabCase('camelCase')).toBe('camel-case')
      expect(toKebabCase('PascalCase')).toBe('pascal-case')
    })

    it('スペースをケバブケースに変換する', () => {
      expect(toKebabCase('hello world')).toBe('hello-world')
    })

    it('アンダースコアをケバブケースに変換する', () => {
      expect(toKebabCase('snake_case')).toBe('snake-case')
    })

    it('混合形式を処理する', () => {
      expect(toKebabCase('someVery Complex_string')).toBe('some-very-complex-string')
    })
  })

  describe('toCamelCase', () => {
    it('ケバブケースをキャメルケースに変換する', () => {
      expect(toCamelCase('kebab-case')).toBe('kebabCase')
    })

    it('スネークケースをキャメルケースに変換する', () => {
      expect(toCamelCase('snake_case')).toBe('snakeCase')
    })

    it('スペース区切りをキャメルケースに変換する', () => {
      expect(toCamelCase('hello world')).toBe('helloWorld')
    })

    it('PascalCaseをcamelCaseに変換する', () => {
      expect(toCamelCase('PascalCase')).toBe('pascalCase')
    })
  })

  describe('shuffleArray', () => {
    it('配列をシャッフルする（元の配列は変更しない）', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled).toHaveLength(original.length)
      expect(shuffled).not.toBe(original) // 異なるインスタンス
      expect(original).toEqual([1, 2, 3, 4, 5]) // 元の配列は変更されない
      
      // 同じ要素を含む
      expect(shuffled.sort()).toEqual(original.sort())
    })

    it('空の配列を処理する', () => {
      expect(shuffleArray([])).toEqual([])
    })

    it('単一要素の配列を処理する', () => {
      expect(shuffleArray([1])).toEqual([1])
    })
  })

  describe('uniqueArray', () => {
    it('重複を除去する', () => {
      expect(uniqueArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    })

    it('文字列の重複を除去する', () => {
      expect(uniqueArray(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c'])
    })

    it('重複がない場合はそのまま返す', () => {
      expect(uniqueArray([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('空の配列を処理する', () => {
      expect(uniqueArray([])).toEqual([])
    })
  })

  describe('pick', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }

    it('指定されたキーのみを抽出する', () => {
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
    })

    it('存在しないキーは無視する', () => {
      expect(pick(obj, ['a', 'x' as keyof typeof obj])).toEqual({ a: 1 })
    })

    it('空のキー配列の場合は空オブジェクトを返す', () => {
      expect(pick(obj, [])).toEqual({})
    })
  })

  describe('omit', () => {
    const obj = { a: 1, b: 2, c: 3, d: 4 }

    it('指定されたキーを除外する', () => {
      expect(omit(obj, ['b', 'd'])).toEqual({ a: 1, c: 3 })
    })

    it('存在しないキーは無視する', () => {
      expect(omit(obj, ['x' as keyof typeof obj])).toEqual(obj)
    })

    it('空のキー配列の場合は元のオブジェクトを返す', () => {
      expect(omit(obj, [])).toEqual(obj)
    })
  })

  describe('deepClone', () => {
    it('プリミティブ値をそのまま返す', () => {
      expect(deepClone(null)).toBe(null)
      expect(deepClone('string')).toBe('string')
      expect(deepClone(123)).toBe(123)
      expect(deepClone(true)).toBe(true)
    })

    it('Dateオブジェクトをクローンする', () => {
      jest.useRealTimers()
      const date = new Date('2023-01-01')
      const cloned = deepClone(date)
      
      expect(cloned).toEqual(date)
      expect(cloned).not.toBe(date)
    })

    it('配列を深くクローンする', () => {
      const arr = [1, [2, 3], { a: 4 }]
      const cloned = deepClone(arr)
      
      expect(cloned).toEqual(arr)
      expect(cloned).not.toBe(arr)
      expect(cloned[1]).not.toBe(arr[1])
      expect(cloned[2]).not.toBe(arr[2])
    })

    it('オブジェクトを深くクローンする', () => {
      const obj = {
        a: 1,
        b: {
          c: 2,
          d: [3, 4]
        }
      }
      const cloned = deepClone(obj)
      
      expect(cloned).toEqual(obj)
      expect(cloned).not.toBe(obj)
      expect(cloned.b).not.toBe(obj.b)
      expect(cloned.b.d).not.toBe(obj.b.d)
    })
  })

  describe('sleep', () => {
    it('指定された時間だけ待機する', async () => {
      jest.useRealTimers()
      const start = Date.now()
      await sleep(10) // より短い時間でテスト
      const end = Date.now()
      
      expect(end - start).toBeGreaterThanOrEqual(5) // 多少の誤差を許容
    }, 1000) // 1秒のタイムアウト
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('指定時間内の連続実行を制限する', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 1000)

      throttledFn()
      throttledFn()
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(1)

      jest.advanceTimersByTime(1000)
      throttledFn()

      expect(mockFn).toHaveBeenCalledTimes(2)
    })
  })

  describe('safeLog', () => {
    const originalEnv = process.env.NODE_ENV
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: originalEnv || 'test', writable: true })
      consoleSpy.mockClear()
    })

    it('開発環境でログを出力する', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      
      safeLog('test message')
      expect(consoleSpy).toHaveBeenCalledWith('[GitHub Search App] test message', undefined)
    })

    it('本番環境ではログを出力しない', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      
      safeLog('test message')
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('safeError', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    afterEach(() => {
      consoleSpy.mockClear()
    })

    it('開発環境でエラーログを出力する', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'development', writable: true })
      
      safeError('error message')
      expect(consoleSpy).toHaveBeenCalledWith('[GitHub Search App Error] error message', undefined)
    })

    it('本番環境ではエラーログを出力しない', () => {
      Object.defineProperty(process.env, 'NODE_ENV', { value: 'production', writable: true })
      
      safeError('error message')
      expect(consoleSpy).not.toHaveBeenCalled()
    })
  })

  describe('getEnvVar', () => {
    const originalEnv = process.env.TEST_VAR

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.TEST_VAR = originalEnv
      } else {
        delete process.env.TEST_VAR
      }
    })

    it('環境変数の値を返す', () => {
      process.env.TEST_VAR = 'test-value'
      expect(getEnvVar('TEST_VAR')).toBe('test-value')
    })

    it('デフォルト値を返す', () => {
      delete process.env.TEST_VAR
      expect(getEnvVar('TEST_VAR', 'default')).toBe('default')
    })

    it('環境変数が存在しない場合はエラーを投げる', () => {
      delete process.env.TEST_VAR
      expect(() => getEnvVar('TEST_VAR')).toThrow('Environment variable TEST_VAR is not defined')
    })
  })

  describe('LocalStorageManager', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    it('データを保存・取得する', () => {
      const testData = { key: 'value' }
      localStorage.set('test', testData)
      
      expect(localStorage.get('test')).toEqual(testData)
    })

    it('存在しないキーに対してnullを返す', () => {
      expect(localStorage.get('nonexistent')).toBeNull()
    })

    it('データを削除する', () => {
      localStorage.set('test', { data: 'value' })
      localStorage.remove('test')
      
      expect(localStorage.get('test')).toBeNull()
    })

    it('すべてのデータをクリアする', () => {
      localStorage.set('test1', { data: 'value1' })
      localStorage.set('test2', { data: 'value2' })
      localStorage.clear()
      
      expect(localStorage.get('test1')).toBeNull()
      expect(localStorage.get('test2')).toBeNull()
    })
  })
})