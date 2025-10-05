package controllers

import (
	"encoding/json"
	"fmt"

	"github.com/astaxie/beego/orm"
)

// GetBreweriesController APIのヘルスチェックを処理するコントローラー
type GetBreweriesController struct {
	BaseController
	UserID int
}

// GetBreweries 醸造所の一覧を取得する
// @Title Get Breweries
// @Description Get list of breweries
// @Param lat query float64 false "Latitude for location search"
// @Param lng query float64 false "Longitude for location search"
// @Param radius query float64 false "Search radius in km (default: 10)"
// @Param limit query int false "Limit (default: 20, max: 100)"
// @Param offset query int false "Offset (default: 0)"
// @Success 200 {object} dto.BreweriesResponse
// @Failure 400 {object} dto.ErrorResponse
// @router /breweries [get]

func (c *GetBreweriesController) GetBreweries() {
	lat := c.GetFloatQuery("lat", 0)
	lng := c.GetFloatQuery("lng", 0)
	radius := c.GetFloatQuery("radius", 10.0)
	limit := c.GetIntQuery("limit", 20)
	offset := c.GetIntQuery("offset", 0)

	// r := repository.NewBreweryRepository()
	// repos, a, b := r.GetAll(limit, offset)
	// fmt.Println("repos", repos, a, b)
	// ここから
	o := orm.NewOrm()

	qs := o.QueryTable("brewery").OrderBy("-created_at")
	fmt.Println("qs:", qs)

	// ここまで

	type Temp struct {
		Lat    float64 `json:"lat"`
		Lng    float64 `json:"lng"`
		Radius float64 `json:"radius"`
		Limit  int     `json:"limit"`
		Offset int     `json:"offset"`
	}

	temp := Temp{Lat: lat, Lng: lng, Radius: radius, Limit: limit, Offset: offset}
	t, _ := json.MarshalIndent(temp, "", "    ")
	fmt.Println(string(t))
	fmt.Println("UserId:", c.UserID)

	// 認証チェック（認証済みユーザーのみ位置情報取得可能）
	cognitoSub, _ := c.GetCognitoSub()
	fmt.Println("CognitoSub:", cognitoSub)

	var response interface{}
	response = map[string]string{"message": "GetBreweries called"}

	c.JSONResponse(response)
}
