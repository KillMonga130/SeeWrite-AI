#!/bin/bash

# SeeWrite AI - Complete Deployment Script
# This script deploys the entire SeeWrite AI application to AWS

set -e

# Configuration
PROJECT_NAME="seewrite-ai"
ENVIRONMENT="prod"
AWS_REGION="us-east-1"
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured. Please run 'aws configure'."
        exit 1
    fi
    
    # Check if Bedrock model access is enabled
    log_info "Checking Bedrock model access..."
    if ! aws bedrock list-foundation-models --region $AWS_REGION &> /dev/null; then
        log_warning "Cannot verify Bedrock access. Ensure Claude 3 Sonnet model is enabled in your AWS account."
    fi
    
    log_success "Prerequisites check completed"
}

# Package Lambda functions
package_lambda_functions() {
    log_info "Packaging Lambda functions..."
    
    # Create deployment directory
    mkdir -p deployment/lambda-packages
    
    # Package Image Processor
    log_info "Packaging Image Processor function..."
    cd backend
    zip -r ../deployment/lambda-packages/image-processor.zip image_processor.py
    cd ..
    
    # Package Q&A Chat
    log_info "Packaging Q&A Chat function..."
    cd backend
    zip -r ../deployment/lambda-packages/q-chat.zip q_chat.py
    cd ..
    
    # Package Audio Generator
    log_info "Packaging Audio Generator function..."
    cd backend
    zip -r ../deployment/lambda-packages/audio-generator.zip audio_generator.py
    cd ..
    
    log_success "Lambda functions packaged successfully"
}

# Deploy CloudFormation stack
deploy_infrastructure() {
    log_info "Deploying infrastructure with CloudFormation..."
    
    # Deploy the stack
    aws cloudformation deploy \
        --template-file infrastructure/cloudformation.yaml \
        --stack-name $STACK_NAME \
        --parameter-overrides \
            ProjectName=$PROJECT_NAME \
            Environment=$ENVIRONMENT \
        --capabilities CAPABILITY_NAMED_IAM \
        --region $AWS_REGION
    
    if [ $? -eq 0 ]; then
        log_success "Infrastructure deployed successfully"
    else
        log_error "Infrastructure deployment failed"
        exit 1
    fi
}

# Update Lambda function code
update_lambda_functions() {
    log_info "Updating Lambda function code..."
    
    # Get function names from CloudFormation outputs
    IMAGE_PROCESSOR_FUNCTION="${PROJECT_NAME}-image-processor-${ENVIRONMENT}"
    QCHAT_FUNCTION="${PROJECT_NAME}-q-chat-${ENVIRONMENT}"
    AUDIO_GENERATOR_FUNCTION="${PROJECT_NAME}-audio-generator-${ENVIRONMENT}"
    
    # Update Image Processor
    log_info "Updating Image Processor function..."
    aws lambda update-function-code \
        --function-name $IMAGE_PROCESSOR_FUNCTION \
        --zip-file fileb://deployment/lambda-packages/image-processor.zip \
        --region $AWS_REGION
    
    # Update Q&A Chat
    log_info "Updating Q&A Chat function..."
    aws lambda update-function-code \
        --function-name $QCHAT_FUNCTION \
        --zip-file fileb://deployment/lambda-packages/q-chat.zip \
        --region $AWS_REGION
    
    # Update Audio Generator
    log_info "Updating Audio Generator function..."
    aws lambda update-function-code \
        --function-name $AUDIO_GENERATOR_FUNCTION \
        --zip-file fileb://deployment/lambda-packages/audio-generator.zip \
        --region $AWS_REGION
    
    log_success "Lambda functions updated successfully"
}

# Get API Gateway URL
get_api_url() {
    log_info "Getting API Gateway URL..."
    
    API_URL=$(aws cloudformation describe-stacks \
        --stack-name $STACK_NAME \
        --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' \
        --output text \
        --region $AWS_REGION)
    
    if [ -n "$API_URL" ]; then
        log_success "API Gateway URL: $API_URL"
        
        # Update frontend configuration
        log_info "Updating frontend configuration..."
        sed -i.bak "s|https://your-api-gateway-url|$API_URL|g" frontend/script.js
        rm frontend/script.js.bak
        
        log_success "Frontend configuration updated"
    else
        log_error "Could not retrieve API Gateway URL"
        exit 1
    fi
}

# Deploy frontend to S3 (optional)
deploy_frontend() {
    read -p "Do you want to deploy frontend to S3? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deploying frontend to S3..."
        
        # Create S3 bucket for static website hosting
        BUCKET_NAME="${PROJECT_NAME}-frontend-${ENVIRONMENT}-$(date +%s)"
        
        aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
        
        # Configure bucket for static website hosting
        aws s3 website s3://$BUCKET_NAME --index-document index.html
        
        # Upload frontend files
        aws s3 sync frontend/ s3://$BUCKET_NAME --delete
        
        # Make bucket public
        aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
                }
            ]
        }'
        
        WEBSITE_URL="http://${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"
        log_success "Frontend deployed to: $WEBSITE_URL"
    else
        log_info "Skipping frontend deployment to S3"
        log_info "You can serve the frontend locally or deploy it to your preferred hosting service"
    fi
}

# Test deployment
test_deployment() {
    log_info "Testing deployment..."
    
    # Test API endpoints
    log_info "Testing API endpoints..."
    
    # Test CORS preflight
    curl -X OPTIONS "${API_URL}/process-image" \
        -H "Access-Control-Request-Method: POST" \
        -H "Access-Control-Request-Headers: Content-Type" \
        --silent --output /dev/null --write-out "CORS Test: %{http_code}\n"
    
    log_success "Basic deployment tests completed"
    log_info "Please test the full application with actual image uploads"
}

# Main deployment function
main() {
    echo "========================================="
    echo "   SeeWrite AI - Deployment Script"
    echo "========================================="
    echo
    
    log_info "Starting deployment for environment: $ENVIRONMENT"
    log_info "AWS Region: $AWS_REGION"
    echo
    
    # Run deployment steps
    check_prerequisites
    package_lambda_functions
    deploy_infrastructure
    update_lambda_functions
    get_api_url
    deploy_frontend
    test_deployment
    
    echo
    log_success "🎉 SeeWrite AI deployment completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Test the application with sample educational images"
    echo "2. Monitor CloudWatch logs for any issues"
    echo "3. Set up CloudWatch alarms for production monitoring"
    echo
    echo "API Endpoints:"
    echo "- Image Processing: ${API_URL}/process-image"
    echo "- Q&A Chat: ${API_URL}/chat"
    echo "- Audio Generation: ${API_URL}/generate-audio"
    echo
}

# Run main function
main "$@"