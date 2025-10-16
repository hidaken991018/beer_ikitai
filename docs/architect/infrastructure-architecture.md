# BeerLog インフラストラクチャ アーキテクチャ

本ドキュメントでは、BeerLog (My Beer Log) アプリケーションの AWS インフラストラクチャ構成を説明します。

## 目次

1. [概要](#概要)
2. [全体アーキテクチャ](#全体アーキテクチャ)
3. [ネットワーク構成](#ネットワーク構成)
4. [データフロー](#データフロー)
5. [環境別構成](#環境別構成)
6. [セキュリティ設計](#セキュリティ設計)
7. [運用・監視](#運用監視)
8. [構成図の更新方法](#構成図の更新方法)

---

## 概要

### アーキテクチャの特徴

- **サーバーレスアーキテクチャ**: Lambda を使用した Go アプリケーション
- **マルチAZ構成**: 可用性を考慮した 2 AZ 構成（本番環境）
- **セキュアなネットワーク**: プライベートサブネットでのアプリケーション実行
- **マネージドサービス活用**: RDS、Cognito、Secrets Manager の利用

### 主要コンポーネント

| カテゴリ | サービス | 用途 |
|---------|---------|------|
| フロントエンド | AWS Amplify | Next.js アプリケーションのホスティング |
| API | API Gateway | REST API エンドポイント |
| 認証 | Cognito User Pool | ユーザー認証・認可 |
| コンピューティング | Lambda (Go) | バックエンド API ロジック |
| データベース | RDS PostgreSQL | ユーザー・醸造所・訪問データ |
| ネットワーク | VPC | 2AZ構成のプライベート/パブリックサブネット |
| シークレット管理 | Secrets Manager | DB認証情報の暗号化保存 |
| 静的コンテンツ | S3 + CloudFront | アイコン画像配信 (OAC) |
| 管理 | EC2 (Systems Manager) | データベース管理用インスタンス |

---

## 全体アーキテクチャ

### 構成図

![BeerLog Architecture Overview](images/beerlog_architecture_overview.png)

*構成図が表示されない場合は、[構成図の更新方法](#構成図の更新方法) を参照してローカルで生成してください。*

### アーキテクチャ説明

#### 1. クライアント層
- **Next.js アプリケーション** (AWS Amplify でホスティング)
  - CSR (Client-Side Rendering) による動的ルーティング
  - Cognito SDK によるユーザー認証
  - API Gateway 経由でバックエンドと通信

#### 2. API・認証層
- **API Gateway**
  - REST API エンドポイント提供
  - Cognito Authorizer による JWT トークン検証
  - Lambda Proxy 統合
  - CORS 設定（本番環境）

- **Cognito User Pool**
  - ユーザー登録・ログイン管理
  - JWT トークン発行
  - メール検証

#### 3. アプリケーション層 (VPC内プライベートサブネット)
- **Lambda Function (Go + Beego)**
  - クリーンアーキテクチャ構成
  - `bootstrap` ハンドラー (provided.al2023 runtime)
  - 環境変数から DB 接続情報を取得
  - Cognito Sub ID を `X-Cognito-Sub` ヘッダーから取得

#### 4. データ層
- **RDS PostgreSQL**
  - Multi-AZ 構成 (本番環境)
  - プライベートサブネット配置
  - Secrets Manager による認証情報管理
  - 自動バックアップ設定

- **Secrets Manager**
  - DB ユーザー名・パスワードの暗号化保存
  - Lambda と RDS からの参照

#### 5. 静的コンテンツ配信
- **S3 Bucket** (アイコン画像)
  - 暗号化有効 (AES256)
  - パブリックアクセスブロック設定
  - CloudFront 経由のみアクセス可能

- **CloudFront Distribution**
  - Origin Access Control (OAC) による S3 アクセス
  - HTTPS 強制リダイレクト
  - キャッシュ最適化

#### 6. 管理・運用
- **EC2 Instance**
  - データベース管理用
  - Systems Manager Session Manager 経由で接続
  - PostgreSQL クライアントインストール済み

- **VPC Endpoints**
  - SSM / SSM Messages / EC2 Messages (Systems Manager 用)
  - S3 Gateway Endpoint (プライベートサブネットから S3 アクセス)

---

## ネットワーク構成

### 構成図

![BeerLog Network Detail](images/beerlog_network_detail.png)

*構成図が表示されない場合は、[構成図の更新方法](#構成図の更新方法) を参照してローカルで生成してください。*

### VPC 設計

#### CIDR ブロック
- **VPC**: `10.0.0.0/16`

#### サブネット構成 (2 AZ)

| サブネット種別 | AZ | CIDR | 用途 |
|--------------|-----|------|------|
| パブリックサブネット A | AZ-1 | `10.0.1.0/24` | 将来的な拡張用 |
| パブリックサブネット B | AZ-2 | `10.0.2.0/24` | 将来的な拡張用 |
| プライベートサブネット A | AZ-1 | `10.0.11.0/24` | Lambda, RDS, EC2 |
| プライベートサブネット B | AZ-2 | `10.0.12.0/24` | Lambda, RDS (Standby) |

#### ルーティング

**パブリックルートテーブル:**
- `0.0.0.0/0` → Internet Gateway

**プライベートルートテーブル:**
- VPC 内通信のみ（インターネットアクセスなし）
- S3 / Systems Manager は VPC Endpoint 経由

### セキュリティグループ

#### 1. Lambda / RDS セキュリティグループ
- **インバウンド**:
  - TCP 5432 (PostgreSQL) ← VPC 内 (`10.0.0.0/16`)
  - TCP 5432 (PostgreSQL) ← EC2 セキュリティグループ
- **アウトバウンド**:
  - 全て許可 (`0.0.0.0/0`)

#### 2. EC2 セキュリティグループ
- **インバウンド**:
  - TCP 443 (HTTPS) ← VPC 内 (`10.0.0.0/16`)
- **アウトバウンド**:
  - 全て許可 (`0.0.0.0/0`)

### VPC Endpoints

| エンドポイント種別 | サービス | タイプ | 用途 |
|------------------|---------|--------|------|
| Interface | `ssm` | Interface | Systems Manager 接続 |
| Interface | `ssmmessages` | Interface | Session Manager 通信 |
| Interface | `ec2messages` | Interface | Session Manager 通信 |
| Gateway | `s3` | Gateway | Lambda からの S3 アクセス |

---

## データフロー

### API リクエストフロー

![BeerLog Data Flow](images/beerlog_data_flow.png)

*構成図が表示されない場合は、[構成図の更新方法](#構成図の更新方法) を参照してローカルで生成してください。*

### リクエスト処理シーケンス

1. **クライアント → API Gateway**
   - Next.js アプリが JWT トークン付きで HTTPS リクエスト送信

2. **API Gateway → Cognito Authorizer**
   - JWT トークンの検証リクエスト

3. **Cognito Authorizer → Cognito User Pool**
   - トークンの署名・有効期限・権限を検証

4. **API Gateway → Lambda**
   - Lambda Proxy 統合でリクエスト転送
   - `X-Cognito-Sub` ヘッダーに Cognito Sub ID を設定
   - `X-Cognito-Groups` ヘッダーにグループ情報を設定

5. **Lambda → Secrets Manager**
   - DB 認証情報取得（初回接続時のみ）

6. **Lambda → RDS PostgreSQL**
   - SQL クエリ実行
   - Cognito Sub ID を使用したデータフィルタリング

7. **RDS → Lambda**
   - クエリ結果を返却

8. **Lambda → API Gateway → クライアント**
   - JSON レスポンスを返却

### 認証・認可フロー

```
ユーザー登録/ログイン:
  Client → Cognito User Pool
    ↓
  JWT トークン発行
    ↓
  Client に保存

API 呼び出し:
  Client → API Gateway (Authorization: Bearer <JWT>)
    ↓
  Cognito Authorizer が JWT 検証
    ↓
  Lambda に Cognito Sub ID を渡す
    ↓
  Lambda が UserProfile テーブルで認証
```

---

## 環境別構成

### 環境パラメータ

| 項目 | dev | staging | prod |
|------|-----|---------|------|
| **RDS インスタンスクラス** | db.t3.micro | db.t3.small | db.t3.medium |
| **RDS Multi-AZ** | false | false | true |
| **バックアップ保持期間** | 1日 | 3日 | 7日 |
| **API ステージ名** | dev | staging | prod |
| **CloudFront Price Class** | PriceClass_100 | PriceClass_100 | PriceClass_All |

### デプロイコマンド例

```bash
# 開発環境
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-dev-stack \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM

# 本番環境
aws cloudformation deploy \
  --template-file infra/beerlog_template.yml \
  --stack-name beerlog-prod-stack \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_NAMED_IAM
```

---

## セキュリティ設計

### 1. ネットワークセキュリティ

#### プライベートサブネット配置
- Lambda、RDS、EC2 は全てプライベートサブネットに配置
- インターネットへの直接アクセス不可
- VPC Endpoints 経由で AWS サービスにアクセス

#### セキュリティグループによるアクセス制御
- 最小権限の原則に基づく設定
- RDS は VPC 内からのみアクセス可能
- EC2 は SSM 経由でのみ接続可能

### 2. 認証・認可

#### Cognito User Pool
- メール検証による本人確認
- JWT トークンベースの認証
- トークン有効期限管理

#### API Gateway Cognito Authorizer
- リクエスト毎に JWT トークン検証
- 不正なトークンは Lambda に到達する前に拒否
- Cognito Sub ID を Lambda に安全に渡す

### 3. データ保護

#### Secrets Manager
- DB 認証情報の暗号化保存
- 自動ローテーション対応（将来的に有効化可能）
- Lambda からの安全な参照

#### S3 暗号化
- サーバーサイド暗号化 (AES256) 有効
- パブリックアクセス完全ブロック
- CloudFront OAC 経由のみアクセス許可

#### RDS
- プライベートサブネット配置
- SSL/TLS 接続対応（`rds.force_ssl: 0` は開発時の設定）
- 自動バックアップ有効

### 4. アクセス制御

#### IAM ロール
- Lambda 実行ロール: CloudWatch Logs, VPC, Secrets Manager アクセス
- EC2 ロール: Systems Manager, CloudWatch, S3 読み取り専用

#### S3 バケットポリシー
- CloudFront ディストリビューションからのみアクセス許可
- 直接アクセスを拒否

---

## 運用・監視

### バックアップ・災害対策

#### RDS 自動バックアップ
- 保持期間: 本番 7日、ステージング 3日、開発 1日
- ポイントインタイムリカバリ対応
- Multi-AZ 構成（本番環境）でフェイルオーバー対応

#### データベース管理
- EC2 インスタンス経由での手動バックアップ・復旧
- Systems Manager Session Manager で安全に接続

### ログ・モニタリング

#### CloudWatch Logs
- Lambda 関数ログ
- API Gateway アクセスログ
- RDS ログ（エラーログ、スロークエリログ）

#### 拡張ヘルスチェック
- Lambda 関数内でデータベース接続確認
- 環境変数の存在チェック
- アプリケーションバージョン情報

### スケーラビリティ

#### Lambda
- 自動スケーリング（同時実行数管理）
- コールドスタート対策（プロビジョニング済み同時実行性 - 将来検討）

#### RDS
- ストレージ自動拡張設定（将来検討）
- リードレプリカ追加（将来検討）

---

## 構成図の更新方法

### 前提条件

構成図は Python の `diagrams` ライブラリを使用して生成されます。以下の環境が必要です：

```bash
# Python 3.7 以上
python3 --version

# Graphviz のインストール
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# pip で diagrams ライブラリをインストール
pip3 install diagrams
```

### 構成図の生成手順

1. **リポジトリのクローン**

   ```bash
   git clone https://github.com/hidaken991018/beer_ikitai.git
   cd beer_ikitai/docs/architect
   ```

2. **生成スクリプトの実行**

   ```bash
   python3 generate_infrastructure_diagrams.py
   ```

3. **生成確認**

   以下のファイルが `images/` ディレクトリに生成されます：
   - `beerlog_architecture_overview.png` - 全体アーキテクチャ
   - `beerlog_network_detail.png` - ネットワーク構成詳細
   - `beerlog_data_flow.png` - データフロー

4. **変更のコミット**

   ```bash
   git add images/*.png
   git commit -m "docs: インフラ構成図を更新"
   git push
   ```

### 構成図のカスタマイズ

構成図を変更する場合は、`generate_infrastructure_diagrams.py` を編集してください：

- `generate_overview_diagram()` - 全体アーキテクチャ
- `generate_network_diagram()` - ネットワーク構成
- `generate_data_flow_diagram()` - データフロー

詳細は [diagrams 公式ドキュメント](https://diagrams.mingrammer.com/) を参照してください。

---

## 参考リンク

- [CloudFormation テンプレート](../../infra/beerlog_template.yml)
- [API 仕様](../api/openapi.yml)
- [データベーススキーマ](https://dbdocs.io/hidaken991018/MyBeerLog)
- [画面遷移図](./screen-transitions.md)
- [CLAUDE.md プロジェクト概要](../../CLAUDE.md)

---

*最終更新: 2025年10月16日*
