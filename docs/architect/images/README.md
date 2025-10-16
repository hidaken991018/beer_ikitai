# インフラ構成図画像ディレクトリ

このディレクトリには、BeerLog の AWS インフラストラクチャ構成図の PNG 画像ファイルが格納されます。

## 構成図の生成方法

構成図は Python の `diagrams` ライブラリを使用して生成されます。

### 前提条件

```bash
# Graphviz のインストール
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows (Chocolatey)
choco install graphviz

# pip で diagrams ライブラリをインストール
pip3 install diagrams
```

### 生成手順

1. このディレクトリの親ディレクトリに移動:

   ```bash
   cd docs/architect
   ```

2. 生成スクリプトを実行:

   ```bash
   python3 generate_infrastructure_diagrams.py
   ```

3. 以下のファイルが生成されます:
   - `beerlog_architecture_overview.png` - 全体アーキテクチャ構成図
   - `beerlog_network_detail.png` - ネットワーク構成詳細図
   - `beerlog_data_flow.png` - API リクエストデータフロー図

## 生成される構成図

### 1. 全体アーキテクチャ構成図 (`beerlog_architecture_overview.png`)

BeerLog システム全体のコンポーネント配置を示す図です。以下を含みます：
- クライアント層 (Next.js on Amplify)
- API・認証層 (API Gateway, Cognito)
- アプリケーション層 (Lambda, VPC)
- データ層 (RDS, Secrets Manager)
- 静的コンテンツ配信 (S3, CloudFront)
- 管理・運用 (EC2, VPC Endpoints)

### 2. ネットワーク構成詳細図 (`beerlog_network_detail.png`)

VPC のネットワーク構成を詳細に示す図です。以下を含みます：
- VPC CIDR (`10.0.0.0/16`)
- パブリックサブネット (2 AZ)
- プライベートサブネット (2 AZ)
- セキュリティグループ設定
- VPC Endpoints (SSM, S3)
- ルーティング設定

### 3. データフロー図 (`beerlog_data_flow.png`)

API リクエストの処理フローを示す図です。以下を含みます：
1. クライアントからの JWT トークン付きリクエスト
2. API Gateway での Cognito Authorizer による認証
3. Lambda への Cognito Sub ID 伝搬
4. Secrets Manager からの DB 認証情報取得
5. RDS PostgreSQL へのクエリ実行
6. レスポンス返却フロー

## トラブルシューティング

### エラー: `ModuleNotFoundError: No module named 'diagrams'`

```bash
pip3 install diagrams
```

### エラー: `graphviz` が見つからない

Graphviz がシステムにインストールされていることを確認してください：

```bash
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz
```

### 画像が生成されない

- Python 3.7 以上が必要です
- スクリプトの実行ディレクトリを確認してください (`docs/architect` で実行)
- 権限を確認してください (書き込み権限が必要)

## 更新時の注意事項

CloudFormation テンプレート (`infra/beerlog_template.yml`) を変更した場合は、以下の手順で構成図を更新してください：

1. `generate_infrastructure_diagrams.py` を編集して変更を反映
2. 構成図を再生成
3. Git に画像をコミット

```bash
cd docs/architect
python3 generate_infrastructure_diagrams.py
git add images/*.png
git commit -m "docs: インフラ構成図を更新"
git push
```

---

詳細は [infrastructure-architecture.md](../infrastructure-architecture.md) を参照してください。
