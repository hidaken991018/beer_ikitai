package entity

import "time"

type Visit struct {
	ID            int
	UserProfileID *int
	UserProfile   *UserProfile
	BreweryID     *int
	Brewery       *Brewery
	VisitedAt     time.Time
}

func NewVisit(userProfileID, breweryID int) *Visit {
	return &Visit{
		UserProfileID: &userProfileID,
		BreweryID:     &breweryID,
		VisitedAt:     time.Now(),
	}
}

func (v *Visit) IsValid() bool {
	return *v.UserProfileID > 0 && *v.BreweryID > 0
}
