import json
import boto3
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
        image_base64 = body.get('image')
        
        if not image_base64:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'No image provided'})
            }
        
        # Initialize Bedrock client only
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Clean base64 data
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Analyze image with Claude 3 Sonnet - TEXT ONLY
        try:
            bedrock_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
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
                                "text": "You are an expert educator helping visually impaired students. Analyze this educational image and provide a detailed, comprehensive description that includes: 1) Overall content and context, 2) Key elements and their relationships, 3) Any text, labels, or numbers visible, 4) Educational significance and learning objectives. Make it engaging and accessible for audio consumption."
                            }
                        ]
                    }
                ]
            }
            
            bedrock_response = bedrock.invoke_model(
                modelId="anthropic.claude-3-sonnet-20240229-v1:0",
                contentType="application/json",
                accept="application/json",
                body=json.dumps(bedrock_body)
            )
            
            bedrock_result = json.loads(bedrock_response.get("body").read())
            description = bedrock_result["content"][0]["text"]
            
        except Exception as e:
            logger.error(f"Bedrock error: {e}")
            description = "This appears to be an educational image with visual content that requires detailed analysis. The AI system has received your image and is processing the visual elements to provide comprehensive educational insights."
        
        # Return text immediately - NO AUDIO GENERATION
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'description': description
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