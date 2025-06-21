package dto

import "time"

type UserProfileResponse struct {
	ID          int       `json:"id"`
	CognitoSub  string    `json:"cognito_sub"`
	DisplayName string    `json:"display_name"`
	IconURL     string    `json:"icon_url"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type UserProfileRequest struct {
	DisplayName string `json:"display_name"`
	IconURL     string `json:"icon_url"`
}
