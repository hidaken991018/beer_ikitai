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

### 必要なソフトウェア（Windows）

- **WSL2** (Ubuntu 20.04 以上推奨)
- **Docker Desktop for Windows** (WSL2 統合有効)
- **Git** (ソースコード管理)

## セットアップ

### 前提条件確認

1. **Docker Desktop WSL2 統合確認**

   ```bash
   docker --version // Docker version 28.1.1

   docker compose version //Docker Compose version v2.35.1-desktop.1
   ```

2. **コードの取得**
   ```bash
   git clone https://github.com/hidaken991018/beer_ikitai
   cd beer_ikitai/back
   ```

### Docker 環境での起動（推奨）

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

## API エンドポイント

- docs\api\openapi.yml
