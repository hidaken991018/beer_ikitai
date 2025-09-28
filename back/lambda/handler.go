package lambda

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/beego/beego/v2/server/web"
)

// CognitoClaims represents the Cognito user claims from API Gateway authorizer
type CognitoClaims struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Groups        string `json:"cognito:groups"`
}

// Handler is the Lambda entry point for API Gateway proxy integration
func Handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	// Extract Cognito claims from requestContext.authorizer.claims
	var claims CognitoClaims
	if authorizerData, exists := request.RequestContext.Authorizer["claims"]; exists {
		if claimsMap, ok := authorizerData.(map[string]interface{}); ok {
			// Convert claims to JSON and back to struct for type safety
			claimsBytes, _ := json.Marshal(claimsMap)
			json.Unmarshal(claimsBytes, &claims)
		}
	}

	// Convert Lambda event to HTTP request
	httpRequest := convertLambdaEventToHTTPRequest(request, claims)

	// Initialize Beego application if not already done
	web.BConfig.RunMode = "prod"
	web.BConfig.CopyRequestBody = true

	// Create a custom response writer to capture the response
	responseWriter := &lambdaResponseWriter{
		headers:    make(http.Header),
		statusCode: http.StatusOK,
	}

	// Process the request through Beego
	web.BeeApp.Handlers.ServeHTTP(responseWriter, httpRequest)

	// Convert HTTP response to Lambda response
	return convertHTTPResponseToLambdaResponse(responseWriter), nil
}

// convertLambdaEventToHTTPRequest converts API Gateway proxy request to HTTP request
func convertLambdaEventToHTTPRequest(request events.APIGatewayProxyRequest, claims CognitoClaims) *http.Request {
	// Build URL
	path := request.Path
	if request.PathParameters != nil {
		for key, value := range request.PathParameters {
			path = strings.ReplaceAll(path, "{"+key+"}", value)
		}
	}

	// Add query parameters
	values := url.Values{}
	if request.QueryStringParameters != nil {
		for key, value := range request.QueryStringParameters {
			values.Add(key, value)
		}
	}

	// Build full URL
	fullURL := "https://" + request.Headers["Host"] + path
	if len(values) > 0 {
		fullURL += "?" + values.Encode()
	}

	// Create HTTP request
	httpRequest, _ := http.NewRequest(request.HTTPMethod, fullURL, strings.NewReader(request.Body))

	// Copy headers
	for key, value := range request.Headers {
		httpRequest.Header.Set(key, value)
	}

	// Add Cognito claims as custom headers for Beego
	if claims.Sub != "" {
		httpRequest.Header.Set("X-Cognito-Sub", claims.Sub)
	}
	if claims.Email != "" {
		httpRequest.Header.Set("X-Cognito-Email", claims.Email)
	}
	if claims.EmailVerified != "" {
		httpRequest.Header.Set("X-Cognito-Email-Verified", claims.EmailVerified)
	}
	if claims.Groups != "" {
		httpRequest.Header.Set("X-Cognito-Groups", claims.Groups)
	}

	// Add AWS Lambda Proxy integration standard headers
	if claims.Sub != "" {
		httpRequest.Header.Set("X-Amzn-Cognito-Sub", claims.Sub)
	}

	return httpRequest
}

// lambdaResponseWriter implements http.ResponseWriter for capturing Beego responses
type lambdaResponseWriter struct {
	headers    http.Header
	body       []byte
	statusCode int
}

func (w *lambdaResponseWriter) Header() http.Header {
	return w.headers
}

func (w *lambdaResponseWriter) Write(body []byte) (int, error) {
	w.body = append(w.body, body...)
	return len(body), nil
}

func (w *lambdaResponseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
}

// convertHTTPResponseToLambdaResponse converts HTTP response to API Gateway proxy response
func convertHTTPResponseToLambdaResponse(w *lambdaResponseWriter) events.APIGatewayProxyResponse {
	// Convert headers to string map
	headers := make(map[string]string)
	for key, values := range w.headers {
		if len(values) > 0 {
			headers[key] = values[0]
		}
	}

	// Ensure CORS headers are present
	headers["Access-Control-Allow-Origin"] = "*"
	headers["Access-Control-Allow-Headers"] = "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token"
	headers["Access-Control-Allow-Methods"] = "DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT"

	return events.APIGatewayProxyResponse{
		StatusCode: w.statusCode,
		Headers:    headers,
		Body:       string(w.body),
	}
}

// Start starts the Lambda handler
func Start() {
	lambda.Start(Handler)
}
