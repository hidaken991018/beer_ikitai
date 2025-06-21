# マルチステージビルド
FROM golang:1.21-alpine AS builder

WORKDIR /app

# 依存関係ファイルをコピー
COPY go.mod go.sum ./

# 依存関係をダウンロード
RUN go mod download

# ソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# 実行用イメージ
FROM alpine:latest

# セキュリティアップデートとCA証明書
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /root/

# ビルドされたバイナリをコピー
COPY --from=builder /app/main .
COPY --from=builder /app/conf ./conf

# ポート公開
EXPOSE 8080

# アプリケーション実行
CMD ["./main"]