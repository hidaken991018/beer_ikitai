package controllers

import (
	"errors"
	"mybeerlog/interfaces/dto"
	"mybeerlog/utils"
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
	c.Data["json"] = data
	c.ServeJSON()
}

// ErrorResponse エラーレスポンスを送信する
func (c *BaseController) ErrorResponse(code int, message, errorCode string) {
	c.Ctx.ResponseWriter.WriteHeader(code)
	c.Data["json"] = dto.ErrorResponse{
		Error: message,
		Code:  errorCode,
	}
	c.ServeJSON()
}

// GetCognitoSub Cognito JWTからユーザー情報を取得する
func (c *BaseController) GetCognitoSub() (string, error) {
	// API Gateway Lambda プロキシ統合では、Cognito の認証情報が requestContext に含まれる
	if c.Ctx.Request.Header.Get("X-Amzn-Requestid") != "" {
		// Lambda 環境での認証情報取得
		if cognitoSub := c.Ctx.Request.Header.Get("X-Amzn-Trace-Id"); cognitoSub != "" {
			// API Gateway が設定した Cognito sub を取得
			if sub := c.Ctx.Request.Header.Get("X-Cognito-Sub"); sub != "" {
				return sub, nil
			}
		}
	}

	// Authorization ヘッダーから JWT を取得（フォールバック）
	authHeader := c.Ctx.Request.Header.Get("Authorization")
	if authHeader == "" {
		return "", errors.New("authorization header required")
	}

	// Bearer トークンの解析
	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return "", errors.New("invalid authorization header format")
	}

	token := parts[1]

	// 開発環境ではテストトークンも受け入れる
	if beego.BConfig.RunMode == "dev" {
		authManager := utils.GetTestAuthTokenManager()
		if cognitoSub, err := authManager.ValidateToken(token); err == nil {
			return cognitoSub, nil
		}
	}

	// JWT の検証とデコード（簡易実装）
	// 実際の運用では AWS Cognito JWT の検証を実装する必要があります
	// TODO: AWS Cognito JWT 検証の実装

	// デモ用の簡易実装
	claims, err := c.parseJWT(token)
	if err != nil {
		return "", err
	}

	sub, ok := claims["sub"].(string)
	if !ok {
		return "", errors.New("invalid JWT claims")
	}

	return sub, nil
}

// IsAdmin 管理者権限をチェックする
func (c *BaseController) IsAdmin() bool {
	// JWT から権限情報を取得
	// TODO: AWS Cognito のグループ情報から管理者権限をチェック
	return false // デモ用
}

// GetIntQuery 整数型のクエリパラメータを取得する
func (c *BaseController) GetIntQuery(key string, defaultValue int) int {
	value := c.GetString(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
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

// parseJWT 簡易JWTパーサー（デモ用）
func (c *BaseController) parseJWT(token string) (map[string]interface{}, error) {
	// 実際の実装では proper JWT validation が必要
	// この実装はデモ用の簡易版です

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid JWT format")
	}

	// Base64 デコード (簡易実装)
	// 実際の運用では proper JWT library を使用してください

	// デモ用のダミーデータ
	return map[string]interface{}{
		"sub":            "demo-user-123",
		"cognito:groups": []string{"user"},
	}, nil
}
