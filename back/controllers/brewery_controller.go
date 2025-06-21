package controllers

import (
	"encoding/json"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"mybeerlog/domain/usecase"
	"mybeerlog/interfaces/dto"
	"mybeerlog/interfaces/mapper"
)

// BreweryController 醸造所関連のHTTPリクエストを処理するコントローラー
type BreweryController struct {
	BaseController
	breweryUsecase usecase.BreweryUsecase
}

// NewBreweryController 新しい醸造所コントローラーを作成する
func NewBreweryController() *BreweryController {
	breweryRepo := repository.NewBreweryRepository()
	breweryUsecase := usecase.NewBreweryUsecase(breweryRepo)

	return &BreweryController{
		breweryUsecase: breweryUsecase,
	}
}

// GetBreweries 醸造所の一覧を取得する
// @Title Get Breweries
// @Description Get list of breweries
// @Param lat query float64 false "Latitude for location search"
// @Param lng query float64 false "Longitude for location search"
// @Param radius query float64 false "Search radius in km (default: 10)"
// @Param limit query int false "Limit (default: 20, max: 100)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {object} dto.BreweriesResponse
// @Failure 400 {object} dto.ErrorResponse
// @router /breweries [get]
func (c *BreweryController) GetBreweries() {
	lat := c.GetFloatQuery("lat", 0)
	lng := c.GetFloatQuery("lng", 0)
	radius := c.GetFloatQuery("radius", 10.0)
	limit := c.GetIntQuery("limit", 20)
	offset := c.GetIntQuery("offset", 0)

	// 認証チェック（認証済みユーザーのみ位置情報取得可能）
	cognitoSub, err := c.GetCognitoSub()
	isAuthenticated := err == nil && cognitoSub != ""

	var breweries []*entity.Brewery
	var total int

	if lat != 0 && lng != 0 {
		// 位置情報による検索
		breweries, total, err = c.breweryUsecase.GetBreweriesByLocation(lat, lng, radius, limit, offset)
	} else {
		// 全件取得
		breweries, total, err = c.breweryUsecase.GetBreweries(limit, offset)
	}

	if err != nil {
		c.ErrorResponse(400, err.Error(), "FETCH_FAILED")
		return
	}

	var response interface{}
	if isAuthenticated {
		// 認証済みユーザー: フル情報
		response = dto.BreweriesResponse{
			Breweries: mapper.BreweryEntitiesToResponses(breweries),
			Total:     total,
		}
	} else {
		// ゲスト: 基本情報のみ
		publicBreweries := mapper.BreweryEntitiesToPublicResponses(breweries)
		response = struct {
			Breweries []*dto.BreweryPublicResponse `json:"breweries"`
			Total     int                          `json:"total"`
		}{
			Breweries: publicBreweries,
			Total:     total,
		}
	}

	c.JSONResponse(response)
}

// CreateBrewery 新しい醸造所を作成する（管理者のみ）
// @Title Create Brewery
// @Description Create new brewery (admin only)
// @Param body body dto.BreweryRequest true "Brewery data"
// @Success 201 {object} dto.BreweryResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 403 {object} dto.ErrorResponse
// @router /breweries [post]
func (c *BreweryController) CreateBrewery() {
	_, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(404, "User profile not found", "PROFILE_NOT_FOUND")
		return
	}

	// 管理者権限チェック
	if !c.IsAdmin() {
		c.ErrorResponse(403, "Admin permission required", "FORBIDDEN")
		return
	}

	var request dto.BreweryRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.ErrorResponse(400, "Invalid request body", "INVALID_REQUEST")
		return
	}

	brewery, err := c.breweryUsecase.CreateBrewery(
		request.Name,
		request.Address,
		request.Description,
		request.Latitude,
		request.Longitude,
	)
	if err != nil {
		c.ErrorResponse(400, err.Error(), "CREATE_FAILED")
		return
	}

	response := mapper.BreweryEntityToResponse(brewery)
	c.Ctx.ResponseWriter.WriteHeader(201)
	c.JSONResponse(response)
}

// GetBrewery IDで醸造所を取得する
// @Title Get Brewery
// @Description Get brewery by ID
// @Param brewery_id path int true "Brewery ID"
// @Success 200 {object} dto.BreweryResponse
// @Failure 404 {object} dto.ErrorResponse
// @router /breweries/:brewery_id [get]
func (c *BreweryController) GetBrewery() {
	breweryID := c.GetIntQuery("brewery_id", 0)
	if breweryID <= 0 {
		c.ErrorResponse(400, "Brewery ID is required", "INVALID_BREWERY_ID")
		return
	}

	brewery, err := c.breweryUsecase.GetBrewery(breweryID)
	if err != nil {
		c.ErrorResponse(404, "Brewery not found", "BREWERY_NOT_FOUND")
		return
	}

	// 認証チェック
	cognitoSub, err := c.GetCognitoSub()
	isAuthenticated := err == nil && cognitoSub != ""

	var response interface{}
	if isAuthenticated {
		// 認証済みユーザー: フル情報
		response = mapper.BreweryEntityToResponse(brewery)
	} else {
		// ゲスト: 基本情報のみ
		response = mapper.BreweryEntityToPublicResponse(brewery)
	}

	c.JSONResponse(response)
}
