#!/usr/bin/env python3
"""
Local development server for SeeWrite AI
This allows testing the frontend without deploying to AWS Lambda
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sys
import os
import base64
import json

# Add backend utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from bedrock_client import BedrockClient
from polly_client import PollyClient
from image_processor import ImageProcessor

app = Flask(__name__)
CORS(app)

# Initialize clients
bedrock_client = BedrockClient()
polly_client = PollyClient()
image_processor = ImageProcessor()

@app.route('/')
def index():
    """Serve the main HTML file"""
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files from frontend directory"""
    return send_from_directory('frontend', filename)

@app.route('/api/process-image', methods=['POST'])
def process_image():
    """Process uploaded image and generate audio description"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Process the image
        image_result = image_processor.process_image_base64(image_base64)
        
        if not image_result['success']:
            return jsonify({'error': image_result.get('error', 'Image processing failed')}), 500
        
        # Generate detailed description using Bedrock
        detailed_description = bedrock_client.generate_educational_description(
            image_result['description']
        )
        
        # Convert to speech using Polly
        audio_result = polly_client.synthesize_speech(detailed_description)
        
        if not audio_result['success']:
            return jsonify({'error': 'Audio generation failed'}), 500
        
        # Return successful response
        return jsonify({
            'success': True,
            'description': detailed_description,
            'audio_base64': audio_result['audio_base64'],
            'content_type': audio_result['content_type'],
            'detected_objects': image_result.get('objects', []),
            'extracted_text': image_result.get('text', '')
        })
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle follow-up questions about the content"""
    try:
        data = request.get_json()
        question = data.get('question')
        original_description = data.get('original_description', '')
        
        if not question:
            return jsonify({'error': 'No question provided'}), 400
        
        # Generate answer using Bedrock
        answer = bedrock_client.answer_followup_question(
            original_description, 
            question
        )
        
        # Convert answer to speech using Polly
        audio_result = polly_client.synthesize_speech(answer)
        
        if not audio_result['success']:
            return jsonify({'error': 'Audio generation failed'}), 500
        
        # Return successful response
        return jsonify({
            'success': True,
            'answer': answer,
            'audio_base64': audio_result['audio_base64'],
            'content_type': audio_result['content_type']
        })
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'SeeWrite AI local server is running'})

if __name__ == '__main__':
    print("🚀 Starting SeeWrite AI Local Development Server")
    print("=" * 50)
    print("Frontend: http://localhost:5000")
    print("API Endpoints:")
    print("  - POST /api/process-image")
    print("  - POST /api/chat")
    print("  - GET /health")
    print("=" * 50)
    
    app.run(debug=True, host='0.0.0.0', port=5000)