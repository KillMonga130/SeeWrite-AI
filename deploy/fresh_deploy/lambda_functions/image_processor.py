import json
import sys
import os

# Add utils to path for Lambda
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))

from bedrock_client import BedrockClient
from polly_client import PollyClient
from image_processor import ImageProcessor

def lambda_handler(event, context):
    """
    Lambda function to process uploaded images and generate audio descriptions
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        image_base64 = body.get('image')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'No image provided'
                })
            }
        
        # Initialize clients
        image_processor = ImageProcessor()
        bedrock_client = BedrockClient()
        polly_client = PollyClient()
        
        # Process the image
        image_result = image_processor.process_image_base64(image_base64)
        
        if not image_result['success']:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': image_result.get('error', 'Image processing failed')
                })
            }
        
        # Generate detailed description using Bedrock
        detailed_description = bedrock_client.generate_educational_description(
            image_result['description']
        )
        
        # Convert to speech using Polly
        audio_result = polly_client.synthesize_speech(detailed_description)
        
        if not audio_result['success']:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'Audio generation failed'
                })
            }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'success': True,
                'description': detailed_description,
                'audio_base64': audio_result['audio_base64'],
                'content_type': audio_result['content_type'],
                'detected_objects': image_result.get('objects', []),
                'extracted_text': image_result.get('text', '')
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({
                'error': f'Internal server error: {str(e)}'
            })
        }