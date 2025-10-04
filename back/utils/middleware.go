package utils

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"mybeerlog/interfaces/dto"
	"net/http"
	"runtime"
	"time"

	beegoCtx "github.com/astaxie/beego/context"
	"github.com/sirupsen/logrus"
)

// RequestIDHeader リクエストIDヘッダー名
const RequestIDHeader = "X-Request-ID"

// GenerateRequestID リクエストIDを生成する
func GenerateRequestID() string {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		// フォールバック：タイムスタンプベース
		return fmt.Sprintf("req_%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(bytes)
}

// RequestLoggingMiddleware リクエストログ記録ミドルウェア
func RequestLoggingMiddleware(ctx *beegoCtx.Context) {
	startTime := time.Now()

	// リクエストIDを生成または取得
	requestID := ctx.Request.Header.Get(RequestIDHeader)
	if requestID == "" {
		requestID = GenerateRequestID()
	}

	// リクエストIDをレスポンスヘッダーに設定
	ctx.ResponseWriter.Header().Set(RequestIDHeader, requestID)

	// コンテキストにリクエストIDを設定
	reqCtx := SetRequestIDToContext(ctx.Request.Context(), requestID)
	ctx.Request = ctx.Request.WithContext(reqCtx)

	// リクエスト開始ログ
	LogRequest(reqCtx, ctx.Request.Method, ctx.Request.URL.Path, ctx.Request.UserAgent())

	// リクエスト処理後のログ出力用に後処理を設定
	rw := &responseWriter{
		ResponseWriter: ctx.ResponseWriter.ResponseWriter,
		statusCode:     200, // デフォルト
		requestCtx:     reqCtx,
		startTime:      startTime,
	}
	ctx.ResponseWriter.ResponseWriter = rw
}

// responseWriter レスポンス情報を記録するためのカスタムResponseWriter
type responseWriter struct {
	http.ResponseWriter
	statusCode int
	requestCtx context.Context
	startTime  time.Time
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)

	// レスポンス完了ログ
	duration := time.Since(rw.startTime).Milliseconds()
	LogResponse(rw.requestCtx, rw.statusCode, duration)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	// WriteHeaderが呼ばれていない場合のデフォルト処理
	if rw.statusCode == 0 {
		rw.statusCode = 200
	}
	return rw.ResponseWriter.Write(b)
}

// PanicRecoveryMiddleware パニック復旧ミドルウェア
func PanicRecoveryMiddleware(ctx *beegoCtx.Context) {
	defer func() {
		if r := recover(); r != nil {
			// スタックトレースを取得
			stackTrace := make([]byte, 4096)
			stackSize := runtime.Stack(stackTrace, false)

			// リクエストIDを取得
			requestID := GetRequestIDFromContext(ctx.Request.Context())
			if requestID == "" {
				requestID = "unknown"
			}

			// エラーログを出力
			Logger.WithFields(logrus.Fields{
				"request_id":  requestID,
				"panic":       r,
				"stack_trace": string(stackTrace[:stackSize]),
				"method":      ctx.Request.Method,
				"path":        ctx.Request.URL.Path,
				"type":        "panic_recovery",
			}).Error("Panic recovered")

			// 統一エラーレスポンスを返す
			errorResponse := dto.NewErrorResponse(
				dto.ErrorCodeInternalServer,
				"An internal server error occurred",
				fmt.Sprintf("Panic: %v", r),
				requestID,
			)

			ctx.ResponseWriter.WriteHeader(http.StatusInternalServerError)
			ctx.ResponseWriter.Header().Set("Content-Type", "application/json")
			ctx.ResponseWriter.Header().Set(RequestIDHeader, requestID)
			// JSONエラーレスポンスを出力
			if jsonData, err := json.Marshal(errorResponse); err == nil {
				if _, err := ctx.ResponseWriter.Write(jsonData); err != nil {
					Logger.WithError(err).Error("Failed to write JSON error response")
				}
			} else {
				// JSONマーシャルに失敗した場合のフォールバック
				fallbackResponse := fmt.Sprintf(`{"error":"Internal server error","code":"INTERNAL_SERVER_ERROR","request_id":"%s","timestamp":"%s"}`,
					requestID, time.Now().UTC().Format(time.RFC3339))
				if _, err := ctx.ResponseWriter.Write([]byte(fallbackResponse)); err != nil {
					Logger.WithError(err).Error("Failed to write fallback error response")
				}
			}
		}
	}()
}

// SecurityHeadersMiddleware セキュリティヘッダー設定ミドルウェア
func SecurityHeadersMiddleware(ctx *beegoCtx.Context) {
	ctx.Output.Header("X-Content-Type-Options", "nosniff")
	ctx.Output.Header("X-Frame-Options", "DENY")
	ctx.Output.Header("X-XSS-Protection", "1; mode=block")
	ctx.Output.Header("Referrer-Policy", "strict-origin-when-cross-origin")

	// HTTPS環境でのみHSTSヘッダーを設定
	if ctx.Request.Header.Get("X-Forwarded-Proto") == "https" || ctx.Request.TLS != nil {
		ctx.Output.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
	}
}

// CORSMiddleware CORS設定ミドルウェア
func CORSMiddleware(ctx *beegoCtx.Context) {
	// NOTE: API GatewayでCORS設定を行うため、ここでは全オリジンを許可
	ctx.Output.Header("Access-Control-Allow-Origin", "*")
}
