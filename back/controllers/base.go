package controllers

import (
	"errors"
	"mybeerlog/interfaces/dto"
	"mybeerlog/utils"
	"strconv"
	"strings"

	"github.com/astaxie/beego"
)

type BaseController struct {
	beego.Controller
}

// JSON レスポンス
func (c *BaseController) JSONResponse(data interface{}) {
	c.Data["json"] = data
	c.ServeJSON()
}

// エラーレスポンス
func (c *BaseController) ErrorResponse(code int, message, errorCode string) {
	c.Ctx.ResponseWriter.WriteHeader(code)
	c.Data["json"] = dto.ErrorResponse{
		Error: message,
		Code:  errorCode,
	}
	c.ServeJSON()
}

// Cognito JWT からユーザー情報を取得
func (c *BaseController) GetCognitoSub() (string, error) {
	// Authorization ヘッダーから JWT を取得
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
		if cognitoSub, err := utils.ValidateTestToken(token); err == nil {
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

// 管理者権限チェック
func (c *BaseController) IsAdmin() bool {
	// JWT から権限情報を取得
	// TODO: AWS Cognito のグループ情報から管理者権限をチェック
	return false // デモ用
}

// クエリパラメータの取得
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

func (c *BaseController) GetStringQuery(key string, defaultValue string) string {
	value := c.GetString(key)
	if value == "" {
		return defaultValue
	}

	return value
}

// 簡易 JWT パーサー（デモ用）
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
