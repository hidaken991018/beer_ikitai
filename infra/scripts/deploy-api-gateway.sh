#!/bin/bash

# 手動API Gateway デプロイメントスクリプト
# 使用方法: ./deploy-api-gateway.sh <stack-name> [region] [stage-name]

set -euo pipefail

# 色付きログ関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

# 引数チェック
if [ $# -lt 1 ]; then
    log_error "使用方法: $0 <stack-name> [region] [stage-name]"
    log_error "例: $0 beerlog-dev-stack ap-northeast-1 dev"
    exit 1
fi

STACK_NAME="$1"
REGION="${2:-ap-northeast-1}"
STAGE_NAME="${3:-}"

log_info "手動API Gateway デプロイメント開始"
log_info "スタック名: $STACK_NAME"
log_info "リージョン: $REGION"

# スタック存在確認
log_info "CloudFormation スタック確認中..."
if ! aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text >/dev/null 2>&1; then
    log_error "スタック '$STACK_NAME' が見つかりません"
    exit 1
fi

# スタック出力値取得
log_info "スタック出力値取得中..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs')

if [ "$OUTPUTS" == "null" ] || [ -z "$OUTPUTS" ]; then
    log_error "スタック出力値が見つかりません"
    exit 1
fi

# API Gateway情報取得
API_GATEWAY_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayId") | .OutputValue' 2>/dev/null || echo "")
ENVIRONMENT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="Environment") | .OutputValue' 2>/dev/null || echo "")

if [ -z "$API_GATEWAY_ID" ]; then
    log_error "API Gateway ID が取得できません"
    exit 1
fi

# ステージ名決定
if [ -z "$STAGE_NAME" ]; then
    if [ -n "$ENVIRONMENT" ]; then
        STAGE_NAME="$ENVIRONMENT"
    else
        STAGE_NAME="dev"
    fi
fi

log_info "API Gateway ID: $API_GATEWAY_ID"
log_info "デプロイ先ステージ: $STAGE_NAME"

# 既存デプロイメント確認
log_info "既存デプロイメント確認中..."
EXISTING_DEPLOYMENTS=$(aws apigateway get-deployments \
    --rest-api-id "$API_GATEWAY_ID" \
    --region "$REGION" \
    --query 'items[*].{Id:id,CreatedDate:createdDate}' \
    --output json)

DEPLOYMENT_COUNT=$(echo "$EXISTING_DEPLOYMENTS" | jq length)
log_info "既存デプロイメント数: $DEPLOYMENT_COUNT"

# 新しいデプロイメント作成
log_info "新しいデプロイメント作成中..."
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
DESCRIPTION="Manual deployment via script - $TIMESTAMP"

NEW_DEPLOYMENT=$(aws apigateway create-deployment \
    --rest-api-id "$API_GATEWAY_ID" \
    --region "$REGION" \
    --description "$DESCRIPTION" \
    --stage-name "$STAGE_NAME" \
    --query '{Id:id,CreatedDate:createdDate,Description:description}' \
    --output json)

NEW_DEPLOYMENT_ID=$(echo "$NEW_DEPLOYMENT" | jq -r '.Id')

if [ -z "$NEW_DEPLOYMENT_ID" ] || [ "$NEW_DEPLOYMENT_ID" == "null" ]; then
    log_error "デプロイメント作成に失敗しました"
    exit 1
fi

log_info "✅ 新しいデプロイメントが作成されました"
echo "$NEW_DEPLOYMENT" | jq .

# ステージ情報確認
log_info "ステージ情報確認中..."
STAGE_INFO=$(aws apigateway get-stage \
    --rest-api-id "$API_GATEWAY_ID" \
    --stage-name "$STAGE_NAME" \
    --region "$REGION" \
    --query '{StageName:stageName,DeploymentId:deploymentId,LastUpdatedDate:lastUpdatedDate}' \
    --output json 2>/dev/null || echo "{}")

if [ "$STAGE_INFO" != "{}" ]; then
    log_info "ステージ情報:"
    echo "$STAGE_INFO" | jq .
    
    CURRENT_DEPLOYMENT_ID=$(echo "$STAGE_INFO" | jq -r '.DeploymentId')
    if [ "$CURRENT_DEPLOYMENT_ID" == "$NEW_DEPLOYMENT_ID" ]; then
        log_info "✅ ステージが新しいデプロイメントに正常に更新されました"
    else
        log_warn "⚠️  ステージのデプロイメントIDが期待値と異なります"
        log_warn "期待値: $NEW_DEPLOYMENT_ID"
        log_warn "実際値: $CURRENT_DEPLOYMENT_ID"
    fi
else
    log_warn "ステージ情報の取得に失敗しました"
fi

# エンドポイント確認
API_ENDPOINT="https://${API_GATEWAY_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"
log_info "API Gateway エンドポイント: $API_ENDPOINT"

# デプロイメント後の動作確認
log_info "=== デプロイメント後の動作確認 ==="
log_info "エンドポイント接続確認中..."

# 少し待機（デプロイメント反映待ち）
sleep 3

# ヘルスチェックエンドポイントを試行
HEALTH_ENDPOINT="$API_ENDPOINT/health"

if curl -s --max-time 10 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
    log_info "✅ ヘルスチェックエンドポイント($HEALTH_ENDPOINT)に正常に接続できました"
else
    log_warn "⚠️  ヘルスチェックエンドポイント($HEALTH_ENDPOINT)への接続に失敗しました"
    log_warn "認証が必要な場合は正常な動作です"
fi

# レスポンスヘッダー確認
HEADERS=$(curl -s -I --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "HTTP/1.1 401 Unauthorized")
log_info "レスポンスヘッダー(最初の3行):"
echo "$HEADERS" | head -3

# CloudFormation スタックアウトプット更新確認
log_info "=== CloudFormation 出力値との整合性確認 ==="
STACK_DEPLOYMENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiDeploymentId") | .OutputValue' 2>/dev/null || echo "")

if [ -n "$STACK_DEPLOYMENT_ID" ] && [ "$STACK_DEPLOYMENT_ID" != "$NEW_DEPLOYMENT_ID" ]; then
    log_warn "⚠️  CloudFormationスタックの出力値と新しいデプロイメントIDが異なります"
    log_warn "スタック出力値: $STACK_DEPLOYMENT_ID"
    log_warn "新デプロイメント: $NEW_DEPLOYMENT_ID"
    log_warn "これは手動デプロイメント時は正常な状態です"
fi

# 古いデプロイメント削除の推奨
if [ "$DEPLOYMENT_COUNT" -gt 5 ]; then
    log_warn "⚠️  デプロイメントが多数存在します($DEPLOYMENT_COUNT 個)"
    log_warn "古いデプロイメントの削除を検討してください:"
    log_warn "aws apigateway delete-deployment --rest-api-id $API_GATEWAY_ID --deployment-id <old-deployment-id>"
fi

log_info "=== 手動デプロイメント完了 ==="
log_info "デプロイメントID: $NEW_DEPLOYMENT_ID"
log_info "ステージ: $STAGE_NAME"
log_info "エンドポイント: $API_ENDPOINT"