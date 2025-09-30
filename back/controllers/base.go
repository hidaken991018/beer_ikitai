package controllers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
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

// extractCognitoSubFromJWT JWT トークンから Cognito Sub を抽出する
func (c *BaseController) extractCognitoSubFromJWT(authHeader string) (string, error) {

	// JWT を '.' で分割（header.payload.signature）
	parts := strings.Split(authHeader, ".")
	if len(parts) != 3 {
		return "", fmt.Errorf("invalid JWT format: expected 3 parts, got %d", len(parts))
	}

	// payload（2番目の部分）をデコード
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("failed to decode JWT payload: %v", err)
	}

	// JSON をパース
	var claims map[string]interface{}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return "", fmt.Errorf("failed to parse JWT claims: %v", err)
	}

	// "sub" クレームを取得
	sub, ok := claims["sub"].(string)
	if !ok {
		return "", fmt.Errorf("sub claim not found or not a string")
	}

	if sub == "" {
		return "", fmt.Errorf("sub claim is empty")
	}

	return sub, nil
}

// GetCognitoSub JWT トークンから Cognito Sub 情報を取得する
func (c *BaseController) GetCognitoSub() (string, error) {
	// デバッグ用環境情報ログ
	utils.LogDebug(c.Ctx.Request.Context(), "Starting Cognito Sub authentication process", map[string]interface{}{
		"run_mode":       beego.BConfig.RunMode,
		"is_lambda":      c.isLambdaEnvironment(),
		"request_method": c.Ctx.Request.Method,
		"request_uri":    c.Ctx.Request.RequestURI,
	})

	// 1. Authorization ヘッダーから JWT トークンを取得
	authHeader := c.Ctx.Request.Header.Get("Authorization")
	if authHeader == "" {
		utils.LogWarn(c.Ctx.Request.Context(), "No authorization header found", nil)
		return "", errors.New("authentication required: no authorization header")
	}

	// 2. 開発環境でのテストトークン処理を最初に試行
	if beego.BConfig.RunMode == "dev" {
		utils.LogDebug(c.Ctx.Request.Context(), "Attempting test token validation in dev environment", nil)
		parts := strings.Split(authHeader, " ")
		if len(parts) == 2 && parts[0] == "Bearer" {
			authManager := utils.GetTestAuthTokenManager()
			if testCognitoSub, err := authManager.ValidateToken(parts[1]); err == nil {
				utils.LogDebug(c.Ctx.Request.Context(), "Test token validated in dev environment", map[string]interface{}{
					"cognito_sub": testCognitoSub,
					"method":      "dev_test_token",
				})
				return testCognitoSub, nil
			} else {
				utils.LogDebug(c.Ctx.Request.Context(), "Test token validation failed, trying JWT extraction", map[string]interface{}{
					"error": err.Error(),
				})
			}
		}
	}

	// 3. JWT トークンから Cognito Sub を抽出
	sub, err := c.extractCognitoSubFromJWT(authHeader)
	if err != nil {
		utils.LogWarn(c.Ctx.Request.Context(), "Failed to extract Cognito Sub from JWT", map[string]interface{}{
			"error":           err.Error(),
			"auth_header_len": len(authHeader),
			"run_mode":        beego.BConfig.RunMode,
		})
		c.logAuthenticationFailure()
		return "", fmt.Errorf("authentication required: failed to extract cognito sub from JWT: %v", err)
	}

	// 成功ログを追加
	utils.LogInfo(c.Ctx.Request.Context(), "Successfully extracted Cognito Sub from JWT", map[string]interface{}{
		"sub":    sub,
		"method": "jwt_extraction",
	})

	return sub, nil
}

// isLambdaEnvironment Lambda環境で実行されているかを判定する
func (c *BaseController) isLambdaEnvironment() bool {
	return c.Ctx.Request.Header.Get("AWS_LAMBDA_FUNCTION_NAME") != "" ||
		c.Ctx.Request.Header.Get("X-Amzn-Requestid") != ""
}

// logAuthenticationFailure 認証失敗時の詳細情報をログ出力する
func (c *BaseController) logAuthenticationFailure() {
	// 認証失敗時の詳細ログを出力（デバッグ用）
	utils.LogWarn(c.Ctx.Request.Context(), "Failed to obtain Cognito Sub from JWT", map[string]interface{}{
		"run_mode":        beego.BConfig.RunMode,
		"is_lambda":       c.isLambdaEnvironment(),
		"request_method":  c.Ctx.Request.Method,
		"request_uri":     c.Ctx.Request.RequestURI,
		"headers":         c.Ctx.Request.Header,
		"header_count":    len(c.Ctx.Request.Header),
		"has_auth_header": c.Ctx.Request.Header.Get("Authorization") != "",
	})
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
