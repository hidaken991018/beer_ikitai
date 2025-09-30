package controllers

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"mybeerlog/domain/repository"
	"mybeerlog/domain/usecase"
	"mybeerlog/interfaces/dto"
	"mybeerlog/interfaces/mapper"
	"mybeerlog/utils"
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
	log.Println("Initializing VisitController")
	visitRepo := repository.NewVisitRepository()
	if visitRepo == nil {
		log.Println("Failed to initialize VisitRepository")
	} else {
		log.Println("VisitRepository created successfully")
	}

	breweryRepo := repository.NewBreweryRepository()
	if breweryRepo == nil {
		log.Println("Failed to initialize BreweryRepository")
	} else {
		log.Println("BreweryRepository created successfully")
	}

	userProfileRepo := repository.NewUserProfileRepository()
	if userProfileRepo == nil {
		log.Println("Failed to initialize UserProfileRepository")
	} else {
		log.Println("UserProfileRepository created successfully")
	}

	visitUsecase := usecase.NewVisitUsecase(visitRepo, breweryRepo)
	if visitUsecase == nil {
		log.Println("Failed to initialize VisitUsecase")
	} else {
		log.Println("VisitUsecase created successfully")
	}

	userProfileUsecase := usecase.NewUserProfileUsecase(userProfileRepo)
	if userProfileUsecase == nil {
		log.Println("Failed to initialize UserProfileUsecase")
	} else {
		log.Println("UserProfileUsecase created successfully")
	}

	log.Println("VisitController initialized with usecases")
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
	if c == nil {
		utils.LogError(context.Background(), errors.New("controller is nil"), "Controller initialization error")
		return
	}

	// Usecaseのnullチェック
	if c.userProfileUsecase == nil {
		utils.LogError(c.Ctx.Request.Context(), errors.New("userProfileUsecase is nil"), "Usecase not initialized")
		c.ErrorResponse(500, "Internal Server Error", "USECASE_NOT_INITIALIZED")
		return
	}

	if c.visitUsecase == nil {
		utils.LogError(c.Ctx.Request.Context(), errors.New("visitUsecase is nil"), "Usecase not initialized")
		c.ErrorResponse(500, "Internal Server Error", "USECASE_NOT_INITIALIZED")
		return
	}

	utils.LogInfo(c.Ctx.Request.Context(), "GetVisits called", map[string]interface{}{
		"controller_status": "initialized",
		"usecases_status": map[string]bool{
			"userProfile": c.userProfileUsecase != nil,
			"visit":       c.visitUsecase != nil,
		},
	})
	log.Println("GetVisits called arg:", c)
	cognitoSub, err := c.GetCognitoSub()
	utils.LogInfo(c.Ctx.Request.Context(), "GetVisits called by user1")
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}
	utils.LogInfo(c.Ctx.Request.Context(), "GetVisits called by user2")
	log.Printf("userProfileUsecase: %+v", c.userProfileUsecase)
	utils.LogInfo(c.Ctx.Request.Context(), "userProfileUsecase", map[string]interface{}{"userProfileUsecase": c.userProfileUsecase})
	// ユーザープロファイル取得
	userProfile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.ErrorResponse(404, "User profile not found", "PROFILE_NOT_FOUND")
		return
	}

	utils.LogInfo(c.Ctx.Request.Context(), "completed user profile retrieval")

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
