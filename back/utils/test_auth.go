package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/astaxie/beego"
)

// TestAuthToken represents a test authentication token for local development
type TestAuthToken struct {
	Token     string `json:"token"`
	CognitoSub string `json:"cognito_sub"`
	ExpiresAt int64  `json:"expires_at"`
}

// GenerateTestToken creates a test token for local development
func GenerateTestToken(cognitoSub string) *TestAuthToken {
	// ランダムトークン生成
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// 1時間後に期限切れ
	expiresAt := time.Now().Add(time.Hour).Unix()

	return &TestAuthToken{
		Token:     token,
		CognitoSub: cognitoSub,
		ExpiresAt: expiresAt,
	}
}

// ValidateTestToken validates a test token (for local development only)
func ValidateTestToken(token string) (string, error) {
	// 本番環境では使用しない
	if beego.BConfig.RunMode != "dev" {
		return "", fmt.Errorf("test tokens are only available in development mode")
	}

	// 簡易的な検証（実際のプロジェクトではRedisやメモリストアを使用）
	// ここでは開発用として固定のテストユーザーを返す
	if token == "test-token" {
		return "test-user-sub", nil
	}

	return "", fmt.Errorf("invalid test token")
}

// GetDefaultTestCognitoSub returns a default test Cognito SUB for development
func GetDefaultTestCognitoSub() string {
	return "test-user-" + GenerateRandomString(8)
}

// GenerateRandomString generates a random string of given length
func GenerateRandomString(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:length]
}