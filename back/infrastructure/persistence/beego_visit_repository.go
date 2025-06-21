package persistence

import (
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

type beegoVisitRepository struct {
	orm orm.Ormer
}

func NewBeegoVisitRepository() repository.VisitRepository {
	return &beegoVisitRepository{
		orm: orm.NewOrm(),
	}
}

func (r *beegoVisitRepository) GetByID(id int) (*entity.Visit, error) {
	model := &models.Visit{}
	err := r.orm.QueryTable("visit").Filter("id", id).RelatedSel("brewery").One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model), nil
}

func (r *beegoVisitRepository) GetByUserProfile(userProfileID int, limit, offset int) ([]*entity.Visit, int, error) {
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
		entities[i] = r.modelToEntity(model)
	}

	return entities, int(total), nil
}

func (r *beegoVisitRepository) GetByUserProfileAndBrewery(userProfileID, breweryID int, limit, offset int) ([]*entity.Visit, int, error) {
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
		entities[i] = r.modelToEntity(model)
	}

	return entities, int(total), nil
}

func (r *beegoVisitRepository) Create(visit *entity.Visit) error {
	model := r.entityToModel(visit)
	model.VisitedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return err
	}

	visit.VisitedAt = model.VisitedAt

	return nil
}

func (r *beegoVisitRepository) Delete(id int) error {
	model := &models.Visit{Id: id}
	_, err := r.orm.Delete(model)
	return err
}

func (r *beegoVisitRepository) modelToEntity(model *models.Visit) *entity.Visit {
	visit := &entity.Visit{
		ID:        model.Id,
		VisitedAt: model.VisitedAt,
	}

	// 関連するユーザープロファイル情報がある場合
	if model.UserProfile != nil {
		visit.UserProfile = &entity.UserProfile{
			ID:          model.UserProfile.Id,
			CognitoSub:  model.UserProfile.CognitoSub,
			DisplayName: model.UserProfile.DisplayName,
			IconURL:     model.UserProfile.IconURL,
			CreatedAt:   model.UserProfile.CreatedAt,
			UpdatedAt:   model.UserProfile.UpdatedAt,
		}
	}

	// 関連する醸造所情報がある場合
	if model.Brewery != nil {
		visit.Brewery = &entity.Brewery{
			ID:          model.Brewery.Id,
			Name:        model.Brewery.Name,
			Address:     model.Brewery.Address,
			Description: model.Brewery.Description,
			Latitude:    model.Brewery.Latitude,
			Longitude:   model.Brewery.Longitude,
			CreatedAt:   model.Brewery.CreatedAt,
			UpdatedAt:   model.Brewery.UpdatedAt,
		}
	}

	return visit
}

func (r *beegoVisitRepository) entityToModel(e *entity.Visit) *models.Visit {
	visit := &models.Visit{
		Id:        e.ID,
		VisitedAt: e.VisitedAt,
	}

	if e.UserProfile != nil {
		visit.UserProfile = &models.UserProfile{
			Id:          e.UserProfile.ID,
			CognitoSub:  e.UserProfile.CognitoSub,
			DisplayName: e.UserProfile.DisplayName,
			IconURL:     e.UserProfile.IconURL,
			CreatedAt:   e.UserProfile.CreatedAt,
			UpdatedAt:   e.UserProfile.UpdatedAt,
		}
	}
	if e.Brewery != nil {
		visit.Brewery = &models.Brewery{
			Id:          e.Brewery.ID,
			Name:        e.Brewery.Name,
			Address:     e.Brewery.Address,
			Description: e.Brewery.Description,
			Latitude:    e.Brewery.Latitude,
			Longitude:   e.Brewery.Longitude,
			CreatedAt:   e.Brewery.CreatedAt,
			UpdatedAt:   e.Brewery.UpdatedAt,
		}
	}

	return visit
}
