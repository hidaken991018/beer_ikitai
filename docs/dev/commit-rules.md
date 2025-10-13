# コミットルール

## 概要

My Beer Log プロジェクトにおけるコミットメッセージの統一ルールです。AIと人間の両方が理解しやすく、効率的な開発を可能にするための規約を定めています。

## 基本構造

```
<type>[scope]: <summary>

<body>

[footer]
```

### 構造の詳細

- **type**: 変更の種類（必須）
- **scope**: 変更の対象範囲（任意、推奨）
- **summary**: 変更の要約（必須、50文字以内）
- **body**: 変更の詳細説明（任意、72文字で改行）
- **footer**: Breaking Changes や Issue への参照（任意）

## コミットタイプ

| タイプ | 説明 | 例 |
|--------|------|-----|
| `feat` | 新機能の追加 | `feat[front]: ユーザー醸造所検索機能を追加` |
| `fix` | バグの修正 | `fix[back]: GPS座標の精度問題を修正` |
| `docs` | ドキュメントの変更 | `docs: READMEにAPI仕様書のリンクを追加` |
| `style` | フォーマット、セミコロンなどのコード整形 | `style[front]: ESLintルールに従ってコード整形` |
| `refactor` | リファクタリング（機能変更なし） | `refactor[back]: Visit エンティティの構造を最適化` |
| `test` | テストの追加・修正 | `test[back]: Brewery Repository のテストケース追加` |
| `chore` | ビルド、設定ファイルの変更 | `chore: package.json の依存関係を更新` |
| `perf` | パフォーマンス改善 | `perf[back]: データベースクエリの最適化` |
| `ci` | CI/CD設定の変更 | `ci: GitHub Actions ワークフローを追加` |

## スコープ

| スコープ | 対象 | 説明 |
|----------|------|------|
| `front` | フロントエンド | Next.js, React, TypeScript, Tailwind, shadcn/ui |
| `back` | バックエンド | Go, Beego, PostgreSQL, Lambda |
| `infra` | インフラ | CloudFormation, AWS サービス, Docker |
| `docs` | ドキュメント | マークダウンファイル、API仕様書 |
| `api` | API関連 | OpenAPI仕様、エンドポイント |

## コミットメッセージの例

### 良い例

```
feat[front]: GPS位置情報を使用した醸造所検索機能を実装

ユーザーの現在位置から半径5km以内の醸造所を表示する機能を追加。
Geolocation API を使用して位置情報を取得し、醸造所データベースから
距離順でソートした結果を表示する。

- GPS座標の取得と権限確認
- 距離計算アルゴリズムの実装
- 検索結果のUI表示

Closes #45
```

```
fix[back]: Visit作成時のタイムゾーン問題を修正

UTC時刻での保存時にローカル時刻が適切に変換されない問題を修正。
PostgreSQLでのタイムスタンプ処理にtime.UTC指定を追加。

修正前: ローカル時刻がUTCとして誤保存
修正後: 正しいUTC時刻での保存

Fixes #52
```

### 悪い例

```
fix: バグ修正
```
→ 何のバグなのか、どう修正したのかが不明

```
Update code
```
→ 何をアップデートしたのか、理由が不明

## 変更理由の記載

すべてのコミットメッセージには**変更理由**を明記することを必須とします。

### 記載方法

1. **Body部分**に変更の背景と理由を記述
2. **修正前/修正後**の状態を明示（バグ修正の場合）
3. **影響範囲**を明記（大きな変更の場合）

### 例

```
refactor[back]: Repository パターンの実装を改善

クリーンアーキテクチャの原則に従い、依存関係の方向を修正。
Domain LayerがInfrastructure Layerに依存していた問題を解決。

変更理由:
- テストの容易性向上
- 依存関係の逆転原則の適用
- 将来的なデータベース変更への対応

影響範囲:
- Brewery, User, Visit の各Repository
- 対応するUseCase層
- テストコードの構造
```

## Breaking Changes

互換性を破る変更の場合は、フッターに`BREAKING CHANGE:`を記載します。

```
feat[api]: 認証システムをCognito JWTに変更

従来のセッションベース認証からJWTトークンベース認証に移行。
セキュリティ強化とスケーラビリティ向上を実現。

BREAKING CHANGE: 
既存のセッション認証APIは削除されました。
フロントエンドでは新しいJWT認証フローに対応が必要です。

Migration Guide: docs/api/auth-migration.md
```

## コミット粒度

### 推奨される粒度

- **1つのコミット = 1つの論理的な変更**
- **関連する変更をまとめる**（テストとコードは同一コミット）
- **独立した変更は分離する**（機能追加とリファクタリングは別コミット）

### 例

✅ **良い粒度**
```
feat[front]: 醸造所詳細ページコンポーネント実装

醸造所の詳細情報を表示するページを追加。
GPS座標、営業時間、レビュー情報を含む完全な詳細画面。

- BreweryDetail コンポーネント実装
- 対応するテストケース追加
- APIエンドポイントとの連携
```

❌ **悪い粒度**
```
feat: 複数機能の追加

醸造所詳細ページ、ユーザープロファイル編集、
検索機能の改善、バグ修正を実施。
```

## ツール連携

将来的な導入検討項目：

### commitlint
```bash
# package.json
"devDependencies": {
  "@commitlint/cli": "^17.0.0",
  "@commitlint/config-conventional": "^17.0.0"
}
```

### husky
```bash
# commit-msg フック
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

## 注意事項

1. **言語**: コミットメッセージは日本語で記述
2. **文字数制限**: 
   - サマリー: 50文字以内
   - 本文: 72文字で改行
3. **句読点**: サマリーには句点（。）を付けない
4. **動詞**: 過去形ではなく現在形で記述（「追加した」ではなく「追加」）
5. **Issue参照**: 関連するIssueがある場合は必ず参照を記載

## 参考資料

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Versioning](https://semver.org/)

---

このドキュメントは開発チームの効率性向上とコード品質維持を目的として策定されています。
疑問や改善提案がある場合は、開発チームまでお知らせください。