# GitHubリポジトリ検索アプリケーション 技術設計書

## 1. アーキテクチャ設計

### 1.1 全体構成図

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                   Vercel CDN                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Next.js Frontend                           ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐││
│  │  │ Search Page   │  │ Detail Page   │  │ API Routes   │││
│  │  │ (SSG/CSR)     │  │ (SSR/ISR)     │  │ (Serverless) │││
│  │  └───────────────┘  └───────────────┘  └──────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│                 GitHub REST API                            │
│            https://api.github.com                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 コンポーネント構成（App Router 完全対応）

```
src/
├── app/                                # Next.js App Router（必須構成）
│   ├── (home)/                        # Route Group - ホーム画面グループ
│   │   ├── page.tsx                   # Server Component - 検索ページ
│   │   ├── loading.tsx                # Loading UI
│   │   ├── error.tsx                  # Error UI
│   │   └── components/                # ページ固有コンポーネント
│   │       ├── SearchForm.tsx         # Client Component
│   │       ├── SearchResults.tsx      # Server Component
│   │       └── RepositoryCard.tsx     # Server Component
│   ├── repository/                    # 動的ルート
│   │   └── [owner]/
│   │       └── [name]/
│   │           ├── page.tsx           # Server Component - 詳細ページ
│   │           ├── loading.tsx        # Loading UI
│   │           ├── error.tsx          # Error UI
│   │           ├── not-found.tsx      # 404ページ
│   │           └── components/
│   │               ├── RepositoryHeader.tsx    # Server Component
│   │               ├── RepositoryStats.tsx     # Server Component
│   │               └── RepositoryDetails.tsx   # Server Component
│   ├── api/                          # App Router API Routes
│   │   └── repositories/
│   │       ├── search/
│   │       │   └── route.ts          # GET /api/repositories/search
│   │       └── [owner]/
│   │           └── [name]/
│   │               └── route.ts      # GET /api/repositories/[owner]/[name]
│   ├── globals.css                   # グローバルスタイル
│   ├── layout.tsx                    # Root Layout (Server Component)
│   ├── error.tsx                     # Global Error UI
│   ├── not-found.tsx                 # Global 404ページ
│   └── loading.tsx                   # Global Loading UI
├── components/                       # 共通コンポーネント
│   ├── ui/                          # HeroUI基盤コンポーネント  
│   ├── layout/                      # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   └── common/                      # 汎用コンポーネント
│       ├── Loading.tsx
│       ├── ErrorBoundary.tsx
│       └── InfiniteScroll.tsx
├── hooks/                          # カスタムHooks
│   ├── useRepositorySearch.ts
│   ├── useInfiniteScroll.ts
│   └── useRepositoryDetail.ts
├── lib/                           # ユーティリティ
│   ├── github-api.ts             # GitHub API クライアント
│   ├── utils.ts                  # 汎用ユーティリティ
│   ├── types.ts                  # TypeScript型定義
│   └── constants.ts              # 定数定義
└── store/                        # 状態管理
    ├── searchStore.ts           # 検索状態管理
    └── uiStore.ts              # UI状態管理
```

### 1.3 データフロー

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ User Input  │───▶│ Search Form  │───▶│ API Route   │───▶│ GitHub API   │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
                            ▲                  │                  │
                            │                  ▼                  ▼
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌──────────────┐
│ UI Update   │◀───│ State Store  │◀───│ Response    │◀───│ JSON Data    │
└─────────────┘    └──────────────┘    └─────────────┘    └──────────────┘
```

### 1.4 シーケンス図: App Router検索フロー

```
User    SearchForm     Server         API Route     GitHub API    SearchResults
 │     (Client)       Component      (route.ts)                  (Server)
 │          │             │              │              │             │
 │─search──▶│             │              │              │             │
 │          │─────────────│──────────────│──────────────│─────────────│
 │          │ Server      │              │              │             │
 │          │ Action      │              │              │             │
 │          │             │─────────────▶│              │             │
 │          │             │              │─────────────▶│             │
 │          │             │              │◀─────────────│             │
 │          │             │◀─────────────│              │             │
 │          │             │                             │             │
 │          │             │─────────────────────────────────────────▶│
 │          │             │            Re-render                     │
 │◀─────────│─────────────│─────────────────────────────────────────│
 │          │             │                                         │
```

## 2. 詳細設計

### 2.1 コンポーネント設計

#### 2.1.1 SearchForm コンポーネント

```typescript
interface SearchFormProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialQuery?: string;
}

interface SearchFormState {
  query: string;
  error: string | null;
}

// 責務:
// - ユーザー入力の受付
// - バリデーション
// - 検索実行のトリガー
```

#### 2.1.2 RepositoryCard コンポーネント

```typescript
interface RepositoryCardProps {
  repository: Repository;
  onClick: (repository: Repository) => void;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
}

// 責務:
// - リポジトリ情報の表示
// - クリックイベントの処理
// - ホバー効果の実装
```

#### 2.1.3 InfiniteScroll コンポーネント

```typescript
interface InfiniteScrollProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number;
  children: React.ReactNode;
}

// 責務:
// - スクロール位置の監視
// - 追加データの読み込みトリガー
// - ローディング状態の表示
```

### 2.2 カスタムHooks設計

#### 2.2.1 useRepositorySearch

```typescript
interface UseRepositorySearchOptions {
  initialQuery?: string;
  perPage?: number;
}

interface UseRepositorySearchReturn {
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  search: (query: string) => Promise<void>;
  loadMore: () => Promise<void>;
  reset: () => void;
}

// 実装内容:
// - GitHub API への検索リクエスト
// - ページネーション管理
// - キャッシュ機能
// - エラーハンドリング
```

#### 2.2.2 useRepositoryDetail

```typescript
interface UseRepositoryDetailOptions {
  owner: string;
  name: string;
}

interface UseRepositoryDetailReturn {
  repository: RepositoryDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 実装内容:
// - リポジトリ詳細情報の取得
// - キャッシュ機能
// - エラーハンドリング
```

### 2.3 API設計

#### 2.3.1 検索API (`/api/repositories/search`)

```typescript
// Request
interface SearchRequest {
  q: string;                    // 検索クエリ
  page?: number;               // ページ番号 (default: 1)
  per_page?: number;          // 件数 (default: 30, max: 100)
  sort?: 'stars' | 'forks' | 'updated';  // ソート条件
  order?: 'asc' | 'desc';     // ソート順
}

// Response
interface SearchResponse {
  items: Repository[];
  total_count: number;
  incomplete_results: boolean;
  has_next_page: boolean;
  current_page: number;
  per_page: number;
}

// Error Response
interface ApiError {
  error: string;
  message: string;
  status: number;
}
```

#### 2.3.2 詳細取得API (`/api/repositories/[owner]/[name]`)

```typescript
// Response
interface RepositoryDetailResponse extends Repository {
  readme?: string;            // README内容
  topics: string[];          // トピック
  license?: {               // ライセンス情報
    name: string;
    spdx_id: string;
  };
  contributors_count?: number; // コントリビューター数
  default_branch: string;     // デフォルトブランチ
}
```

### 2.4 状態管理設計

#### 2.4.1 SearchStore (Zustand)

```typescript
interface SearchState {
  // 検索状態
  query: string;
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  
  // ページネーション
  currentPage: number;
  hasMore: boolean;
  totalCount: number;
  
  // フィルター・ソート
  sort: 'stars' | 'forks' | 'updated';
  order: 'asc' | 'desc';
  
  // アクション
  setQuery: (query: string) => void;
  setRepositories: (repositories: Repository[]) => void;
  appendRepositories: (repositories: Repository[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
```

#### 2.4.2 UIStore (Zustand)

```typescript
interface UIState {
  // グローバルUI状態
  theme: 'light' | 'dark';
  
  // モーダル・ダイアログ
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  
  // 通知
  notifications: Notification[];
  
  // アクション
  setTheme: (theme: 'light' | 'dark') => void;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}
```

## 3. 技術選定

### 3.1 使用技術・ライブラリ

#### 3.1.1 フロントエンド

| 技術 | バージョン | 選定理由 |
|------|------------|----------|
| **Next.js** | 15.4.5 | **App Router必須**、Server Components、RSC対応 |
| **React** | 19.1.0 | UI構築、Server Components対応、並行機能 |
| **TypeScript** | 5.x | 型安全性、App Router完全対応 |
| **HeroUI** | 2.8.2 | React 19対応、アクセシビリティ |
| **Tailwind CSS** | 4.x | ユーティリティファースト、App Router最適化 |

#### 3.1.2 状態管理・データフェッチ

| 技術 | バージョン | 選定理由 |
|------|------------|----------|
| **Zustand** | 5.0.7 | 軽量、シンプルなAPI、TypeScript対応 |
| **SWR** | 2.3.4 | キャッシュ、リアルタイム更新、エラーハンドリング |

#### 3.1.3 テスト・品質管理ツール

| 技術 | バージョン | 選定理由 |
|------|------------|----------|
| **Jest** | 30.0.5 | React Testing Library統合、App Router対応 |
| **@testing-library/react** | 16.3.0 | Server/Client Components対応 |
| **@testing-library/jest-dom** | 6.6.4 | DOM assertion拡張 |
| **Playwright** | 1.54.1 | E2Eテスト、クロスブラウザ対応 |

#### 3.1.4 開発・ビルドツール

| 技術 | バージョン | 選定理由 |
|------|------------|----------|
| **npm** | latest | 標準パッケージマネージャー |
| **ESLint** | 9.x | App Router対応ルール |
| **Prettier** | latest | コードフォーマッター |
| **Husky** | 9.1.7 | Git hooks、テスト自動実行 |

### 3.2 選定理由詳細

#### 3.2.1 HeroUI vs 他のUIライブラリ

**選定理由:**
- モダンなデザインシステム
- React Server Components対応
- 優れたアクセシビリティ
- TypeScript完全対応
- 軽量なバンドルサイズ

**代替案検討:**
- **Chakra UI**: 機能豊富だがバンドルサイズが大きい
- **Material-UI**: 成熟しているがデザインの制約が多い
- **Ant Design**: 企業向けで個人プロジェクトには重い

#### 3.2.2 Zustand vs 他の状態管理

**選定理由:**
- 軽量（2KB未満）
- ボイラープレート不要
- TypeScript完全対応
- 学習コストが低い

**代替案検討:**
- **Redux Toolkit**: 高機能だが複雑
- **Context API**: パフォーマンス問題
- **Jotai**: 原子的だが学習コスト高

## 4. セキュリティ設計

### 4.1 脆弱性対策

#### 4.1.1 XSS対策

```typescript
// 安全なデータレンダリング
const SafeDescription: React.FC<{ description: string }> = ({ description }) => {
  // DOMPurifyを使用してHTMLサニタイズ
  const sanitizedDescription = DOMPurify.sanitize(description);
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
      className="text-default-600"
    />
  );
};
```

#### 4.1.2 CSRF対策

```typescript
// Next.js API Routes での CSRF 対策
import { headers } from 'next/headers';

export async function POST(request: Request) {
  const headersList = headers();
  const origin = headersList.get('origin');
  const host = headersList.get('host');
  
  // Origin ヘッダーの検証
  if (!origin || !origin.includes(host!)) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // 処理続行
}
```

#### 4.1.3 レート制限

```typescript
// GitHub API レート制限の管理
class RateLimitManager {
  private requests: Map<string, number[]> = new Map();
  
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];
    
    // 直近1時間のリクエスト数をチェック
    const recentRequests = userRequests.filter(
      time => now - time < 60 * 60 * 1000
    );
    
    return recentRequests.length < 60; // GitHub API制限に合わせる
  }
}
```

### 4.2 データ保護

#### 4.2.1 個人情報の取り扱い

```typescript
// 個人情報を含まないデータモデル
interface PublicRepository {
  id: number;
  name: string;
  description: string | null;
  // 個人情報（メールアドレス等）は除外
  owner: {
    login: string;        // 公開情報のみ
    avatar_url: string;   // 公開情報のみ
    // private情報は取得・保存しない
  };
}
```

#### 4.2.2 通信の暗号化

```typescript
// HTTPS強制設定
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};
```

## 5. パフォーマンス設計

### 5.1 ローディング戦略

#### 5.1.1 コード分割

```typescript
// ページレベルでの動的インポート
const RepositoryDetail = dynamic(
  () => import('@/components/RepositoryDetail'),
  {
    loading: () => <Loading />,
    ssr: false // 必要に応じてSSRを無効化
  }
);

// コンポーネントレベルでの遅延読み込み
const InfiniteScroll = lazy(
  () => import('@/components/InfiniteScroll')
);
```

#### 5.1.2 画像最適化

```typescript
// Next.js Image コンポーネントの活用
import Image from 'next/image';

const AvatarImage: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <Image
    src={src}
    alt={alt}
    width={40}
    height={40}
    className="rounded-full"
    loading="lazy"
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
  />
);
```

### 5.2 キャッシュ戦略

#### 5.2.1 SWRキャッシュ設定

```typescript
// SWR グローバル設定
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5分間隔でバックグラウンド更新
  dedupingInterval: 10 * 1000,    // 10秒間の重複リクエスト防止
  errorRetryCount: 3,
  shouldRetryOnError: (error) => {
    // 4xx エラーはリトライしない
    return error.status >= 500;
  }
};
```

#### 5.2.2 API レスポンスキャッシュ

```typescript
// Next.js API Routes でのキャッシュ設定
export async function GET(request: Request) {
  const response = await fetch('https://api.github.com/search/repositories', {
    // GitHub API リクエスト
  });
  
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      // 5分間キャッシュ、10分間stale可能
    }
  });
}
```

### 5.3 バンドル最適化

#### 5.3.1 webpack設定

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // プロダクションビルドでの最適化
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
};
```

## 6. エラーハンドリング

### 6.1 エラー処理方針

#### 6.1.1 エラー分類

```typescript
enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

interface AppError extends Error {
  type: ErrorType;
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}
```

#### 6.1.2 エラーハンドラー

```typescript
class ErrorHandler {
  static handle(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }
    
    if (error instanceof Response) {
      return this.handleApiError(error);
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new AppError('ネットワークエラーが発生しました', ErrorType.NETWORK_ERROR);
    }
    
    return new AppError('予期しないエラーが発生しました', ErrorType.UNKNOWN_ERROR);
  }
  
  private static handleApiError(response: Response): AppError {
    switch (response.status) {
      case 403:
        return new AppError('API利用制限に達しました', ErrorType.RATE_LIMIT_ERROR);
      case 404:
        return new AppError('リポジトリが見つかりません', ErrorType.NOT_FOUND_ERROR);
      case 422:
        return new AppError('検索条件が正しくありません', ErrorType.VALIDATION_ERROR);
      default:
        return new AppError('APIエラーが発生しました', ErrorType.API_ERROR);
    }
  }
}
```

### 6.2 ログ設計

#### 6.2.1 ログレベル

```typescript
enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}
```

#### 6.2.2 ログ出力

```typescript
class Logger {
  static error(message: string, error?: Error, context?: Record<string, unknown>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: {
        ...context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }
    };
    
    // 開発環境ではコンソール出力
    if (process.env.NODE_ENV === 'development') {
      console.error(JSON.stringify(logEntry, null, 2));
    }
    
    // 本番環境では外部ログサービスに送信
    // 例: Sentry, LogRocket, Datadog など
  }
}
```

### 6.3 監視設計

#### 6.3.1 パフォーマンス監視

```typescript
// Web Vitals の測定
export function reportWebVitals(metric: NextWebVitalsMetric) {
  switch (metric.name) {
    case 'CLS':
    case 'FID':
    case 'FCP':
    case 'LCP':
    case 'TTFB':
      // メトリクスを外部サービスに送信
      sendToAnalytics(metric);
      break;
  }
}

function sendToAnalytics(metric: NextWebVitalsMetric) {
  // Vercel Analytics, Google Analytics 等に送信
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      event_label: metric.id
    });
  }
}
```

#### 6.3.2 エラー監視

```typescript
// React Error Boundary
class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  { hasError: boolean }
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // エラー情報を外部サービスに送信
    Logger.error('React Error Boundary', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => this.setState({ hasError: false })} />;
    }
    
    return this.props.children;
  }
}
```

## 7. テスト設計

### 7.1 テスト戦略（App Router対応）

#### 7.1.1 App Router テストピラミッド

```
        ┌─────────────┐
        │    E2E      │  ← 15% (Playwright + App Router)
        │   Tests     │
        └─────────────┘
      ┌─────────────────┐
      │  Integration    │  ← 25% (API Routes + Components)
      │     Tests       │
      └─────────────────┘
    ┌───────────────────────┐
    │    Unit Tests         │  ← 60% (Server/Client Components)
    └───────────────────────┘
```

#### 7.1.2 App Router テスト分類

**Server Components テスト**
- RSC (React Server Components) のレンダリングテスト
- Server Actions のテスト
- データフェッチングロジックのテスト

**Client Components テスト**
- インタラクション（onClick、onChange）のテスト
- 状態管理（useState、useEffect）のテスト
- ユーザーイベントのテスト

**API Routes テスト**
- GET /api/repositories/search/route.ts
- GET /api/repositories/[owner]/[name]/route.ts
- エラーレスポンスの処理

#### 7.1.2 テスト設定

```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

---

**文書情報**
- 作成日: 2025-08-01
- 更新日: 2025-08-01  
- バージョン: 1.0
- 承認者: [未承認]