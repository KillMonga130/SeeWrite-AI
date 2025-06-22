# SeeWrite AI - Complete Setup Guide

## 🚀 Quick Deploy on Any PC

### Prerequisites
1. **AWS Account** with admin permissions
2. **AWS CLI** installed and configured (`aws configure`)
3. **Bedrock Access** - Enable Claude 3 Sonnet model in AWS Console

### One-Command Deploy
```bash
# Extract and deploy
unzip seewrite-ai-complete.zip
cd seewrite-ai-complete/
./deploy.sh
```

### Manual Steps (if needed)
```bash
# 1. Deploy infrastructure
aws cloudformation deploy --template-file cloudformation.yaml --stack-name seewrite-ai-prod --capabilities CAPABILITY_NAMED_IAM

# 2. Package Lambda functions
cd lambda_functions
zip image-processor.zip image_processor.py
zip q-chat.zip q_chat.py  
zip audio-generator.zip audio_generator.py

# 3. Update Lambda functions
aws lambda update-function-code --function-name seewrite-ai-image-processor-prod --zip-file fileb://image-processor.zip
aws lambda update-function-code --function-name seewrite-ai-q-chat-prod --zip-file fileb://q-chat.zip
aws lambda update-function-code --function-name seewrite-ai-audio-generator-prod --zip-file fileb://audio-generator.zip

# 4. Get API URL
aws cloudformation describe-stacks --stack-name seewrite-ai-prod --query 'Stacks[0].Outputs[?OutputKey==`APIGatewayURL`].OutputValue' --output text

# 5. Update frontend script.js with the API URL
```

### Enable Bedrock Models
1. Go to AWS Bedrock Console
2. Navigate to "Model access"
3. Enable "Claude 3 Sonnet" model
4. Wait for approval (usually instant)

### Test Deployment
- Upload educational image
- Verify AI analysis works
- Test Q&A functionality
- Check audio generation

## 🔧 Fixes Applied
- ✅ Polly text length limit (2900 chars)
- ✅ Proper error handling
- ✅ CORS configuration
- ✅ CloudWatch logging