# My Beer Log - AWS インフラ構成図

## 概要

このドキュメントでは、My Beer Log アプリケーションの AWS インフラストラクチャを可視化したアーキテクチャ図について説明します。

## 目的

- **理解促進**: 複雑な AWS インフラ構成を視覚的に理解しやすくする
- **ドキュメント化**: アーキテクチャの設計意図と構成要素を明確に文書化する
- **コミュニケーション**: チームメンバーや関係者との技術的な議論を円滑にする
- **運用支援**: システムの運用・保守時の参考資料として活用する

## 図の種類

### 1. 全体アーキテクチャ図 (`beer_log_overall_architecture.png`)

**目的**: AWS インフラ全体の俯瞰的な構成を示す

**含まれる要素**:

- VPC 構成（パブリック/プライベートサブネット）
- コンピューティングリソース（Lambda、EC2）
- データベース（RDS PostgreSQL Multi-AZ）
- API・認証（API Gateway、Cognito）
- ストレージ・CDN（S3、CloudFront）
- セキュリティ（Security Groups、IAM Roles）
- 外部接続（Internet Gateway、VPC Endpoints）

**特徴**:

- トップダウン（TB）レイアウトで階層構造を表現
- AWS クラウド内の論理的なグルーピング
- 主要なデータフローと依存関係を可視化

## 技術仕様

### 生成ツール

- **Python diagrams**: v0.23.x 以上
- **Graphviz**: グラフ描画エンジン
- **出力形式**: PNG 画像

### ファイル構成

```
docs/architect/diagrams/
├── beer_log_overall_architecture.png      # 全体アーキテクチャ
```

## セットアップと使用方法

### 1. 依存関係のインストール

```bash
# Python diagrams ライブラリのインストール
pip install diagrams>=0.23.0

# Graphviz のインストール
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# CentOS/RHEL
sudo yum install graphviz
```

### 2. 図の生成

```bash
# リポジトリルートから実行
python generate_diagrams.py
```

### 3. 出力確認

生成された PNG ファイルは `docs/architect/diagrams/` ディレクトリに保存されます。

## アーキテクチャ詳細解説

### VPC 設計思想

**Multi-AZ 構成**:

- 高可用性を確保するため 2 つの Availability Zone を使用
- パブリック/プライベートサブネットの適切な分離

**ネットワークセグメンテーション**:

- パブリックサブネット: NAT Gateway
- プライベートサブネット: アプリケーションとデータベース用

### セキュリティ設計

**多層防御**:

1. **ネットワークレベル**: VPC、サブネット、Security Groups
2. **アプリケーションレベル**: Cognito 認証、API Gateway Authorizer
3. **データレベル**: RDS 暗号化、Secrets Manager
4. **アクセス制御**: IAM Roles、最小権限の原則

**プライベート配置**:

- Lambda 関数、EC2 インスタンス、RDS はプライベートサブネット内
- VPC Endpoints で AWS サービスへのプライベート接続

### データベース設計

**Multi-AZ RDS**:

- 高可用性: プライマリ/スタンバイ構成
- 自動フェイルオーバー機能
- バックアップ保持期間の環境別設定

**接続制御**:

- Security Group でプライベートサブネット内からのみアクセス許可
- Secrets Manager による認証情報の安全な管理

### API アーキテクチャ

**Serverless 設計**:

- API Gateway + Lambda によるサーバーレス構成
- Go (Beego) によるクリーンアーキテクチャ実装
- 自動スケーリングとコスト効率

**認証・認可**:

- Cognito User Pool による統一認証
- JWT トークンベースの認証
- API Gateway レベルでの認可制御

## 関連ドキュメント

- [CloudFormation テンプレート](../../infra/beerlog_template.yml)
- [データベース設計](./database.dbml)
- [API 仕様](../api/openapi.yml)
- [技術スタック](./techstack.md)
