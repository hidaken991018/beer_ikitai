# My Beer Log API Backend

Go 言語と Beego フレームワークを使用したクラフトビール記録アプリのバックエンド API 実装です。

## アーキテクチャ

- **フレームワーク**: Beego (Go)
- **設計思想**: クリーンアーキテクチャ
- **データベース**: PostgreSQL
- **認証**: AWS Cognito JWT

## ディレクトリ構造

```
back/
├── main.go                    # エントリーポイント
├── conf/
│   └── app.conf              # Beego設定ファイル
├── routers/
│   └── router.go             # ルーティング設定
├── controllers/              # 【Beego標準】アダプター層
│   ├── base.go              # ベースコントローラー
│   ├── health_controller.go # ヘルスチェック
│   ├── user_controller.go   # ユーザーコントローラー
│   ├── brewery_controller.go # 醸造所コントローラー
│   └── visit_controller.go  # 訪問コントローラー
├── models/                   # 【Beego標準】データモデル
│   ├── user_profile.go      # ユーザープロファイルモデル
│   ├── brewery.go           # 醸造所モデル
│   └── visit.go             # 訪問モデル
├── domain/                   # 【クリーンアーキテクチャ】ドメイン層
│   ├── entity/              # エンティティ
│   ├── repository/          # リポジトリインターフェース
│   └── usecase/             # ユースケース
├── infrastructure/           # 【クリーンアーキテクチャ】インフラ層
│   └── persistence/         # リポジトリ実装
├── interfaces/              # 【クリーンアーキテクチャ】インターフェース層
│   ├── dto/                 # データ転送オブジェクト
│   └── mapper/              # DTO ↔ Entity変換
├── docker-compose.yml       # Docker環境設定
├── Dockerfile              # Dockerイメージ設定
└── init-db/               # データベース初期化スクリプト
```

## 動作環境

### 必要なソフトウェア
- **Docker Desktop for Windows** (WSL2統合有効)
- **WSL2** (Ubuntu 20.04以上推奨)
- **Git** (コード取得用)

### 推奨スペック
- **メモリ**: 8GB以上
- **ストレージ**: 5GB以上の空き容量
- **OS**: Windows 10/11 (WSL2対応)

## セットアップ

### 前提条件確認

1. **Docker Desktop WSL2統合確認**
   ```bash
   docker --version
   docker compose version
   ```

2. **コードの取得**
   ```bash
   git clone <repository-url>
   cd <repository-name>/back
   ```

### Docker環境での起動（推奨）

```bash
# アプリケーション起動
docker compose up --build -d

# 起動確認
docker compose ps

# ヘルスチェック
curl http://localhost:8080/health

# ログ確認
docker compose logs -f api
```

### ローカル環境での起動（参考）

#### 1. Go言語のインストール
```bash
# Go 1.21以上が必要
wget https://go.dev/dl/go1.21.5.linux-amd64.tar.gz
tar -C $HOME -xzf go1.21.5.linux-amd64.tar.gz
export PATH=$HOME/go/bin:$PATH
```

#### 2. PostgreSQLのインストール
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb mybeerlog
```

#### 3. 依存関係のインストール
```bash
cd back
go mod tidy
```

#### 4. 環境変数設定
```bash
export DB_HOST=localhost
export DB_USER=postgres
export DB_PASS=password
export DB_NAME=mybeerlog
export DB_PORT=5432
export COGNITO_REGION=us-east-1
export COGNITO_USER_POOL_ID=your-user-pool-id
export COGNITO_CLIENT_ID=your-client-id
```

#### 5. アプリケーション実行
```bash
go run main.go
```

### トラブルシューティング

#### Docker関連
```bash
# Docker Desktopが起動していない場合
# → Docker Desktopを起動してください

# WSL2統合が無効の場合
# → Docker Desktop Settings → Resources → WSL Integration を確認

# ポート競合の場合
docker compose down
docker compose up --build -d
```

#### データベース関連
```bash
# データベース接続確認
docker compose exec postgres psql -U postgres -d mybeerlog -c "\dt"

# データベースログ確認
docker compose logs postgres
```

## API エンドポイント

### ヘルスチェック

- `GET /health` - API 稼働状況確認

### ユーザープロファイル管理

- `GET /users/profile` - プロファイル取得
- `POST /users/profile` - プロファイル作成
- `PUT /users/profile` - プロファイル更新

### 醸造所管理

- `GET /breweries` - 醸造所一覧取得
- `POST /breweries` - 醸造所登録（管理者のみ）
- `GET /breweries/{id}` - 醸造所詳細取得

### 訪問・チェックイン

- `POST /checkin` - GPS チェックイン
- `GET /visits` - 訪問履歴取得
- `GET /visits/{id}` - 訪問詳細取得

## 認証

AWS Cognito JWT トークンを Authorization ヘッダーに設定してください：

```
Authorization: Bearer <JWT_TOKEN>
```

## GPS チェックイン

チェックイン時は醸造所から半径 100m 以内（設定可能）にいる必要があります。
同一醸造所への連続チェックインは 1 時間以内は禁止されています。

## 開発ノート

- JWT 検証の実装は簡易版です。本番環境では適切な AWS Cognito JWT 検証を実装してください。
- 位置情報検索は簡易的な矩形範囲検索を使用しています。本番環境では PostGIS 等の使用を推奨します。
- 管理者権限チェックは未実装です。AWS Cognito グループ情報を基に実装してください。
