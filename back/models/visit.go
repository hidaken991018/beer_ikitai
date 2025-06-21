package models

import (
	"time"
)

type Visit struct {
	Id          int          `orm:"auto" json:"id"`
	UserProfile *UserProfile `orm:"rel(fk)" json:"user_profile"`
	Brewery     *Brewery     `orm:"rel(fk)" json:"brewery"`
	VisitedAt   time.Time    `orm:"auto_now_add;type(datetime)" json:"visited_at"`
}
