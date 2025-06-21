package persistence

import (
	"mybeerlog/domain/entity"
	"mybeerlog/domain/repository"
	"mybeerlog/models"
	"time"

	"github.com/astaxie/beego/orm"
)

type beegoBreweryRepository struct {
	orm orm.Ormer
}

func NewBeegoBreweryRepository() repository.BreweryRepository {
	return &beegoBreweryRepository{
		orm: orm.NewOrm(),
	}
}

func (r *beegoBreweryRepository) GetByID(id int) (*entity.Brewery, error) {
	model := &models.Brewery{}
	err := r.orm.QueryTable("brewery").Filter("id", id).One(model)
	if err != nil {
		return nil, err
	}

	return r.modelToEntity(model), nil
}

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
		entities[i] = r.modelToEntity(model)
	}

	return entities, int(total), nil
}

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
		entities[i] = r.modelToEntity(model)
	}

	return entities, int(total), nil
}

func (r *beegoBreweryRepository) Create(brewery *entity.Brewery) error {
	model := r.entityToModel(brewery)
	model.CreatedAt = time.Now()
	model.UpdatedAt = time.Now()

	_, err := r.orm.Insert(model)
	if err != nil {
		return err
	}
	brewery.CreatedAt = model.CreatedAt
	brewery.UpdatedAt = model.UpdatedAt

	return nil
}

func (r *beegoBreweryRepository) Update(brewery *entity.Brewery) error {
	model := r.entityToModel(brewery)
	model.UpdatedAt = time.Now()

	_, err := r.orm.Update(model)
	if err != nil {
		return err
	}

	brewery.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *beegoBreweryRepository) Delete(id int) error {
	model := &models.Brewery{Id: id}
	_, err := r.orm.Delete(model)
	return err
}

func (r *beegoBreweryRepository) modelToEntity(model *models.Brewery) *entity.Brewery {
	return &entity.Brewery{
		ID:          model.Id,
		Name:        model.Name,
		Address:     model.Address,
		Description: model.Description,
		Latitude:    model.Latitude,
		Longitude:   model.Longitude,
		CreatedAt:   model.CreatedAt,
		UpdatedAt:   model.UpdatedAt,
	}
}

func (r *beegoBreweryRepository) entityToModel(e *entity.Brewery) *models.Brewery {
	return &models.Brewery{
		Id:          e.ID,
		Name:        e.Name,
		Address:     e.Address,
		Description: e.Description,
		Latitude:    e.Latitude,
		Longitude:   e.Longitude,
		CreatedAt:   e.CreatedAt,
		UpdatedAt:   e.UpdatedAt,
	}
}

// 簡易コサイン近似（緯度の経度換算用）
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
