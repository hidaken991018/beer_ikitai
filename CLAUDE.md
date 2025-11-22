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

### インフラ

#### バックエンドインフラ環境別デプロイ

```bash
# 開発環境のデプロイ
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-dev-stack \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM

# ステージング環境のデプロイ
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-staging-stack \
  --parameter-overrides Environment=staging DBInstanceClass=db.t3.small \
  --capabilities CAPABILITY_NAMED_IAM

# 本番環境のデプロイ
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-prod-stack \
  --parameter-overrides Environment=prod DBInstanceClass=db.t3.medium \
  --capabilities CAPABILITY_NAMED_IAM

# カスタムパラメータでのデプロイ例
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-custom-stack \
  --parameter-overrides \
    Environment=staging \
    DBInstanceClass=db.t3.small \
    LambdaDeploymentBucket=my-custom-bucket \
    LambdaCodeKey=my-lambda-code.zip \
  --capabilities CAPABILITY_NAMED_IAM
```

#### バックエンド Lambda コードのデプロイ準備

```bash
# デプロイ用のLambdaコードパッケージ化
cd back && zip -r ../lambda-deployment.zip . && cd ..

# S3バケットにアップロード（環境別）
aws s3 cp lambda-deployment.zip s3://beerlog-app-back/lambda-deployment.zip

# 特定環境用のコードアップロード
aws s3 cp lambda-deployment.zip s3://my-custom-bucket/my-lambda-code.zip
```

#### スタック管理

```bash
# スタック一覧表示
aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# 特定スタックの詳細表示
aws cloudformation describe-stacks --stack-name beerlog-dev-stack

# スタックの出力値取得
aws cloudformation describe-stacks \
  --stack-name beerlog-dev-stack \
  --query 'Stacks[0].Outputs'

# スタック削除
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

#### 本番環境（Lambda）

Lambda 関数は以下の環境変数を期待：

**データベース設定:**

- `DB_HOST`: RDS エンドポイント
- `DB_USER`: データベースユーザー名（Secrets Manager から）
- `DB_PASS`: データベースパスワード（Secrets Manager から）
- `DB_NAME`: データベース名
- `DB_PORT`: データベースポート（デフォルト: 5432）
- `DB_SSLMODE`: SSL モード（本番: require, 開発: disable）

**ログ設定:**

- `LOG_LEVEL`: ログレベル（debug, info, warn, error, fatal）
- `LOG_FORMAT`: ログフォーマット（json, text）

**アプリケーション設定:**

- `APP_VERSION`: アプリケーションバージョン
- `ALLOWED_ORIGINS`: 許可するオリジンのカンマ区切りリスト

#### 開発環境（Docker）

Docker 環境では `back/docker-compose.yml` で PostgreSQL コンテナが自動構成されます。
設定は `back/conf/app.conf` で管理されています。

**開発用環境変数例:**

```bash
# ログ設定
export LOG_LEVEL=debug
export LOG_FORMAT=text

# CORS設定はAPI Gatewayで実施（バックエンドでは削除済み）
# ローカル開発ではNext.jsプロキシでCORS問題を回避

# アプリケーション情報
export APP_VERSION=development
```

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
│   │   │   ├── map/        # マップページ（Mapbox統合）
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

## 商用リリース対応実装詳細

### 認証・セキュリティ

#### Cognito 認証フロー

```go
// BaseController内での認証取得
func (c *BaseController) GetCognitoSub() (string, error) {
    // API Gateway Cognito Authorizerが設定するヘッダーから取得
    headers := []string{
        "X-Cognito-Sub",                    // Cognito Authorizer
        "X-Amzn-Cognito-Sub",              // AWS Lambda Proxy統合
        "X-Amz-User-Sub",                  // カスタムヘッダー
        "X-User-Sub",                      // カスタムヘッダー
    }
}
```

#### セキュリティヘッダー

- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security（HTTPS 環境のみ）

### ログ・モニタリング

#### 構造化ログ設定

```bash
# 本番環境（JSON形式）
LOG_LEVEL=info
LOG_FORMAT=json

# 開発環境（テキスト形式）
LOG_LEVEL=debug
LOG_FORMAT=text
```

#### リクエスト追跡

- 自動生成されるリクエスト ID
- エラーレスポンスの統一化

### エラーハンドリング

#### 統一エラーレスポンス

```json
{
  "error": "ユーザー向けメッセージ",
  "code": "ERROR_CODE",
  "message": "内部エラー詳細（開発時のみ）",
  "details": { "field": "validation info" },
  "request_id": "req_123456789",
  "timestamp": "2025-01-27T10:00:00Z"
}
```

#### エラーコード体系

- UNAUTHORIZED: 認証エラー
- VALIDATION_FAILED: 入力検証エラー
- NOT_FOUND: リソース不存在
- INTERNAL_SERVER_ERROR: システムエラー

### 運用・監視

#### ヘルスチェック拡張

- データベース接続状態確認
- 必要環境変数の存在確認
- アプリケーションバージョン情報
- ステータス別 HTTP コード返却

#### CORS 設定

**本番・ステージング環境：**
- API Gateway で CORS を制御（CloudFormation テンプレートで設定済み）
- バックエンドソフトウェアでは CORS ミドルウェアを削除済み

**ローカル開発環境：**
- Next.js プロキシ機能で CORS 問題を回避
- `/api/*` → `http://localhost:8080/*` への自動プロキシ設定
- `front/next.config.ts` で設定済み

### 開発支援

#### テスト認証機能

開発環境では`utils/test_auth.go`によりテストトークンで認証をシミュレート

#### ミドルウェア階層

1. パニック復旧（最優先）
2. リクエストログ
3. セキュリティヘッダー

**注：** CORS ミドルウェアは削除済み（API Gateway で制御）

この実装により、**商用リリース準備完了**状態を実現しています。

## フロントエンド実装詳細

### モバイルファーストアーキテクチャ（2025年1月実装）

#### MobileLayout コンポーネント

**ファイル:** `front/src/components/layout/MobileLayout.tsx`

**機能:**
- PC表示時は `max-w-[448px]` でモバイルサイズに制限
- 中央配置 + 背景グレー表示でアプリ外を明示
- ボトムナビゲーション対応の余白管理（`pb-[77px]`）

**使用パターン:**
```typescript
<MobileLayout showBottomNav={true}>
  <div className="p-4 pb-20">
    {/* コンテンツ */}
  </div>
  <BottomNavigation />
</MobileLayout>
```

#### BottomNavigation コンポーネント

**ファイル:** `front/src/components/layout/BottomNavigation.tsx`

**デザイン仕様:**
- Figmaデザイン準拠（node-id=1:770）
- 3タブ構成：マップ（Map）・履歴（History）・プロフィール（User）
- アクティブ状態：オレンジ色（`#e17100`）
- 非アクティブ状態：グレー（`#6a7282`）
- 固定配置（`fixed bottom-0`）、高さ77px

**表示対象:**
- ✅ `/map` - マップページ
- ✅ `/visits` - 訪問履歴ページ
- ✅ `/profile` - プロフィールページ
- ❌ `/` - ランディングページ
- ❌ `/auth/*` - 認証ページ

### Mapbox統合（2025年1月実装）

**依存関係:**
```json
{
  "react-map-gl": "^7.1.7",
  "mapbox-gl": "^3.10.0",
  "@types/mapbox-gl": "^3.4.1"
}
```

**環境変数:**
```bash
# .env.local（必須）
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...
```

**実装場所:** `front/src/app/map/page.tsx`

**主要機能:**
1. **地図表示**: Mapboxの街路地図スタイル、日本語ラベル対応
2. **現在地表示**: Geolocation API、青色マーカー + 範囲サークル
3. **醸造所マーカー**: カスタムビールアイコン、訪問済み/未訪問で色分け可能
4. **Bottom Sheet**: 店舗情報カード（店名、住所、距離表示）
5. **チェックイン機能**: 100m以内判定、認証状態確認
6. **ナビゲーション**: 現在地ボタン、地図操作コントロール

**実装パターン:**
```typescript
import Map, { Marker, NavigationControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  mapStyle="mapbox://styles/mapbox/streets-v12"
  // ...
>
  <NavigationControl position="top-left" />
  <Marker longitude={lng} latitude={lat}>
    {/* カスタムマーカー */}
  </Marker>
</Map>
```

### Redux型定義（2025年1月追加）

**ファイル:** `front/src/store/hooks.ts`

**型定義:**
```typescript
import type { store } from './store';

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

**使用パターン:**

**既存ページ（互換性重視）:**
```typescript
import { useSelector } from 'react-redux';
const authState = useSelector((state: any) => state.auth);
```

**新規ページ（型安全推奨）:**
```typescript
import { useAppSelector } from '@/store/hooks';
const authState = useAppSelector((state) => state.auth);
```

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

### 削除されたコンポーネント（2025年1月）

**理由: モバイルファーストアーキテクチャへの移行**

**削除されたファイル:**
- `front/src/components/layout/Header.tsx` - ボトムナビゲーションに置き換え

**削除されたルート:**
- `/brewery` - 醸造所一覧（マップに統合）
- `/brewery/[id]` - 醸造所詳細（マップに統合）
- `/brewery/nearby` - 近隣醸造所（マップに統合）

**プライベートフォルダ（保持）:**
- `front/src/app/_brewery/*` - Next.js仕様により `_` で始まるフォルダはルーティング対象外
- 保持理由: 将来的な再利用の可能性、コンポーネント参照用

**ルーティング設定更新:**
```typescript
// front/src/lib/constants.ts
export const ROUTES = {
  home: '/',
  login: '/auth/login',
  register: '/auth/register',
  profile: '/profile',
  profileCreate: '/profile/create',
  map: '/map',           // 新規追加
  visits: '/visits',
  // 削除: breweries, breweryDetail, nearbyBreweries
} as const;
```

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
