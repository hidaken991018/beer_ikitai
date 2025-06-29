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
	"strings"
	"time"

	"github.com/astaxie/beego"
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
	ctx.ResponseWriter.ResponseWriter.(*beegoCtx.Response).ResponseWriter = &responseWriter{
		ResponseWriter: ctx.ResponseWriter.ResponseWriter.(*beegoCtx.Response).ResponseWriter,
		statusCode:     200, // デフォルト
		requestCtx:     reqCtx,
		startTime:      startTime,
	}
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
				ctx.ResponseWriter.Write(jsonData)
			} else {
				// JSONマーシャルに失敗した場合のフォールバック
				fallbackResponse := fmt.Sprintf(`{"error":"Internal server error","code":"INTERNAL_SERVER_ERROR","request_id":"%s","timestamp":"%s"}`,
					requestID, time.Now().UTC().Format(time.RFC3339))
				ctx.ResponseWriter.Write([]byte(fallbackResponse))
			}
		}
	}()
}

// CORSMiddleware CORS対応ミドルウェア
func CORSMiddleware(ctx *beegoCtx.Context) {
	// 環境に応じたCORS設定
	allowedOrigins := getAllowedOrigins()
	origin := ctx.Request.Header.Get("Origin")

	// オリジンチェック
	if isOriginAllowed(origin, allowedOrigins) {
		ctx.Output.Header("Access-Control-Allow-Origin", origin)
	}

	ctx.Output.Header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS")
	ctx.Output.Header("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Request-ID")
	ctx.Output.Header("Access-Control-Allow-Credentials", "true")
	ctx.Output.Header("Access-Control-Max-Age", "3600")

	// プリフライトリクエストの処理
	if ctx.Input.Method() == "OPTIONS" {
		ctx.Output.SetStatus(http.StatusOK)
		return
	}
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

// getAllowedOrigins 環境に応じた許可オリジンを取得
func getAllowedOrigins() []string {
	// 環境変数から許可オリジンを取得
	allowedOriginsEnv := getEnvOrDefault("ALLOWED_ORIGINS", "")

	if allowedOriginsEnv != "" {
		// カンマ区切りで複数オリジンを指定可能
		origins := []string{}
		for _, origin := range strings.Split(allowedOriginsEnv, ",") {
			origins = append(origins, strings.TrimSpace(origin))
		}
		return origins
	}

	// デフォルト設定（環境別）
	runMode := beego.BConfig.RunMode
	switch runMode {
	case "dev":
		return []string{
			"http://localhost:3000",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:8080",
		}
	case "test":
		return []string{
			"http://localhost:3000",
		}
	case "prod":
		// 本番環境では具体的なドメインを指定
		return []string{
			"https://yourdomain.com",
			"https://www.yourdomain.com",
		}
	default:
		return []string{}
	}
}

// isOriginAllowed オリジンが許可されているかチェック
func isOriginAllowed(origin string, allowedOrigins []string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range allowedOrigins {
		if origin == allowed {
			return true
		}
	}
	return false
}
