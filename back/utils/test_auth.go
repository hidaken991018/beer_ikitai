package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"time"

	"github.com/astaxie/beego"
)

// TestAuthToken ローカル開発用のテスト認証トークンを表す
type TestAuthToken struct {
	Token     string `json:"token"`
	CognitoSub string `json:"cognito_sub"`
	ExpiresAt int64  `json:"expires_at"`
}

// TestAuthTokenManager テスト認証トークンを管理する
type TestAuthTokenManager struct {
	tokens map[string]*TestAuthToken
	mutex  sync.RWMutex
}

// NewTestAuthTokenManager 新しいTestAuthTokenManagerインスタンスを作成する
func NewTestAuthTokenManager() *TestAuthTokenManager {
	manager := &TestAuthTokenManager{
		tokens: make(map[string]*TestAuthToken),
	}
	
	// デフォルトのテストトークンを追加
	defaultToken := &TestAuthToken{
		Token:     "test-token",
		CognitoSub: "test-user-sub",
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(), // 24時間有効
	}
	manager.tokens["test-token"] = defaultToken
	
	return manager
}

// GenerateToken ローカル開発用のテストトークンを作成する
func (m *TestAuthTokenManager) GenerateToken(cognitoSub string) *TestAuthToken {
	// ランダムトークン生成
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// 1時間後に期限切れ
	expiresAt := time.Now().Add(time.Hour).Unix()

	testToken := &TestAuthToken{
		Token:     token,
		CognitoSub: cognitoSub,
		ExpiresAt: expiresAt,
	}

	// トークンストアに保存
	m.mutex.Lock()
	m.tokens[token] = testToken
	m.mutex.Unlock()

	return testToken
}

// ValidateToken テストトークンを検証する（ローカル開発のみ）
func (m *TestAuthTokenManager) ValidateToken(token string) (string, error) {
	// 本番環境では使用しない
	if beego.BConfig.RunMode != "dev" {
		return "", fmt.Errorf("test tokens are only available in development mode")
	}

	m.mutex.RLock()
	testToken, exists := m.tokens[token]
	m.mutex.RUnlock()

	if !exists {
		return "", fmt.Errorf("invalid test token")
	}

	// 有効期限チェック
	if time.Now().Unix() > testToken.ExpiresAt {
		// 期限切れトークンを削除
		m.mutex.Lock()
		delete(m.tokens, token)
		m.mutex.Unlock()
		return "", fmt.Errorf("test token has expired")
	}

	return testToken.CognitoSub, nil
}

// RevokeToken 特定のテストトークンを無効化する
func (m *TestAuthTokenManager) RevokeToken(token string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	if _, exists := m.tokens[token]; !exists {
		return fmt.Errorf("token not found")
	}

	delete(m.tokens, token)
	return nil
}

// CleanupExpiredTokens 期限切れトークンをストアから削除する
func (m *TestAuthTokenManager) CleanupExpiredTokens() {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	currentTime := time.Now().Unix()
	for token, testToken := range m.tokens {
		if currentTime > testToken.ExpiresAt {
			delete(m.tokens, token)
		}
	}
}

// GetDefaultTestCognitoSub 開発用のデフォルトテストCognito SUBを返す
func (m *TestAuthTokenManager) GetDefaultTestCognitoSub() string {
	return "test-user-" + m.generateRandomString(8)
}

// generateRandomString 指定された長さのランダム文字列を生成する
func (m *TestAuthTokenManager) generateRandomString(length int) string {
	bytes := make([]byte, length/2)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)[:length]
}

// GetTokenCount アクティブなトークン数を返す（デバッグ用）
func (m *TestAuthTokenManager) GetTokenCount() int {
	m.mutex.RLock()
	defer m.mutex.RUnlock()
	return len(m.tokens)
}

// グローバルインスタンス（シングルトンパターン）
var (
	testAuthManager *TestAuthTokenManager
	once           sync.Once
)

// GetTestAuthTokenManager TestAuthTokenManagerのシングルトンインスタンスを返す
func GetTestAuthTokenManager() *TestAuthTokenManager {
	once.Do(func() {
		testAuthManager = NewTestAuthTokenManager()
		
		// 定期的な期限切れトークンのクリーンアップ（バックグラウンド処理）
		go func() {
			ticker := time.NewTicker(30 * time.Minute)
			defer ticker.Stop()
			for range ticker.C {
				testAuthManager.CleanupExpiredTokens()
			}
		}()
	})
	return testAuthManager
}