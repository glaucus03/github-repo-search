# Claude Code プロジェクトテンプレート

このテンプレートは、Claude Codeを使用したプロジェクト開発において、言語・フレームワークに依存しない基本的な設定ファイルを提供します。

## 📋 含まれるファイル

### Claude Code専用設定
- `CLAUDE.md` - プロジェクト固有の指示書テンプレート
- `.claude.json` - MCP servers基本設定
- `.claude/settings.local.json` - ローカル設定サンプル

### バージョン管理
- `.gitignore` - 汎用的な除外設定
- `.gitattributes` - Git属性設定（改行コード、バイナリファイル識別）

### エディタ・開発環境
- `.editorconfig` - エディタ設定統一

### その他
- `.env.example` - 環境変数サンプル
- `.github/workflows/claude-code.yml` - GitHub Actions基本設定

## 🚀 使い方

1. このテンプレートを新しいプロジェクトにコピー
2. `CLAUDE.md` を編集してプロジェクト固有の情報を記載
3. `.claude.json` でMCPサーバーの設定を調整
4. `.env.example` を参考に環境変数を設定
5. プロジェクトに応じて他の設定ファイルを追加

## 📝 カスタマイズ例

### プロジェクトタイプ別の追加設定

#### Node.js/TypeScript プロジェクト
```bash
# 追加で必要なファイル
package.json
tsconfig.json
eslint.config.js
.prettierrc
```

#### Python プロジェクト
```bash
# 追加で必要なファイル
requirements.txt
pyproject.toml
.flake8
```

#### Go プロジェクト
```bash
# 追加で必要なファイル
go.mod
go.sum
```

## 🔧 Claude Code設定

### MCP Servers
デフォルトで以下のMCPサーバーが設定されています：
- `filesystem` - ファイルシステム操作
- `git` - Git操作
- `time` - 時間関連機能

### カスタムMCPサーバーの追加
`.claude.json` に新しいサーバーを追加できます：

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "your-mcp-server"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## 📋 Slash Commands

`.claude/commands/` ディレクトリに仕様書駆動開発をサポートするコマンドが含まれています：

### 基本的なワークフロー

1. **`/steering-init`** - プロジェクトの基本ドキュメントを初期化
   - product.md（プロダクト概要）
   - tech.md（技術スタック）
   - structure.md（プロジェクト構造）

2. **`/spec-init`** - 新機能の仕様書作成プロセスを開始

3. **`/spec-requirements`** - 要件定義書を作成

4. **`/spec-design`** - 技術設計書を作成

5. **`/spec-tasks`** - 実装タスクリストを作成

6. **`/spec-status`** - プロジェクトの進捗状況を確認

7. **`/steering-update`** - 実装完了後、ステアリングドキュメントを更新

### 個人開発専用コマンド

8. **`/personal-dev-init`** - 個人開発プロジェクトの初期設定
9. **`/mvp-check`** - MVP開発の進捗チェック
10. **`/personal-dev-feedback`** - フィードバック分析と改善計画

### 使用例

#### 仕様書駆動開発
```
# プロジェクト開始時
/steering-init

# 新機能開発時
/spec-init ユーザー認証機能を追加したい
/spec-requirements
/spec-design
/spec-tasks

# 進捗確認
/spec-status

# 完了後
/steering-update
```

#### 個人開発
```
# 個人開発開始時
/personal-dev-init

# MVP完成チェック
/mvp-check

# フィードバック分析
/personal-dev-feedback
```

## 📚 CLAUDE.mdの書き方

`CLAUDE.md` には以下の情報を記載してください：

1. プロジェクトの概要と目的
2. 使用している技術スタック
3. プロジェクト構造
4. コーディング規約
5. 重要な制約事項
6. 開発フロー
7. よく使うコマンド

### 個人開発向けガイドライン

このテンプレートには個人開発に特化したガイドラインも含まれています：

- **開発フェーズ管理**: 0→1、1→10、10→100の段階的アプローチ
- **アンチパターンの回避**: 完璧主義やスコープクリープの防止
- **ベストプラクティス**: 継続的な改善とユーザー中心の開発
- **技術スタック推奨**: 2025年時点での個人開発向け技術選定

詳細は[個人開発ガイドライン](https://izanami.dev/kojin-kaihatsu)を参照してください。

## 🤝 貢献

改善提案や新しい設定ファイルの追加は、Issueまたはプルリクエストでお知らせください。

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🙏 謝辞

このテンプレートは、日本のエンジニアコミュニティのベストプラクティスを参考に作成されました。
