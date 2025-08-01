// Jest DOM テスト用のカスタムマッチャーをインポート
import '@testing-library/jest-dom'

// HeroUI のモック設定（必要に応じて）
jest.mock('@heroui/react', () => ({
  ...jest.requireActual('@heroui/react'),
  // 特定のコンポーネントのモックが必要な場合はここに追加
}))

// Next.js Router のモック
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// GitHub API のモック設定
global.fetch = jest.fn()

// Window オブジェクトのモック（必要に応じて）
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Intersection Observer のモック（無限スクロール用）
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  disconnect() {
    return null
  }
  unobserve() {
    return null
  }
}