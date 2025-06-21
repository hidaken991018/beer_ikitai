package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
)

type UserProfileUsecase interface {
	GetProfile(cognitoSub string) (*entity.UserProfile, error)
	CreateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error)
	UpdateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error)
}

type userProfileUsecase struct {
	userProfileRepo repository.UserProfileRepository
}

func NewUserProfileUsecase(repo repository.UserProfileRepository) UserProfileUsecase {
	return &userProfileUsecase{
		userProfileRepo: repo,
	}
}

func (u *userProfileUsecase) GetProfile(cognitoSub string) (*entity.UserProfile, error) {
	if cognitoSub == "" {
		return nil, errors.New("cognito_sub is required")
	}
	
	return u.userProfileRepo.GetByCognitoSub(cognitoSub)
}

func (u *userProfileUsecase) CreateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error) {
	if cognitoSub == "" {
		return nil, errors.New("cognito_sub is required")
	}

	// 既存プロファイルチェック
	existing, _ := u.userProfileRepo.GetByCognitoSub(cognitoSub)
	if existing != nil {
		return nil, errors.New("profile already exists")
	}

	profile := &entity.UserProfile{
		CognitoSub:  cognitoSub,
		DisplayName: displayName,
		IconURL:     iconURL,
	}

	if !profile.IsValid() {
		return nil, errors.New("invalid profile data")
	}

	err := u.userProfileRepo.Create(profile)
	if err != nil {
		return nil, err
	}

	return profile, nil
}

func (u *userProfileUsecase) UpdateProfile(cognitoSub, displayName, iconURL string) (*entity.UserProfile, error) {
	profile, err := u.userProfileRepo.GetByCognitoSub(cognitoSub)
	if err != nil {
		return nil, err
	}

	if displayName != "" {
		profile.UpdateDisplayName(displayName)
	}
	if iconURL != "" {
		profile.UpdateIconURL(iconURL)
	}

	err = u.userProfileRepo.Update(profile)
	if err != nil {
		return nil, err
	}

	return profile, nil
}