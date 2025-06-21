package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
)

// userProfileUsecase ユーザープロファイルユースケースの実装
type userProfileUsecase struct {
	userProfileRepo repository.UserProfileRepository
}

// UserProfileUsecase ユーザープロファイルのビジネスロジックインターフェースを定義する
type UserProfileUsecase interface {
	GetProfile(cognitoSub string) (*entity.UserProfile, error)
	CreateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error)
	UpdateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error)
}

// NewUserProfileUsecase 新しいユーザープロファイルユースケースを作成する
func NewUserProfileUsecase(repo repository.UserProfileRepository) UserProfileUsecase {
	return &userProfileUsecase{
		userProfileRepo: repo,
	}
}

// GetProfile ユーザープロファイルを取得する
func (u *userProfileUsecase) GetProfile(cognitoSub string) (*entity.UserProfile, error) {
	if cognitoSub == "" {
		return nil, errors.New("cognito_sub is required")
	}

	return u.userProfileRepo.GetByCognitoSub(cognitoSub)
}

// CreateProfile ユーザープロファイルを作成する
func (u *userProfileUsecase) CreateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error) {
	if cognitoSub == "" {
		return nil, errors.New("cognito_sub is required")
	}

	// 既存プロファイルチェック
	existing, _ := u.userProfileRepo.GetByCognitoSub(cognitoSub)
	if existing != nil {
		return nil, errors.New("profile already exists")
	}

	profile, err := entity.NewUserProfileBuilder().
		WithCognitoSub(cognitoSub).
		WithDisplayName(displayName).
		WithIconURL(iconURL).
		Build()
	if err != nil {
		return nil, err
	}

	return u.userProfileRepo.Create(profile)
}

// UpdateProfile ユーザープロファイルを更新する
func (u *userProfileUsecase) UpdateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error) {
	profile, err := u.userProfileRepo.GetByCognitoSub(cognitoSub)
	if err != nil {
		return nil, err
	}

	// 新しいプロファイルエンティティを作成（イミュータブル）
	newDisplayName := profile.DisplayName()
	newIconURL := profile.IconURL()

	if displayName != "" {
		newDisplayName = displayName
	}
	if iconURL != "" {
		newIconURL = iconURL
	}

	updatedProfile, err := entity.NewUserProfileBuilder().
		WithID(profile.ID()).
		WithCognitoSub(profile.CognitoSub()).
		WithDisplayName(newDisplayName).
		WithIconURL(newIconURL).
		WithCreatedAt(profile.CreatedAt()).
		Build()
	if err != nil {
		return nil, err
	}

	return u.userProfileRepo.Update(updatedProfile)
}
