# API Gateway デプロイメント管理スクリプト

このディレクトリには、API Gateway のデプロイメント管理を支援するスクリプトが含まれています。

## スクリプト一覧

### 1. check-api-deployment.sh

API Gateway のデプロイメント状況を確認するスクリプトです。

#### 使用方法

```bash
# 基本的な使用方法
./check-api-deployment.sh <stack-name> [region]

# 例：開発環境の確認
./check-api-deployment.sh beerlog-dev-stack ap-northeast-1

# 例：本番環境の確認
./check-api-deployment.sh beerlog-prod-stack ap-northeast-1
```

#### 確認内容

- CloudFormation スタックの状態
- API Gateway の基本情報（ID、エンドポイント）
- デプロイメント戦略設定（自動/手動）
- デプロイメント履歴
- ステージ情報
- エンドポイントの動作確認
- 運用推奨事項の表示

### 2. deploy-api-gateway.sh

手動で API Gateway のデプロイメントを実行するスクリプトです。

#### 使用方法

```bash
# 基本的な使用方法
./deploy-api-gateway.sh <stack-name> [region] [stage-name]

# 例：開発環境への手動デプロイ
./deploy-api-gateway.sh beerlog-dev-stack ap-northeast-1 dev

# 例：本番環境への手動デプロイ（ステージ名自動決定）
./deploy-api-gateway.sh beerlog-prod-stack ap-northeast-1
```

#### 実行内容

- 新しいデプロイメントの作成
- ステージへのデプロイメント適用
- デプロイメント後の動作確認
- CloudFormation との整合性チェック
- 古いデプロイメント削除の推奨

## 前提条件

### 必要なツール

- AWS CLI v2 （設定済み）
- jq （JSON パーサー）
- curl （エンドポイント確認用）

### AWS CLI の設定

```bash
# AWS CLI の設定確認
aws sts get-caller-identity

# 必要な権限
# - cloudformation:DescribeStacks
# - apigateway:GetDeployments
# - apigateway:GetStages
# - apigateway:GetStage
# - apigateway:CreateDeployment
# - apigateway:DeleteDeployment
```

### jq のインストール

```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS (Homebrew)
brew install jq

# Amazon Linux
sudo yum install jq
```

## 使用シナリオ

### 1. 開発環境での定期チェック

```bash
# 毎日の開発開始時にデプロイメント状況を確認
./check-api-deployment.sh beerlog-dev-stack

# API 定義変更後の動作確認
./check-api-deployment.sh beerlog-dev-stack
```

### 2. 本番環境での計画的デプロイ

```bash
# 本番デプロイ前の事前確認
./check-api-deployment.sh beerlog-prod-stack

# 計画的な手動デプロイ実行
./deploy-api-gateway.sh beerlog-prod-stack ap-northeast-1 prod

# デプロイ後の動作確認
./check-api-deployment.sh beerlog-prod-stack
```

### 3. トラブルシューティング

```bash
# API Gateway が動作しない場合の状況確認
./check-api-deployment.sh beerlog-staging-stack

# 強制的な再デプロイ
./deploy-api-gateway.sh beerlog-staging-stack ap-northeast-1 staging
```

## 出力例

### check-api-deployment.sh の出力例

```
[INFO] API Gateway デプロイメント状況確認開始
[INFO] スタック名: beerlog-dev-stack
[INFO] リージョン: ap-northeast-1
[INFO] CloudFormation スタック確認中...
[INFO] スタック状態: UPDATE_COMPLETE
[INFO] スタック出力値取得中...
[INFO] === API Gateway 情報 ===
[INFO] API Gateway ID: abcd123456
[INFO] エンドポイント: https://abcd123456.execute-api.ap-northeast-1.amazonaws.com/dev
[INFO] デプロイメント戦略: timestamp
[INFO] 自動デプロイ: true
...
```

### deploy-api-gateway.sh の出力例

```
[INFO] 手動API Gateway デプロイメント開始
[INFO] スタック名: beerlog-dev-stack
[INFO] リージョン: ap-northeast-1
[INFO] API Gateway ID: abcd123456
[INFO] デプロイ先ステージ: dev
[INFO] 新しいデプロイメント作成中...
[INFO] ✅ 新しいデプロイメントが作成されました
...
```

## トラブルシューティング

### よくある問題と解決方法

#### 1. AWS CLI 認証エラー

```bash
# 認証情報確認
aws sts get-caller-identity

# 必要に応じて再設定
aws configure
```

#### 2. jq コマンドが見つからない

```bash
# jq インストール確認
which jq

# インストール
sudo yum install jq  # Amazon Linux
```

#### 3. API Gateway への接続タイムアウト

- ネットワーク接続確認
- Cognito 認証が必要な場合は 401 エラーは正常
- API Gateway の設定確認

#### 4. デプロイメント作成に失敗

- CloudFormation スタックの状態確認
- API Gateway の設定確認
- 必要な IAM 権限の確認

## 運用上の注意事項

### 1. 自動デプロイメント戦略使用時

- CloudFormation 更新時に自動的にデプロイされる
- 手動デプロイスクリプトは緊急時のみ使用
- 定期的なデプロイメント状況確認を推奨

### 2. 手動デプロイメント戦略使用時

- API 定義変更後は必ず手動デプロイが必要
- デプロイ忘れに注意
- 本番環境では計画的なデプロイを実施

### 3. デプロイメント履歴管理

- 古いデプロイメントは定期的に削除
- 重要なデプロイメントはタグ付けを検討
- デプロイメント内容の記録を推奨

### 4. セキュリティ考慮事項

- 本番環境では適切なアクセス制御
- デプロイメント権限の最小化
- 監査ログの確保