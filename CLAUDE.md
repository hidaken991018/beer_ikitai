# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

My Beer Log は GPS ベースの醸造所チェックイン機能を持つクラフトビール記録アプリケーションです。現在は MVP フェーズ 1 の初期開発段階で、基本的なアカウント管理と位置情報ベースの醸造所訪問機能に焦点を当てています。

## ドキュメント管理

プロジェクトは構造化されたドキュメントアプローチに従います：

1. **docs/marketing/**: ビジネス計画（リーンキャンバス、顧客分析）
2. **docs/product/**: 機能仕様とユーザーフロー
3. **docs/architect/**: 技術アーキテクチャとデータベース設計
4. **docs/api/**: OpenAPI 仕様と権限マトリックス

## アーキテクチャ

AWS ベースのサーバーレスアプリケーションで、以下の構成です：

- **フロントエンド**: Next.js + React + TypeScript + Tailwind + shadcn/ui（AWS Amplify 手動デプロイ）
- **バックエンド**: Beego フレームワークの Go アプリケーション（Go + REST API + クリーンアーキテクチャ）
- **データベース**: Amazon RDS 上の PostgreSQL
- **認証**: AWS Cognito
- **インフラ**: AWS CloudFormation（API Gateway + Lambda + RDS + Cognito）

## 主要コンポーネント

### データベーススキーマ（database.dbml）(https://dbdocs.io/hidaken991018/MyBeerLog)

- **Brewery**: GPS 座標を含む醸造所情報
- **UserProfile**: Cognito sub ID に連携されたユーザープロファイル
- **Visit**: タイムスタンプ付きのユーザー醸造所訪問記録

### インフラ（infra/beerlog_template.yml）

完全な AWS CloudFormation テンプレートで以下を定義：

- 2 つの AZ にまたがるパブリック/プライベートサブネットを持つ VPC
- Secrets Manager 統合を持つ RDS PostgreSQL インスタンス
- プライベートサブネット内の Lambda 関数
- Lambda プロキシ統合を持つ API Gateway
- OAC を使用した静的ホスティング用の S3 + CloudFront
- 認証用の Cognito User Pool

### 現在の実装状況

- **バックエンド**: Go + Beego による REST API 実装（完全なクリーンアーキテクチャ構成、Docker 環境対応）
  - Controllers: brewery, user, visit, health, test の各エンドポイント実装済み
  - Domain Layer: Entity, Repository, UseCase の分離実装済み
  - Infrastructure Layer: DTO, Mapper による API インターフェース実装済み
  - データベース初期化スクリプトとサンプルデータ準備済み
  - **商用リリース対応（2025 年 1 月追加）**: NOTE 実装要確認
    - 構造化ログ（logrus）による JSON/テキスト出力対応
    - リクエスト ID 追跡とパニック復旧ミドルウェア
    - 統一エラーレスポンス構造とエラーハンドリング
    - API Gateway Cognito Authorizer 連携強化
    - セキュリティヘッダー設定（CORS設定はAPI Gatewayで実施）
    - 拡張ヘルスチェック（DB 接続・環境変数チェック）
- **フロントエンド**: Next.js + React + TypeScript によるモバイルファーストSPA
  - **モバイルファーストアーキテクチャ（2025年1月実装）**:
    - MobileLayout: max-w-[448px]でモバイルサイズに制限、PC背景グレー表示
    - BottomNavigation: Figmaデザイン準拠の3タブナビゲーション（マップ・履歴・プロフィール）
    - 主要ページ: `/map`（マップ）、`/visits`（訪問履歴）、`/profile`（プロフィール）
  - **Mapbox統合**: react-map-gl + mapbox-gl による地図表示、醸造所マーカー、チェックイン機能
  - **Redux状態管理**: 認証・醸造所データの集中管理、型付きフック（useAppSelector/useAppDispatch）
  - **shadcn/ui**: 統一されたUIコンポーネントライブラリ
- **ツール**: 位置情報取得ツール（`tool/get_target_geo/`）
- **ドキュメント**: 日本語での包括的な計画書（API 仕様、権限マトリックス含む）

## 開発コマンド

### フロントエンド（Next.js）

```bash
# 依存関係のインストール
cd front && npm install

# 開発サーバー起動
cd front && npm run dev

# ビルド
cd front && npm run build

# TypeScript型チェック
cd front && npm run type-check

# ESLintチェック
cd front && npm run lint

# Jestテスト
cd front && npm test

# 品質チェック一括実行
cd front && npm run check
```

**環境変数設定（.env.local）:**

```bash
# Mapbox設定（必須）
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here

# API設定（オプション、デフォルト: http://localhost:8080）
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### バックエンド（Go）

```bash
# 開発環境のセットアップ
cd back && make setup

# アプリケーションのビルドと実行（開発モード）
cd back && make run

# 本番ライクなログ設定での実行
cd back && make run-prod

# テスト実行
cd back && make test

# コードフォーマットとLint
cd back && make fmt
cd back && make lint

# すべてのチェック実行
cd back && make check

# Docker環境での実行
cd back && make docker-run
cd back && make docker-stop
```

### インフラ（CloudFormation）

```bash
# デプロイ（環境別にパラメータを調整）
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-{env}-stack \
  --parameter-overrides Environment={env} \
  --capabilities CAPABILITY_NAMED_IAM

# Lambdaコードパッケージ化とアップロード
cd back && zip -r ../lambda-deployment.zip . && cd ..
aws s3 cp lambda-deployment.zip s3://beerlog-app-back/lambda-deployment.zip

# スタック管理
aws cloudformation describe-stacks --stack-name beerlog-dev-stack
aws cloudformation delete-stack --stack-name beerlog-dev-stack
```

## 開発ノート

### 認証フロー

- ユーザー管理に AWS Cognito を使用
- ユーザープロファイルは`cognito_sub`を一意識別子として PostgreSQL に保存
- API Gateway Cognito Authorizer により事前に JWT 検証が完了
- Lambda 環境では以下のヘッダーから Cognito 情報を取得：
  - `X-Cognito-Sub`: Cognito Sub ID
  - `X-Amzn-Cognito-Sub`: AWS Lambda Proxy 統合用
  - `X-Cognito-Groups`: Cognito グループ情報（管理者権限判定用）
- 開発環境ではテストトークン機能で認証をシミュレート

### GPS 統合

- 醸造所の場所は緯度/経度座標で保存
- GPS ベースのチェックイン用の訪問追跡を計画
- 将来のイテレーションでバッジシステムを計画

### 環境設定

**本番環境（Lambda）**: `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_PORT`, `DB_SSLMODE`, `LOG_LEVEL`, `LOG_FORMAT`, `APP_VERSION`, `ALLOWED_ORIGINS`

**開発環境（Docker）**: `back/docker-compose.yml`でPostgreSQLコンテナ自動構成、`back/conf/app.conf`で管理

### 重要なファイル依存関係

- CloudFormation テンプレートは Lambda デプロイ用の S3 バケット`beerlog-app-back`を参照
- データベーススキーマは `back/init-db/01_create_tables.sql` で定義
- サンプルデータは `back/init-db/02_sample_data.sql` で提供
- API 仕様は `docs/api/openapi.yml` で定義
- フロントエンドは AWS Amplify で独立デプロイ

### プロジェクト構造

```
├── back/                     # Go バックエンドアプリケーション
│   ├── controllers/          # HTTP ハンドラー
│   ├── domain/              # ドメインロジック
│   │   ├── entity/          # エンティティ定義
│   │   ├── repository/      # リポジトリインターフェース
│   │   └── usecase/         # ビジネスロジック
│   ├── interfaces/          # 外部インターフェース
│   │   ├── dto/             # データ転送オブジェクト（統一エラーレスポンス含む）
│   │   └── mapper/          # DTO/Entity マッピング
│   ├── models/              # Beego ORM モデル
│   ├── init-db/             # データベース初期化スクリプト
│   └── utils/               # ユーティリティ（商用リリース対応）
│       ├── logger.go        # 構造化ログ（logrus）
│       ├── middleware.go    # パニック復旧・ログ・セキュリティヘッダーミドルウェア
│       └── test_auth.go     # 開発環境用認証
├── front/                   # Next.js フロントエンド（CSR + Amplify デプロイ）
│   ├── src/
│   │   ├── app/            # Next.js App Router ページ
│   │   │   ├── page.tsx    # ランディングページ（Figmaデザイン準拠）
│   │   │   ├── _components/  # ランディングページ固有コンポーネント
│   │   │   │   ├── AppIcon.tsx        # アプリアイコン
│   │   │   │   ├── FeatureCard.tsx    # 機能カード
│   │   │   │   └── CTAButtons.tsx     # CTAボタン
│   │   │   ├── map/        # マップページ（Mapbox統合）
│   │   │   │   ├── page.tsx           # マップページメイン
│   │   │   │   ├── _components/       # マップページ固有コンポーネント
│   │   │   │   │   ├── LoadingScreen.tsx        # ローディング画面
│   │   │   │   │   ├── CurrentLocationMarker.tsx # 現在地マーカー
│   │   │   │   │   ├── TapRoomMarker.tsx        # 醸造所マーカー
│   │   │   │   │   ├── LocateMeButton.tsx       # 現在地ボタン
│   │   │   │   │   └── TapRoomBottomSheet.tsx   # 店舗情報カード
│   │   │   │   └── _domain/           # マップページドメインロジック
│   │   │   │       └── distance.ts    # 距離計算（純粋関数）
│   │   │   ├── visits/     # 訪問履歴ページ
│   │   │   ├── profile/    # プロフィールページ
│   │   │   └── auth/       # 認証ページ（login, register, etc）
│   │   ├── components/
│   │   │   ├── layout/     # レイアウトコンポーネント
│   │   │   │   ├── MobileLayout.tsx       # モバイルサイズコンテナ
│   │   │   │   ├── BottomNavigation.tsx   # ボトムナビゲーション
│   │   │   │   └── AppLayout.tsx          # レガシーレイアウト（認証ページ用）
│   │   │   └── ui/         # shadcn/ui コンポーネント
│   │   ├── store/          # Redux状態管理
│   │   │   ├── store.ts    # ストア設定
│   │   │   ├── hooks.ts    # 型付きフック（useAppSelector/useAppDispatch）
│   │   │   └── slices/     # Redux Toolkit スライス
│   │   ├── hooks/          # カスタムフック
│   │   ├── types/          # 型定義（Brewery, Visit, etc）
│   │   └── lib/            # ユーティリティ・定数
│   └── .env.local          # 環境変数（Mapboxトークンなど）
├── docs/                    # プロジェクトドキュメント
├── infra/                   # AWS CloudFormation テンプレート
└── tool/                    # 開発支援ツール
```

## 対話のプロセス

1. **業務分析**: まず要求を分析し、docs ディレクトリ配下の既存ドキュメントと照合する
2. **タスク化**: 明確なタスクリストを作成し、TodoWrite ツールで管理する
3. **docs 正規化**: docs/ 配下のドキュメントを正とし、矛盾がある場合は確認を求める
4. **変更承認**: 要求が既存の仕様や実装から変更となる場合は、その旨を明示し承認を得る
5. **実装**: 承認後に実装を進める
6. **品質チェック**: 処理変更後は必ず以下のコード品質チェックを実行し、問題がないことを確認する

## コード品質チェック

処理を変更した後は、以下のチェックを必ず実行してコードの品質が問題ないことを確認する：

### フロントエンド（front/）

```bash
# TypeScript型チェック実行
cd front && npm run type-check

# ESLintによるコード品質チェック実行
cd front && npm run lint

# Jestによるテスト実行
cd front && npm test

# Prettierによるコードフォーマット実行
cd front && npm run format

# 品質チェック一括実行
cd front && npm run check
```

**フロントエンド開発環境構築状況（2025 年 1 月更新）**:

- **TypeScript**: 型チェック環境完全構築済み（テストファイル含む）
- **ESLint**: Next.js + TypeScript 対応、import 順序・未使用変数検出強化済み
- **Prettier**: 統一コードフォーマット設定済み（シングルクォート・2 スペースインデント）
- **Jest**: テスト環境構築済み（@testing-library/react, jsdom 対応）
- **品質チェック**: 全ツールが正常動作、CLAUDE.md 品質要件完全対応

### バックエンド（back/）

```bash
# すべてのチェック実行（フォーマット、Lint、テスト）
cd back && make check

# 個別実行の場合
cd back && make fmt     # コードフォーマット
cd back && make lint    # Lintチェック
cd back && make test    # テスト実行
```

### 品質チェック基準

- **TypeScript**: 型エラーが 0 件であること
- **ESLint**: Lint エラー・警告が 0 件であること
- **Jest**: 全テストが通過すること（51 passed）
- **Go**: `make check` が正常完了すること

これらのチェックが全て通過した場合のみ、変更を完了とする。

## 商用リリース対応（2025年1月）

### 認証・セキュリティ
- **Cognito認証**: API Gateway Authorizer経由で`X-Cognito-Sub`等のヘッダーから取得
- **セキュリティヘッダー**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection設定済み
- **開発環境**: `utils/test_auth.go`でテストトークン認証をシミュレート

### ログ・モニタリング
- **構造化ログ**: logrusによるJSON/テキスト出力（`LOG_LEVEL`, `LOG_FORMAT`環境変数で制御）
- **リクエスト追跡**: 自動生成されるリクエストID、統一エラーレスポンス構造
- **ヘルスチェック**: DB接続状態、環境変数、アプリバージョン確認

### エラーハンドリング
- **統一レスポンス**: error, code, message, details, request_id, timestamp
- **エラーコード**: UNAUTHORIZED, VALIDATION_FAILED, NOT_FOUND, INTERNAL_SERVER_ERROR

### CORS設定
- **本番・ステージング**: API Gatewayで制御（CloudFormation設定済み）
- **ローカル開発**: Next.jsプロキシ（`/api/*` → `http://localhost:8080/*`）

### ミドルウェア階層
1. パニック復旧（最優先）
2. リクエストログ
3. セキュリティヘッダー

## フロントエンド実装詳細

### コンポーネントアーキテクチャ（2025年1月実装）

#### コロケーション戦略

ページ固有のコンポーネントは `_components/` に、ドメインロジック（純粋関数）は `_domain/` に配置。Next.jsの `_` プレフィックスによりルーティング対象外。共通コンポーネントは `components/` に配置。詳細は「プロジェクト構造」セクションを参照。

### モバイルファーストアーキテクチャ（2025年1月実装）

**MobileLayout**: `max-w-[448px]`でモバイルサイズ制限、中央配置、余白管理（`pb-[77px]`）

**BottomNavigation**: Figmaデザイン準拠（node-id=1:770）、3タブ構成（マップ・履歴・プロフィール）、固定配置（高さ77px）。表示対象: `/map`, `/visits`, `/profile`

### Mapbox統合（2025年1月実装）

**実装**: `front/src/app/map/page.tsx`、依存: react-map-gl, mapbox-gl、環境変数: `NEXT_PUBLIC_MAPBOX_TOKEN`

**機能**: 地図表示、現在地追跡、醸造所マーカー、チェックイン（100m判定）、Bottom Sheet

**データフロー**: 位置情報取得 → `/breweries/nearby` API呼び出し → Redux状態更新 → UI描画

**ドメインロジック**: `map/_domain/distance.ts`でHaversine公式実装

### Redux状態管理

**型安全フック**: `useAppDispatch`, `useAppSelector`（`front/src/store/hooks.ts`）で型安全性を確保

### 現在のページ構成（2025年1月更新）

```
/ (ランディング)
├── デザイン: Figmaデザイン準拠（node-id=1:565）
├── レイアウト: MobileLayout（ボトムナビなし）
├── 機能: アプリ紹介、CTA（ログイン/ゲスト地図閲覧）
└── ルート: ROUTES.home

/auth/*（認証関連）
├── /auth/login - ログインページ
├── /auth/register - 新規登録ページ
├── /auth/confirm-signup - メール確認ページ
├── レイアウト: AppLayout（レガシー、ボトムナビなし）
└── 認証: AWS Cognito連携

/map（マップ画面）⭐ デフォルト画面
├── レイアウト: MobileLayout + BottomNavigation
├── 機能: Mapbox地図、醸造所マーカー、チェックイン
├── 認証: ゲストOK（チェックインは要認証）
└── ルート: ROUTES.map

/visits（訪問履歴）
├── レイアウト: MobileLayout + BottomNavigation
├── 機能: 統計表示、検索・フィルター、訪問記録一覧
├── 認証: 必須
└── ルート: ROUTES.visits

/profile（プロフィール）
├── レイアウト: MobileLayout + BottomNavigation
├── 機能: プロフィール編集、アカウント管理、ログアウト
├── 認証: 必須
└── ルート: ROUTES.profile
```

## フロントエンド設計方針（2025年1月追加）

### コロケーション戦略

**採用理由:**
- ページ固有のコンポーネントをページディレクトリ内に配置することで、関連コードの近接性を保つ
- `_components`フォルダは Next.js により自動的にルーティング対象外となる
- コンポーネントの依存関係が明確になり、不要なグローバルコンポーネントの削減
- ページ削除時に関連コンポーネントも一緒に削除できる保守性

**適用ルール:**
- ページ専用のUIコンポーネントは `_components/` に配置
- ページ固有のドメインロジック（純粋関数）は `_domain/` に配置
- 複数ページで共有するコンポーネントは `src/components/` に配置
- 全体で共有する型定義は `src/types/` に配置

### ドメインロジック分離の原則

**純粋関数の分離:**
- ビジネスロジックや計算処理は純粋関数として `_domain/` に切り出す
- React フックや状態に依存しない計算ロジックを分離することでテスタビリティを向上
- 例: 距離計算（Haversine formula）を `map/_domain/distance.ts` に分離

**メリット:**
- 単体テストが容易（モックやコンポーネントマウント不要）
- 他のページやコンポーネントでの再利用が可能
- ロジックの変更がUIコンポーネントに影響しない

### 型安全性の徹底

**TypeScript活用:**
- 全コンポーネントで厳密な型定義を適用
- `useAppSelector` / `useAppDispatch` で Redux の型安全性を確保
- API レスポンスの型定義を `src/types/` で一元管理
- `any` 型の使用を最小限に抑える

**型定義の配置:**
```typescript
// src/types/brewery.ts - 醸造所関連の型
// src/types/visit.ts - 訪問記録関連の型
// src/types/user.ts - ユーザー関連の型
```

### コンポーネント設計のベストプラクティス

**単一責任の原則:**
- 各コンポーネントは単一の責任を持つ
- 例: `TapRoomMarker`（マーカー表示）、`TapRoomBottomSheet`（店舗情報表示）を分離

**Props の明示:**
- すべてのコンポーネントで Props インターフェースを定義
- オプショナルなプロパティには `?` を使用
- デフォルト値を適切に設定

**状態管理の階層化:**
1. **ローカル状態**: `useState` でコンポーネント内完結
2. **ページレベル状態**: 親コンポーネントで管理、Props で子に渡す
3. **アプリケーション状態**: Redux で管理（認証、醸造所データなど）

**コンポーネント粒度:**
- 中程度の粒度を基本とする（機能単位）
- 過度な細分化を避け、理解しやすさを優先
- 再利用性が見込まれる場合のみ分離を検討

## フロントエンドデプロイ

### AWS Amplify 手動デプロイ

#### デプロイ方式

- **プラットフォーム**: AWS Amplify Hosting
- **デプロイ**: 手動アップロード（GitHub ワークフロー経由）
- **ビルド**: Next.js CSR アプリケーション
- **環境変数**: Amplifyコンソールで `NEXT_PUBLIC_MAPBOX_TOKEN` を設定

#### 動的ルート対応

- **CSR による実装**: クライアントサイドルーティング（Next.js App Router）
- **useParams()**: URL パラメータの取得
- **API コール**: バックエンドAPIからデータを動的にフェッチ
- **ブラウザルーティング**: 履歴管理とSPA体験の提供

#### GitHub Actions ワークフロー

**CI ワークフロー（frontend-ci.yml）**

- **トリガー**: `front/` ディレクトリの変更時（push/PR）
- **品質チェック**:
  - TypeScript 型チェック (`npm run type-check`)
  - ESLint によるコード品質チェック (`npm run lint`)
  - Jest テスト実行 (`npm run test:ci`)
  - Next.js ビルド確認 (`npm run build`)
  - テストカバレッジレポート生成
```
