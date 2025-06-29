# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

My Beer Log は GPS ベースの醸造所チェックイン機能を持つクラフトビール記録アプリケーションです。現在は MVP フェーズ 1 の初期開発段階で、基本的なアカウント管理と位置情報ベースの醸造所訪問機能に焦点を当てています。

## アーキテクチャ

AWS ベースのサーバーレスアプリケーションで、以下の構成です：

- **フロントエンド**: 静的 HTML/CSS/JS（予定：Next.js + React + TypeScript + Tailwind + shadcn/ui）
- **バックエンド**: Beego フレームワークの Go アプリケーション（Go + REST API + クリーンアーキテクチャ）
- **データベース**: Amazon RDS 上の PostgreSQL
- **認証**: AWS Cognito
- **インフラ**: AWS CloudFormation（S3 + CloudFront + API Gateway + Lambda + RDS）

## 主要コンポーネント

### データベーススキーマ（database.dbml）

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
  - **商用リリース対応（2025年1月追加）**:
    - 構造化ログ（logrus）による JSON/テキスト出力対応
    - リクエストID追跡とパニック復旧ミドルウェア
    - 統一エラーレスポンス構造とエラーハンドリング
    - API Gateway Cognito Authorizer 連携強化
    - セキュリティヘッダーと環境別CORS設定
    - 拡張ヘルスチェック（DB接続・環境変数チェック）
- **フロントエンド**: 基本的な HTML テンプレート（`front/index.html`）
- **ツール**: 位置情報取得ツール（`tool/get_target_geo/`）
- **ドキュメント**: 日本語での包括的な計画書（API仕様、権限マトリックス含む）

## 開発コマンド

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

#### 環境別デプロイ

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

#### Lambdaコードのデプロイ準備

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

### プロジェクト構造管理

プロジェクトは構造化されたドキュメントアプローチに従います：

1. **docs/marketing/**: ビジネス計画（リーンキャンバス、顧客分析）
2. **docs/product/**: 機能仕様とユーザーフロー
3. **docs/architect/**: 技術アーキテクチャとデータベース設計
4. **docs/api/**: OpenAPI仕様と権限マトリックス

## 開発ノート

### 認証フロー

- ユーザー管理に AWS Cognito を使用
- ユーザープロファイルは`cognito_sub`を一意識別子として PostgreSQL に保存
- API Gateway Cognito Authorizerにより事前にJWT検証が完了
- Lambda環境では以下のヘッダーからCognito情報を取得：
  - `X-Cognito-Sub`: Cognito Sub ID
  - `X-Amzn-Cognito-Sub`: AWS Lambda Proxy統合用
  - `X-Cognito-Groups`: Cognitoグループ情報（管理者権限判定用）
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
Docker環境では `back/docker-compose.yml` で PostgreSQL コンテナが自動構成されます。
設定は `back/conf/app.conf` で管理されています。

**開発用環境変数例:**
```bash
# ログ設定
export LOG_LEVEL=debug
export LOG_FORMAT=text

# CORS設定（開発環境）
export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8080"

# アプリケーション情報
export APP_VERSION=development
```

### 重要なファイル依存関係

- CloudFormation テンプレートは Lambda デプロイ用の S3 バケット`beerlog-app-back`を参照
- データベーススキーマは `back/init-db/01_create_tables.sql` で定義
- サンプルデータは `back/init-db/02_sample_data.sql` で提供
- API仕様は `docs/api/openapi.yml` で定義
- フロントエンドデプロイは CloudFront ディストリビューションを持つ S3 バケットを対象

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
│       ├── middleware.go    # CORS・パニック復旧・ログミドルウェア
│       └── test_auth.go     # 開発環境用認証
├── front/                   # フロントエンド（HTML/CSS/JS）
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

## 商用リリース対応実装詳細

### 認証・セキュリティ

#### Cognito認証フロー
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
- Strict-Transport-Security（HTTPS環境のみ）

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
- 自動生成されるリクエストID
- パニック復旧による可用性確保
- エラーレスポンスの統一化

### エラーハンドリング

#### 統一エラーレスポンス
```json
{
  "error": "ユーザー向けメッセージ",
  "code": "ERROR_CODE",
  "message": "内部エラー詳細（開発時のみ）",
  "details": {"field": "validation info"},
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
- ステータス別HTTPコード返却

#### CORS設定
```bash
# 開発環境
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8080"

# 本番環境
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 開発支援

#### テスト認証機能
開発環境では`utils/test_auth.go`によりテストトークンで認証をシミュレート

#### ミドルウェア階層
1. パニック復旧（最優先）
2. リクエストログ
3. セキュリティヘッダー
4. CORS

この実装により、**商用リリース準備完了**状態を実現しています。
