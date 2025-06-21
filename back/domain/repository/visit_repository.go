package repository

import "mybeerlog/domain/entity"

type VisitRepository interface {
	GetByID(id int) (*entity.Visit, error)
	GetByUserProfile(userProfileID int, limit, offset int) ([]*entity.Visit, int, error)
	GetByUserProfileAndBrewery(userProfileID, breweryID int, limit, offset int) ([]*entity.Visit, int, error)
	Create(visit *entity.Visit) error
	Delete(id int) error
}
