package models

import (
	"time"
)

type UserProfile struct {
	Id          int       `orm:"auto" json:"id"`
	CognitoSub  string    `orm:"unique;size(255)" json:"cognito_sub"`
	DisplayName string    `orm:"null;size(255)" json:"display_name"`
	IconURL     string    `orm:"null;size(512)" json:"icon_url"`
	CreatedAt   time.Time `orm:"auto_now_add;type(datetime)" json:"created_at"`
	UpdatedAt   time.Time `orm:"auto_now;type(datetime)" json:"updated_at"`
}

func (u *UserProfile) TableName() string {
	return "user_profile"
}

// NewUserProfile creates a new UserProfile
func NewUserProfile(cognitoSub string) *UserProfile {
	return &UserProfile{
		CognitoSub: cognitoSub,
	}
}
