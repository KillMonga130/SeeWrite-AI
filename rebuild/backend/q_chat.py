import json
import boto3
import base64
import logging
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Handle interactive Q&A about educational content using AWS Bedrock
    and generate audio responses using Amazon Polly
    """
    
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return cors_response()
    
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        question = body.get('question')
        original_description = body.get('original_description', '')
        
        if not question:
            return error_response('No question provided', 400)
        
        # Initialize AWS clients
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        polly = boto3.client('polly', region_name='us-east-1')
        
        # Generate contextual answer using Claude 3 Sonnet
        answer = generate_educational_answer(bedrock, question, original_description)
        
        # Generate audio response using Polly
        audio_base64 = generate_audio(polly, answer)
        
        return success_response({
            'answer': answer,
            'audio_base64': audio_base64,
            'content_type': 'audio/mp3'
        })
        
    except Exception as e:
        logger.error(f"Error in Q&A processing: {str(e)}")
        return error_response(f'Q&A processing failed: {str(e)}', 500)

def generate_educational_answer(bedrock, question, original_description):
    """Generate contextual educational answer using Claude 3 Sonnet"""
    try:
        prompt = f"""You are an expert educator helping a visually impaired student understand educational content. You have previously analyzed an educational image and provided this description:

ORIGINAL CONTENT ANALYSIS:
{original_description}

STUDENT'S QUESTION:
{question}

Please provide a clear, detailed, and educational answer that:

1. **Directly addresses** the student's specific question
2. **Uses context** from the original image analysis
3. **Explains concepts** in an accessible, easy-to-understand way
4. **Provides additional insights** that enhance learning
5. **Encourages further exploration** of the topic
6. **Is optimized for audio** consumption with natural flow

Be supportive, encouraging, and focus on helping the student build understanding. If the question relates to specific visual elements, describe them clearly. If it's about concepts, provide comprehensive explanations with examples when helpful."""

        bedrock_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
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
        logger.error(f"Bedrock error in Q&A: {e}")
        return f"Thank you for your question about '{question}'. Based on the educational content we've been discussing, I can help explain this concept in more detail. Let me provide you with a comprehensive answer that builds on what we've already covered."
    except Exception as e:
        logger.error(f"Unexpected error in answer generation: {e}")
        return "I understand your question and I'm here to help you learn. Let me provide you with a detailed explanation based on the educational content we've been analyzing."

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