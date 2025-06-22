package main

import (
	"context"
	"log"
	"mybeerlog/controllers"
	"mybeerlog/models"
	"os"

	"github.com/astaxie/beego"
	beegoCtx "github.com/astaxie/beego/context"
	"github.com/astaxie/beego/orm"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/awslabs/aws-lambda-go-api-proxy/httpadapter"

	_ "github.com/lib/pq"
)

var beegoLambda *httpadapter.HandlerAdapter

func init() {
	// Lambda 環境変数からデータベース設定を取得
	dbHost := getEnvOrDefault("DB_HOST", "localhost")
	dbUser := getEnvOrDefault("DB_USER", "postgres")
	dbPass := getEnvOrDefault("DB_PASS", "password")
	dbName := getEnvOrDefault("DB_NAME", "mybeerlog")
	dbPort := getEnvOrDefault("DB_PORT", "5432")
	dbSSLMode := getEnvOrDefault("DB_SSLMODE", "disable")

	// データベース接続設定
	// sslmodeを環境変数で指定可能に
	// 例: DB_SSLMODE=disable もしくは require など
	dataSource := "user=" + dbUser + " password=" + dbPass + " dbname=" + dbName + " host=" + dbHost + " port=" + dbPort + " sslmode=" + dbSSLMode

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

	// Lambda 環境では run.mode を production に設定
	beego.BConfig.RunMode = beego.PROD

	// ルーティング設定
	setupRoutes()

	// CORS設定
	beego.InsertFilter("*", beego.BeforeRouter, func(ctx *beegoCtx.Context) {
		ctx.Output.Header("Access-Control-Allow-Origin", "*")
		ctx.Output.Header("Access-Control-Allow-Methods", "OPTIONS,DELETE,POST,GET,PUT")
		ctx.Output.Header("Access-Control-Allow-Headers", "Content-Type,Authorization")
		if ctx.Input.Method() == "OPTIONS" {
			ctx.Output.SetStatus(200)
			return
		}
	})

	// Lambda adapter を初期化
	beegoLambda = httpadapter.New(beego.BeeApp.Handlers)
}

// setupRoutes ルーティングを設定する
func setupRoutes() {
	// ヘルスチェック
	beego.Router("/health", &controllers.HealthController{})

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

// Handler Lambda ハンドラー関数
func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// API Gateway プロキシ統合を使用してリクエストを処理
	return beegoLambda.ProxyWithContext(ctx, req)
}

// getEnvOrDefault 環境変数を取得し、存在しない場合はデフォルト値を返す
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func main() {
	// Lambda 環境かどうかをチェック
	if os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
		// Lambda 環境で実行
		lambda.Start(Handler)
	} else {
		// ローカル開発環境で実行
		log.Println("Running in local development mode")

		// 開発環境でのテーブル自動作成
		err := orm.RunSyncdb("default", false, true)
		if err != nil {
			log.Fatal("テーブル作成エラー:", err)
		}

		// テスト用エンドポイント（開発環境のみ）
		testController := controllers.NewTestController()
		beego.Router("/test/generate-token", testController, "get:GenerateToken")
		beego.Router("/test/auth", testController, "get:TestAuth")
		beego.Router("/test/revoke-token", testController, "post:RevokeToken")
		beego.Router("/test/token-info", testController, "get:GetTokenInfo")

		beego.Run()
	}
}
