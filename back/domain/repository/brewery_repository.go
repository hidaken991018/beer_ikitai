package repository

import (
	"mybeerlog/domain/entity"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

// BreweryRepository 醸造所のデータアクセスインターフェースを定義する
type BreweryRepository interface {
	GetByID(id int) (*entity.Brewery, error)
	GetAll(limit, offset int) ([]*entity.Brewery, int, error)
	GetByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error)
	Create(brewery *entity.Brewery) (*entity.Brewery, error)
}

// beegoBreweryRepository Beego ORMを使用してBreweryRepositoryを実装する
type beegoBreweryRepository struct {
	orm orm.Ormer
}

// NewBreweryRepository 新しいBreweryRepositoryインスタンスを作成する
func NewBreweryRepository() BreweryRepository {
	return &beegoBreweryRepository{
		orm: orm.NewOrm(),
	}
}

// GetByID IDで醸造所を取得する
func (r *beegoBreweryRepository) GetByID(id int) (*entity.Brewery, error) {
	model := &models.Brewery{}
	err := r.orm.QueryTable("brewery").Filter("id", id).One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model)
}

// GetAll 全ての醸造所を取得する
func (r *beegoBreweryRepository) GetAll(limit, offset int) ([]*entity.Brewery, int, error) {
	var models []*models.Brewery

	qs := r.orm.QueryTable("brewery").OrderBy("-created_at")

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

	entities := make([]*entity.Brewery, len(models))
	for i, model := range models {
		entity, err := r.modelToEntity(model)
		if err != nil {
			return nil, 0, err
		}
		entities[i] = entity
	}

	return entities, int(total), nil
}

// GetByLocation 位置情報で醸造所を検索する
func (r *beegoBreweryRepository) GetByLocation(lat, lng, radius float64, limit, offset int) ([]*entity.Brewery, int, error) {
	var models []*models.Brewery

	// PostgreSQLのearth拡張を使用した距離検索
	// 注意: この実装では簡易的な矩形範囲検索を使用
	// 実際の運用ではPostGIS等の地理空間拡張の使用を推奨
	latRange := radius / 111000.0 // 緯度1度 ≈ 111km
	lngRange := radius / (111000.0 * cosineApprox(lat))

	sql := `SELECT * FROM brewery 
			WHERE latitude BETWEEN ? AND ? 
			AND longitude BETWEEN ? AND ?
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?`

	_, err := r.orm.Raw(sql,
		lat-latRange, lat+latRange,
		lng-lngRange, lng+lngRange,
		limit, offset).QueryRows(&models)
	if err != nil {
		return nil, 0, err
	}

	// 総数取得（簡易版）
	countSql := `SELECT COUNT(*) FROM brewery 
				 WHERE latitude BETWEEN ? AND ? 
				 AND longitude BETWEEN ? AND ?`

	var total int64
	err = r.orm.Raw(countSql,
		lat-latRange, lat+latRange,
		lng-lngRange, lng+lngRange).QueryRow(&total)
	if err != nil {
		return nil, 0, err
	}

	entities := make([]*entity.Brewery, len(models))
	for i, model := range models {
		entity, err := r.modelToEntity(model)
		if err != nil {
			return nil, 0, err
		}
		entities[i] = entity
	}

	return entities, int(total), nil
}

// Create 醸造所を作成する
func (r *beegoBreweryRepository) Create(brewery *entity.Brewery) (*entity.Brewery, error) {
	model := r.entityToModel(brewery)
	model.CreatedAt = time.Now()
	model.UpdatedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return nil, err
	}

	// 作成されたエンティティを返す
	return r.modelToEntity(model)
}


// modelToEntity モデルからエンティティに変換する
func (r *beegoBreweryRepository) modelToEntity(model *models.Brewery) (*entity.Brewery, error) {
	return entity.NewBreweryBuilder().
		WithID(model.Id).
		WithName(model.Name).
		WithAddress(model.Address).
		WithDescription(model.Description).
		WithLocation(model.Latitude, model.Longitude).
		WithCreatedAt(model.CreatedAt).
		WithUpdatedAt(model.UpdatedAt).
		Build()
}

// entityToModel エンティティからモデルに変換する
func (r *beegoBreweryRepository) entityToModel(e *entity.Brewery) *models.Brewery {
	return &models.Brewery{
		Id:          e.ID(),
		Name:        e.Name(),
		Address:     e.Address(),
		Description: e.Description(),
		Latitude:    e.Latitude(),
		Longitude:   e.Longitude(),
		CreatedAt:   e.CreatedAt(),
		UpdatedAt:   e.UpdatedAt(),
	}
}

// cosineApprox 簡易コサイン近似（緯度の経度換算用）
func cosineApprox(lat float64) float64 {
	// 日本付近の緯度での近似値
	if lat < 0 {
		lat = -lat
	}
	if lat > 45 {
		return 0.7 // 北海道付近
	}
	return 0.8 // 本州付近
}
