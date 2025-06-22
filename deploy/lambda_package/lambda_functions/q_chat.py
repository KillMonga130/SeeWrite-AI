import json
import sys
import os

# Add utils to path for Lambda
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'utils'))

from bedrock_client import BedrockClient
from polly_client import PollyClient

def lambda_handler(event, context):
    """
    Lambda function to handle follow-up questions about the content
    """
    try:
        # Parse the incoming request
        body = json.loads(event.get('body', '{}'))
        question = body.get('question')
        original_description = body.get('original_description', '')
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({
                    'error': 'No question provided'
                })
            }
        
        # Initialize clients
        bedrock_client = BedrockClient()
        polly_client = PollyClient()
        
        # Generate answer using Bedrock
        answer = bedrock_client.answer_followup_question(
            original_description, 
            question
        )
        
        # Convert answer to speech using Polly
        audio_result = polly_client.synthesize_speech(answer)
        
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
                'answer': answer,
                'audio_base64': audio_result['audio_base64'],
                'content_type': audio_result['content_type']
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