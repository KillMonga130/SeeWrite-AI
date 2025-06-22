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
