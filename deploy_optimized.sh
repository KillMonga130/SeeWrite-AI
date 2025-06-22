#!/bin/bash

# Deploy optimized SeeWrite AI with separate text and audio processing

echo "🚀 Deploying Optimized SeeWrite AI..."

# Create deployment directory
mkdir -p deploy/optimized

# Copy optimized Lambda functions
cp backend/lambda_functions/image_processor_optimized.py deploy/optimized/
cp backend/lambda_functions/q_chat_optimized.py deploy/optimized/
cp backend/lambda_functions/audio_generator.py deploy/optimized/

# Copy utilities
cp -r backend/utils deploy/optimized/

# Package optimized image processor
echo "📦 Packaging optimized image processor..."
cd deploy/optimized
zip -r image_processor_optimized.zip image_processor_optimized.py utils/

# Package optimized Q&A chat
echo "📦 Packaging optimized Q&A chat..."
zip -r q_chat_optimized.zip q_chat_optimized.py utils/

# Package audio generator
echo "📦 Packaging audio generator..."
zip -r audio_generator.zip audio_generator.py utils/

# Package optimized frontend
echo "📦 Packaging optimized frontend..."
cd ../../frontend
zip -r ../deploy/optimized/frontend_optimized.zip .

cd ../deploy/optimized

echo "✅ Optimized packages created:"
echo "   - image_processor_optimized.zip (fast text response)"
echo "   - q_chat_optimized.zip (fast Q&A response)"
echo "   - audio_generator.zip (on-demand audio)"
echo "   - frontend_optimized.zip (streaming UI)"

echo ""
echo "🔧 Next steps:"
echo "1. Deploy these Lambda functions to AWS"
echo "2. Update API Gateway endpoints"
echo "3. Deploy frontend to Amplify"
echo ""
echo "💡 Benefits of optimized version:"
echo "   ✓ Faster text responses (no audio blocking)"
echo "   ✓ Streaming text display with animations"
echo "   ✓ On-demand audio generation"
echo "   ✓ Better user experience"