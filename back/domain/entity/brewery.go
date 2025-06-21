package entity

import (
	"errors"
	"math"
	"strings"
	"time"
)

// Brewery はドメイン内の醇造所を表す
type Brewery struct {
	id          int
	name        string
	address     string
	description string
	latitude    float64
	longitude   float64
	createdAt   time.Time
	updatedAt   time.Time
}

// BreweryBuilder はBreweryインスタンスの作成を支援する
type BreweryBuilder struct {
	brewery *Brewery
}

// NewBreweryBuilder 新しいBreweryBuilderを作成する
func NewBreweryBuilder() *BreweryBuilder {
	return &BreweryBuilder{
		brewery: &Brewery{
			createdAt: time.Now(),
			updatedAt: time.Now(),
		},
	}
}

// WithID IDを設定する
func (b *BreweryBuilder) WithID(id int) *BreweryBuilder {
	b.brewery.id = id
	return b
}

// WithName 名前を設定する
func (b *BreweryBuilder) WithName(name string) *BreweryBuilder {
	b.brewery.name = strings.TrimSpace(name)
	return b
}

// WithAddress 住所を設定する
func (b *BreweryBuilder) WithAddress(address string) *BreweryBuilder {
	b.brewery.address = strings.TrimSpace(address)
	return b
}

// WithDescription 説明を設定する
func (b *BreweryBuilder) WithDescription(description string) *BreweryBuilder {
	b.brewery.description = strings.TrimSpace(description)
	return b
}

// WithLocation 緯度と経度を設定する
func (b *BreweryBuilder) WithLocation(latitude, longitude float64) *BreweryBuilder {
	b.brewery.latitude = latitude
	b.brewery.longitude = longitude
	return b
}

// WithCreatedAt 作成日時を設定する
func (b *BreweryBuilder) WithCreatedAt(createdAt time.Time) *BreweryBuilder {
	b.brewery.createdAt = createdAt
	return b
}

// WithUpdatedAt 更新日時を設定する
func (b *BreweryBuilder) WithUpdatedAt(updatedAt time.Time) *BreweryBuilder {
	b.brewery.updatedAt = updatedAt
	return b
}

// Build Breweryインスタンスを作成する
func (b *BreweryBuilder) Build() (*Brewery, error) {
	if err := b.brewery.validate(); err != nil {
		return nil, err
	}
	return b.brewery, nil
}

// ID IDを取得する
func (b *Brewery) ID() int {
	return b.id
}

// Name 名前を取得する
func (b *Brewery) Name() string {
	return b.name
}

// Address 住所を取得する
func (b *Brewery) Address() string {
	return b.address
}

// Description 説明を取得する
func (b *Brewery) Description() string {
	return b.description
}

// Latitude 緯度を取得する
func (b *Brewery) Latitude() float64 {
	return b.latitude
}

// Longitude 経度を取得する
func (b *Brewery) Longitude() float64 {
	return b.longitude
}

// CreatedAt 作成日時を取得する
func (b *Brewery) CreatedAt() time.Time {
	return b.createdAt
}

// UpdatedAt 更新日時を取得する
func (b *Brewery) UpdatedAt() time.Time {
	return b.updatedAt
}

// IsValid 醇造所が有効かどうかを判定する
func (b *Brewery) IsValid() bool {
	return b.validate() == nil
}

// validate 醇造所のバリデーションを実行する
func (b *Brewery) validate() error {
	if strings.TrimSpace(b.name) == "" {
		return errors.New("brewery name is required")
	}
	if len(b.name) > 255 {
		return errors.New("brewery name must be 255 characters or less")
	}
	if len(b.address) > 512 {
		return errors.New("brewery address must be 512 characters or less")
	}
	if !b.isValidLatitude(b.latitude) {
		return errors.New("invalid latitude: must be between -90 and 90")
	}
	if !b.isValidLongitude(b.longitude) {
		return errors.New("invalid longitude: must be between -180 and 180")
	}
	return nil
}

// isValidLatitude 緯度が有効かどうかを判定する
func (b *Brewery) isValidLatitude(lat float64) bool {
	return lat >= -90.0 && lat <= 90.0 && lat != 0
}

// isValidLongitude 経度が有効かどうかを判定する
func (b *Brewery) isValidLongitude(lng float64) bool {
	return lng >= -180.0 && lng <= 180.0 && lng != 0
}

// DistanceFrom 2点間の距離を計算する（ハーバサイン公式）
func (b *Brewery) DistanceFrom(lat, lng float64) (float64, error) {
	if !b.isValidLatitude(lat) || !b.isValidLongitude(lng) {
		return 0, errors.New("invalid coordinates provided")
	}

	const earthRadius = 6371000 // 地球の半径（メートル）

	lat1 := b.latitude * math.Pi / 180
	lat2 := lat * math.Pi / 180
	deltaLat := (lat - b.latitude) * math.Pi / 180
	deltaLng := (lng - b.longitude) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c, nil
}

// IsWithinCheckinRange チェックイン可能な距離内かどうかを判定する
func (b *Brewery) IsWithinCheckinRange(lat, lng float64, maxDistance float64) (bool, error) {
	if maxDistance <= 0 {
		return false, errors.New("max distance must be positive")
	}

	distance, err := b.DistanceFrom(lat, lng)
	if err != nil {
		return false, err
	}

	return distance <= maxDistance, nil
}

