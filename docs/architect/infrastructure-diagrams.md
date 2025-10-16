# My Beer Log - AWS インフラ構成図

## 概要

このドキュメントでは、My Beer Log アプリケーションの AWS インフラストラクチャを可視化したアーキテクチャ図について説明します。Python diagrams ライブラリを使用して生成された図は、CloudFormation テンプレート (`infra/beerlog_template.yml`) で定義されたインフラ構成を視覚的に表現しています。

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

### 2. ネットワークアーキテクチャ図 (`beer_log_network_architecture.png`)

**目的**: VPC レベルでのネットワーク構成とルーティングを詳細に示す

**含まれる要素**:
- VPC（10.0.0.0/16）の詳細構成
- 2つの Availability Zone (AZ-A, AZ-B)
- パブリックサブネット（10.0.1.0/24, 10.0.2.0/24）
- プライベートサブネット（10.0.11.0/24, 10.0.12.0/24）
- Internet Gateway とルートテーブル
- VPC Endpoints（SSM、S3 Gateway）
- Multi-AZ RDS 配置

**特徴**:
- ネットワークセグメンテーションの詳細
- ルーティング戦略の可視化
- プライベートサブネット内でのセキュアな配置

### 3. セキュリティアーキテクチャ図 (`beer_log_security_architecture.png`)

**目的**: セキュリティ要素とアクセス制御の仕組みを示す

**含まれる要素**:
- Cognito User Pool による認証
- API Gateway Cognito Authorizer
- Security Groups（Lambda/DB 用、EC2 用）
- IAM Roles（Lambda 実行ロール、EC2 インスタンスロール）
- Secrets Manager による認証情報管理
- S3 暗号化とプライベートアクセス
- RDS 暗号化ストレージ

**特徴**:
- 左右（LR）レイアウトでセキュリティフローを表現
- 認証・認可の流れを明確化
- データ保護メカニズムの可視化

### 4. データフローアーキテクチャ図 (`beer_log_data_flow_architecture.png`)

**目的**: アプリケーションレベルでのデータフローと API 構成を示す

**含まれる要素**:
- クライアントアプリケーション（Next.js、将来のモバイルアプリ）
- API レイヤー（API Gateway、Cognito 認証）
- アプリケーションレイヤー（Go Lambda、ビジネスロジック）
- データレイヤー（PostgreSQL、S3 ストレージ）
- 外部サービス（Maps API）
- CDN 配信（CloudFront）

**特徴**:
- アプリケーションアーキテクチャの階層構造
- ビジネスロジックの分離（Brewery、User、Visit Use Cases）
- データの流れと処理の可視化

## 技術仕様

### 生成ツール

- **Python diagrams**: v0.23.x 以上
- **Graphviz**: グラフ描画エンジン
- **出力形式**: PNG 画像

### ファイル構成

```
docs/architect/diagrams/
├── beer_log_overall_architecture.png      # 全体アーキテクチャ
├── beer_log_network_architecture.png      # ネットワーク構成
├── beer_log_security_architecture.png     # セキュリティ構成
└── beer_log_data_flow_architecture.png    # データフロー構成
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
- 高可用性を確保するため 2つの Availability Zone を使用
- パブリック/プライベートサブネットの適切な分離

**ネットワークセグメンテーション**:
- パブリックサブネット: 将来の NAT Gateway やロードバランサー用
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

## 運用考慮事項

### 監視・ログ

- **CloudWatch Logs**: Lambda 関数のログ出力
- **VPC Flow Logs**: ネットワークトラフィックの監視（必要に応じて有効化）
- **RDS Enhanced Monitoring**: データベースパフォーマンス監視

### バックアップ・災害対策

- **RDS 自動バックアップ**: 環境別保持期間設定
- **Multi-AZ 配置**: 自動フェイルオーバー
- **S3 データ**: 標準で 99.999999999% (11 9's) の耐久性

### スケーリング戦略

- **Lambda**: 自動スケーリング（同時実行数制限あり）
- **RDS**: 必要に応じてインスタンスタイプ変更
- **API Gateway**: トラフィック増加に応じた自動スケーリング

## 今後の拡張計画

### Phase 2 検討事項

1. **WAF (Web Application Firewall)** の導入
2. **ElastiCache** によるキャッシュレイヤー追加
3. **ALB (Application Load Balancer)** による負荷分散
4. **Container 化** (ECS/EKS) への移行検討
5. **CI/CD パイプライン** の AWS CodePipeline 統合

### 追加監視項目

1. **X-Ray** による分散トレーシング
2. **CloudWatch Dashboards** による可視化
3. **AWS Config** による構成管理
4. **AWS Security Hub** によるセキュリティ統合管理

## 関連ドキュメント

- [CloudFormation テンプレート](../../infra/beerlog_template.yml)
- [データベース設計](./database.dbml)
- [API 仕様](../api/openapi.yml)
- [技術スタック](./techstack.md)

## 更新履歴

| 日付 | バージョン | 変更内容 | 作成者 |
|------|------------|----------|--------|
| 2025-01-XX | 1.0.0 | 初版作成、4つのアーキテクチャ図追加 | Claude |

---

**注意**: この図は CloudFormation テンプレート `infra/beerlog_template.yml` の内容を基に生成されています。インフラ構成に変更がある場合は、テンプレート更新後に図も再生成してください。