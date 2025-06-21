package entity

import (
	"errors"
	"strings"
	"time"
)

// UserProfile はドメイン内のユーザープロファイルを表す
type UserProfile struct {
	id          int
	cognitoSub  string
	displayName string
	iconURL     string
	createdAt   time.Time
	updatedAt   time.Time
}

// UserProfileBuilder はUserProfileインスタンスの作成を支援する
type UserProfileBuilder struct {
	userProfile *UserProfile
}

// NewUserProfileBuilder 新しいUserProfileBuilderを作成する
func NewUserProfileBuilder() *UserProfileBuilder {
	return &UserProfileBuilder{
		userProfile: &UserProfile{
			createdAt: time.Now(),
			updatedAt: time.Now(),
		},
	}
}

// WithID IDを設定する
func (b *UserProfileBuilder) WithID(id int) *UserProfileBuilder {
	b.userProfile.id = id
	return b
}

// WithCognitoSub Cognito SUBを設定する
func (b *UserProfileBuilder) WithCognitoSub(cognitoSub string) *UserProfileBuilder {
	b.userProfile.cognitoSub = strings.TrimSpace(cognitoSub)
	return b
}

// WithDisplayName 表示名を設定する
func (b *UserProfileBuilder) WithDisplayName(displayName string) *UserProfileBuilder {
	b.userProfile.displayName = strings.TrimSpace(displayName)
	return b
}

// WithIconURL アイコンURLを設定する
func (b *UserProfileBuilder) WithIconURL(iconURL string) *UserProfileBuilder {
	b.userProfile.iconURL = strings.TrimSpace(iconURL)
	return b
}

// WithCreatedAt 作成日時を設定する
func (b *UserProfileBuilder) WithCreatedAt(createdAt time.Time) *UserProfileBuilder {
	b.userProfile.createdAt = createdAt
	return b
}

// WithUpdatedAt 更新日時を設定する
func (b *UserProfileBuilder) WithUpdatedAt(updatedAt time.Time) *UserProfileBuilder {
	b.userProfile.updatedAt = updatedAt
	return b
}

// Build UserProfileインスタンスを作成する
func (b *UserProfileBuilder) Build() (*UserProfile, error) {
	if err := b.userProfile.validate(); err != nil {
		return nil, err
	}
	return b.userProfile, nil
}

// ID IDを取得する
func (u *UserProfile) ID() int {
	return u.id
}

// CognitoSub Cognito SUBを取得する
func (u *UserProfile) CognitoSub() string {
	return u.cognitoSub
}

// DisplayName 表示名を取得する
func (u *UserProfile) DisplayName() string {
	return u.displayName
}

// IconURL アイコンURLを取得する
func (u *UserProfile) IconURL() string {
	return u.iconURL
}

// CreatedAt 作成日時を取得する
func (u *UserProfile) CreatedAt() time.Time {
	return u.createdAt
}

// UpdatedAt 更新日時を取得する
func (u *UserProfile) UpdatedAt() time.Time {
	return u.updatedAt
}

// IsValid ユーザープロファイルが有効かどうかを判定する
func (u *UserProfile) IsValid() bool {
	return u.validate() == nil
}

// validate ユーザープロファイルのバリデーションを実行する
func (u *UserProfile) validate() error {
	if strings.TrimSpace(u.cognitoSub) == "" {
		return errors.New("cognito sub is required")
	}
	if len(u.cognitoSub) > 255 {
		return errors.New("cognito sub must be 255 characters or less")
	}
	if len(u.displayName) > 255 {
		return errors.New("display name must be 255 characters or less")
	}
	if len(u.iconURL) > 512 {
		return errors.New("icon URL must be 512 characters or less")
	}
	return nil
}

