import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        # Parse request
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        question = body.get('question', '')
        image_context = body.get('context', '')
        
        if not question:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                'body': json.dumps({'success': False, 'error': 'Question required'})
            }
        
        # Use Amazon Bedrock for educational Q&A (simulating Amazon Q functionality)
        bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Educational and supportive prompt for Q&A
        prompt = f"""You are a supportive educational AI assistant. Every question is valid and important. Based on this image analysis:
{image_context}

Student question: {question}

Provide a helpful, encouraging response. Always:
- Answer the question directly and kindly
- Provide educational value when possible
- Be supportive and encouraging
- Never dismiss any question as unclear or stupid
- If the question seems unclear, provide your best interpretation and ask for clarification
- For health-related questions, provide general educational information while encouraging professional consultation

Response:"""

        response = bedrock.invoke_model(
            modelId='anthropic.claude-3-sonnet-20240229-v1:0',
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 200,
                'messages': [{'role': 'user', 'content': prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        answer = result['content'][0]['text'].strip()
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({'success': False, 'error': 'Internal server error'})
        }