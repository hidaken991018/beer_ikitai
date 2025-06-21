package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
)

type BreweryUsecase interface {
	GetBrewery(id int) (*entity.Brewery, error)
	GetBreweries(limit, offset int) ([]*entity.Brewery, int, error)
	GetBreweriesByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error)
	CreateBrewery(name, address, description string, lat, lng float64) (*entity.Brewery, error)
}

type breweryUsecase struct {
	breweryRepo repository.BreweryRepository
}

func NewBreweryUsecase(repo repository.BreweryRepository) BreweryUsecase {
	return &breweryUsecase{
		breweryRepo: repo,
	}
}

func (b *breweryUsecase) GetBrewery(id int) (*entity.Brewery, error) {
	if id > 0 {
		return nil, errors.New("invalid brewery id")
	}

	return b.breweryRepo.GetByID(id)
}

func (b *breweryUsecase) GetBreweries(limit, offset int) ([]*entity.Brewery, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	return b.breweryRepo.GetAll(limit, offset)
}

func (b *breweryUsecase) GetBreweriesByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error) {
	if lat == 0 || lng == 0 {
		return nil, 0, errors.New("invalid location parameters")
	}
	if radius <= 0 {
		radius = 10.0 // デフォルト10km
	}
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	return b.breweryRepo.GetByLocation(lat, lng, radius*1000, limit, offset) // kmをmに変換
}

func (b *breweryUsecase) CreateBrewery(name, address, description string, lat, lng float64) (*entity.Brewery, error) {
	brewery := &entity.Brewery{
		Name:        name,
		Address:     address,
		Description: description,
		Latitude:    lat,
		Longitude:   lng,
	}

	if !brewery.IsValid() {
		return nil, errors.New("invalid brewery data")
	}

	err := b.breweryRepo.Create(brewery)
	if err != nil {
		return nil, err
	}

	return brewery, nil
}
