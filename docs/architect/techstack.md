# My Beer Log 技術スタック（MVP）

## フロントエンド

- フレームワーク：Next.js × React
- 言語：TypeScript
- CSS フレームワーク：Tailwind
- データフェッチ：useSWR
- 状態管理：Redux
- UI コンポーネント：shadcn/ui

## 認証・認可

- AWS Cognito（ユーザー管理・認証）

## データベース

- PostgreSQL（Amazon RDS）

## インフラ・ホスティング

- AWS
  - フロントエンド：S3, CloudFront
  - バックエンド：API Gateway + Lambda
  - DB：RDS
  - 認証：Cognito
  - IaC：Cloudformation
- Docker（開発・本番環境用コンテナ）

## CI/CD・運用

- GitHub Actions（CI/CD パイプライン）

## 監視

- ブラウザ監視：Amazon CloudWatch RUM
