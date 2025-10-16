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
    VPC, InternetGateway, ELB, APIGateway, Route53,
    VPCEndpoint, NATGateway
)
from diagrams.aws.security import (
    SecurityGroup, IAMRole, SecretsManager, Cognito
)
from diagrams.aws.storage import S3
from diagrams.aws.general import General
from diagrams.aws.devtools import CloudFormation
from diagrams.aws.integration import SQS
from diagrams.aws.analytics import CloudFront


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
            # DNS and Entry Point
            with Cluster("DNS & CDN"):
                cloudfront = CloudFront("CloudFront\n(Icon Images)")
                
            with Cluster("VPC (10.0.0.0/16)"):
                # Internet Gateway
                igw = InternetGateway("Internet Gateway")
                
                with Cluster("Public Subnets"):
                    with Cluster("AZ-A (10.0.1.0/24)"):
                        vpc_endpoint_pub_a = VPCEndpoint("S3 Gateway\nEndpoint")
                    
                    with Cluster("AZ-B (10.0.2.0/24)"):
                        vpc_endpoint_pub_b = General("Public Subnet B\n(Future use)")
                
                with Cluster("Private Subnets"):
                    with Cluster("AZ-A (10.0.11.0/24)"):
                        # Lambda Function
                        lambda_func = Lambda("API Handler\nLambda")
                        
                        # EC2 Instance
                        ec2_instance = EC2("Management\nEC2 Instance")
                        
                        # VPC Endpoints for private subnets
                        ssm_endpoint = VPCEndpoint("SSM\nEndpoints")
                        
                    with Cluster("AZ-B (10.0.12.0/24)"):
                        # Database
                        with Cluster("RDS Multi-AZ"):
                            rds_primary = RDS("PostgreSQL\nPrimary")
                            rds_standby = RDS("PostgreSQL\nStandby")
                
                # Security Groups
                with Cluster("Security"):
                    lambda_sg = SecurityGroup("Lambda/DB\nSecurity Group")
                    ec2_sg = SecurityGroup("EC2\nSecurity Group")
            
            # External AWS Services
            with Cluster("AWS Managed Services"):
                # API Gateway
                api_gateway = APIGateway("API Gateway\nREST API")
                
                # Cognito
                cognito = Cognito("Cognito\nUser Pool")
                
                # S3 Storage
                s3_bucket = S3("Icon Images\nS3 Bucket")
                
                # Secrets Manager
                secrets = SecretsManager("DB Secrets\nManager")
                
                # IAM Roles
                with Cluster("IAM Roles"):
                    lambda_role = IAMRole("Lambda\nExecution Role")
                    ec2_role = IAMRole("EC2\nInstance Role")
        
        # Connections
        users >> cloudfront
        cloudfront >> s3_bucket
        
        users >> api_gateway
        api_gateway >> Edge(label="Cognito Auth") >> cognito
        api_gateway >> Edge(label="Lambda Proxy") >> lambda_func
        
        lambda_func >> Edge(label="DB Connection") >> rds_primary
        rds_primary - Edge(label="Multi-AZ Sync", style="dashed") - rds_standby
        
        lambda_func >> Edge(label="Get Secrets") >> secrets
        ec2_instance >> Edge(label="Admin Access") >> rds_primary
        
        # VPC Endpoints connections
        lambda_func >> ssm_endpoint
        ec2_instance >> ssm_endpoint
        
        # Security associations
        lambda_func - lambda_sg
        ec2_instance - ec2_sg
        rds_primary - lambda_sg


def create_network_architecture():
    """Create detailed network architecture diagram."""
    output_dir = ensure_output_directory()
    
    with Diagram(
        "My Beer Log - Network Architecture",
        filename=f"{output_dir}/beer_log_network_architecture",
        show=False,
        direction="TB",
        graph_attr={
            "fontsize": "45",
            "bgcolor": "white",
            "pad": "1.0"
        }
    ):
        with Cluster("VPC (10.0.0.0/16)"):
            igw = InternetGateway("Internet Gateway")
            
            with Cluster("Availability Zone A"):
                with Cluster("Public Subnet A\n(10.0.1.0/24)"):
                    public_rt_a = General("Public Route Table")
                    s3_gateway = VPCEndpoint("S3 Gateway\nEndpoint")
                
                with Cluster("Private Subnet A\n(10.0.11.0/24)"):
                    private_rt_a = General("Private Route Table")
                    lambda_a = Lambda("Lambda Function")
                    ec2_a = EC2("EC2 Instance")
                    
                    # Interface Endpoints
                    ssm_endpoint_a = VPCEndpoint("SSM")
                    ssmmsg_endpoint_a = VPCEndpoint("SSM Messages")
                    ec2msg_endpoint_a = VPCEndpoint("EC2 Messages")
            
            with Cluster("Availability Zone B"):
                with Cluster("Public Subnet B\n(10.0.2.0/24)"):
                    public_rt_b = General("Public Route Table")
                
                with Cluster("Private Subnet B\n(10.0.12.0/24)"):
                    private_rt_b = General("Private Route Table")
                    rds_primary = RDS("RDS Primary")
                    rds_standby = RDS("RDS Standby")
        
        # Route connections
        igw >> Edge(label="0.0.0.0/0") >> public_rt_a
        igw >> Edge(label="0.0.0.0/0") >> public_rt_b
        
        # VPC Endpoint connections
        lambda_a >> ssm_endpoint_a
        lambda_a >> ssmmsg_endpoint_a
        ec2_a >> ec2msg_endpoint_a
        
        # Database connections
        lambda_a >> Edge(label="DB Access") >> rds_primary
        ec2_a >> Edge(label="Admin Access") >> rds_primary
        rds_primary - Edge(label="Multi-AZ", style="dashed") - rds_standby


def create_security_architecture():
    """Create security and access control diagram."""
    output_dir = ensure_output_directory()
    
    with Diagram(
        "My Beer Log - Security Architecture",
        filename=f"{output_dir}/beer_log_security_architecture",
        show=False,
        direction="LR",
        graph_attr={
            "fontsize": "45",
            "bgcolor": "white",
            "pad": "1.0"
        }
    ):
        # External user
        user = General("Application User")
        
        with Cluster("Authentication & Authorization"):
            cognito = Cognito("Cognito User Pool")
            api_gateway = APIGateway("API Gateway\nwith Cognito Authorizer")
        
        with Cluster("VPC Security"):
            with Cluster("Security Groups"):
                lambda_sg = SecurityGroup("Lambda/DB SG\n- Port 5432 (VPC only)\n- HTTPS outbound")
                ec2_sg = SecurityGroup("EC2 SG\n- HTTPS (VPC only)\n- Outbound all")
            
            with Cluster("IAM Roles & Policies"):
                lambda_role = IAMRole("Lambda Role\n- VPC access\n- Logs\n- Secrets access")
                ec2_role = IAMRole("EC2 Role\n- SSM access\n- CloudWatch\n- S3 read-only")
        
        with Cluster("Data Protection"):
            secrets = SecretsManager("Secrets Manager\n- DB credentials\n- Auto-rotation")
            s3_encrypted = S3("S3 Bucket\n- AES256 encryption\n- Private access only")
            
        with Cluster("Compute Resources"):
            lambda_func = Lambda("Lambda Function")
            ec2_instance = EC2("EC2 Instance")
            rds_db = RDS("RDS PostgreSQL\n- Encrypted storage\n- Private subnet only")
        
        # Security flow
        user >> Edge(label="JWT Token") >> cognito
        cognito >> Edge(label="Verified Identity") >> api_gateway
        api_gateway >> Edge(label="Authorized Request") >> lambda_func
        
        # IAM associations
        lambda_func - lambda_role
        ec2_instance - ec2_role
        
        # Security Group associations
        lambda_func - lambda_sg
        ec2_instance - ec2_sg
        rds_db - lambda_sg
        
        # Secrets access
        lambda_func >> Edge(label="Get DB Credentials") >> secrets
        secrets >> Edge(label="Secure Connection") >> rds_db


def create_data_flow_architecture():
    """Create data flow and API architecture diagram."""
    output_dir = ensure_output_directory()
    
    with Diagram(
        "My Beer Log - Data Flow Architecture",
        filename=f"{output_dir}/beer_log_data_flow_architecture",
        show=False,
        direction="TB",
        graph_attr={
            "fontsize": "45",
            "bgcolor": "white",
            "pad": "1.0"
        }
    ):
        # Client applications
        with Cluster("Client Applications"):
            web_app = General("Next.js Web App\n(AWS Amplify)")
            mobile_app = General("Mobile App\n(Future)")
        
        # API Layer
        with Cluster("API Layer"):
            api_gateway = APIGateway("API Gateway")
            cognito_auth = Cognito("Cognito Authorizer")
        
        # Application Layer
        with Cluster("Application Layer"):
            lambda_func = Lambda("Go Lambda Function\n(Beego Framework)")
            
            with Cluster("Business Logic"):
                brewery_service = General("Brewery\nUse Cases")
                user_service = General("User Profile\nUse Cases")
                visit_service = General("Visit\nUse Cases")
        
        # Data Layer
        with Cluster("Data Layer"):
            with Cluster("Database"):
                rds_db = RDS("PostgreSQL RDS\n- User Profiles\n- Breweries\n- Visits")
            
            with Cluster("File Storage"):
                s3_storage = S3("S3 Bucket\n- Brewery Icons\n- User Images")
                cloudfront_cdn = CloudFront("CloudFront CDN\n- Image Delivery")
        
        # External Services
        with Cluster("External APIs"):
            maps_api = General("Maps API\n(GPS Services)")
        
        # Data flow connections
        web_app >> Edge(label="HTTPS Requests") >> api_gateway
        mobile_app >> Edge(label="HTTPS Requests") >> api_gateway
        
        api_gateway >> Edge(label="Auth Check") >> cognito_auth
        api_gateway >> Edge(label="Proxy Request") >> lambda_func
        
        lambda_func >> brewery_service
        lambda_func >> user_service
        lambda_func >> visit_service
        
        brewery_service >> Edge(label="CRUD Operations") >> rds_db
        user_service >> Edge(label="CRUD Operations") >> rds_db
        visit_service >> Edge(label="CRUD Operations") >> rds_db
        
        lambda_func >> Edge(label="Image Upload") >> s3_storage
        s3_storage >> Edge(label="CDN Distribution") >> cloudfront_cdn
        cloudfront_cdn >> Edge(label="Optimized Delivery") >> web_app
        
        lambda_func >> Edge(label="Location Services") >> maps_api


def main():
    """Generate all infrastructure diagrams."""
    print("Generating My Beer Log AWS Infrastructure Diagrams...")
    
    try:
        print("1. Creating overall architecture diagram...")
        create_overall_architecture()
        
        print("2. Creating network architecture diagram...")
        create_network_architecture()
        
        print("3. Creating security architecture diagram...")
        create_security_architecture()
        
        print("4. Creating data flow architecture diagram...")
        create_data_flow_architecture()
        
        print("\nDiagrams generated successfully!")
        print("Output location: docs/architect/diagrams/")
        print("\nGenerated files:")
        print("- beer_log_overall_architecture.png")
        print("- beer_log_network_architecture.png") 
        print("- beer_log_security_architecture.png")
        print("- beer_log_data_flow_architecture.png")
        
    except Exception as e:
        print(f"Error generating diagrams: {e}")
        print("Please ensure you have installed required dependencies:")
        print("pip install diagrams graphviz")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())