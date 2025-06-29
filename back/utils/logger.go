package utils

import (
	"context"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

// Logger 構造化ログ用のグローバルロガー
var Logger *logrus.Logger

// RequestIDKey リクエストIDをコンテキストに保存するためのキー
type RequestIDKey struct{}

// LogLevel ログレベルの定義
type LogLevel string

const (
	LogLevelDebug LogLevel = "debug"
	LogLevelInfo  LogLevel = "info"
	LogLevelWarn  LogLevel = "warn"
	LogLevelError LogLevel = "error"
	LogLevelFatal LogLevel = "fatal"
	LogLevelPanic LogLevel = "panic"
)

// init パッケージ初期化時にロガーを設定
func init() {
	InitLogger()
}

// InitLogger ロガーを初期化する
func InitLogger() {
	Logger = logrus.New()

	// 環境変数からログレベルを取得
	logLevel := getEnvOrDefault("LOG_LEVEL", "info")
	level, err := logrus.ParseLevel(strings.ToLower(logLevel))
	if err != nil {
		level = logrus.InfoLevel
	}
	Logger.SetLevel(level)

	// Lambda環境またはJSON出力指定の場合はJSON形式で出力
	if isLambdaEnvironment() || getEnvOrDefault("LOG_FORMAT", "text") == "json" {
		Logger.SetFormatter(&logrus.JSONFormatter{
			TimestampFormat: "2006-01-02T15:04:05.000Z07:00",
			FieldMap: logrus.FieldMap{
				logrus.FieldKeyTime:  "timestamp",
				logrus.FieldKeyLevel: "level",
				logrus.FieldKeyMsg:   "message",
			},
		})
	} else {
		// 開発環境では見やすいテキスト形式
		Logger.SetFormatter(&logrus.TextFormatter{
			FullTimestamp:   true,
			TimestampFormat: "2006-01-02 15:04:05",
		})
	}

	// 出力先を設定（通常は標準出力）
	Logger.SetOutput(os.Stdout)
}

// WithRequestID リクエストIDを含むロガーを取得する
func WithRequestID(ctx context.Context) *logrus.Entry {
	if requestID := GetRequestIDFromContext(ctx); requestID != "" {
		return Logger.WithField("request_id", requestID)
	}
	return Logger.WithField("request_id", "unknown")
}

// WithFields 複数のフィールドを含むロガーを取得する
func WithFields(fields logrus.Fields) *logrus.Entry {
	return Logger.WithFields(fields)
}

// WithError エラー情報を含むロガーを取得する
func WithError(err error) *logrus.Entry {
	return Logger.WithError(err)
}

// SetRequestIDToContext コンテキストにリクエストIDを設定する
func SetRequestIDToContext(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey{}, requestID)
}

// GetRequestIDFromContext コンテキストからリクエストIDを取得する
func GetRequestIDFromContext(ctx context.Context) string {
	if requestID, ok := ctx.Value(RequestIDKey{}).(string); ok {
		return requestID
	}
	return ""
}

// LogRequest リクエスト開始時のログを出力する
func LogRequest(ctx context.Context, method, path, userAgent string) {
	WithRequestID(ctx).WithFields(logrus.Fields{
		"method":     method,
		"path":       path,
		"user_agent": userAgent,
		"type":       "request_start",
	}).Info("Request started")
}

// LogResponse レスポンス時のログを出力する
func LogResponse(ctx context.Context, statusCode int, duration int64) {
	entry := WithRequestID(ctx).WithFields(logrus.Fields{
		"status_code":    statusCode,
		"duration_ms":    duration,
		"type":           "request_end",
	})

	if statusCode >= 500 {
		entry.Error("Request completed with server error")
	} else if statusCode >= 400 {
		entry.Warn("Request completed with client error")
	} else {
		entry.Info("Request completed successfully")
	}
}

// LogError エラーログを出力する
func LogError(ctx context.Context, err error, message string, fields ...logrus.Fields) {
	entry := WithRequestID(ctx).WithError(err)
	
	if len(fields) > 0 {
		entry = entry.WithFields(fields[0])
	}
	
	entry.WithField("type", "application_error").Error(message)
}

// LogWarn 警告ログを出力する
func LogWarn(ctx context.Context, message string, fields ...logrus.Fields) {
	entry := WithRequestID(ctx)
	
	if len(fields) > 0 {
		entry = entry.WithFields(fields[0])
	}
	
	entry.WithField("type", "application_warning").Warn(message)
}

// LogInfo 情報ログを出力する
func LogInfo(ctx context.Context, message string, fields ...logrus.Fields) {
	entry := WithRequestID(ctx)
	
	if len(fields) > 0 {
		entry = entry.WithFields(fields[0])
	}
	
	entry.WithField("type", "application_info").Info(message)
}

// LogDebug デバッグログを出力する
func LogDebug(ctx context.Context, message string, fields ...logrus.Fields) {
	entry := WithRequestID(ctx)
	
	if len(fields) > 0 {
		entry = entry.WithFields(fields[0])
	}
	
	entry.WithField("type", "application_debug").Debug(message)
}

// isLambdaEnvironment Lambda環境かどうかを判定する
func isLambdaEnvironment() bool {
	return os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != ""
}

// getEnvOrDefault 環境変数を取得し、存在しない場合はデフォルト値を返す
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}