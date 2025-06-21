# Docker環境での実行手順

## 前提条件

Docker Desktop for Windowsがインストールされ、WSL2統合が有効になっている必要があります。

## 実行手順

1. **Docker Desktop の WSL2 統合を有効化**
   - Docker Desktop を開く
   - Settings → Resources → WSL Integration
   - Ubuntu/WSL2 ディストリビューションでの統合を有効化

2. **アプリケーション起動**
   ```bash
   cd /mnt/c/Users/hiken/documents/101_IT/01-27_mybeerlog/back
   docker compose up --build -d
   ```

3. **データベース接続確認**
   ```bash
   docker compose exec postgres psql -U postgres -d mybeerlog -c "\dt"
   ```

4. **API動作確認**
   ```bash
   curl http://localhost:8080/health
   ```

5. **ログ確認**
   ```bash
   docker compose logs -f api
   ```

6. **停止**
   ```bash
   docker compose down
   ```

## 含まれるサービス

- **postgres**: PostgreSQL 15 データベース (port 5432)
- **api**: Go Beego API サーバー (port 8080)

## サンプルデータ

初期化時に以下のサンプルデータが投入されます：
- 5つの醸造所（東京、横浜、大阪、福岡、札幌）
- 2つのテストユーザープロファイル
- サンプル訪問データ

## 開発用の便利コマンド

```bash
# コンテナの状態確認
docker compose ps

# データベースに直接接続
docker compose exec postgres psql -U postgres -d mybeerlog

# APIコンテナでシェル実行
docker compose exec api sh

# 特定のサービスのみ再起動
docker compose restart api
```