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
	// デバッグ用環境情報ログ
	utils.LogDebug(c.Ctx.Request.Context(), "Starting Cognito Sub authentication process", map[string]interface{}{
		"run_mode":      beego.BConfig.RunMode,
		"is_lambda":     c.isLambdaEnvironment(),
		"request_method": c.Ctx.Request.Method,
		"request_uri":   c.Ctx.Request.RequestURI,
	})

	// 1. API Gateway Authorizer から設定されるヘッダーを確認
	// Lambda Authorizerまたは Cognito Authorizer が設定するヘッダー
	cognitoSub := c.getCognitoSubFromHeaders()
	if cognitoSub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub obtained from API Gateway headers", map[string]interface{}{
			"cognito_sub": c.maskSensitiveData(cognitoSub),
			"method":      "api_gateway_headers",
		})
		return cognitoSub, nil
	}

	utils.LogDebug(c.Ctx.Request.Context(), "API Gateway headers check completed - no Cognito Sub found", nil)

	// 2. 開発環境でのテストトークン処理
	if beego.BConfig.RunMode == "dev" {
		utils.LogDebug(c.Ctx.Request.Context(), "Attempting test token validation in dev environment", nil)
		authHeader := c.Ctx.Request.Header.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			utils.LogDebug(c.Ctx.Request.Context(), "Authorization header found", map[string]interface{}{
				"header_parts_count": len(parts),
				"auth_type":          parts[0],
			})
			if len(parts) == 2 && parts[0] == "Bearer" {
				authManager := utils.GetTestAuthTokenManager()
				if testCognitoSub, err := authManager.ValidateToken(parts[1]); err == nil {
					utils.LogDebug(c.Ctx.Request.Context(), "Test token validated in dev environment", map[string]interface{}{
						"cognito_sub": c.maskSensitiveData(testCognitoSub),
						"method":      "dev_test_token",
					})
					return testCognitoSub, nil
				} else {
					utils.LogDebug(c.Ctx.Request.Context(), "Test token validation failed", map[string]interface{}{
						"error": err.Error(),
					})
				}
			} else {
				utils.LogDebug(c.Ctx.Request.Context(), "Invalid Authorization header format", nil)
			}
		} else {
			utils.LogDebug(c.Ctx.Request.Context(), "No Authorization header found in dev environment", nil)
		}
	} else {
		utils.LogDebug(c.Ctx.Request.Context(), "Skipping test token validation - not in dev environment", map[string]interface{}{
			"run_mode": beego.BConfig.RunMode,
		})
	}

	// 3. 認証情報が取得できない場合のエラー（詳細情報付き）
	c.logAuthenticationFailure()
	return "", errors.New("authentication required: cognito sub not found")
}

// getCognitoSubFromHeaders API Gatewayが設定する各種ヘッダーからCognito Subを取得
func (c *BaseController) getCognitoSubFromHeaders() string {
	// API Gateway Cognito Authorizer が設定するヘッダー（一般的なパターン）
	headers := []string{
		"X-Cognito-Sub",      // Cognito Authorizer
		"X-Amzn-Cognito-Sub", // AWS Lambda Proxy統合
		"X-Amz-User-Sub",     // カスタムヘッダー
		"X-User-Sub",         // カスタムヘッダー
	}

	utils.LogDebug(c.Ctx.Request.Context(), "Checking API Gateway Cognito headers", map[string]interface{}{
		"target_headers": headers,
	})

	headerResults := make(map[string]string)
	for _, header := range headers {
		value := c.Ctx.Request.Header.Get(header)
		headerResults[header] = c.maskSensitiveData(value)
		if value != "" {
			utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub found in header", map[string]interface{}{
				"header": header,
				"value":  c.maskSensitiveData(value),
			})
			return value
		}
	}

	utils.LogDebug(c.Ctx.Request.Context(), "Primary header check completed", map[string]interface{}{
		"header_results": headerResults,
	})

	// Lambda環境での requestContext からの取得（追加の確認）
	lambdaRequestId := c.Ctx.Request.Header.Get("X-Amzn-Requestid")
	utils.LogDebug(c.Ctx.Request.Context(), "Checking Lambda environment headers", map[string]interface{}{
		"lambda_request_id_exists": lambdaRequestId != "",
		"lambda_request_id":        c.maskSensitiveData(lambdaRequestId),
	})

	if lambdaRequestId != "" {
		// API Gateway Lambda プロキシ統合でのリクエストコンテキスト情報
		contextHeader := "X-Amzn-Requestcontext-Authorizer-Claims-Sub"
		value := c.Ctx.Request.Header.Get(contextHeader)
		utils.LogDebug(c.Ctx.Request.Context(), "Lambda request context header check", map[string]interface{}{
			"header":      contextHeader,
			"value_found": value != "",
			"value":       c.maskSensitiveData(value),
		})
		if value != "" {
			return value
		}
	}

	return ""
}

// isLambdaEnvironment Lambda環境で実行されているかを判定する
func (c *BaseController) isLambdaEnvironment() bool {
	return c.Ctx.Request.Header.Get("AWS_LAMBDA_FUNCTION_NAME") != "" || 
		   c.Ctx.Request.Header.Get("X-Amzn-Requestid") != ""
}

// maskSensitiveData センシティブなデータをマスクする
func (c *BaseController) maskSensitiveData(data string) string {
	if data == "" {
		return "<empty>"
	}
	if len(data) <= 8 {
		return strings.Repeat("*", len(data))
	}
	return data[:4] + strings.Repeat("*", len(data)-8) + data[len(data)-4:]
}

// logAuthenticationFailure 認証失敗時の詳細情報をログ出力する
func (c *BaseController) logAuthenticationFailure() {
	// 利用可能な全ヘッダーを取得してログ出力
	allHeaders := make(map[string]string)
	for headerName, headerValues := range c.Ctx.Request.Header {
		if len(headerValues) > 0 {
			// 認証関連のヘッダーのみログに記録
			if c.isAuthRelatedHeader(headerName) {
				allHeaders[headerName] = c.maskSensitiveData(headerValues[0])
			}
		}
	}

	utils.LogWarn(c.Ctx.Request.Context(), "Failed to obtain Cognito Sub from API Gateway", map[string]interface{}{
		"run_mode":         beego.BConfig.RunMode,
		"is_lambda":        c.isLambdaEnvironment(),
		"request_method":   c.Ctx.Request.Method,
		"request_uri":      c.Ctx.Request.RequestURI,
		"auth_headers":     allHeaders,
		"header_count":     len(c.Ctx.Request.Header),
		"has_auth_header":  c.Ctx.Request.Header.Get("Authorization") != "",
	})
}

// isAuthRelatedHeader 認証関連のヘッダーかどうかを判定する
func (c *BaseController) isAuthRelatedHeader(headerName string) bool {
	authHeaders := []string{
		"Authorization",
		"X-Cognito-Sub",
		"X-Amzn-Cognito-Sub", 
		"X-Amz-User-Sub",
		"X-User-Sub",
		"X-Amzn-Requestid",
		"X-Amzn-Requestcontext-Authorizer-Claims-Sub",
		"X-Cognito-Groups",
		"X-Amzn-Cognito-Groups",
		"X-Amzn-Requestcontext-Authorizer-Claims-Cognito-Groups",
		"AWS_LAMBDA_FUNCTION_NAME",
	}
	
	headerLower := strings.ToLower(headerName)
	for _, authHeader := range authHeaders {
		if strings.ToLower(authHeader) == headerLower {
			return true
		}
	}
	
	// X-Amzn- や X-Cognito- で始まるヘッダーも含める
	return strings.HasPrefix(headerLower, "x-amzn-") || 
		   strings.HasPrefix(headerLower, "x-cognito-") ||
		   strings.Contains(headerLower, "auth")
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