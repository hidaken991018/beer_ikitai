package controllers

import (
	"mybeerlog/interfaces/dto"
	"mybeerlog/utils"
	"os"
	"time"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/orm"
)

// HealthController APIのヘルスチェックを処理するコントローラー
type HealthController struct {
	BaseController
}

// Get APIのヘルスチェックを実行する
// @Title Health Check
// @Description API health check with detailed status
// @Success 200 {object} dto.HealthResponse
// @Failure 503 {object} dto.ErrorResponse
// @router /health [get]
func (c *HealthController) Get() {
	utils.LogInfo(c.Ctx.Request.Context(), "Health check requested")
	
	checks := make(map[string]string)
	overallStatus := "ok"
	
	// データベース接続チェック
	dbStatus := c.checkDatabase()
	checks["database"] = dbStatus
	if dbStatus != "ok" {
		overallStatus = "degraded"
	}
	
	// 環境情報チェック
	envStatus := c.checkEnvironment()
	checks["environment"] = envStatus
	if envStatus != "ok" && overallStatus == "ok" {
		overallStatus = "warning"
	}
	
	response := dto.HealthResponse{
		Status:      overallStatus,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Version:     getVersion(),
		Environment: beego.BConfig.RunMode,
		Checks:      checks,
	}
	
	// ステータスに応じてHTTPステータスコードを設定
	if overallStatus == "degraded" {
		c.Ctx.ResponseWriter.WriteHeader(503)
		utils.LogWarn(c.Ctx.Request.Context(), "Health check failed", map[string]interface{}{
			"status": overallStatus,
			"checks": checks,
		})
	} else if overallStatus == "warning" {
		utils.LogWarn(c.Ctx.Request.Context(), "Health check warning", map[string]interface{}{
			"status": overallStatus,
			"checks": checks,
		})
	}
	
	c.JSONResponse(response)
}

// checkDatabase データベース接続をチェックする
func (c *HealthController) checkDatabase() string {
	o := orm.NewOrm()
	
	// 簡単なクエリでデータベース接続を確認
	if _, err := o.Raw("SELECT 1").Exec(); err != nil {
		utils.LogError(c.Ctx.Request.Context(), err, "Database health check failed")
		return "error"
	}
	
	return "ok"
}

// checkEnvironment 環境設定をチェックする
func (c *HealthController) checkEnvironment() string {
	// 必要な環境変数の確認
	requiredEnvVars := []string{
		"DB_HOST",
		"DB_USER", 
		"DB_NAME",
	}
	
	missing := []string{}
	for _, envVar := range requiredEnvVars {
		if os.Getenv(envVar) == "" {
			missing = append(missing, envVar)
		}
	}
	
	if len(missing) > 0 {
		utils.LogWarn(c.Ctx.Request.Context(), "Missing environment variables", map[string]interface{}{
			"missing_vars": missing,
		})
		return "warning"
	}
	
	return "ok"
}

// getVersion アプリケーションのバージョンを取得する
func getVersion() string {
	// 環境変数またはビルド情報からバージョンを取得
	if version := os.Getenv("APP_VERSION"); version != "" {
		return version
	}
	return "development"
}