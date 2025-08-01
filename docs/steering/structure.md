# プロジェクト構造

## ディレクトリ構成

```
task-github-search/
├── src/                    # ソースコード
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/        # 認証関連ページ
│   │   ├── (dashboard)/   # ダッシュボード関連ページ
│   │   ├── api/           # API Routes
│   │   ├── globals.css    # グローバルスタイル
│   │   ├── layout.tsx     # ルートレイアウト
│   │   └── page.tsx       # ホームページ
│   ├── components/        # UIコンポーネント
│   │   ├── ui/            # 基本UIコンポーネント（shadcn/ui）
│   │   ├── forms/         # フォームコンポーネント
│   │   ├── layout/        # レイアウトコンポーネント
│   │   └── features/      # 機能別コンポーネント
│   ├── lib/               # ユーティリティとライブラリ
│   │   ├── auth.ts        # 認証ロジック
│   │   ├── database.ts    # データベース設定
│   │   ├── github.ts      # GitHub API クライアント
│   │   └── utils.ts       # 共通ユーティリティ
│   ├── hooks/             # カスタムReact Hooks
│   ├── store/             # 状態管理（Zustand）
│   ├── types/             # TypeScript型定義
│   └── styles/            # スタイル関連ファイル
├── public/                # 静的ファイル
├── docs/                  # ドキュメント
│   └── steering/          # プロジェクト設計ドキュメント
├── .env.local             # 環境変数（ローカル）
├── .gitignore
├── next.config.js         # Next.js設定
├── package.json
├── tailwind.config.js     # Tailwind CSS設定
├── tsconfig.json          # TypeScript設定
└── README.md
```

## 主要コンポーネント構成

### 機能別コンポーネント（src/components/features/）

#### 検索機能
```
search/
├── SearchForm.tsx         # 検索フォーム
├── SearchFilters.tsx      # 検索フィルター
├── SearchResults.tsx      # 検索結果一覧
├── RepositoryCard.tsx     # リポジトリカード
└── SearchHistory.tsx      # 検索履歴
```

#### タスク管理機能
```
tasks/
├── TaskList.tsx           # タスク一覧
├── TaskItem.tsx           # 個別タスク
├── TaskForm.tsx           # タスク作成・編集フォーム
├── TaskFilters.tsx        # タスクフィルター
└── TaskStats.tsx          # タスク統計
```

#### ユーザー機能
```
user/
├── UserProfile.tsx        # ユーザープロフィール
├── UserSettings.tsx       # ユーザー設定
└── AuthButton.tsx         # 認証ボタン
```

### ページ構成（src/app/）

#### 公開ページ
- `/` - ランディングページ
- `/about` - サービス紹介

#### ダッシュボード（認証必須）
- `/dashboard` - メインダッシュボード
- `/dashboard/search` - リポジトリ検索
- `/dashboard/tasks` - タスク管理
- `/dashboard/favorites` - お気に入りリポジトリ
- `/dashboard/settings` - ユーザー設定

#### API Routes
- `/api/auth/callback` - OAuth認証コールバック
- `/api/github/search` - GitHub検索API
- `/api/tasks` - タスクCRUD API
- `/api/user` - ユーザー情報API

## データフロー

### 認証フロー
1. GitHub OAuth認証
2. Supabaseでユーザー情報管理
3. セッション状態の管理

### 検索フロー
1. フロントエンドから検索クエリ送信
2. GitHub API経由でデータ取得
3. 結果の表示と保存機能

### タスク管理フロー
1. リポジトリからタスク作成
2. Supabaseでタスクデータ管理
3. リアルタイム更新機能

## 状態管理（Zustand Store）

### authStore
- ユーザー認証状態
- ユーザー情報
- ログイン・ログアウト処理

### searchStore
- 検索クエリとフィルター
- 検索結果
- 検索履歴

### taskStore
- タスク一覧
- フィルター状態
- CRUD操作

### uiStore
- モーダル表示状態
- ローディング状態
- 通知メッセージ

## データベース設計（Supabase）

### テーブル構成

#### users
- id (UUID, PK)
- github_id (Integer, Unique)
- username (Text)
- avatar_url (Text)
- email (Text)
- created_at (Timestamp)
- updated_at (Timestamp)

#### repositories
- id (UUID, PK)
- github_id (Integer, Unique)
- name (Text)
- full_name (Text)
- description (Text)
- url (Text)
- stars (Integer)
- language (Text)
- created_at (Timestamp)

#### tasks
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- repository_id (UUID, FK → repositories.id)
- title (Text)
- description (Text)
- status (Enum: pending, in_progress, completed)
- priority (Enum: low, medium, high)
- due_date (Date)
- created_at (Timestamp)
- updated_at (Timestamp)

#### user_repositories（お気に入り）
- id (UUID, PK)
- user_id (UUID, FK → users.id)
- repository_id (UUID, FK → repositories.id)
- created_at (Timestamp)

## API設計

### GitHub API統合
- 検索エンドポイントの活用
- レート制限の管理
- エラーハンドリング

### 内部API設計
- RESTful API設計
- 適切なHTTPステータスコード
- エラーレスポンスの統一

## セキュリティ考慮事項

### 認証・認可
- JWT トークンの適切な管理
- API アクセス制御
- CSRF対策

### データ保護
- 個人情報の適切な管理
- SQLインジェクション対策
- XSS対策

## パフォーマンス最適化

### フロントエンド
- コンポーネントの最適化
- レイジーローディング
- 画像最適化

### バックエンド
- データベースクエリ最適化
- キャッシュ戦略
- API レスポンスの最適化