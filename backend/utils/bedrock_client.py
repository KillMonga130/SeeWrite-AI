import boto3
import json
import logging

logger = logging.getLogger(__name__)

class BedrockClient:
    def __init__(self, region_name="us-east-1"):
        self.client = boto3.client("bedrock-runtime", region_name=region_name)
        self.model_id = "anthropic.claude-3-sonnet-20240229-v1:0"
    
    def generate_educational_description(self, content_description):
        """Generate detailed educational description from visual content"""
        prompt = f"""You are an expert educator specializing in describing visual content for visually impaired students. 
        
Your task is to create a detailed, engaging audio description that:
- Explains what is shown in clear, descriptive language
- Identifies key relationships and connections
- Provides educational context and significance
- Uses language suitable for audio consumption
- Maintains an encouraging, educational tone

Content to describe: {content_description}

Provide a comprehensive description suitable for a visually impaired student:"""

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 1000,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body)
            )
            
            response_body = json.loads(response.get("body").read())
            return response_body["content"][0]["text"]
            
        except Exception as e:
            logger.error(f"Error calling Bedrock: {e}")
            return "I apologize, but I'm having trouble generating a description right now."
    
    def answer_followup_question(self, original_description, question):
        """Answer follow-up questions about the content"""
        prompt = f"""You are an expert educator helping a visually impaired student understand visual content.

Original content description: {original_description}

Student's question: {question}

Provide a clear, detailed answer that:
- Directly addresses the student's question
- References the original content when relevant
- Provides additional educational context
- Uses encouraging, supportive language
- Is optimized for audio delivery

Answer:"""

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 800,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body)
            )
            
            response_body = json.loads(response.get("body").read())
            return response_body["content"][0]["text"]
            
        except Exception as e:
            logger.error(f"Error calling Bedrock for follow-up: {e}")
            return "I'm having trouble answering that question right now."