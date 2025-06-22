import boto3
import base64
import logging

logger = logging.getLogger(__name__)

class PollyClient:
    def __init__(self, region_name="us-east-1"):
        self.client = boto3.client("polly", region_name=region_name)
        self.voice_id = "Joanna"  # Clear, professional female voice
        self.output_format = "mp3"
    
    def synthesize_speech(self, text):
        """Convert text to speech and return base64 encoded audio"""
        try:
            response = self.client.synthesize_speech(
                Text=text,
                OutputFormat=self.output_format,
                VoiceId=self.voice_id,
                Engine="neural"  # Higher quality neural voices
            )
            
            if "AudioStream" in response:
                audio_data = response["AudioStream"].read()
                # Return base64 encoded audio for web delivery
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                return {
                    "success": True,
                    "audio_base64": audio_base64,
                    "content_type": f"audio/{self.output_format}"
                }
            else:
                logger.error("No AudioStream in Polly response")
                return {"success": False, "error": "No audio stream generated"}
                
        except Exception as e:
            logger.error(f"Error synthesizing speech: {e}")
            return {"success": False, "error": str(e)}
    
    def get_available_voices(self):
        """Get list of available voices for customization"""
        try:
            response = self.client.describe_voices(
                Engine="neural",
                LanguageCode="en-US"
            )
            return [voice["Id"] for voice in response["Voices"]]
        except Exception as e:
            logger.error(f"Error getting voices: {e}")
            return ["Joanna"]  # Default fallback