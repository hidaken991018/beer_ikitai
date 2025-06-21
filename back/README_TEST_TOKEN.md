# ローカル開発用テストトークン

このドキュメントでは、ローカル開発環境でのテスト認証トークンの使用方法について説明します。

## 概要

本番環境ではAWS Cognitoを使用した認証を行いますが、ローカル開発では以下のテスト機能を使用できます：

1. **テストトークンの生成**: 疑似的なアクセストークンを生成
2. **テスト認証**: 生成されたトークンでAPIアクセスをテスト

## 使用方法

### 1. テストトークンの生成

```bash
# デフォルトのCognito SUBでトークン生成
curl http://localhost:8080/test/generate-token

# カスタムCognito SUBでトークン生成
curl "http://localhost:8080/test/generate-token?cognito_sub=my-test-user"
```

レスポンス例：
```json
{
  "token": "a1b2c3d4e5f6...",
  "cognito_sub": "test-user-abc123",
  "expires_at": 1640995200
}
```

### 2. トークンを使用したAPIアクセス

生成されたトークンをAuthorizationヘッダーに設定してAPIにアクセス：

```bash
# 認証テスト
curl -H "Authorization: Bearer a1b2c3d4e5f6..." http://localhost:8080/test/auth

# ユーザープロファイル取得
curl -H "Authorization: Bearer a1b2c3d4e5f6..." http://localhost:8080/users/profile

# チェックイン
curl -X POST -H "Authorization: Bearer a1b2c3d4e5f6..." \
  -H "Content-Type: application/json" \
  -d '{"brewery_id": 1, "latitude": 35.6762, "longitude": 139.6503}' \
  http://localhost:8080/checkin
```

### 3. 簡易テストトークン

開発中の簡単なテストには、固定のテストトークンも使用可能：

```bash
# 固定テストトークン（cognito_sub: "test-user-sub"）
curl -H "Authorization: Bearer test-token" http://localhost:8080/test/auth
```

## 注意事項

- **開発環境でのみ利用可能**: `run.mode = dev` の場合のみテストトークンが有効
- **本番環境では無効**: 本番環境では実際のCognito認証のみが受け入れられます
- **セキュリティ**: テストトークンにはセキュリティ機能がないため、本番データでは使用しないでください

## 環境設定

`conf/app.conf` で開発モードを設定：

```ini
run.mode = dev
```

または環境変数：

```bash
export RUN_MODE=dev
```

## トラブルシューティング

### トークンが無効エラー
- 開発モード（`run.mode = dev`）になっているか確認
- トークンの有効期限（1時間）が切れていないか確認

### 認証が失敗する
- Authorizationヘッダーの形式が `Bearer <token>` になっているか確認
- トークンが正しく生成されているか確認

## API エンドポイント一覧

### テスト用エンドポイント（開発環境のみ）
- `GET /test/generate-token` - テストトークン生成
- `GET /test/auth` - 認証テスト

### 実際のAPIエンドポイント
- `GET /health` - ヘルスチェック
- `GET|POST|PUT /users/profile` - ユーザープロファイル管理
- `GET|POST /breweries` - 醸造所管理
- `GET /breweries/:brewery_id` - 醸造所詳細
- `POST /checkin` - チェックイン
- `GET /visits` - 訪問履歴
- `GET /visits/:visit_id` - 訪問詳細