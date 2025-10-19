#!/usr/bin/env python3
"""
My Beer Log AWS Infrastructure Diagram Generator

This script generates infrastructure diagrams for the My Beer Log application
using Python diagrams library. The diagrams visualize the AWS architecture
defined in the CloudFormation template.

Requirements:
    - diagrams>=0.23.0
    - graphviz

Usage:
    python generate_diagrams.py

Output:
    - PNG images in docs/architect/diagrams/
"""

import os
from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda, EC2
from diagrams.aws.database import RDS
from diagrams.aws.network import (
    InternetGateway, APIGateway, Endpoint,CloudFront, NATGateway
)
from diagrams.aws.security import (
    IAM, SecretsManager, Cognito
)
from diagrams.aws.storage import S3
from diagrams.aws.general import General


def ensure_output_directory():
    """Ensure the output directory exists."""
    output_dir = "docs/architect/diagrams"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    return output_dir


def create_overall_architecture():
    """Create the overall AWS architecture diagram."""
    output_dir = ensure_output_directory()
    
    with Diagram(
        "My Beer Log - AWS Overall Architecture",
        filename=f"{output_dir}/beer_log_overall_architecture",
        show=False,
        direction="TB",
        graph_attr={
            "fontsize": "45",
            "bgcolor": "white",
            "pad": "1.0",
            "splines": "ortho"
        }
    ):
        # External entities
        users = General("Users")
        
        with Cluster("AWS Cloud"):
            # Internet Gateway
            igw = InternetGateway("Internet Gateway")
                        # External AWS Services
            with Cluster("AWS Managed Services"):
                cloudfront = CloudFront("CloudFront\n(Icon Images)")
                # API Gateway
                api_gateway = APIGateway("API Gateway\nREST API")
                
                # Cognito
                cognito = Cognito("Cognito\nUser Pool")
                
                # S3 Storage
                s3_bucket = S3("Icon Images\nS3 Bucket")
                
                # Secrets Manager
                secrets = SecretsManager("DB Secrets\nManager")
                
                # IAM
                iam = IAM("IAM")

            with Cluster("VPC (10.0.0.0/16)"):
                # Interface&Gateway Endpoints
                vpc_endpoint = Endpoint("vpc-endpoint")
                
                with Cluster("Public Subnets"):
                    # NAT Gateway
                    nat_gw_a = NATGateway("NAT Gateway")
            
                with Cluster("Private Subnets"):
                    # Lambda Function
                    lambda_func = Lambda("API Handler\nLambda")
                    
                    # EC2 Instance
                    ec2_instance = EC2("EC2 Instance")
                    
                    # Database
                    rds_primary = RDS("PostgreSQL\nPrimary")
                    rds_standby = RDS("PostgreSQL\nStandby")
                
                # Security Groups
                with Cluster("Security"):
                    lambda_sg = Cluster("Lambda/DB\nSecurity Group")
                    ec2_sg = Cluster("EC2\nSecurity Group")
            

        
        # Connections
        users >> igw
        igw >> cloudfront
        cloudfront >> s3_bucket
        
        users >> igw
        igw >> api_gateway
        api_gateway >> Edge(label="Cognito Auth") >> cognito
        api_gateway >> Edge(label="Lambda Proxy") >> lambda_func
        
        lambda_func >> Edge(label="DB Connection") >> rds_primary
        rds_primary - Edge(label="Multi-AZ Sync", style="dashed") - rds_standby
        
        lambda_func >> Edge(label="Get Secrets") >> secrets
        ec2_instance >> Edge(label="Admin Access") >> rds_primary
        
        # VPC Endpoints connections
        ec2_instance >> vpc_endpoint
        ec2_instance >> nat_gw_a
        lambda_func >> nat_gw_a
        
        nat_gw_a >> igw        
        
        # Security associations
        lambda_func - lambda_sg
        ec2_instance - ec2_sg
        rds_primary - lambda_sg


      

def main():
    """Generate all infrastructure diagrams."""
    print("Generating My Beer Log AWS Infrastructure Diagrams...")
    
    try:
        print("1. Creating overall architecture diagram...")
        create_overall_architecture()

        
        print("\nDiagrams generated successfully!")
        print("Output location: docs/architect/diagrams/")
        print("\nGenerated files:")
        print("- beer_log_overall_architecture.png")
        
    except Exception as e:
        print(f"Error generating diagrams: {e}")
        print("Please ensure you have installed required dependencies:")
        print("pip install diagrams graphviz")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())