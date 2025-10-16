#!/usr/bin/env python3
"""
BeerLog インフラストラクチャ構成図生成スクリプト

このスクリプトは Python diagrams ライブラリを使用して、
CloudFormation テンプレートに基づくAWSインフラ構成図を生成します。

必要な環境:
- Python 3.7+
- diagrams ライブラリ (pip install diagrams)
- Graphviz (システムパッケージ)

使用方法:
    python3 generate_infrastructure_diagrams.py

生成されるファイル:
- images/beerlog_architecture_overview.png - 全体アーキテクチャ
- images/beerlog_network_detail.png - ネットワーク構成詳細
- images/beerlog_data_flow.png - データフロー
"""

import os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.network import VPC, InternetGateway, NATGateway, Route53, CloudFront
from diagrams.aws.compute import Lambda, EC2
from diagrams.aws.database import RDS
from diagrams.aws.security import SecretsManager, Cognito, IAM
from diagrams.aws.network import APIGateway, VPCEndpoint
from diagrams.aws.storage import S3
from diagrams.aws.management import SystemsManager

# 出力ディレクトリ設定
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "images")

# 出力ディレクトリが存在しない場合は作成
os.makedirs(OUTPUT_DIR, exist_ok=True)

# diagrams の設定
graph_attr = {
    "fontsize": "14",
    "bgcolor": "white",
    "pad": "0.5",
}


def generate_overview_diagram():
    """全体アーキテクチャ構成図を生成"""

    output_path = os.path.join(OUTPUT_DIR, "beerlog_architecture_overview")

    with Diagram(
        "BeerLog - AWS Architecture Overview",
        filename=output_path,
        show=False,
        direction="TB",
        graph_attr=graph_attr,
    ):
        # ユーザー/クライアント
        users = CloudFront("Next.js App\n(Amplify)")

        # API層
        with Cluster("API & Authentication"):
            cognito = Cognito("Cognito\nUser Pool")
            api_gw = APIGateway("API Gateway\n(Cognito Authorizer)")

        # VPC
        with Cluster("VPC (10.0.0.0/16)"):
            # パブリックサブネット
            with Cluster("Public Subnets (2 AZ)"):
                igw = InternetGateway("Internet\nGateway")

            # プライベートサブネット
            with Cluster("Private Subnets (2 AZ)"):
                # Lambda
                lambda_func = Lambda("Lambda\n(Go API)")

                # RDS
                with Cluster("Database"):
                    rds = RDS("RDS PostgreSQL\n(Multi-AZ)")
                    secrets = SecretsManager("DB Credentials")

                # EC2管理インスタンス
                ec2 = EC2("EC2\n(Management)")

                # VPCエンドポイント
                vpc_endpoints = VPCEndpoint("VPC Endpoints\n(SSM, S3)")

        # S3とCloudFront (アイコン画像用)
        with Cluster("Static Content"):
            s3_icons = S3("S3\n(Icon Images)")
            cf_icons = CloudFront("CloudFront\n(OAC)")

        # 接続関係
        users >> Edge(label="HTTPS") >> api_gw
        users >> Edge(label="認証") >> cognito
        api_gw >> Edge(label="認可") >> cognito
        api_gw >> Edge(label="Lambda Proxy") >> lambda_func
        lambda_func >> Edge(label="SQL") >> rds
        lambda_func >> Edge(label="credentials") >> secrets
        ec2 >> Edge(label="管理接続") >> rds
        ec2 >> Edge(label="SSM Session") >> vpc_endpoints

        # 静的コンテンツ配信
        users >> Edge(label="画像取得") >> cf_icons
        cf_icons >> Edge(label="Origin Access") >> s3_icons

        # インターネットゲートウェイ接続
        igw


def generate_network_diagram():
    """ネットワーク構成詳細図を生成"""

    output_path = os.path.join(OUTPUT_DIR, "beerlog_network_detail")

    with Diagram(
        "BeerLog - Network Architecture Detail",
        filename=output_path,
        show=False,
        direction="LR",
        graph_attr=graph_attr,
    ):
        # インターネット
        internet = InternetGateway("Internet Gateway")

        # VPC構成
        with Cluster("VPC (10.0.0.0/16)"):
            # パブリックサブネット AZ-A
            with Cluster("Public Subnet A\n10.0.1.0/24\nAZ-1"):
                public_a = VPCEndpoint("Public Resources")

            # パブリックサブネット AZ-B
            with Cluster("Public Subnet B\n10.0.2.0/24\nAZ-2"):
                public_b = VPCEndpoint("Public Resources")

            # プライベートサブネット AZ-A
            with Cluster("Private Subnet A\n10.0.11.0/24\nAZ-1"):
                lambda_a = Lambda("Lambda")
                ec2_a = EC2("EC2")
                rds_a = RDS("RDS Primary\n(or Standby)")

            # プライベートサブネット AZ-B
            with Cluster("Private Subnet B\n10.0.12.0/24\nAZ-2"):
                lambda_b = Lambda("Lambda")
                rds_b = RDS("RDS Standby\n(or Primary)")

            # VPCエンドポイント
            with Cluster("VPC Endpoints"):
                ssm_ep = SystemsManager("SSM")
                s3_ep = S3("S3 Gateway")

        # セキュリティグループ
        with Cluster("Security Groups"):
            sg_lambda = IAM("Lambda/RDS SG\n(Port 5432)")
            sg_ec2 = IAM("EC2 SG\n(Port 443)")

        # 接続関係
        internet >> public_a
        internet >> public_b

        lambda_a >> sg_lambda >> rds_a
        lambda_b >> sg_lambda >> rds_b
        ec2_a >> sg_ec2 >> rds_a

        # VPCエンドポイント接続
        lambda_a >> s3_ep
        lambda_b >> s3_ep
        ec2_a >> ssm_ep


def generate_data_flow_diagram():
    """データフロー図を生成"""

    output_path = os.path.join(OUTPUT_DIR, "beerlog_data_flow")

    with Diagram(
        "BeerLog - API Request Data Flow",
        filename=output_path,
        show=False,
        direction="LR",
        graph_attr=graph_attr,
    ):
        # クライアント
        client = CloudFront("Next.js Client")

        # 認証フロー
        with Cluster("Authentication"):
            cognito = Cognito("Cognito\nUser Pool")

        # APIゲートウェイ
        api_gw = APIGateway("API Gateway")

        # 認可
        authorizer = IAM("Cognito\nAuthorizer")

        # Lambda処理
        with Cluster("Lambda Function (Go)"):
            lambda_handler = Lambda("API Handler\n(Beego)")

        # データベースアクセス
        with Cluster("Data Layer"):
            secrets = SecretsManager("DB Credentials")
            rds = RDS("PostgreSQL")

        # リクエストフロー
        client >> Edge(label="1. JWT Token") >> api_gw
        api_gw >> Edge(label="2. Verify Token") >> authorizer
        authorizer >> Edge(label="2-1. Validate") >> cognito
        api_gw >> Edge(label="3. Lambda Proxy\n(X-Cognito-Sub)") >> lambda_handler
        lambda_handler >> Edge(label="4. Get Credentials") >> secrets
        lambda_handler >> Edge(label="5. SQL Query") >> rds
        rds >> Edge(label="6. Result") >> lambda_handler
        lambda_handler >> Edge(label="7. JSON Response") >> api_gw
        api_gw >> Edge(label="8. HTTPS Response") >> client


def main():
    """メイン処理: 全ての構成図を生成"""

    print("BeerLog インフラ構成図生成を開始します...")

    try:
        print("\n1. 全体アーキテクチャ構成図を生成中...")
        generate_overview_diagram()
        print("   ✓ images/beerlog_architecture_overview.png")

        print("\n2. ネットワーク構成詳細図を生成中...")
        generate_network_diagram()
        print("   ✓ images/beerlog_network_detail.png")

        print("\n3. データフロー図を生成中...")
        generate_data_flow_diagram()
        print("   ✓ images/beerlog_data_flow.png")

        print("\n✅ 全ての構成図の生成が完了しました!")
        print(f"   出力先: {OUTPUT_DIR}")

    except Exception as e:
        print(f"\n❌ エラーが発生しました: {e}")
        print("\n必要な環境:")
        print("  - Python 3.7+")
        print("  - pip install diagrams")
        print("  - Graphviz (brew install graphviz / apt-get install graphviz)")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
