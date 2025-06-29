package controllers

import (
	"encoding/json"
	"errors"
	"mybeerlog/domain/repository"
	"mybeerlog/domain/usecase"
	"mybeerlog/interfaces/dto"
	"mybeerlog/interfaces/mapper"
	"mybeerlog/utils"
	"net/http"
	"strings"
)

// UserController ユーザー関連のHTTPリクエストを処理するコントローラー
type UserController struct {
	BaseController
	userProfileUsecase usecase.UserProfileUsecase
}

// NewUserController 新しいユーザーコントローラーを作成する
func NewUserController() *UserController {
	userProfileRepo := repository.NewUserProfileRepository()
	userProfileUsecase := usecase.NewUserProfileUsecase(userProfileRepo)
	
	return &UserController{
		userProfileUsecase: userProfileUsecase,
	}
}

// GetProfile 認証されたユーザーのプロファイルを取得する
// @Title Get User Profile
// @Description Get authenticated user profile
// @Success 200 {object} dto.UserProfileResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @router /users/profile [get]
func (c *UserController) GetProfile() {
	cognitoSub, ok := c.RequireAuth()
	if !ok {
		return
	}

	profile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.HandleNotFound("User profile")
		return
	}

	response := mapper.UserProfileEntityToResponse(profile)
	c.JSONResponseWithMessage(response, "Profile retrieved successfully")
}

// CreateProfile 新しいユーザープロファイルを作成する
// @Title Create User Profile
// @Description Create new user profile
// @Param body body dto.UserProfileRequest true "User profile data"
// @Success 201 {object} dto.UserProfileResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 409 {object} dto.ErrorResponse
// @router /users/profile [post]
func (c *UserController) CreateProfile() {
	cognitoSub, ok := c.RequireAuth()
	if !ok {
		return
	}

	var request dto.UserProfileRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.HandleError(err, "Invalid request body", dto.ErrorCodeInvalidRequest, http.StatusBadRequest)
		return
	}

	// バリデーション
	if err := c.validateUserProfileRequest(&request); err != nil {
		return // バリデーションエラーは関数内で処理済み
	}

	profile, err := c.userProfileUsecase.CreateProfile(cognitoSub, request.DisplayName, request.IconURL)
	if err != nil {
		if strings.Contains(err.Error(), "already exists") {
			c.ErrorResponseDetailed(http.StatusConflict, "Profile already exists", err.Error(), dto.ErrorCodeProfileExists, nil)
			return
		}
		c.HandleInternalError(err)
		return
	}

	utils.LogInfo(c.Ctx.Request.Context(), "User profile created successfully", map[string]interface{}{
		"cognito_sub": cognitoSub,
	})

	response := mapper.UserProfileEntityToResponse(profile)
	c.Ctx.ResponseWriter.WriteHeader(http.StatusCreated)
	c.JSONResponseWithMessage(response, "Profile created successfully")
}

// UpdateProfile 認証されたユーザーのプロファイルを更新する
// @Title Update User Profile
// @Description Update authenticated user profile
// @Param body body dto.UserProfileRequest true "User profile data"
// @Success 200 {object} dto.UserProfileResponse
// @Failure 400 {object} dto.ErrorResponse
// @Failure 401 {object} dto.ErrorResponse
// @Failure 404 {object} dto.ErrorResponse
// @router /users/profile [put]
func (c *UserController) UpdateProfile() {
	cognitoSub, ok := c.RequireAuth()
	if !ok {
		return
	}

	var request dto.UserProfileRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.HandleError(err, "Invalid request body", dto.ErrorCodeInvalidRequest, http.StatusBadRequest)
		return
	}

	// バリデーション
	if err := c.validateUserProfileRequest(&request); err != nil {
		return // バリデーションエラーは関数内で処理済み
	}

	profile, err := c.userProfileUsecase.UpdateProfile(cognitoSub, request.DisplayName, request.IconURL)
	if err != nil {
		if strings.Contains(err.Error(), "not found") {
			c.HandleNotFound("User profile")
			return
		}
		c.HandleInternalError(err)
		return
	}

	utils.LogInfo(c.Ctx.Request.Context(), "User profile updated successfully", map[string]interface{}{
		"cognito_sub": cognitoSub,
	})

	response := mapper.UserProfileEntityToResponse(profile)
	c.JSONResponseWithMessage(response, "Profile updated successfully")
}

// validateUserProfileRequest ユーザープロファイルリクエストのバリデーション
func (c *UserController) validateUserProfileRequest(request *dto.UserProfileRequest) error {
	// DisplayName のバリデーション
	if request.DisplayName == "" {
		c.HandleValidationError("display_name", "Display name is required", "")
		return errors.New("validation failed")
	}
	
	if len(request.DisplayName) > 50 {
		c.HandleValidationError("display_name", "Display name must be 50 characters or less", request.DisplayName)
		return errors.New("validation failed")
	}
	
	// IconURL のバリデーション（オプションフィールド）
	if request.IconURL != "" && len(request.IconURL) > 255 {
		c.HandleValidationError("icon_url", "Icon URL must be 255 characters or less", request.IconURL)
		return errors.New("validation failed")
	}
	
	return nil
}