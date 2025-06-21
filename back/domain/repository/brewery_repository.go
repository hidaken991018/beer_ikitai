package repository

import "mybeerlog/domain/entity"

type BreweryRepository interface {
	GetByID(id int) (*entity.Brewery, error)
	GetAll(limit, offset int) ([]*entity.Brewery, int, error)
	GetByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error)
	Create(brewery *entity.Brewery) error
	Update(brewery *entity.Brewery) error
	Delete(id int) error
}
