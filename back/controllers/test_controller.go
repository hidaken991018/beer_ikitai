package controllers

import (
	"mybeerlog/utils"

	"github.com/astaxie/beego"
)

// TestController provides test utilities for local development
type TestController struct {
	BaseController
}

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
		cognitoSub = utils.GetDefaultTestCognitoSub()
	}

	// テストトークン生成
	token := utils.GenerateTestToken(cognitoSub)

	c.JSONResponse(token)
}

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

// getCognitoSub extracts Cognito SUB from request (including test tokens)
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
		if cognitoSub, err := utils.ValidateTestToken(token); err == nil {
			return cognitoSub
		}
	}

	// 本番環境では実際のCognito検証を行う
	// TODO: 実際のCognito JWT検証を実装

	return ""
}