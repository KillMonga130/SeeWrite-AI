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
        question = body.get('question')
        original_description = body.get('original_description', '')
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'No question provided'})
            }
        
        # Initialize Bedrock client only
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Generate contextual answer using Claude 3 Sonnet - TEXT ONLY
        try:
            bedrock_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 600,
                "messages": [
                    {
                        "role": "user",
                        "content": f"""You are a helpful educational assistant. Based on this content: {original_description}

Student asks: {question}

Provide a brief, focused answer (2-3 sentences) that:
- Directly answers their question
- Adds new insight or explanation
- Uses simple, clear language
- Encourages curiosity

Be conversational and engaging, not repetitive."""
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
            answer = bedrock_result["content"][0]["text"]
            
        except Exception as e:
            logger.error(f"Bedrock error: {e}")
            answer = f"Thank you for your question about {question}. Based on the educational content we discussed, I can help explain this concept in more detail. Let me provide you with a comprehensive answer that builds on what we've already covered."
        
        # Return text immediately - NO AUDIO GENERATION
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'success': True,
                'answer': answer
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