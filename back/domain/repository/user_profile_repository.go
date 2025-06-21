package repository

import "mybeerlog/domain/entity"

type UserProfileRepository interface {
	GetByCognitoSub(cognitoSub string) (*entity.UserProfile, error)
	Create(userProfile *entity.UserProfile) error
	Update(userProfile *entity.UserProfile) error
	Delete(id int) error
}
