package controllers

import (
	"encoding/base64"
	"encoding/json"
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
		"run_mode":       beego.BConfig.RunMode,
		"is_lambda":      c.isLambdaEnvironment(),
		"request_method": c.Ctx.Request.Method,
		"request_uri":    c.Ctx.Request.RequestURI,
	})

	// 1. JWT トークンから Cognito Sub を直接デコード（最優先）
	if cognitoSub := c.getCognitoSubFromJWT(); cognitoSub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub obtained from JWT token", map[string]interface{}{
			"cognito_sub": cognitoSub,
			"method":      "jwt_decode",
		})
		return cognitoSub, nil
	}

	// 2. Lambda requestContext から Cognito Sub を取得
	if cognitoSub := c.getCognitoSubFromRequestContext(); cognitoSub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub obtained from Lambda requestContext", map[string]interface{}{
			"cognito_sub": cognitoSub,
			"method":      "lambda_request_context",
		})
		return cognitoSub, nil
	}

	// 3. API Gateway Authorizer から設定されるヘッダーを確認（従来方式）
	if cognitoSub := c.getCognitoSubFromHeaders(); cognitoSub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub obtained from API Gateway headers", map[string]interface{}{
			"cognito_sub": cognitoSub,
			"method":      "api_gateway_headers",
		})
		return cognitoSub, nil
	}

	utils.LogDebug(c.Ctx.Request.Context(), "API Gateway headers check completed - no Cognito Sub found", nil)

	// 4. 開発環境でのテストトークン処理
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
						"cognito_sub": testCognitoSub,
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

	// 5. 認証情報が取得できない場合のエラー（詳細情報付き）
	c.logAuthenticationFailure()
	return "", errors.New("authentication required: cognito sub not found")
}

// getCognitoSubFromJWT Authorization ヘッダーの JWT トークンから Cognito Sub を取得
func (c *BaseController) getCognitoSubFromJWT() string {
	authHeader := c.Ctx.Request.Header.Get("Authorization")
	if authHeader == "" {
		utils.LogDebug(c.Ctx.Request.Context(), "No Authorization header found for JWT decode", nil)
		return ""
	}

	// Bearer トークンのフォーマット確認
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		utils.LogDebug(c.Ctx.Request.Context(), "Invalid Authorization header format for JWT", map[string]interface{}{
			"parts_count": len(parts),
			"auth_type":   parts[0],
		})
		return ""
	}

	jwtToken := parts[1]
	utils.LogDebug(c.Ctx.Request.Context(), "Attempting to decode JWT token", map[string]interface{}{
		"token_length": len(jwtToken),
	})

	// JWT は base64url エンコードされた3つの部分（header.payload.signature）に分かれている
	tokenParts := strings.Split(jwtToken, ".")
	if len(tokenParts) != 3 {
		utils.LogDebug(c.Ctx.Request.Context(), "Invalid JWT token format", map[string]interface{}{
			"token_parts_count": len(tokenParts),
		})
		return ""
	}

	// ペイロード部分（インデックス1）をデコード
	payload := tokenParts[1]
	
	// base64url のパディング調整
	switch len(payload) % 4 {
	case 2:
		payload += "=="
	case 3:
		payload += "="
	}

	// base64 デコード
	decodedPayload, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		utils.LogDebug(c.Ctx.Request.Context(), "Failed to decode JWT payload", map[string]interface{}{
			"error": err.Error(),
		})
		return ""
	}

	// JSON パース
	var claims map[string]interface{}
	if err := json.Unmarshal(decodedPayload, &claims); err != nil {
		utils.LogDebug(c.Ctx.Request.Context(), "Failed to parse JWT claims", map[string]interface{}{
			"error": err.Error(),
		})
		return ""
	}

	utils.LogDebug(c.Ctx.Request.Context(), "Successfully decoded JWT claims", map[string]interface{}{
		"claims_count": len(claims),
		"has_sub":      claims["sub"] != nil,
	})

	// sub クレームを取得
	if sub, ok := claims["sub"].(string); ok && sub != "" {
		utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub extracted from JWT", map[string]interface{}{
			"cognito_sub": sub,
		})
		return sub
	}

	utils.LogDebug(c.Ctx.Request.Context(), "No valid sub claim found in JWT", map[string]interface{}{
		"sub_claim": claims["sub"],
	})

	return ""
}

// getCognitoSubFromRequestContext Lambda requestContext から Cognito Sub を取得
func (c *BaseController) getCognitoSubFromRequestContext() string {
	// Lambda 環境でない場合はスキップ
	if !c.isLambdaEnvironment() {
		utils.LogDebug(c.Ctx.Request.Context(), "Not in Lambda environment, skipping requestContext check", nil)
		return ""
	}

	utils.LogDebug(c.Ctx.Request.Context(), "Attempting to get Cognito Sub from Lambda requestContext", nil)

	// aws-lambda-go-api-proxy を使用している場合、
	// context から APIGatewayProxyRequest の情報が取得できる可能性がある
	
	// Context から aws-lambda-go-api-proxy が設定した値を取得する試み
	// 注意: この方法は aws-lambda-go-api-proxy の実装に依存する
	if ctx := c.Ctx.Request.Context(); ctx != nil {
		// context に含まれる値を調査
		utils.LogDebug(c.Ctx.Request.Context(), "Checking context for Lambda information", map[string]interface{}{
			"context_type": "request_context",
		})
		
		// aws-lambda-go-api-proxy が設定するコンテキストキーを確認
		// 通常は "aws-lambda-go-api-proxy" や類似のキーで情報が格納される
		if value := ctx.Value("apigateway-request"); value != nil {
			utils.LogDebug(c.Ctx.Request.Context(), "Found apigateway-request in context", map[string]interface{}{
				"value_type": "apigateway_request",
			})
		}
		
		if value := ctx.Value("aws-lambda-context"); value != nil {
			utils.LogDebug(c.Ctx.Request.Context(), "Found aws-lambda-context in context", map[string]interface{}{
				"value_type": "lambda_context",
			})
		}
	}

	// ヘッダーから requestContext の情報を取得する試み
	// API Gateway が設定する可能性のあるヘッダー
	contextHeaders := map[string]string{
		"X-Amzn-Requestcontext-Authorizer-Claims-Sub":      "requestcontext_authorizer_claims_sub",
		"X-Amzn-Requestcontext-Authorizer-Sub":             "requestcontext_authorizer_sub", 
		"X-Apigateway-Event":                               "apigateway_event",
		"X-Amzn-Requestcontext":                            "requestcontext",
	}

	for header, description := range contextHeaders {
		if value := c.Ctx.Request.Header.Get(header); value != "" {
			utils.LogDebug(c.Ctx.Request.Context(), "Found requestContext header", map[string]interface{}{
				"header":      header,
				"description": description,
				"value":       value,
			})
			
			// 直接 sub 値として使用できる場合
			if strings.Contains(header, "Sub") && value != "" {
				return value
			}
		}
	}

	utils.LogDebug(c.Ctx.Request.Context(), "No Cognito Sub found in Lambda requestContext", nil)
	return ""
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
		headerResults[header] = value
		if value != "" {
			utils.LogDebug(c.Ctx.Request.Context(), "Cognito Sub found in header", map[string]interface{}{
				"header": header,
				"value":  value,
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
		"lambda_request_id":        lambdaRequestId,
	})

	if lambdaRequestId != "" {
		// API Gateway Lambda プロキシ統合でのリクエストコンテキスト情報
		contextHeader := "X-Amzn-Requestcontext-Authorizer-Claims-Sub"
		value := c.Ctx.Request.Header.Get(contextHeader)
		utils.LogDebug(c.Ctx.Request.Context(), "Lambda request context header check", map[string]interface{}{
			"header":      contextHeader,
			"value_found": value != "",
			"value":       value,
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

// logAuthenticationFailure 認証失敗時の詳細情報をログ出力する
func (c *BaseController) logAuthenticationFailure() {
	// 認証失敗時の詳細ログを出力（デバッグ用）
	utils.LogWarn(c.Ctx.Request.Context(), "Failed to obtain Cognito Sub from API Gateway", map[string]interface{}{
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