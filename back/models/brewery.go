package models

import (
	"time"
)

type Brewery struct {
	Id          int       `orm:"auto" json:"id"`
	Name        string    `orm:"size(255)" json:"name"`
	Address     string    `orm:"null;size(512)" json:"address"`
	Description string    `orm:"null;type(text)" json:"description"`
	Latitude    float64   `orm:"digits(10);decimals(7)" json:"latitude"`
	Longitude   float64   `orm:"digits(10);decimals(7)" json:"longitude"`
	CreatedAt   time.Time `orm:"auto_now_add;type(datetime)" json:"created_at"`
	UpdatedAt   time.Time `orm:"auto_now;type(datetime)" json:"updated_at"`
}
