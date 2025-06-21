package entity

import (
	"math"
	"time"
)

type Brewery struct {
	ID          int
	Name        string
	Address     string
	Description string
	Latitude    float64
	Longitude   float64
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (b *Brewery) IsValid() bool {
	return b.Name != "" && b.Latitude != 0 && b.Longitude != 0
}

// 2点間の距離を計算（ハーバサイン公式）
func (b *Brewery) DistanceFrom(lat, lng float64) float64 {
	const earthRadius = 6371000 // 地球の半径（メートル）

	lat1 := b.Latitude * math.Pi / 180
	lat2 := lat * math.Pi / 180
	deltaLat := (lat - b.Latitude) * math.Pi / 180
	deltaLng := (lng - b.Longitude) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1)*math.Cos(lat2)*
			math.Sin(deltaLng/2)*math.Sin(deltaLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// チェックイン可能な距離内かどうか
func (b *Brewery) IsWithinCheckinRange(lat, lng float64, maxDistance float64) bool {
	return b.DistanceFrom(lat, lng) <= maxDistance
}
