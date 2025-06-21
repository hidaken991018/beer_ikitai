package dto

import "time"

type BreweryResponse struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Address     string    `json:"address"`
	Description string    `json:"description"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type BreweryRequest struct {
	Name        string  `json:"name" valid:"Required"`
	Address     string  `json:"address"`
	Description string  `json:"description"`
	Latitude    float64 `json:"latitude" valid:"Required"`
	Longitude   float64 `json:"longitude" valid:"Required"`
}

type BreweriesResponse struct {
	Breweries []*BreweryResponse `json:"breweries"`
	Total     int                `json:"total"`
}

// ゲスト用のレスポンス（位置情報を除く）
type BreweryPublicResponse struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	Address     string    `json:"address"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
