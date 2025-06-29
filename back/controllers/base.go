package controllers

import (
	"errors"
	"mybeerlog/interfaces/dto"
	"mybeerlog/utils"
	"net/http"
	"strconv"
	"strings"

	"github.com/astaxie/beego"
)

// BaseController 全てのコントローラーの基底クラス
type BaseController struct {
	beego.Controller
}

// JSONResponse JSONレスポンスを送信する
func (c *BaseController) JSONResponse(data interface{}) {
	requestID := utils.GetRequestIDFromContext(c.Ctx.Request.Context())
	response := dto.NewSuccessResponse(data, "", requestID)
	c.Data["json"] = response
	c.ServeJSON()
}

// JSONResponseWithMessage メッセージ付きJSONレスポンスを送信する
func (c *BaseController) JSONResponseWithMessage(data interface{}, message string) {
	requestID := utils.GetRequestIDFromContext(c.Ctx.Request.Context())
	response := dto.NewSuccessResponse(data, message, requestID)
	c.Data["json"] = response
	c.ServeJSON()
}

// ErrorResponse エラーレスポンスを送信する（旧互換性のため残す）
func (c *BaseController) ErrorResponse(code int, message, errorCode string) {
	c.ErrorResponseDetailed(code, message, "", errorCode, nil)
}

// ErrorResponseDetailed 詳細エラーレスポンスを送信する
func (c *BaseController) ErrorResponseDetailed(httpCode int, userMessage, internalMessage, errorCode string, details map[string]string) {
	requestID := utils.GetRequestIDFromContext(c.Ctx.Request.Context())
	
	// エラーログを出力
	if internalMessage != "" {
		utils.LogError(c.Ctx.Request.Context(), errors.New(internalMessage), userMessage)
	} else {
		utils.LogWarn(c.Ctx.Request.Context(), userMessage)
	}
	
	// エラーレスポンスを作成
	var errorResponse *dto.ErrorResponse
	if details != nil {
		errorResponse = dto.NewErrorResponseWithDetails(errorCode, userMessage, internalMessage, details, requestID)
	} else {
		errorResponse = dto.NewErrorResponse(errorCode, userMessage, internalMessage, requestID)
	}
	
	c.Ctx.ResponseWriter.WriteHeader(httpCode)
	c.Data["json"] = errorResponse
	c.ServeJSON()
}

// HandleError 統一エラーハンドリング
func (c *BaseController) HandleError(err error, userMessage, errorCode string, httpCode int) {
	if err == nil {
		return
	}
	
	c.ErrorResponseDetailed(httpCode, userMessage, err.Error(), errorCode, nil)
}

// HandleValidationError バリデーションエラーを処理する
func (c *BaseController) HandleValidationError(field, message, value string) {
	details := map[string]string{
		"field": field,
		"value": value,
	}
	c.ErrorResponseDetailed(http.StatusBadRequest, "Validation failed", message, dto.ErrorCodeValidationFailed, details)
}

// HandleUnauthorized 認証エラーを処理する
func (c *BaseController) HandleUnauthorized(message string) {
	if message == "" {
		message = "Authentication required"
	}
	c.ErrorResponseDetailed(http.StatusUnauthorized, message, "", dto.ErrorCodeUnauthorized, nil)
}

// HandleNotFound リソース不存在エラーを処理する
func (c *BaseController) HandleNotFound(resourceType string) {
	message := "Resource not found"
	if resourceType != "" {
		message = resourceType + " not found"
	}
	c.ErrorResponseDetailed(http.StatusNotFound, message, "", dto.ErrorCodeNotFound, nil)
}

// HandleInternalError 内部サーバーエラーを処理する
func (c *BaseController) HandleInternalError(err error) {
	c.ErrorResponseDetailed(http.StatusInternalServerError, "Internal server error", err.Error(), dto.ErrorCodeInternalServer, nil)
}

// GetCognitoSub API GatewayからCognito Sub情報を取得する
func (c *BaseController) GetCognitoSub() (string, error) {
	// 1. API Gateway Authorizer から設定されるヘッダーを確認
	// Lambda Authorizerまたは Cognito Authorizer が設定するヘッダー
	cognitoSub := c.getCognitoSubFromHeaders()
	if cognitoSub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub obtained from API Gateway headers", map[string]interface{}{
			"cognito_sub": cognitoSub,
		})
		return cognitoSub, nil
	}

	// 2. 開発環境でのテストトークン処理
	if beego.BConfig.RunMode == "dev" {
		authHeader := c.Ctx.Request.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				authManager := utils.GetTestAuthTokenManager()
				if testCognitoSub, err := authManager.ValidateToken(parts[1]); err == nil {
					utils.LogDebug(c.Ctx.Request.Context(), "Test token validated in dev environment", map[string]interface{}{
						"cognito_sub": testCognitoSub,
					})
					return testCognitoSub, nil
				}
			}
		}
	}

	// 3. 認証情報が取得できない場合のエラー
	utils.LogWarn(c.Ctx.Request.Context(), "Failed to obtain Cognito Sub from API Gateway")
	return "", errors.New("authentication required: cognito sub not found")
}

// getCognitoSubFromHeaders API Gatewayが設定する各種ヘッダーからCognito Subを取得
func (c *BaseController) getCognitoSubFromHeaders() string {
	// API Gateway Cognito Authorizer が設定するヘッダー（一般的なパターン）
	headers := []string{
		"X-Cognito-Sub",                    // Cognito Authorizer
		"X-Amzn-Cognito-Sub",              // AWS Lambda Proxy統合
		"X-Amz-User-Sub",                  // カスタムヘッダー
		"X-User-Sub",                      // カスタムヘッダー
	}
	
	for _, header := range headers {
		if value := c.Ctx.Request.Header.Get(header); value != "" {
			return value
		}
	}
	
	// Lambda環境での requestContext からの取得（追加の確認）
	if c.Ctx.Request.Header.Get("X-Amzn-Requestid") != "" {
		// API Gateway Lambda プロキシ統合でのリクエストコンテキスト情報
		if value := c.Ctx.Request.Header.Get("X-Amzn-Requestcontext-Authorizer-Claims-Sub"); value != "" {
			return value
		}
	}
	
	return ""
}

// IsAdmin 管理者権限をチェックする
func (c *BaseController) IsAdmin() bool {
	// API Gateway Authorizer からグループ情報を取得
	groups := c.getCognitoGroupsFromHeaders()
	for _, group := range groups {
		if group == "admin" || group == "administrators" {
			return true
		}
	}
	return false
}

// getCognitoGroupsFromHeaders API Gatewayが設定するヘッダーからCognitoグループ情報を取得
func (c *BaseController) getCognitoGroupsFromHeaders() []string {
	// API Gateway Cognito Authorizer が設定するグループヘッダー
	groupsHeader := c.Ctx.Request.Header.Get("X-Cognito-Groups")
	if groupsHeader == "" {
		groupsHeader = c.Ctx.Request.Header.Get("X-Amzn-Cognito-Groups")
	}
	if groupsHeader == "" {
		groupsHeader = c.Ctx.Request.Header.Get("X-Amzn-Requestcontext-Authorizer-Claims-Cognito-Groups")
	}
	
	if groupsHeader != "" {
		// カンマ区切りまたはスペース区切りでグループが設定される場合がある
		groups := strings.Split(groupsHeader, ",")
		for i, group := range groups {
			groups[i] = strings.TrimSpace(group)
		}
		return groups
	}
	
	return []string{}
}

// GetIntQuery 整数型のクエリパラメータを取得する
func (c *BaseController) GetIntQuery(key string, defaultValue int) int {
	value := c.GetString(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		c.HandleValidationError(key, "Invalid integer value", value)
		return defaultValue
	}

	return intValue
}

// GetFloatQuery 浮動小数点型のクエリパラメータを取得する
func (c *BaseController) GetFloatQuery(key string, defaultValue float64) float64 {
	value := c.GetString(key)
	if value == "" {
		return defaultValue
	}

	floatValue, err := strconv.ParseFloat(value, 64)
	if err != nil {
		c.HandleValidationError(key, "Invalid float value", value)
		return defaultValue
	}

	return floatValue
}

// GetStringQuery 文字列型のクエリパラメータを取得する
func (c *BaseController) GetStringQuery(key string, defaultValue string) string {
	value := c.GetString(key)
	if value == "" {
		return defaultValue
	}

	return value
}

// RequireAuth 認証が必要なエンドポイント用のヘルパー
func (c *BaseController) RequireAuth() (string, bool) {
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.HandleUnauthorized("Authentication required")
		return "", false
	}
	return cognitoSub, true
}

// RequireAdmin 管理者権限が必要なエンドポイント用のヘルパー
func (c *BaseController) RequireAdmin() (string, bool) {
	cognitoSub, ok := c.RequireAuth()
	if !ok {
		return "", false
	}
	
	if !c.IsAdmin() {
		c.ErrorResponseDetailed(http.StatusForbidden, "Administrator access required", "", dto.ErrorCodeForbidden, nil)
		return "", false
	}
	
	return cognitoSub, true
}
