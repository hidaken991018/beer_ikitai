package dto

import "time"

// ErrorResponse 統一エラーレスポンス構造
type ErrorResponse struct {
	Error     string            `json:"error"`
	Code      string            `json:"code"`
	Message   string            `json:"message,omitempty"`
	Details   map[string]string `json:"details,omitempty"`
	RequestID string            `json:"request_id,omitempty"`
	Timestamp string            `json:"timestamp"`
}

// NewErrorResponse 新しいエラーレスポンスを作成する
func NewErrorResponse(code, userMessage, internalError string, requestID string) *ErrorResponse {
	return &ErrorResponse{
		Error:     userMessage,
		Code:      code,
		Message:   internalError,
		RequestID: requestID,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
}

// NewErrorResponseWithDetails 詳細情報付きエラーレスポンスを作成する
func NewErrorResponseWithDetails(code, userMessage, internalError string, details map[string]string, requestID string) *ErrorResponse {
	return &ErrorResponse{
		Error:     userMessage,
		Code:      code,
		Message:   internalError,
		Details:   details,
		RequestID: requestID,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
}

// SuccessResponse 成功レスポンスの基本構造
type SuccessResponse struct {
	Data      interface{} `json:"data"`
	Message   string      `json:"message,omitempty"`
	RequestID string      `json:"request_id,omitempty"`
	Timestamp string      `json:"timestamp"`
}

// NewSuccessResponse 新しい成功レスポンスを作成する
func NewSuccessResponse(data interface{}, message, requestID string) *SuccessResponse {
	return &SuccessResponse{
		Data:      data,
		Message:   message,
		RequestID: requestID,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	}
}

// HealthResponse ヘルスチェックレスポンス
type HealthResponse struct {
	Status      string            `json:"status"`
	Timestamp   string            `json:"timestamp"`
	Version     string            `json:"version,omitempty"`
	Environment string            `json:"environment,omitempty"`
	Checks      map[string]string `json:"checks,omitempty"`
}

// ValidationError バリデーションエラーの詳細
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   string `json:"value,omitempty"`
}

// ErrorCode エラーコードの定数定義
const (
	// 認証・認可関連
	ErrorCodeUnauthorized        = "UNAUTHORIZED"
	ErrorCodeForbidden          = "FORBIDDEN"
	ErrorCodeInvalidToken       = "INVALID_TOKEN"
	ErrorCodeTokenExpired       = "TOKEN_EXPIRED"
	
	// バリデーション関連
	ErrorCodeValidationFailed   = "VALIDATION_FAILED"
	ErrorCodeInvalidRequest     = "INVALID_REQUEST"
	ErrorCodeMissingParameter   = "MISSING_PARAMETER"
	ErrorCodeInvalidParameter   = "INVALID_PARAMETER"
	
	// リソース関連
	ErrorCodeNotFound           = "NOT_FOUND"
	ErrorCodeResourceExists     = "RESOURCE_EXISTS"
	ErrorCodeResourceConflict   = "RESOURCE_CONFLICT"
	
	// システム関連
	ErrorCodeInternalServer     = "INTERNAL_SERVER_ERROR"
	ErrorCodeServiceUnavailable = "SERVICE_UNAVAILABLE"
	ErrorCodeDatabaseError      = "DATABASE_ERROR"
	ErrorCodeExternalAPIError   = "EXTERNAL_API_ERROR"
	
	// ビジネスロジック関連
	ErrorCodeProfileNotFound    = "PROFILE_NOT_FOUND"
	ErrorCodeProfileExists      = "PROFILE_EXISTS"
	ErrorCodeBreweryNotFound    = "BREWERY_NOT_FOUND"
	ErrorCodeVisitNotFound      = "VISIT_NOT_FOUND"
	ErrorCodeCheckInFailed      = "CHECKIN_FAILED"
	ErrorCodeLocationTooFar     = "LOCATION_TOO_FAR"
)