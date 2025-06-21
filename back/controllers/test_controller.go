package controllers

import (
	"mybeerlog/utils"

	"github.com/astaxie/beego"
)

// TestController ローカル開発用のテストユーティリティを提供するコントローラー
type TestController struct {
	BaseController
	authManager *utils.TestAuthTokenManager
}

// NewTestController 新しいTestControllerインスタンスを作成する
func NewTestController() *TestController {
	return &TestController{
		authManager: utils.GetTestAuthTokenManager(),
	}
}

// GenerateToken ローカル開発用のテスト認証トークンを生成する
// @Title Generate Test Token
// @Description Generate a test authentication token for local development
// @Param cognito_sub query string false "Custom Cognito SUB (optional)"
// @Success 200 {object} utils.TestAuthToken
// @Failure 403 {object} map[string]string
// @router /generate-token [get]
func (c *TestController) GenerateToken() {
	// 開発環境でのみ利用可能
	if beego.BConfig.RunMode != "dev" {
		c.ErrorResponse(403, "Test tokens are only available in development mode", "FORBIDDEN")
		return
	}

	// Cognito SUBをクエリパラメータから取得、なければデフォルト生成
	cognitoSub := c.GetString("cognito_sub")
	if cognitoSub == "" {
		cognitoSub = c.authManager.GetDefaultTestCognitoSub()
	}

	// テストトークン生成
	token := c.authManager.GenerateToken(cognitoSub)

	c.JSONResponse(token)
}

// TestAuth トークンで認証をテストする
// @Title Test Authentication
// @Description Test authentication with a token
// @Param Authorization header string true "Bearer token"
// @Success 200 {object} map[string]string
// @Failure 401 {object} map[string]string
// @router /test-auth [get]
func (c *TestController) TestAuth() {
	cognitoSub := c.getCognitoSub()
	if cognitoSub == "" {
		c.ErrorResponse(401, "Authentication required", "UNAUTHORIZED")
		return
	}

	response := map[string]string{
		"message":     "Authentication successful",
		"cognito_sub": cognitoSub,
	}

	c.JSONResponse(response)
}

// getCognitoSub リクエストからCognito SUBを抽出する（テストトークン含む）
func (c *TestController) getCognitoSub() string {
	authHeader := c.Ctx.Input.Header("Authorization")
	if authHeader == "" {
		return ""
	}

	// Bearer tokenの形式チェック
	if len(authHeader) < 7 || authHeader[:7] != "Bearer " {
		return ""
	}

	token := authHeader[7:]

	// 開発環境ではテストトークンも受け入れる
	if beego.BConfig.RunMode == "dev" {
		if cognitoSub, err := c.authManager.ValidateToken(token); err == nil {
			return cognitoSub
		}
	}

	// 本番環境では実際のCognito検証を行う
	// TODO: 実際のCognito JWT検証を実装

	return ""
}

// RevokeToken テスト認証トークンを無効化する
// @Title Revoke Test Token
// @Description Revoke a test authentication token
// @Param token query string true "Token to revoke"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 403 {object} map[string]string
// @router /revoke-token [post]
func (c *TestController) RevokeToken() {
	// 開発環境でのみ利用可能
	if beego.BConfig.RunMode != "dev" {
		c.ErrorResponse(403, "Test tokens are only available in development mode", "FORBIDDEN")
		return
	}

	token := c.GetString("token")
	if token == "" {
		c.ErrorResponse(400, "Token parameter required", "MISSING_TOKEN")
		return
	}

	err := c.authManager.RevokeToken(token)
	if err != nil {
		c.ErrorResponse(400, err.Error(), "REVOKE_FAILED")
		return
	}

	response := map[string]string{
		"message": "Token revoked successfully",
	}
	c.JSONResponse(response)
}

// GetTokenInfo アクティブなテストトークンの情報を取得する
// @Title Get Token Info
// @Description Get information about active test tokens
// @Success 200 {object} map[string]interface{}
// @Failure 403 {object} map[string]string
// @router /token-info [get]
func (c *TestController) GetTokenInfo() {
	// 開発環境でのみ利用可能
	if beego.BConfig.RunMode != "dev" {
		c.ErrorResponse(403, "Test tokens are only available in development mode", "FORBIDDEN")
		return
	}

	response := map[string]interface{}{
		"active_tokens": c.authManager.GetTokenCount(),
		"message":      "Token information retrieved successfully",
	}
	c.JSONResponse(response)
}