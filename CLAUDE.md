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
- **フロントエンド**: 基本的な HTML テンプレート（`front/index.html`）
- **ドキュメント**: 日本語での包括的な計画書

## 開発コマンド

### インフラ

```bash
# CloudFormationスタックのデプロイ
aws cloudformation deploy --template-file infra/beerlog_template.yml --stack-name beerlog-stack --capabilities CAPABILITY_IAM

# デプロイ用のLambdaコードパッケージ化
cd back && zip -r ../lambda-deployment.zip . && cd ..
```

### プロジェクト構造管理

プロジェクトは構造化されたドキュメントアプローチに従います：

1. **docs/marketing/**: ビジネス計画（リーンキャンバス、顧客分析）
2. **docs/product/**: 機能仕様とユーザーフロー
3. **docs/architect/**: 技術アーキテクチャとデータベース設計

## 開発ノート

### 認証フロー

- ユーザー管理に AWS Cognito を使用
- ユーザープロファイルは`cognito_sub`を一意識別子として PostgreSQL に保存
- Lambda 関数は API Gateway 統合を通じてユーザーコンテキストを受信

### GPS 統合

- 醸造所の場所は緯度/経度座標で保存
- GPS ベースのチェックイン用の訪問追跡を計画
- 将来のイテレーションでバッジシステムを計画

### 環境設定

Lambda 関数は以下の環境変数を期待：

- `DB_HOST`: RDS エンドポイント
- `DB_USER`: データベースユーザー名（Secrets Manager から）
- `DB_PASS`: データベースパスワード（Secrets Manager から）
- `DB_NAME`: データベース名

### 重要なファイル依存関係

- CloudFormation テンプレートは Lambda デプロイ用の S3 バケット`beerlog-app-back`を参照
- データベーススキーマは特定のテーブル構造を持つ PostgreSQL を想定
- フロントエンドデプロイは CloudFront ディストリビューションを持つ S3 バケットを対象

## 対話のプロセス

1. **業務分析**: まず要求を分析し、docs ディレクトリ配下の既存ドキュメントと照合する
2. **タスク化**: 明確なタスクリストを作成し、TodoWrite ツールで管理する
3. **docs 正規化**: docs/ 配下のドキュメントを正とし、矛盾がある場合は確認を求める
4. **変更承認**: 要求が既存の仕様や実装から変更となる場合は、その旨を明示し承認を得る
5. **実装**: 承認後に実装を進める
