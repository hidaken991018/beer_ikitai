#!/bin/bash

# API Gateway デプロイメント状況確認スクリプト
# 使用方法: ./check-api-deployment.sh <stack-name> [region]

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
    log_error "使用方法: $0 <stack-name> [region]"
    log_error "例: $0 beerlog-dev-stack ap-northeast-1"
    exit 1
fi

STACK_NAME="$1"
REGION="${2:-ap-northeast-1}"

log_info "API Gateway デプロイメント状況確認開始"
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

STACK_STATUS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].StackStatus' \
    --output text)

log_info "スタック状態: $STACK_STATUS"

# スタック出力値取得
log_info "スタック出力値取得中..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs')

if [ "$OUTPUTS" == "null" ] || [ -z "$OUTPUTS" ]; then
    log_warn "スタック出力値が見つかりません"
    exit 1
fi

# API Gateway情報取得
API_GATEWAY_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayId") | .OutputValue' 2>/dev/null || echo "")
API_ENDPOINT=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiGatewayEndpoint") | .OutputValue' 2>/dev/null || echo "")
DEPLOYMENT_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiDeploymentId") | .OutputValue' 2>/dev/null || echo "")
DEPLOYMENT_STRATEGY=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="ApiDeploymentStrategy") | .OutputValue' 2>/dev/null || echo "")
AUTO_DEPLOY=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="AutoDeployApiGateway") | .OutputValue' 2>/dev/null || echo "")

if [ -z "$API_GATEWAY_ID" ]; then
    log_error "API Gateway ID が取得できません"
    exit 1
fi

log_info "=== API Gateway 情報 ==="
log_info "API Gateway ID: $API_GATEWAY_ID"
log_info "エンドポイント: $API_ENDPOINT"
log_info "デプロイメント戦略: $DEPLOYMENT_STRATEGY"
log_info "自動デプロイ: $AUTO_DEPLOY"

# API Gateway詳細情報取得
log_info "=== API Gateway デプロイメント詳細 ==="

# デプロイメント一覧取得
DEPLOYMENTS=$(aws apigateway get-deployments \
    --rest-api-id "$API_GATEWAY_ID" \
    --region "$REGION" \
    --query 'items[*].{Id:id,CreatedDate:createdDate,Description:description}' \
    --output table)

echo "$DEPLOYMENTS"

# ステージ情報取得
log_info "=== API Gateway ステージ情報 ==="
STAGES=$(aws apigateway get-stages \
    --rest-api-id "$API_GATEWAY_ID" \
    --region "$REGION" \
    --query 'item[*].{StageName:stageName,DeploymentId:deploymentId,LastUpdatedDate:lastUpdatedDate}' \
    --output table)

echo "$STAGES"

# 現在のデプロイメント確認
if [ -n "$DEPLOYMENT_ID" ]; then
    log_info "=== 現在のデプロイメント詳細 ==="
    CURRENT_DEPLOYMENT=$(aws apigateway get-deployment \
        --rest-api-id "$API_GATEWAY_ID" \
        --deployment-id "$DEPLOYMENT_ID" \
        --region "$REGION" \
        --query '{Id:id,CreatedDate:createdDate,Description:description}' \
        --output table 2>/dev/null || echo "デプロイメント情報の取得に失敗")
    
    echo "$CURRENT_DEPLOYMENT"
fi

# API Gateway エンドポイント動作確認
log_info "=== API Gateway エンドポイント動作確認 ==="
if [ -n "$API_ENDPOINT" ]; then
    log_info "エンドポイント接続確認中: $API_ENDPOINT"
    
    # ヘルスチェックエンドポイントを試行
    HEALTH_ENDPOINT="$API_ENDPOINT/health"
    
    if curl -s --max-time 10 "$HEALTH_ENDPOINT" >/dev/null 2>&1; then
        log_info "✅ ヘルスチェックエンドポイント($HEALTH_ENDPOINT)に正常に接続できました"
    else
        log_warn "⚠️  ヘルスチェックエンドポイント($HEALTH_ENDPOINT)への接続に失敗しました"
        log_warn "認証が必要な場合は正常な動作です"
    fi
    
    # レスポンスヘッダー確認
    log_info "レスポンスヘッダー確認中..."
    HEADERS=$(curl -s -I --max-time 10 "$HEALTH_ENDPOINT" 2>/dev/null || echo "HTTP/1.1 401 Unauthorized")
    echo "$HEADERS" | head -5
else
    log_warn "API Gateway エンドポイントが設定されていません"
fi

# 運用推奨事項
log_info "=== 運用推奨事項 ==="
if [ "$AUTO_DEPLOY" == "true" ]; then
    log_info "✅ 自動デプロイメントが有効です"
    log_info "   CloudFormation更新時にAPI Gatewayも自動的にデプロイされます"
else
    log_warn "⚠️  手動デプロイメントモードです"
    log_warn "   API定義変更後は手動でデプロイメントを実行してください:"
    log_warn "   ./deploy-api-gateway.sh $STACK_NAME $REGION"
fi

if [ "$DEPLOYMENT_STRATEGY" == "manual" ]; then
    log_warn "⚠️  手動デプロイメント戦略が設定されています"
    log_warn "   本番環境では適切ですが、開発効率を考慮して自動戦略も検討してください"
fi

log_info "=== デプロイメント状況確認完了 ==="