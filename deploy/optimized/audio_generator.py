import json
import boto3
import base64
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            },
            'body': ''
        }
    
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        text = body.get('text')
        
        if not text:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'No text provided'})
            }
        
        # Initialize Polly client
        polly = boto3.client('polly', region_name='us-east-1')
        
        # Generate audio using Polly
        try:
            polly_response = polly.synthesize_speech(
                Text=text,
                OutputFormat='mp3',
                VoiceId='Joanna',
                Engine='neural'
            )
            
            audio_data = polly_response['AudioStream'].read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Polly error: {e}")
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Audio generation failed'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'audio_base64': audio_base64,
                'content_type': 'audio/mp3'
            })
        }
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }