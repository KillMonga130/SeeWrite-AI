#!/bin/bash

# SeeWrite AI - AWS Lambda Deployment Script
# This script packages and deploys Lambda functions to AWS

set -e

echo "🚀 SeeWrite AI - Lambda Deployment Script"
echo "=========================================="

# Configuration
REGION="us-east-1"
FUNCTION_TIMEOUT=60
MEMORY_SIZE=512

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Function to create IAM role for Lambda
create_lambda_role() {
    local role_name="SeeWriteAI-Lambda-Role"
    
    echo "📋 Creating IAM role: $role_name"
    
    # Trust policy for Lambda
    cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

    # Create role if it doesn't exist
    if ! aws iam get-role --role-name $role_name &> /dev/null; then
        aws iam create-role \
            --role-name $role_name \
            --assume-role-policy-document file://trust-policy.json
        
        echo -e "${GREEN}✅ IAM role created${NC}"
    else
        echo -e "${YELLOW}⚠️  IAM role already exists${NC}"
    fi
    
    # Attach policies
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
    
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess
    
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn arn:aws:iam::aws:policy/AmazonPollyFullAccess
    
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn arn:aws:iam::aws:policy/AmazonRekognitionReadOnlyAccess
    
    aws iam attach-role-policy \
        --role-name $role_name \
        --policy-arn arn:aws:iam::aws:policy/AmazonTextractFullAccess
    
    # Clean up
    rm trust-policy.json
    
    # Get role ARN
    ROLE_ARN=$(aws iam get-role --role-name $role_name --query 'Role.Arn' --output text)
    echo "Role ARN: $ROLE_ARN"
}

# Function to package Lambda function
package_lambda() {
    local function_name=$1
    local zip_file="${function_name}.zip"
    
    echo "📦 Packaging $function_name..."
    
    # Create temporary directory
    temp_dir=$(mktemp -d)
    
    # Copy function code
    cp lambda_functions/${function_name}.py $temp_dir/
    cp -r utils/ $temp_dir/
    
    # Install dependencies
    cd $temp_dir
    pip install boto3 Pillow -t .
    
    # Create zip file
    zip -r $zip_file . -x "*.pyc" "__pycache__/*"
    
    # Move zip back to original directory
    mv $zip_file $OLDPWD/
    
    # Clean up
    cd $OLDPWD
    rm -rf $temp_dir
    
    echo -e "${GREEN}✅ Package created: $zip_file${NC}"
}

# Function to deploy Lambda function
deploy_lambda() {
    local function_name=$1
    local zip_file="${function_name}.zip"
    local handler="${function_name}.lambda_handler"
    
    echo "🚀 Deploying $function_name..."
    
    # Check if function exists
    if aws lambda get-function --function-name $function_name &> /dev/null; then
        echo "Updating existing function..."
        aws lambda update-function-code \
            --function-name $function_name \
            --zip-file fileb://$zip_file
        
        aws lambda update-function-configuration \
            --function-name $function_name \
            --timeout $FUNCTION_TIMEOUT \
            --memory-size $MEMORY_SIZE
    else
        echo "Creating new function..."
        aws lambda create-function \
            --function-name $function_name \
            --runtime python3.9 \
            --role $ROLE_ARN \
            --handler $handler \
            --zip-file fileb://$zip_file \
            --timeout $FUNCTION_TIMEOUT \
            --memory-size $MEMORY_SIZE \
            --region $REGION
    fi
    
    echo -e "${GREEN}✅ Function deployed: $function_name${NC}"
    
    # Clean up zip file
    rm $zip_file
}

# Function to create API Gateway
create_api_gateway() {
    echo "🌐 Creating API Gateway..."
    
    local api_name="SeeWriteAI-API"
    
    # Create REST API
    API_ID=$(aws apigateway create-rest-api \
        --name $api_name \
        --description "SeeWrite AI REST API" \
        --query 'id' --output text 2>/dev/null || \
        aws apigateway get-rest-apis \
        --query "items[?name=='$api_name'].id" --output text)
    
    if [ -z "$API_ID" ]; then
        echo -e "${RED}❌ Failed to create/find API Gateway${NC}"
        return 1
    fi
    
    echo "API ID: $API_ID"
    
    # Get root resource ID
    ROOT_RESOURCE_ID=$(aws apigateway get-resources \
        --rest-api-id $API_ID \
        --query 'items[?path==`/`].id' --output text)
    
    # Create resources and methods (simplified for hackathon)
    echo "📝 API Gateway setup complete (manual configuration required)"
    echo "   API ID: $API_ID"
    echo "   Root Resource ID: $ROOT_RESOURCE_ID"
    echo ""
    echo "Manual steps required:"
    echo "1. Go to AWS API Gateway console"
    echo "2. Create resources: /process-image and /chat"
    echo "3. Add POST methods to each resource"
    echo "4. Configure Lambda integration"
    echo "5. Enable CORS"
    echo "6. Deploy API"
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    
    # Create IAM role
    create_lambda_role
    
    # Wait for role to be available
    echo "⏳ Waiting for IAM role to be available..."
    sleep 10
    
    # Deploy Lambda functions
    functions=("image_processor" "q_chat")
    
    for func in "${functions[@]}"; do
        package_lambda $func
        deploy_lambda $func
    done
    
    # Create API Gateway
    create_api_gateway
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure API Gateway manually (see instructions above)"
    echo "2. Update frontend/script.js with your API Gateway URLs"
    echo "3. Test the application"
    echo ""
    echo "Lambda Functions deployed:"
    for func in "${functions[@]}"; do
        echo "  - $func"
    done
}

# Run main function
main