package usecase

import (
	"errors"
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"time"
)

// visitUsecase 訪問ユースケースの実装
type visitUsecase struct {
	VisitRepo   repository.VisitRepository
	BreweryRepo repository.BreweryRepository
}

// VisitUsecase 訪問のビジネスロジックインターフェースを定義する
type VisitUsecase interface {
	CheckIn(userProfileID, breweryID int, lat, lng, maxDistance float64) (*entity.Visit, error)
	GetVisitHistory(userProfileID int, breweryID *int, limit, offset int) ([]*entity.Visit, int, error)
	GetVisit(id, userProfileID int) (*entity.Visit, error)
}

// NewVisitUsecase 新しい訪問ユースケースを作成する
func NewVisitUsecase(visitRepo repository.VisitRepository, breweryRepo repository.BreweryRepository) VisitUsecase {
	return &visitUsecase{
		VisitRepo:   visitRepo,
		BreweryRepo: breweryRepo,
	}
}

// CheckIn 醸造所にチェックインする
func (v *visitUsecase) CheckIn(userProfileID, breweryID int, lat, lng, maxDistance float64) (*entity.Visit, error) {
	if userProfileID <= 0 {
		return nil, errors.New("invalid user profile id")
	}
	if breweryID <= 0 {
		return nil, errors.New("invalid brewery id")
	}

	// 醸造所情報取得
	brewery, err := v.BreweryRepo.GetByID(breweryID)
	if err != nil {
		return nil, errors.New("brewery not found")
	}

	// GPS距離チェック
	withinRange, err := brewery.IsWithinCheckinRange(lat, lng, maxDistance)
	if err != nil {
		return nil, err
	}
	if !withinRange {
		return nil, errors.New("too far from brewery for check-in")
	}

	// 重複チェックイン防止（1時間以内の同一醸造所チェックイン禁止）
	recent, _, err := v.VisitRepo.GetByUserProfileAndBrewery(userProfileID, breweryID, 1, 0)
	if err == nil && len(recent) > 0 {
		lastVisit := recent[0]
		if time.Since(lastVisit.VisitedAt()) < time.Hour {
			return nil, errors.New("already checked in within the last hour")
		}
	}

	// 訪問記録作成
	visit, err := entity.NewVisit(userProfileID, breweryID)
	if err != nil {
		return nil, err
	}

	createdVisit, err := v.VisitRepo.Create(visit)
	if err != nil {
		return nil, err
	}

	return createdVisit, nil
}

// GetVisitHistory 訪問履歴を取得する
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
		return v.VisitRepo.GetByUserProfileAndBrewery(userProfileID, *breweryID, limit, offset)
	}

	return v.VisitRepo.GetByUserProfile(userProfileID, limit, offset)
}

// GetVisit 訪問を取得する
func (v *visitUsecase) GetVisit(id int, userProfileID int) (*entity.Visit, error) {
	if id <= 0 || userProfileID <= 0 {
		return nil, errors.New("invalid visit id or user profile id")
	}

	visit, err := v.VisitRepo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 自分の訪問履歴のみアクセス可能
	if visit.UserProfileID() != userProfileID {
		return nil, errors.New("access denied")
	}

	return visit, nil
}
