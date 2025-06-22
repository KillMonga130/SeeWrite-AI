import json
import boto3
import base64
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Generate audio from text using Amazon Polly Neural TTS
    Standalone audio generation service for on-demand audio creation
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return cors_response()
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        text = body.get('text')
        voice_id = body.get('voice_id', 'Joanna')
        
        if not text:
            return error_response('No text provided', 400)
        
        # Validate and truncate text length (Polly has limits)
        if len(text) > 2900:
            text = text[:2900] + "..."
        
        # Initialize Polly client
        polly = boto3.client('polly', region_name='us-east-1')
        
        # Generate audio using Polly Neural TTS
        audio_base64 = generate_neural_audio(polly, text, voice_id)
        
        return success_response({
            'audio_base64': audio_base64,
            'content_type': 'audio/mp3',
            'voice_id': voice_id,
            'text_length': len(text)
        })
        
    except Exception as e:
        logger.error(f"Error generating audio: {str(e)}")
        return error_response(f'Audio generation failed: {str(e)}', 500)

def generate_neural_audio(polly, text, voice_id):
    """Generate high-quality audio using Amazon Polly Neural TTS"""
    try:
        # Validate voice ID
        valid_neural_voices = [
            'Joanna', 'Matthew', 'Amy', 'Emma', 'Brian', 'Olivia', 
            'Aria', 'Ayanda', 'Ivy', 'Kendra', 'Kimberly', 'Salli', 
            'Joey', 'Justin', 'Kevin', 'Ruth'
        ]
        
        if voice_id not in valid_neural_voices:
            voice_id = 'Joanna'  # Default fallback
        
        # Synthesize speech with optimal settings for educational content
        response = polly.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id,
            Engine='neural',
            TextType='text',
            SampleRate='24000'  # High quality for educational content
        )
        
        # Read audio stream and encode to base64
        audio_data = response['AudioStream'].read()
        return base64.b64encode(audio_data).decode('utf-8')
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        logger.error(f"Polly ClientError: {error_code} - {e}")
        
        if error_code == 'TextLengthExceededException':
            raise Exception("Text is too long for audio generation")
        elif error_code == 'InvalidVoiceId':
            raise Exception(f"Invalid voice ID: {voice_id}")
        elif error_code == 'ServiceFailureException':
            raise Exception("Polly service temporarily unavailable")
        else:
            raise Exception(f"Polly error: {error_code}")
            
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