package main

import (
	"log"
	"mybeerlog/controllers"
	"mybeerlog/models"

	"github.com/astaxie/beego"
	"github.com/astaxie/beego/context"
	"github.com/astaxie/beego/orm"
	_ "github.com/lib/pq"
)

func init() {

	// データベース接続設定
	dbHost := beego.AppConfig.String("db.host")
	dbUser := beego.AppConfig.String("db.user")
	dbPass := beego.AppConfig.String("db.pass")
	dbName := beego.AppConfig.String("db.name")
	dbPort := beego.AppConfig.String("db.port")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}

	dataSource := "user=" + dbUser + " password=" + dbPass + " dbname=" + dbName + " host=" + dbHost + " port=" + dbPort + " sslmode=disable"

	err := orm.RegisterDataBase("default", "postgres", dataSource)
	if err != nil {
		log.Fatal("データベース接続エラー:", err)
	}

	// モデル登録
	orm.RegisterModel(
		new(models.UserProfile),
		new(models.Brewery),
		new(models.Visit),
	)

	// 開発環境でのテーブル自動作成
	//ログ出設定

	if beego.AppConfig.String("run.mode") == "dev" {
		err = orm.RunSyncdb("default", false, true)
		if err != nil {
			log.Fatal("テーブル作成エラー:", err)
		}
	}

	// ヘルスチェック
	beego.Router("/health", &controllers.HealthController{})

	// テスト用エンドポイント（開発環境のみ）
	if beego.BConfig.RunMode == "dev" {
		testController := controllers.NewTestController()
		beego.Router("/test/generate-token", testController, "get:GenerateToken")
		beego.Router("/test/auth", testController, "get:TestAuth")
		beego.Router("/test/revoke-token", testController, "post:RevokeToken")
		beego.Router("/test/token-info", testController, "get:GetTokenInfo")
	}

	// ユーザープロファイル管理
	userController := controllers.NewUserController()
	beego.Router("/users/profile", userController, "get:GetProfile;post:CreateProfile;put:UpdateProfile")

	// 醸造所管理
	breweryController := controllers.NewBreweryController()
	beego.Router("/breweries", breweryController, "get:GetBreweries;post:CreateBrewery")
	beego.Router("/breweries/:brewery_id", breweryController, "get:GetBrewery")

	// 訪問・チェックイン
	visitController := controllers.NewVisitController()
	beego.Router("/checkin", visitController, "post:CheckIn")
	beego.Router("/visits", visitController, "get:GetVisits")
	beego.Router("/visits/:visit_id", visitController, "get:GetVisit")
}

func main() {
	// CORS設定
	beego.InsertFilter("*", beego.BeforeRouter, func(ctx *context.Context) {
		ctx.Output.Header("Access-Control-Allow-Origin", "*")
		ctx.Output.Header("Access-Control-Allow-Methods", "OPTIONS,DELETE,POST,GET,PUT")
		ctx.Output.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if ctx.Input.Method() == "OPTIONS" {
			ctx.Output.SetStatus(200)
			return
		}
	})

	beego.Run()
}
