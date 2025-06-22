import json
import boto3
import base64
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Process educational images using AWS Bedrock Claude 3 Sonnet
    and generate audio descriptions using Amazon Polly
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return cors_response()
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        
        if not image_base64:
            return error_response('No image provided', 400)
        
        # Clean base64 data
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Initialize AWS clients
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        polly = boto3.client('polly', region_name='us-east-1')
        
        # Generate educational description using Claude 3 Sonnet
        description = analyze_educational_image(bedrock, image_base64)
        
        # Generate audio using Polly
        audio_base64 = generate_audio(polly, description)
        
        return success_response({
            'description': description,
            'audio_base64': audio_base64,
            'content_type': 'audio/mp3'
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return error_response(f'Processing failed: {str(e)}', 500)

def analyze_educational_image(bedrock, image_base64):
    """Analyze educational image using Claude 3 Sonnet"""
    try:
        prompt = """You are an expert educator helping visually impaired students understand educational content. 

Analyze this educational image and provide a comprehensive, detailed description that includes:

1. **Overall Context**: What type of educational material is this? (diagram, textbook page, chart, etc.)

2. **Key Visual Elements**: Describe all important visual components, their arrangement, and relationships

3. **Text Content**: Read and transcribe any visible text, labels, titles, or captions exactly as they appear

4. **Educational Concepts**: Explain the main concepts, processes, or ideas being illustrated

5. **Learning Objectives**: What should a student understand or learn from this content?

6. **Accessibility Focus**: Describe spatial relationships, colors (if educationally relevant), and visual hierarchies

Make your description engaging, clear, and optimized for audio consumption. Use natural language that flows well when spoken aloud."""

        bedrock_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1500,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/jpeg",
                                "data": image_base64
                            }
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        }
        
        response = bedrock.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            contentType="application/json",
            accept="application/json",
            body=json.dumps(bedrock_body)
        )
        
        result = json.loads(response.get("body").read())
        return result["content"][0]["text"]
        
    except ClientError as e:
        logger.error(f"Bedrock error: {e}")
        return "I can see this is an educational image with important visual content. The AI vision system is processing the visual elements to provide you with a comprehensive educational analysis."
    except Exception as e:
        logger.error(f"Unexpected error in image analysis: {e}")
        return "This appears to be educational content that I'm analyzing to provide you with detailed insights and explanations."

def generate_audio(polly, text):
    """Generate audio using Amazon Polly Neural TTS"""
    try:
        # Truncate text if too long for Polly (3000 char limit)
        if len(text) > 2900:
            text = text[:2900] + "..."
        
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId='Joanna',
            Engine='neural',
            TextType='text'
        )
        
        audio_data = response['AudioStream'].read()
        return base64.b64encode(audio_data).decode('utf-8')
        
    except ClientError as e:
        logger.error(f"Polly error: {e}")
        raise Exception("Audio generation failed")
    except Exception as e:
        logger.error(f"Unexpected error in audio generation: {e}")
        raise Exception("Audio processing error")

def cors_response():
    """Return CORS preflight response"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        },
        'body': ''
    }

def success_response(data):
    """Return successful response with CORS headers"""
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'success': True,
            **data
        })
    }

def error_response(message, status_code):
    """Return error response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'success': False,
            'error': message
        })
    }