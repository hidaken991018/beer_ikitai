package controllers

import (
	"encoding/json"
	"mybeerlog/domain/repository"
	"mybeerlog/domain/usecase"
	"mybeerlog/interfaces/dto"
	"mybeerlog/interfaces/mapper"
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
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	profile, err := c.userProfileUsecase.GetProfile(cognitoSub)
	if err != nil {
		c.ErrorResponse(404, "Profile not found", "PROFILE_NOT_FOUND")
		return
	}

	response := mapper.UserProfileEntityToResponse(profile)
	c.JSONResponse(response)
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
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	var request dto.UserProfileRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.ErrorResponse(400, "Invalid request body", "INVALID_REQUEST")
		return
	}

	profile, err := c.userProfileUsecase.CreateProfile(cognitoSub, request.DisplayName, request.IconURL)
	if err != nil {
		if err.Error() == "profile already exists" {
			c.ErrorResponse(409, "Profile already exists", "PROFILE_EXISTS")
			return
		}
		c.ErrorResponse(400, err.Error(), "CREATE_FAILED")
		return
	}

	response := mapper.UserProfileEntityToResponse(profile)
	c.Ctx.ResponseWriter.WriteHeader(201)
	c.JSONResponse(response)
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
	cognitoSub, err := c.GetCognitoSub()
	if err != nil {
		c.ErrorResponse(401, "Unauthorized", "UNAUTHORIZED")
		return
	}

	var request dto.UserProfileRequest
	if err := json.Unmarshal(c.Ctx.Input.RequestBody, &request); err != nil {
		c.ErrorResponse(400, "Invalid request body", "INVALID_REQUEST")
		return
	}

	profile, err := c.userProfileUsecase.UpdateProfile(cognitoSub, request.DisplayName, request.IconURL)
	if err != nil {
		if err.Error() == "profile not found" {
			c.ErrorResponse(404, "Profile not found", "PROFILE_NOT_FOUND")
			return
		}
		c.ErrorResponse(400, err.Error(), "UPDATE_FAILED")
		return
	}

	response := mapper.UserProfileEntityToResponse(profile)
	c.JSONResponse(response)
}