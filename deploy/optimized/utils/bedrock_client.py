import boto3
import json
import logging

logger = logging.getLogger(__name__)

class BedrockClient:
    def __init__(self, region_name="us-east-1"):
        self.client = boto3.client("bedrock-runtime", region_name=region_name)
        # Try different models in order of preference (ON_DEMAND models first)
        self.model_options = [
            "meta.llama3-8b-instruct-v1:0",
            "meta.llama3-70b-instruct-v1:0",
            "mistral.mistral-7b-instruct-v0:2",
            "mistral.mixtral-8x7b-instruct-v0:1",
            "cohere.command-text-v14",
            "cohere.command-r-v1:0",
            "anthropic.claude-3-haiku-20240307-v1:0",
            "anthropic.claude-v2:1",
            "anthropic.claude-v2"
        ]
        self.model_id = self.model_options[0]
    
    def _try_model(self, prompt_text):
        """Try different models until one works"""
        for model_id in self.model_options:
            try:
                # Create appropriate body format for each model type
                if model_id.startswith("anthropic.claude-3"):
                    body = {
                        "anthropic_version": "bedrock-2023-05-31",
                        "max_tokens": 1000,
                        "messages": [{"role": "user", "content": prompt_text}]
                    }
                elif model_id.startswith("anthropic.claude"):
                    body = {
                        "prompt": f"\n\nHuman: {prompt_text}\n\nAssistant:",
                        "max_tokens_to_sample": 1000,
                        "temperature": 0.5,
                        "stop_sequences": ["\n\nHuman:"]
                    }
                elif model_id.startswith("meta.llama"):
                    body = {
                        "prompt": prompt_text,
                        "max_gen_len": 1000,
                        "temperature": 0.5,
                        "top_p": 0.9
                    }
                elif model_id.startswith("mistral"):
                    body = {
                        "prompt": prompt_text,
                        "max_tokens": 1000,
                        "temperature": 0.5,
                        "top_p": 0.9
                    }
                elif model_id.startswith("cohere"):
                    body = {
                        "prompt": prompt_text,
                        "max_tokens": 1000,
                        "temperature": 0.5,
                        "return_likelihoods": "NONE"
                    }
                else:
                    body = {
                        "prompt": prompt_text,
                        "max_tokens": 1000,
                        "temperature": 0.5
                    }
                
                response = self.client.invoke_model(
                    modelId=model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(body)
                )
                response_body = json.loads(response.get("body").read())
                
                # Handle different response formats
                if "content" in response_body and isinstance(response_body["content"], list):
                    return response_body["content"][0]["text"]
                elif "completion" in response_body:
                    return response_body["completion"]
                elif "generation" in response_body:
                    return response_body["generation"]
                elif "generations" in response_body:
                    return response_body["generations"][0]["text"]
                elif "text" in response_body:
                    return response_body["text"]
                else:
                    logger.info(f"Model {model_id} succeeded! Response: {response_body}")
                    return str(response_body)
                    
            except Exception as e:
                logger.warning(f"Model {model_id} failed: {e}")
                continue
        
        return "I apologize, but I'm unable to access the AI models right now. Please ensure Bedrock model access is enabled in your AWS account."
    
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

        return self._try_model(prompt)
    
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

        return self._try_model(prompt)