package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
)

// breweryUsecase 醸造所ユースケースの実装
type breweryUsecase struct {
	breweryRepo repository.BreweryRepository
}

// BreweryUsecase 醸造所のビジネスロジックインターフェースを定義する
type BreweryUsecase interface {
	GetBrewery(id int) (*entity.Brewery, error)
	GetBreweries(limit, offset int) ([]*entity.Brewery, int, error)
	GetBreweriesByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error)
	CreateBrewery(name, address, description string, lat, lng float64) (*entity.Brewery, error)
}

// NewBreweryUsecase 新しい醸造所ユースケースを作成する
func NewBreweryUsecase(repo repository.BreweryRepository) BreweryUsecase {
	return &breweryUsecase{
		breweryRepo: repo,
	}
}

// GetBrewery IDで醸造所を取得する
func (b *breweryUsecase) GetBrewery(id int) (*entity.Brewery, error) {
	if id <= 0 {
		return nil, errors.New("invalid brewery id")
	}

	return b.breweryRepo.GetByID(id)
}

// GetBreweries 全ての醸造所を取得する
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

// GetBreweriesByLocation 位置情報で醸造所を検索する
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

// CreateBrewery 新しい醸造所を作成する
func (b *breweryUsecase) CreateBrewery(name, address, description string, lat, lng float64) (*entity.Brewery, error) {
	brewery, err := entity.NewBreweryBuilder().
		WithName(name).
		WithAddress(address).
		WithDescription(description).
		WithLocation(lat, lng).
		Build()
	if err != nil {
		return nil, err
	}

	createdBrewery, err := b.breweryRepo.Create(brewery)
	if err != nil {
		return nil, err
	}

	return createdBrewery, nil
}
