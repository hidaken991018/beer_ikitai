package entity

import "time"

type UserProfile struct {
	ID          int
	CognitoSub  string
	DisplayName string
	IconURL     string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (u *UserProfile) IsValid() bool {
	return u.CognitoSub != ""
}

func (u *UserProfile) UpdateDisplayName(name string) {
	u.DisplayName = name
	u.UpdatedAt = time.Now()
}

func (u *UserProfile) UpdateIconURL(url string) {
	u.IconURL = url
	u.UpdatedAt = time.Now()
}
