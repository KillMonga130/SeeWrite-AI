#!/bin/bash

# SeeWrite AI - Package Creation Script
# Creates a complete deployment package for AWS Amplify or manual deployment

set -e

# Configuration
PROJECT_NAME="seewrite-ai"
PACKAGE_NAME="seewrite-ai-complete"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Create package directory
create_package_structure() {
    log_info "Creating package structure..."
    
    # Create main package directory
    mkdir -p "${PACKAGE_NAME}"
    
    # Copy frontend files
    log_info "Copying frontend files..."
    cp -r frontend/ "${PACKAGE_NAME}/"
    
    # Copy backend files
    log_info "Copying backend files..."
    mkdir -p "${PACKAGE_NAME}/lambda_functions"
    cp backend/*.py "${PACKAGE_NAME}/lambda_functions/"
    
    # Copy infrastructure
    log_info "Copying infrastructure files..."
    cp -r infrastructure/ "${PACKAGE_NAME}/"
    
    # Copy documentation and scripts
    log_info "Copying documentation and scripts..."
    cp README.md "${PACKAGE_NAME}/"
    cp requirements.txt "${PACKAGE_NAME}/"
    cp deploy.sh "${PACKAGE_NAME}/"
    chmod +x "${PACKAGE_NAME}/deploy.sh"
    
    log_success "Package structure created"
}

# Create Amplify-specific files
create_amplify_files() {
    log_info "Creating Amplify configuration files..."
    
    # Create amplify.yml for build configuration
    cat > "${PACKAGE_NAME}/amplify.yml" << 'EOF'
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - echo "SeeWrite AI - Amplify Build Starting"
    build:
      commands:
        - echo "Building SeeWrite AI frontend"
        - ls -la
    postBuild:
      commands:
        - echo "SeeWrite AI build completed"
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
  cache:
    paths: []
EOF

    # Create _redirects for SPA routing
    cat > "${PACKAGE_NAME}/_redirects" << 'EOF'
# SeeWrite AI - Redirects for single page application
/*    /index.html   200
EOF

    log_success "Amplify configuration files created"
}

# Create deployment instructions
create_deployment_guide() {
    log_info "Creating deployment guide..."
    
    cat > "${PACKAGE_NAME}/DEPLOYMENT.md" << 'EOF'
# SeeWrite AI - Deployment Guide

## Quick Deployment Options

### Option 1: AWS Amplify (Recommended for Frontend)

1. **Upload to Amplify**:
   ```bash
   # Zip the entire package
   zip -r seewrite-ai-amplify.zip frontend/ amplify.yml _redirects
   ```

2. **Deploy Backend Separately**:
   ```bash
   # Deploy Lambda functions and API Gateway
   ./deploy.sh
   ```

3. **Update Frontend Configuration**:
   - After backend deployment, update API URLs in `frontend/script.js`
   - Redeploy to Amplify

### Option 2: Complete AWS Deployment

1. **Run Full Deployment**:
   ```bash
   ./deploy.sh
   ```

2. **Optional S3 Frontend Hosting**:
   - Script will offer S3 static website hosting option

### Option 3: Manual Deployment

1. **Deploy Infrastructure**:
   ```bash
   aws cloudformation deploy --template-file infrastructure/cloudformation.yaml --stack-name seewrite-ai-prod --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Package and Deploy Lambda Functions**:
   ```bash
   # Package each function
   cd lambda_functions
   zip image-processor.zip image_processor.py
   zip q-chat.zip q_chat.py
   zip audio-generator.zip audio_generator.py
   
   # Deploy to Lambda
   aws lambda update-function-code --function-name seewrite-ai-image-processor-prod --zip-file fileb://image-processor.zip
   aws lambda update-function-code --function-name seewrite-ai-q-chat-prod --zip-file fileb://q-chat.zip
   aws lambda update-function-code --function-name seewrite-ai-audio-generator-prod --zip-file fileb://audio-generator.zip
   ```

3. **Deploy Frontend**:
   - Upload `frontend/` contents to your web hosting service
   - Update API URLs in `script.js`

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Access to AWS Bedrock (Claude 3 Sonnet model enabled)

## Configuration

1. **Enable Bedrock Models**:
   - Go to AWS Bedrock console
   - Enable Claude 3 Sonnet model access
   - Ensure your region supports Bedrock

2. **Set Permissions**:
   - Ensure your AWS user/role has permissions for:
     - Lambda function creation and updates
     - API Gateway management
     - CloudFormation stack operations
     - Bedrock model invocation
     - Polly speech synthesis

## Testing

After deployment:
1. Test image upload and processing
2. Verify audio generation works
3. Test Q&A functionality
4. Check CORS configuration for cross-origin requests

## Troubleshooting

- **Bedrock Access Issues**: Ensure model access is enabled in your AWS region
- **CORS Errors**: Check API Gateway CORS configuration
- **Lambda Timeouts**: Increase timeout values if processing large images
- **Audio Issues**: Verify Polly permissions and supported voice IDs

## Support

For issues:
1. Check CloudWatch logs for Lambda functions
2. Verify AWS service quotas
3. Ensure all prerequisites are met
EOF

    log_success "Deployment guide created"
}

# Create the final package
create_final_package() {
    log_info "Creating final deployment package..."
    
    # Create zip file
    FINAL_PACKAGE="${PACKAGE_NAME}_${TIMESTAMP}.zip"
    zip -r "$FINAL_PACKAGE" "$PACKAGE_NAME"
    
    # Create Amplify-specific package
    AMPLIFY_PACKAGE="seewrite-ai-amplify_${TIMESTAMP}.zip"
    cd "$PACKAGE_NAME"
    zip -r "../$AMPLIFY_PACKAGE" frontend/ amplify.yml _redirects
    cd ..
    
    log_success "Packages created:"
    echo "  - Complete package: $FINAL_PACKAGE"
    echo "  - Amplify package: $AMPLIFY_PACKAGE"
}

# Main function
main() {
    echo "========================================="
    echo "   SeeWrite AI - Package Creator"
    echo "========================================="
    echo
    
    # Clean up any existing package
    if [ -d "$PACKAGE_NAME" ]; then
        log_info "Cleaning up existing package..."
        rm -rf "$PACKAGE_NAME"
    fi
    
    # Create package
    create_package_structure
    create_amplify_files
    create_deployment_guide
    create_final_package
    
    # Clean up temporary directory
    rm -rf "$PACKAGE_NAME"
    
    echo
    log_success "🎉 SeeWrite AI packages created successfully!"
    echo
    echo "Next steps:"
    echo "1. For Amplify deployment: Use $AMPLIFY_PACKAGE"
    echo "2. For complete AWS deployment: Extract $FINAL_PACKAGE and run ./deploy.sh"
    echo "3. Read DEPLOYMENT.md in the extracted package for detailed instructions"
    echo
}

# Run main function
main "$@"