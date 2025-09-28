package main

import (
	"context"
	"mybeerlog/controllers"
	"mybeerlog/models"
	"mybeerlog/utils"
	"os"

	"github.com/astaxie/beego"
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
		utils.Logger.WithError(err).Fatal("Database connection failed")
	}

	// モデル登録
	orm.RegisterModel(
		new(models.UserProfile),
		new(models.Brewery),
		new(models.Visit),
	)

	// Lambda 環境では run.mode を production に設定
	beego.BConfig.RunMode = beego.PROD

	// ミドルウェア設定
	setupMiddleware()

	// ルーティング設定
	setupRoutes()

	// Lambda adapter を初期化
	beegoLambda = httpadapter.New(beego.BeeApp.Handlers)
}

// setupMiddleware ミドルウェアを設定する
func setupMiddleware() {
	// 1. パニック復旧ミドルウェア（最優先）
	beego.InsertFilter("*", beego.BeforeRouter, utils.PanicRecoveryMiddleware)

	// 2. リクエストログミドルウェア
	beego.InsertFilter("*", beego.BeforeRouter, utils.RequestLoggingMiddleware)

	// 3. セキュリティヘッダーミドルウェア
	beego.InsertFilter("*", beego.BeforeRouter, utils.SecurityHeadersMiddleware)

	// 4. CORS ミドルウェア
	beego.InsertFilter("*", beego.BeforeRouter, utils.CORSMiddleware)
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
	// Cognito認証情報をヘッダーに変換
	enrichedRequest := enrichRequestWithCognitoInfo(req)
	
	// API Gateway プロキシ統合を使用してリクエストを処理
	return beegoLambda.ProxyWithContext(ctx, enrichedRequest)
}

// enrichRequestWithCognitoInfo API Gateway ProxyRequestからCognito認証情報を抽出してヘッダーに追加
func enrichRequestWithCognitoInfo(req events.APIGatewayProxyRequest) events.APIGatewayProxyRequest {
	// リクエストのヘッダーマップを初期化（存在しない場合）
	if req.Headers == nil {
		req.Headers = make(map[string]string)
	}
	
	// API Gateway Cognito Authorizerから認証情報を取得
	if req.RequestContext.Authorizer != nil {
		// Authorizerのclaims情報からCognito Subを取得
		if claims, ok := req.RequestContext.Authorizer["claims"].(map[string]interface{}); ok {
			// Cognito Subを取得
			if sub, exists := claims["sub"]; exists {
				if subStr, ok := sub.(string); ok && subStr != "" {
					req.Headers["X-Cognito-Sub"] = subStr
					utils.Logger.WithField("cognito_sub", subStr).Debug("Cognito Sub extracted from requestContext.authorizer.claims")
				}
			}
			
			// Cognito グループ情報を取得（存在する場合）
			if groups, exists := claims["cognito:groups"]; exists {
				if groupsStr, ok := groups.(string); ok && groupsStr != "" {
					req.Headers["X-Cognito-Groups"] = groupsStr
					utils.Logger.WithField("cognito_groups", groupsStr).Debug("Cognito Groups extracted from requestContext.authorizer.claims")
				}
			}
			
			// その他のCognitoクレーム情報も必要に応じて追加
			if email, exists := claims["email"]; exists {
				if emailStr, ok := email.(string); ok && emailStr != "" {
					req.Headers["X-Cognito-Email"] = emailStr
				}
			}
		} else {
			utils.Logger.Warn("requestContext.authorizer.claims not found or invalid format")
		}
	} else {
		utils.Logger.Warn("requestContext.authorizer not found - authentication may not be enabled")
	}
	
	return req
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
		utils.Logger.Info("Running in local development mode")

		// 開発環境でのテーブル自動作成
		err := orm.RunSyncdb("default", false, true)
		if err != nil {
			utils.Logger.WithError(err).Fatal("Table creation failed")
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
