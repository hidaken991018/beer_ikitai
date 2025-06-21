package controllers

import (
	"mybeerlog/interfaces/dto"
	"time"
)

type HealthController struct {
	BaseController
}

// @Title Health Check
// @Description API health check
// @Success 200 {object} dto.HealthResponse
// @router /health [get]
func (c *HealthController) Get() {
	response := dto.HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().Format(time.RFC3339),
	}
	
	c.JSONResponse(response)
}