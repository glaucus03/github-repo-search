# プロジェクト構造

## ディレクトリ構成

```
task-github-search/
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API Routes
│   │   │   └── repositories/ # GitHub API関連エンドポイント
│   │   ├── repository/    # リポジトリ詳細ページ
│   │   │   └── [owner]/   # 動的ルーティング
│   │   │       └── [name]/
│   │   ├── globals.css    # グローバルスタイル
│   │   ├── layout.tsx     # ルートレイアウト
│   │   ├── providers.tsx  # プロバイダー設定
│   │   └── page.tsx       # ホームページ（検索画面）
│   ├── components/        # UIコンポーネント
│   │   ├── ui/            # 基本UIコンポーネント
│   │   ├── SEO/           # SEO関連コンポーネント
│   │   ├── Navigation.tsx # ナビゲーション
│   │   ├── RepositoryCard.tsx # リポジトリカード
│   │   ├── Pagination.tsx # ページネーション
│   │   └── ...            # その他コンポーネント
│   ├── lib/               # ユーティリティとライブラリ
│   │   ├── github-api.ts  # GitHub API クライアント
│   │   ├── env.ts         # 環境変数管理
│   │   ├── utils.ts       # 共通ユーティリティ
│   │   ├── constants.ts   # 定数定義
│   │   ├── validators.ts  # バリデーション
│   │   ├── errorHandler.ts # エラーハンドリング
│   │   ├── search-domain.ts # 検索ドメインロジック
│   │   ├── storage.ts     # ローカルストレージ管理
│   │   └── seo.ts         # SEO関連ユーティリティ
│   ├── hooks/             # カスタムReact Hooks
│   │   ├── useRepositorySearch.ts # 検索フック
│   │   ├── useRepositoryDetail.ts # 詳細取得フック
│   │   ├── useLiveSearch.ts # リアルタイム検索フック
│   │   └── useDebounce.ts # デバウンス処理フック
│   ├── store/             # 状態管理（Zustand）
│   │   ├── searchStore.ts # 検索状態管理
│   │   └── uiStore.ts     # UI状態管理
│   ├── types/             # TypeScript型定義
│   │   ├── github.ts      # GitHub API型定義
│   │   └── index.ts       # 共通型定義
│   └── config/            # 設定ファイル
├── public/                # 静的ファイル
├── docs/                  # ドキュメント
│   ├── steering/          # プロジェクト設計ドキュメント
│   └── specs/             # 機能仕様書
├── e2e/                   # E2Eテスト
├── .env.example           # 環境変数サンプル
├── .gitignore
├── next.config.ts         # Next.js設定
├── package.json
├── tailwind.config.ts     # Tailwind CSS設定
├── tsconfig.json          # TypeScript設定
└── README.md
```

## 主要コンポーネント構成

### コアコンポーネント（src/components/）

#### ナビゲーション・レイアウト

```
Navigation.tsx             # ヘッダーナビゲーション
ErrorBoundary.tsx          # エラー境界
NotificationSystem.tsx     # 通知システム
InitializationProvider.tsx # 初期化プロバイダー
```

#### 検索・表示機能

```
RepositoryCard.tsx         # リポジトリカード表示
SearchForm.tsx             # 検索フォーム
SearchResults.tsx          # 検索結果表示
Pagination.tsx             # ページネーション
LoadingSpinner.tsx         # ローディングスピナー・スケルトン
MarkdownPreview/           # Markdownプレビュー
```

#### SEO・構造化データ

```
SEO.tsx                    # SEO機能統合コンポーネント
                          # - 構造化データ
                          # - パンくずリスト
                          # - SEO監視（開発用）
```

### ページ構成（src/app/）

#### メインページ

- `/` - 検索ホームページ
- `/repository/[owner]/[name]` - リポジトリ詳細ページ

#### API Routes

- `/api/repositories/search` - GitHub検索API
- `/api/repositories/[owner]/[name]` - リポジトリ詳細API

## データフロー

### 検索フロー

1. ユーザーが検索クエリを入力
2. リアルタイム検索結果数取得（useLiveSearch）
3. デバウンス処理による最適化された検索実行
4. GitHub API経由でリポジトリデータ取得
5. 結果をページネーション付きで表示
6. ヘッダーアイコンクリックで初期状態にリセット

### リポジトリ詳細フロー

1. リポジトリカードクリック
2. 動的ルーティングで詳細ページ遷移
3. リポジトリ詳細情報・README・言語統計を並行取得
4. オーナーアバター付きで詳細画面に統合表示
5. README画像の自動GitHub rawURL変換

### API認証フロー

1. 環境変数からGitHub Personal Access Token取得
2. API リクエストのAuthorizationヘッダーに設定
3. レート制限緩和とプライベートリポジトリアクセス

## 状態管理（Zustand Store）

### searchStore

- 検索クエリと結果
- ページネーション状態
- 検索履歴
- フィルター設定

### uiStore

- 通知メッセージ
- ローディング状態
- 検索フォーム展開状態
- ソート・順序設定

## API設計

### GitHub API統合

- Search Repositories エンドポイントの活用
- Personal Access Token による認証
- レート制限の管理とエラーハンドリング
- 再試行機能付きリクエスト

### 内部API設計

- Next.js API Routes による実装
- RESTful API設計原則
- 適切なHTTPステータスコード
- 統一されたエラーレスポンス形式

## セキュリティ考慮事項

### API セキュリティ

- 環境変数による安全なトークン管理
- CORS設定とセキュリティヘッダー
- 入力値の検証とサニタイズ

### フロントエンド セキュリティ

- XSS対策（適切なエスケープ処理）
- 安全なMarkdownレンダリング
- セキュアな外部リンク処理

## パフォーマンス最適化

### フロントエンド

- React 19の最新機能活用
- コンポーネントの適切なメモ化
- 効率的なページネーション実装
- リアルタイム検索結果数表示

### API・データ取得

- SWRによる効率的なキャッシュ戦略
- 並行データ取得による高速化
- GitHub APIレート制限の最適利用
