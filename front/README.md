# My Beer Log - Frontend

クラフトビール愛好家のための GPS ベースの醸造所チェックインアプリケーション。位置情報を活用して近くの醸造所を発見し、訪問記録を管理できます。

## プロジェクト概要

My Beer Log は GPS ベースの醸造所チェックイン機能を持つクラフトビール記録アプリケーションです。現在は **MVP フェーズ 1** の開発段階で、以下の基本機能に焦点を当てています：

- 🏭 **醸造所検索**: GPS 位置情報を使用した近隣醸造所の検索
- 📍 **位置ベースチェックイン**: 醸造所での訪問記録とタイムスタンプ管理
- 👤 **ユーザープロファイル**: AWS Cognito による安全な認証とプロファイル管理
- 📱 **レスポンシブデザイン**: モバイルファーストのユーザー体験

## 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Component Library**: shadcn/ui + Radix UI
- **Icons**: Lucide React

### 状態管理・データフェッチング

- **State Management**: Redux Toolkit
- **Data Fetching**: SWR (Stale-While-Revalidate)
- **Form Handling**: React Hook Form (予定)

### 認証・AWS連携

- **Authentication**: AWS Amplify + Cognito
- **API Client**: カスタム API クライアント

### 開発ツール

- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Next.js config
- **Type Checking**: TypeScript
- **Formatting**: Prettier

## アーキテクチャ概要

```
├── AWS クラウド
│   ├── Cognito (認証)
│   ├── API Gateway + Lambda (バックエンド Go API)
│   ├── RDS PostgreSQL (データベース)
│   └── S3 + CloudFront (フロントエンド配信)
├── Next.js フロントエンド
│   ├── App Router (ルーティング)
│   ├── Redux Toolkit (状態管理)
│   ├── SWR (データフェッチング)
│   └── Tailwind + shadcn/ui (UI)
```

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` ファイルを作成し、環境変数を設定してください：

```bash
cp .env.local.example .env.local
```

#### モック開発環境（推奨）

外部サービス不要でローカル開発ができます：

```bash
# モックモードを有効化
NEXT_PUBLIC_USE_MOCK=true

# アプリケーション設定
NEXT_PUBLIC_APP_NAME="My Beer Log"
NEXT_PUBLIC_APP_ENV=development
```

#### 本番環境設定

AWS Cognito と実際のバックエンド API を使用：

```bash
# AWS Cognito 設定
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=your-client-id

# API 設定
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.ap-northeast-1.amazonaws.com/prod
```

### 3. AWS Amplify 設定

AWS Amplify CLI をインストールして設定：

```bash
npm install -g @aws-amplify/cli
amplify configure
amplify init
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## 🛠️ モック開発環境

外部サービス（AWS Cognito、バックエンドAPI）に依存せずにローカル環境で完全に動作するモック機能を提供しています。

### モック機能の特徴

- **API モック**: 醸造所データ、ユーザー情報、チェックイン機能を完全模擬
- **認証モック**: ログイン・ログアウト・登録機能をローカルでシミュレート
- **位置情報モック**: 東京エリアの複数地点をプリセットとして選択可能
- **リアルタイム切り替え**: 開発中にブラウザ上でモック/本番を切り替え可能

### モック機能の使用方法

#### 1. 環境変数での有効化

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK=true
```

#### 2. ブラウザ上での設定

開発モードで起動すると、画面右下にモック設定パネルが表示されます：

- **Mock API**: APIモックのON/OFF
- **Mock 認証**: 認証モックのON/OFF
- **Mock 位置情報**: 位置情報モックのON/OFF
- **現在地選択**: 東京駅、渋谷、新宿など複数地点から選択
- **自動ログイン**: テストユーザーで自動ログイン
- **設定リセット**: 全モック設定をクリア

#### 3. テストユーザー

モック認証で使用できるテストアカウント：

| ユーザー     | メールアドレス    | パスワード |
| ------------ | ----------------- | ---------- |
| ビール太郎   | test@example.com  | Test123!   |
| ホップ子     | test2@example.com | Test123!   |
| デモユーザー | demo@example.com  | Demo123!   |

#### 4. サンプルデータ

モック環境では以下のデータが利用可能：

- **醸造所**: 東京エリア8か所の醸造所データ
- **訪問履歴**: テストユーザーの過去の訪問記録
- **位置情報**: 東京駅、渋谷、新宿、原宿、浅草、横浜、鎌倉の座標データ

### 本番環境への切り替え

モック環境から本番環境への切り替えは簡単：

1. `.env.local` で `NEXT_PUBLIC_USE_MOCK=false` に設定
2. AWS Cognito の設定値を追加
3. バックエンドAPIのURLを設定
4. アプリケーションを再起動

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページ（レイアウトグループ）
│   │   ├── login/         # ログインページ
│   │   └── register/      # 登録ページ
│   ├── brewery/           # 醸造所関連ページ
│   │   ├── [id]/          # 醸造所詳細ページ（動的ルート）
│   │   ├── nearby/        # 近隣醸造所ページ
│   │   └── page.tsx       # 醸造所一覧ページ
│   ├── profile/           # ユーザープロファイルページ
│   ├── visits/            # 訪問履歴ページ
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/            # 再利用可能なコンポーネント
│   ├── auth/             # 認証関連コンポーネント
│   ├── brewery/          # 醸造所関連コンポーネント
│   ├── error/            # エラーハンドリング
│   ├── layout/           # レイアウトコンポーネント
│   └── ui/               # shadcn/ui コンポーネント
├── hooks/                # カスタムフック
│   ├── useAuth.ts        # 認証管理
│   ├── useBreweries.ts   # 醸造所データ管理
│   └── useGeolocation.ts # 位置情報管理
├── lib/                  # ユーティリティ・設定
│   ├── api/              # API クライアント
│   ├── auth/             # AWS Amplify 設定
│   ├── constants.ts      # 定数定義
│   └── utils.ts          # ヘルパー関数
├── store/                # Redux Toolkit store
│   └── slices/           # Redux slices
│       ├── authSlice.ts  # 認証状態管理
│       └── brewerySlice.ts # 醸造所状態管理
└── types/                # TypeScript 型定義
    ├── api.ts            # API レスポンス型
    ├── auth.ts           # 認証関連型
    └── brewery.ts        # 醸造所関連型
```

### 設計思想

- **Clean Architecture**: ドメインロジック、インフラストラクチャ、プレゼンテーション層の分離
- **Component-Based**: 再利用可能な小さなコンポーネントによる構成
- **TypeScript First**: 型安全性を重視した開発
- **Mobile First**: レスポンシブデザインでモバイル体験を優先

## 開発コマンド

### 基本的な開発コマンド

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start
```

### コード品質管理

```bash
# ESLint実行
npm run lint

# ESLint自動修正
npm run lint:fix

# TypeScript型チェック
npm run type-check

# Prettier自動フォーマット
npm run format
```

### テスト

```bash
# テスト実行
npm run test

# テスト監視モード
npm run test:watch

# CI用テスト（カバレッジ付き）
npm run test:ci
```

## 主要機能

### 🔐 認証システム

- **AWS Cognito**: セキュアなユーザー認証・認可
- **JWT トークン**: セッション管理とAPI認証
- **プロファイル管理**: ユーザー情報の登録・更新

### 🏭 醸造所機能

- **位置情報検索**: GPS を使用した近隣醸造所の検索
- **醸造所詳細**: 営業時間、住所、評価などの詳細情報表示
- **お気に入り**: 醸造所のブックマーク機能

### 📍 チェックイン機能

- **位置ベースチェックイン**: GPS 位置確認による醸造所訪問記録
- **訪問履歴**: タイムスタンプ付きの訪問履歴管理
- **統計情報**: 訪問回数、お気に入り醸造所の分析

### 📱 ユーザー体験

- **レスポンシブデザイン**: スマートフォン、タブレット、デスクトップ対応
- **PWA対応**: オフライン機能とアプリライクな体験
- **アクセシビリティ**: WCAG 2.1 準拠のユニバーサルデザイン

## バックエンドAPI連携

### API 構成

- **バックエンド**: Go + Beego フレームワーク
- **アーキテクチャ**: Clean Architecture によるレイヤー分離
- **API Gateway**: AWS API Gateway による Lambda プロキシ統合
- **認証**: Cognito Authorizer による JWT 検証

### 認証フロー

1. **フロントエンド**: Amplify Auth による Cognito 認証
2. **トークン取得**: Access Token、ID Token、Refresh Token
3. **API リクエスト**: Authorization ヘッダーに Bearer Token 付与
4. **API Gateway**: Cognito Authorizer による Token 検証
5. **Lambda**: 検証済み Cognito Sub による API 処理

### エンドポイント例

```typescript
// 醸造所検索
GET /api/breweries?lat={lat}&lng={lng}&radius={radius}

// 醸造所詳細
GET /api/breweries/{id}

// チェックイン
POST /api/visits
{
  "brewery_id": "uuid",
  "latitude": 35.6762,
  "longitude": 139.6503,
  "comment": "素晴らしいビールでした！"
}

// 訪問履歴
GET /api/visits?user_id={cognito_sub}

// ユーザープロファイル
GET /api/users/profile
PUT /api/users/profile
```

## テスト

### テスト戦略

- **Unit Tests**: 個別コンポーネント・フック・ユーティリティのテスト
- **Integration Tests**: API 連携、状態管理の統合テスト
- **E2E Tests**: ユーザーフロー全体のテスト（将来実装予定）

### テスト環境

- **フレームワーク**: Jest + React Testing Library
- **モック**: MSW (Mock Service Worker) による API モック
- **カバレッジ**: 80% 以上を目標

### テスト実行

```bash
# 全テスト実行
npm run test

# 監視モードでテスト実行
npm run test:watch

# カバレッジレポート生成
npm run test:ci
```

## デプロイ

### AWS インフラ構成

- **S3**: 静的ファイルホスティング
- **CloudFront**: CDN による高速配信
- **Route 53**: カスタムドメイン管理
- **Certificate Manager**: SSL/TLS 証明書

### デプロイ手順

#### 1. ビルド

```bash
npm run build
```

#### 2. S3 デプロイ

```bash
# 静的ファイルをS3バケットにアップロード
aws s3 sync out/ s3://your-bucket-name --delete

# CloudFront キャッシュ無効化
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### 3. 環境変数設定

本番環境では以下の環境変数を設定：

```bash
NEXT_PUBLIC_AWS_REGION=ap-northeast-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=prod-user-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=prod-client-id
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### CI/CD パイプライン

- **GitHub Actions**: プッシュ時の自動テスト・ビルド・デプロイ
- **環境分離**: development、staging、production の3環境
- **ブランチ戦略**: GitFlow による機能開発・リリース管理

## 今後の拡張予定

### フェーズ 2 機能

- **バッジシステム**: 訪問実績に基づく achievement 機能
- **ソーシャル機能**: 友達フォロー、チェックイン共有
- **レビューシステム**: 醸造所・ビールのレーティング

### 技術的改善

- **PWA化**: Service Worker によるオフライン対応
- **パフォーマンス最適化**: 画像最適化、コード分割
- **アクセシビリティ向上**: スクリーンリーダー対応強化

## 開発者向け情報

### コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Request を作成

### コーディング規約

- **ESLint**: Next.js 推奨設定 + カスタムルール
- **Prettier**: 自動フォーマット設定
- **Conventional Commits**: コミットメッセージの統一
- **TypeScript**: 厳格な型チェック設定

### サポート

質問やバグ報告は GitHub Issues までお願いします。
