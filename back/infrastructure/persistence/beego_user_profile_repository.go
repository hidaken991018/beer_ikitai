package persistence

import (
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

type beegoUserProfileRepository struct {
	orm orm.Ormer
}

func NewBeegoUserProfileRepository() repository.UserProfileRepository {
	return &beegoUserProfileRepository{
		orm: orm.NewOrm(),
	}
}

func (r *beegoUserProfileRepository) GetByCognitoSub(cognitoSub string) (*entity.UserProfile, error) {
	model := &models.UserProfile{}
	err := r.orm.QueryTable("user_profile").Filter("cognito_sub", cognitoSub).One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model), nil
}

func (r *beegoUserProfileRepository) Create(userProfile *entity.UserProfile) error {
	model := r.entityToModel(userProfile)
	model.CreatedAt = time.Now()
	model.UpdatedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return err
	}

	userProfile.CreatedAt = model.CreatedAt
	userProfile.UpdatedAt = model.UpdatedAt

	return nil
}

func (r *beegoUserProfileRepository) Update(userProfile *entity.UserProfile) error {
	model := r.entityToModel(userProfile)
	model.UpdatedAt = time.Now()

	_, err := r.orm.Update(model)
	if err != nil {
		return err
	}

	userProfile.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *beegoUserProfileRepository) Delete(id int) error {
	model := &models.UserProfile{Id: id}
	_, err := r.orm.Delete(model)
	return err
}

func (r *beegoUserProfileRepository) modelToEntity(model *models.UserProfile) *entity.UserProfile {
	return &entity.UserProfile{
		ID:          model.Id,
		CognitoSub:  model.CognitoSub,
		DisplayName: model.DisplayName,
		IconURL:     model.IconURL,
		CreatedAt:   model.CreatedAt,
		UpdatedAt:   model.UpdatedAt,
	}
}

func (r *beegoUserProfileRepository) entityToModel(e *entity.UserProfile) *models.UserProfile {
	return &models.UserProfile{
		Id:          e.ID,
		CognitoSub:  e.CognitoSub,
		DisplayName: e.DisplayName,
		IconURL:     e.IconURL,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}
