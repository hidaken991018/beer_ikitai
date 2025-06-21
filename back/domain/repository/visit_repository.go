package repository

import (
	"mybeerlog/domain/entity"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

// visitRepository 訪問リポジトリの実装
type visitRepository struct {
	orm orm.Ormer
}

// VisitRepository 訪問のデータアクセスインターフェースを定義する
type VisitRepository interface {
	GetByID(id int) (*entity.Visit, error)
	GetByUserProfile(userProfileID int, limit, offset int) ([]*entity.Visit, int, error)
	GetByUserProfileAndBrewery(userProfileID, breweryID int, limit, offset int) ([]*entity.Visit, int, error)
	Create(visit *entity.Visit) (*entity.Visit, error)
}

// NewVisitRepository 新しいVisitRepositoryインスタンスを作成する
func NewVisitRepository() VisitRepository {
	return &visitRepository{
		orm: orm.NewOrm(),
	}
}

// GetByID IDで訪問を取得する
func (r *visitRepository) GetByID(id int) (*entity.Visit, error) {
	model := &models.Visit{}
	err := r.orm.QueryTable("visit").Filter("id", id).RelatedSel("brewery").One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model)
}

// GetByUserProfile ユーザープロファイルで訪問を取得する
func (r *visitRepository) GetByUserProfile(userProfileID int, limit, offset int) ([]*entity.Visit, int, error) {
	var models []*models.Visit

	qs := r.orm.QueryTable("visit").Filter("user_profile_id", userProfileID).RelatedSel("brewery").OrderBy("-visited_at")

	// 総数取得
	total, err := qs.Count()
	if err != nil {
		return nil, 0, err
	}

	// ページネーション
	_, err = qs.Limit(limit, offset).All(&models)
	if err != nil {
		return nil, 0, err
	}

	entities := make([]*entity.Visit, len(models))
	for i, model := range models {
		entity, err := r.modelToEntity(model)
		if err != nil {
			return nil, 0, err
		}
		entities[i] = entity
	}

	return entities, int(total), nil
}

// GetByUserProfileAndBrewery ユーザープロファイルと醸造所で訪問を取得する
func (r *visitRepository) GetByUserProfileAndBrewery(userProfileID, breweryID int, limit, offset int) ([]*entity.Visit, int, error) {
	var models []*models.Visit

	qs := r.orm.QueryTable("visit").
		Filter("user_profile_id", userProfileID).
		Filter("brewery_id", breweryID).
		RelatedSel("brewery").
		OrderBy("-visited_at")

	// 総数取得
	total, err := qs.Count()
	if err != nil {
		return nil, 0, err
	}

	// ページネーション
	_, err = qs.Limit(limit, offset).All(&models)
	if err != nil {
		return nil, 0, err
	}

	entities := make([]*entity.Visit, len(models))
	for i, model := range models {
		entity, err := r.modelToEntity(model)
		if err != nil {
			return nil, 0, err
		}
		entities[i] = entity
	}

	return entities, int(total), nil
}

// Create 訪問を作成する
func (r *visitRepository) Create(visit *entity.Visit) (*entity.Visit, error) {
	model := r.entityToModel(visit)
	model.VisitedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return nil, err
	}

	// 作成されたエンティティを返す
	return r.modelToEntity(model)
}


// modelToEntity モデルからエンティティに変換する
func (r *visitRepository) modelToEntity(model *models.Visit) (*entity.Visit, error) {
	builder := entity.NewVisitBuilder().
		WithID(model.Id).
		WithUserProfileID(model.UserProfile.Id).
		WithBreweryID(model.Brewery.Id).
		WithVisitedAt(model.VisitedAt)

	// 関連するユーザープロファイル情報がある場合
	if model.UserProfile != nil {
		userProfile, err := entity.NewUserProfileBuilder().
			WithID(model.UserProfile.Id).
			WithCognitoSub(model.UserProfile.CognitoSub).
			WithDisplayName(model.UserProfile.DisplayName).
			WithIconURL(model.UserProfile.IconURL).
			WithCreatedAt(model.UserProfile.CreatedAt).
			WithUpdatedAt(model.UserProfile.UpdatedAt).
			Build()
		if err != nil {
			return nil, err
		}
		builder = builder.WithUserProfile(userProfile)
	}

	// 関連する醸造所情報がある場合
	if model.Brewery != nil {
		brewery, err := entity.NewBreweryBuilder().
			WithID(model.Brewery.Id).
			WithName(model.Brewery.Name).
			WithAddress(model.Brewery.Address).
			WithDescription(model.Brewery.Description).
			WithLocation(model.Brewery.Latitude, model.Brewery.Longitude).
			WithCreatedAt(model.Brewery.CreatedAt).
			WithUpdatedAt(model.Brewery.UpdatedAt).
			Build()
		if err != nil {
			return nil, err
		}
		builder = builder.WithBrewery(brewery)
	}

	return builder.Build()
}

// entityToModel エンティティからモデルに変換する
func (r *visitRepository) entityToModel(e *entity.Visit) *models.Visit {
	visit := &models.Visit{
		Id:        e.ID(),
		VisitedAt: e.VisitedAt(),
	}

	if e.UserProfile() != nil {
		visit.UserProfile = &models.UserProfile{
			Id:          e.UserProfile().ID(),
			CognitoSub:  e.UserProfile().CognitoSub(),
			DisplayName: e.UserProfile().DisplayName(),
			IconURL:     e.UserProfile().IconURL(),
			CreatedAt:   e.UserProfile().CreatedAt(),
			UpdatedAt:   e.UserProfile().UpdatedAt(),
		}
	}
	if e.Brewery() != nil {
		visit.Brewery = &models.Brewery{
			Id:          e.Brewery().ID(),
			Name:        e.Brewery().Name(),
			Address:     e.Brewery().Address(),
			Description: e.Brewery().Description(),
			Latitude:    e.Brewery().Latitude(),
			Longitude:   e.Brewery().Longitude(),
			CreatedAt:   e.Brewery().CreatedAt(),
			UpdatedAt:   e.Brewery().UpdatedAt(),
		}
	}

	return visit
}
