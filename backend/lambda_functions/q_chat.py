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
        question = body.get('question')
        original_description = body.get('original_description', '')
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'No question provided'})
            }
        
        # Initialize AWS clients
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        polly = boto3.client('polly', region_name='us-east-1')
        
        # Generate contextual answer using Claude 3 Sonnet
        try:
            bedrock_body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 800,
                "messages": [
                    {
                        "role": "user",
                        "content": f"""You are an expert educator helping a visually impaired student understand educational content. 

Original content description: {original_description}

Student's question: {question}

Provide a clear, detailed, and educational answer that:
1) Directly addresses their specific question
2) Uses the context from the original description
3) Explains concepts in an accessible way
4) Encourages further learning
5) Is optimized for audio consumption

Keep your response conversational and supportive."""
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
        
        # Convert answer to speech using Polly
        try:
            polly_response = polly.synthesize_speech(
                Text=answer,
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
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Audio generation failed'})
            }
        
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
                'answer': answer,
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
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }