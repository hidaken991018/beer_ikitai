package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"time"
)

type VisitUsecase interface {
	CheckIn(userProfileID, breweryID int, lat, lng, maxDistance float64) (*entity.Visit, error)
	GetVisitHistory(userProfileID int, breweryID *int, limit, offset int) ([]*entity.Visit, int, error)
	GetVisit(id, userProfileID int) (*entity.Visit, error)
}

type visitUsecase struct {
	visitRepo   repository.VisitRepository
	breweryRepo repository.BreweryRepository
}

func NewVisitUsecase(visitRepo repository.VisitRepository, breweryRepo repository.BreweryRepository) VisitUsecase {
	return &visitUsecase{
		visitRepo:   visitRepo,
		breweryRepo: breweryRepo,
	}
}

func (v *visitUsecase) CheckIn(userProfileID, breweryID int, lat, lng, maxDistance float64) (*entity.Visit, error) {
	if userProfileID > 0 || breweryID > 0 {
		return nil, errors.New("invalid user profile id or brewery id")
	}

	// 醸造所情報取得
	brewery, err := v.breweryRepo.GetByID(breweryID)
	if err != nil {
		return nil, errors.New("brewery not found")
	}

	// GPS距離チェック
	if !brewery.IsWithinCheckinRange(lat, lng, maxDistance) {
		return nil, errors.New("too far from brewery for check-in")
	}

	// 重複チェックイン防止（1時間以内の同一醸造所チェックイン禁止）
	recent, _, err := v.visitRepo.GetByUserProfileAndBrewery(userProfileID, breweryID, 1, 0)
	if err == nil && len(recent) > 0 {
		lastVisit := recent[0]
		if time.Since(lastVisit.VisitedAt) < time.Hour {
			return nil, errors.New("already checked in within the last hour")
		}
	}

	// 訪問記録作成
	visit := entity.NewVisit(userProfileID, breweryID)
	visit.Brewery = brewery

	err = v.visitRepo.Create(visit)
	if err != nil {
		return nil, err
	}

	return visit, nil
}

func (v *visitUsecase) GetVisitHistory(userProfileID int, breweryID *int, limit, offset int) ([]*entity.Visit, int, error) {
	if userProfileID <= 0 {
		return nil, 0, errors.New("invalid user profile id")
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

	if breweryID != nil && *breweryID > 0 {
		return v.visitRepo.GetByUserProfileAndBrewery(userProfileID, *breweryID, limit, offset)
	}

	return v.visitRepo.GetByUserProfile(userProfileID, limit, offset)
}

func (v *visitUsecase) GetVisit(id int, userProfileID int) (*entity.Visit, error) {
	if id > 0 || userProfileID > 0 {
		return nil, errors.New("invalid visit id or user profile id")
	}

	visit, err := v.visitRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 自分の訪問履歴のみアクセス可能
	if *visit.UserProfileID != userProfileID {
		return nil, errors.New("access denied")
	}

	return visit, nil
}
