# SeeWrite AI - Quick Start Guide

## 🚀 Get Started in 15 Minutes

This guide will help you get SeeWrite AI running quickly for the hackathon demo.

### Prerequisites ✅

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Python 3.8+** installed
4. **Basic terminal/command line knowledge**

### Step 1: AWS Setup (5 minutes)

```bash
# Configure AWS credentials
aws configure

# Test your credentials
aws sts get-caller-identity
```

**Required AWS Permissions:**
- Amazon Bedrock (InvokeModel)
- Amazon Polly (SynthesizeSpeech)
- Amazon Rekognition (DetectLabels)
- Amazon Textract (DetectDocumentText)
- AWS Lambda (CreateFunction, UpdateFunction)
- IAM (CreateRole, AttachRolePolicy)

### Step 2: Install Dependencies (2 minutes)

```bash
# Navigate to project directory
cd SeeWrite-AI

# Install Python dependencies
pip install -r requirements.txt
```

### Step 3: Test Local Components (3 minutes)

```bash
# Run local tests to verify AWS services work
python test_local.py
```

**Expected Output:**
- ✅ Bedrock test passes
- ✅ Polly test passes  
- ✅ Image processor test passes
- ✅ Full pipeline test passes

### Step 4: Deploy to AWS (5 minutes)

```bash
# Deploy Lambda functions
cd backend
./deploy.sh
```

**What this does:**
- Creates IAM role with necessary permissions
- Packages Lambda functions with dependencies
- Deploys to AWS Lambda
- Sets up basic API Gateway structure

### Step 5: Configure API Gateway (Manual - 5 minutes)

After deployment, you need to manually configure API Gateway:

1. **Go to AWS API Gateway Console**
2. **Find your API:** "SeeWriteAI-API"
3. **Create Resources:**
   - `/process-image` (POST method)
   - `/chat` (POST method)
4. **Configure Lambda Integration:**
   - Link `/process-image` to `image_processor` function
   - Link `/chat` to `q_chat` function
5. **Enable CORS** on both resources
6. **Deploy API** to a stage (e.g., "prod")
7. **Copy the Invoke URL**

### Step 6: Update Frontend (1 minute)

Edit `frontend/script.js` and update the API URLs:

```javascript
const API_CONFIG = {
    IMAGE_PROCESSOR_URL: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/process-image',
    CHAT_URL: 'https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/chat'
};
```

### Step 7: Test the Application

```bash
# Start the frontend server
cd frontend
npm start
# or
python -m http.server 8000
```

Visit `http://localhost:8000` and test:

1. **Upload an image** (diagram, chart, etc.)
2. **Click "Analyze Image"**
3. **Listen to the generated description**
4. **Ask follow-up questions**

## 🎯 Demo Scenarios

### Biology Diagram
- Upload a heart diagram
- Expected: Detailed anatomical description
- Ask: "What does the left ventricle do?"

### Math Graph
- Upload a function graph
- Expected: Mathematical description
- Ask: "Where is the vertex?"

### Historical Image
- Upload a historical photo
- Expected: Contextual description
- Ask: "What time period is this from?"

## 🐛 Troubleshooting

### Common Issues:

**"Bedrock test failed"**
- Check if Bedrock is available in your region (us-east-1 recommended)
- Verify model access permissions

**"Audio generation failed"**
- Check Polly permissions
- Verify region configuration

**"Network error in frontend"**
- Update API URLs in script.js
- Check CORS configuration
- Verify API Gateway deployment

**"Lambda timeout"**
- Increase timeout in deploy.sh (currently 60s)
- Check CloudWatch logs for errors

### Getting Help:

1. **Check CloudWatch Logs** for Lambda function errors
2. **Test individual components** with `python test_local.py`
3. **Verify AWS permissions** with AWS IAM Policy Simulator

## 📊 Success Metrics

Your demo is ready when:
- ✅ Image uploads successfully
- ✅ Audio description plays automatically
- ✅ Follow-up questions work
- ✅ Audio responses are generated
- ✅ No console errors in browser

## 🎬 Recording Your Demo

1. **Prepare 2-3 test images** (different types)
2. **Script your narration** (5 minutes max)
3. **Show the problem** → **Demonstrate the solution** → **Highlight impact**
4. **Include technical details** about AWS services used

Good luck with your hackathon submission! 🚀