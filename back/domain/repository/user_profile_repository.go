package repository

import (
	"mybeerlog/domain/entity"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

// UserProfileRepository ユーザープロファイルのデータアクセスインターフェースを定義する
type UserProfileRepository interface {
	GetByCognitoSub(cognitoSub string) (*entity.UserProfile, error)
	Create(userProfile *entity.UserProfile) (*entity.UserProfile, error)
	Update(userProfile *entity.UserProfile) (*entity.UserProfile, error)
}

// beegoUserProfileRepository Beego ORMを使用してUserProfileRepositoryを実装する
type beegoUserProfileRepository struct {
	orm orm.Ormer
}

// NewUserProfileRepository 新しいUserProfileRepositoryインスタンスを作成する
func NewUserProfileRepository() UserProfileRepository {
	return &beegoUserProfileRepository{
		orm: orm.NewOrm(),
	}
}

// GetByCognitoSub Cognito SUBでユーザープロファイルを取得する
func (r *beegoUserProfileRepository) GetByCognitoSub(cognitoSub string) (*entity.UserProfile, error) {
	model := &models.UserProfile{}
	err := r.orm.QueryTable("user_profile").Filter("cognito_sub", cognitoSub).One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model)
}

// Create ユーザープロファイルを作成する
func (r *beegoUserProfileRepository) Create(userProfile *entity.UserProfile) (*entity.UserProfile, error) {
	model := r.entityToModel(userProfile)
	model.CreatedAt = time.Now()
	model.UpdatedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return nil, err
	}

	// 新しく作成されたエンティティを返す
	return entity.NewUserProfileBuilder().
		WithID(model.Id).
		WithCognitoSub(model.CognitoSub).
		WithDisplayName(model.DisplayName).
		WithIconURL(model.IconURL).
		WithCreatedAt(model.CreatedAt).
		WithUpdatedAt(model.UpdatedAt).
		Build()
}

// Update ユーザープロファイルを更新する
func (r *beegoUserProfileRepository) Update(userProfile *entity.UserProfile) (*entity.UserProfile, error) {
	model := r.entityToModel(userProfile)
	model.UpdatedAt = time.Now()

	_, err := r.orm.Update(model)
	if err != nil {
		return nil, err
	}

	// 更新されたエンティティを返す
	return entity.NewUserProfileBuilder().
		WithID(model.Id).
		WithCognitoSub(model.CognitoSub).
		WithDisplayName(model.DisplayName).
		WithIconURL(model.IconURL).
		WithCreatedAt(model.CreatedAt).
		WithUpdatedAt(model.UpdatedAt).
		Build()
}


// modelToEntity モデルからエンティティに変換する
func (r *beegoUserProfileRepository) modelToEntity(model *models.UserProfile) (*entity.UserProfile, error) {
	return entity.NewUserProfileBuilder().
		WithID(model.Id).
		WithCognitoSub(model.CognitoSub).
		WithDisplayName(model.DisplayName).
		WithIconURL(model.IconURL).
		WithCreatedAt(model.CreatedAt).
		WithUpdatedAt(model.UpdatedAt).
		Build()
}

// entityToModel エンティティからモデルに変換する
func (r *beegoUserProfileRepository) entityToModel(e *entity.UserProfile) *models.UserProfile {
	return &models.UserProfile{
		Id:          e.ID(),
		CognitoSub:  e.CognitoSub(),
		DisplayName: e.DisplayName(),
		IconURL:     e.IconURL(),
		CreatedAt:   e.CreatedAt(),
		UpdatedAt:   e.UpdatedAt(),
	}
}
