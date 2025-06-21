package dto

import "time"

type VisitResponse struct {
	ID            int              `json:"id"`
	UserProfileID int              `json:"user_profile_id"`
	BreweryID     int              `json:"brewery_id"`
	Brewery       *BreweryResponse `json:"brewery,omitempty"`
	VisitedAt     time.Time        `json:"visited_at"`
}

type CheckinRequest struct {
	BreweryID int     `json:"brewery_id" valid:"Required"`
	Latitude  float64 `json:"latitude" valid:"Required"`
	Longitude float64 `json:"longitude" valid:"Required"`
}

type CheckinResponse struct {
	Visit   *VisitResponse `json:"visit"`
	Message string         `json:"message"`
}

type VisitsResponse struct {
	Visits []*VisitResponse `json:"visits"`
	Total  int              `json:"total"`
}
