package controllers

import (
	"encoding/json"
	"mybeerlog/domain/repository"
	"mybeerlog/domain/usecase"
	"mybeerlog/interfaces/dto"
	"mybeerlog/interfaces/mapper"
	"strconv"

	"github.com/astaxie/beego"
)

// VisitController 訪問関連のHTTPリクエストを処理するコントローラー
type VisitController struct {
	BaseController
	visitUsecase       usecase.VisitUsecase
	userProfileUsecase usecase.UserProfileUsecase
}

// NewVisitController 新しい訪問コントローラーを作成する
func NewVisitController() *VisitController {
	visitRepo := repository.NewVisitRepository()
	breweryRepo := repository.NewBreweryRepository()
	userProfileRepo := repository.NewUserProfileRepository()

	visitUsecase := usecase.NewVisitUsecase(visitRepo, breweryRepo)
	userProfileUsecase := usecase.NewUserProfileUsecase(userProfileRepo)

	return &VisitController{
		visitUsecase:       visitUsecase,
		userProfileUsecase: userProfileUsecase,
	}
}

// CheckIn GPSを使用して醸造所にチェックインする
// @Title Check In
// @Description Check in to brewery using GPS
// @Param body body dto.CheckinRequest true "Check-in data"
// @Success 201 {object} dto.CheckinResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @router /checkin [post]
func (c *VisitController) CheckIn() {
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	// ユーザープロファイル取得
	userProfile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.ErrorResponse(404, "User profile not found", "PROFILE_NOT_FOUND")
		return
	}

	var request dto.CheckinRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.ErrorResponse(400, "Invalid request body", "INVALID_REQUEST")
		return
	}

	// GPS設定から許可範囲を取得
	maxDistance, err := beego.AppConfig.Float("gps.checkin_radius")
	if err != nil || maxDistance == 0 {
		maxDistance = 100.0 // デフォルト100m
	}

	visit, err := c.visitUsecase.CheckIn(
		userProfile.ID(),
		request.BreweryID,
		request.Latitude,
		request.Longitude,
		maxDistance,
	)
	if err != nil {
		switch err.Error() {
		case "brewery not found":
			c.ErrorResponse(404, "Brewery not found", "BREWERY_NOT_FOUND")
		case "too far from brewery for check-in":
			c.ErrorResponse(400, "Too far from brewery for check-in", "LOCATION_TOO_FAR")
		case "already checked in within the last hour":
			c.ErrorResponse(400, "Already checked in within the last hour", "DUPLICATE_CHECKIN")
		default:
			c.ErrorResponse(400, err.Error(), "CHECKIN_FAILED")
		}
		return
	}

	response := dto.CheckinResponse{
		Visit:   mapper.VisitEntityToResponse(visit),
		Message: "Check-in successful!",
	}

	c.Ctx.ResponseWriter.WriteHeader(201)
	c.JSONResponse(response)
}

// GetVisits 認証されたユーザーの訪問履歴を取得する
// @Title Get Visit History
// @Description Get authenticated user's visit history
// @Param brewery_id query int false "Filter by brewery ID"
// @Param limit query int false "Limit (default: 20, max: 100)"
// @Param offset query int false "Offset (default: 0)"
// @Param sort query string false "Sort order: asc or desc (default: desc)"
// @Success 200 {object} dto.VisitsResponse
// @Failure 401 {object} dto.ErrorResponse
// @router /visits [get]
func (c *VisitController) GetVisits() {
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	// ユーザープロファイル取得
	userProfile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.ErrorResponse(404, "User profile not found", "PROFILE_NOT_FOUND")
		return
	}

	breweryID := c.GetIntQuery("brewery_id", 0)
	limit := c.GetIntQuery("limit", 20)
	offset := c.GetIntQuery("offset", 0)

	visits, total, err := c.visitUsecase.GetVisitHistory(userProfile.ID(), &breweryID, limit, offset)
	if err != nil {
		c.ErrorResponse(400, err.Error(), "FETCH_FAILED")
		return
	}

	response := dto.VisitsResponse{
		Visits: mapper.VisitEntitiesToResponses(visits),
		Total:  total,
	}

	c.JSONResponse(response)
}

// GetVisit IDで訪問の詳細を取得する
// @Title Get Visit Details
// @Description Get visit details by ID
// @Param visit_id path int true "Visit ID"
// @Success 200 {object} dto.VisitResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @router /visits/:visit_id [get]
func (c *VisitController) GetVisit() {
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	// ユーザープロファイル取得
	userProfile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.ErrorResponse(404, "User profile not found", "PROFILE_NOT_FOUND")
		return
	}

	visitIDstr := c.Ctx.Input.Param(":visit_id")
	visitID, err := strconv.Atoi(visitIDstr)
	if err != nil {
		c.ErrorResponse(400, "Invalid visit ID", "INVALID_VISIT_ID")
		return
	}

	visit, err := c.visitUsecase.GetVisit(visitID, (userProfile.ID()))
	if err != nil {
		switch err.Error() {
		case "access denied":
			c.ErrorResponse(403, "Access denied", "FORBIDDEN")
		default:
			c.ErrorResponse(404, "Visit not found", "VISIT_NOT_FOUND")
		}
		return
	}

	response := mapper.VisitEntityToResponse(visit)
	c.JSONResponse(response)
}
