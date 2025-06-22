import boto3
from PIL import Image
import io
import base64
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    def __init__(self, region_name="us-east-1"):
        self.rekognition = boto3.client("rekognition", region_name=region_name)
        self.textract = boto3.client("textract", region_name=region_name)
    
    def process_image_base64(self, image_base64):
        """Process base64 encoded image and extract meaningful information"""
        try:
            # Decode base64 image
            image_data = base64.b64decode(image_base64)
            
            # Get object detection results
            objects = self._detect_objects(image_data)
            
            # Get text extraction results
            text_content = self._extract_text(image_data)
            
            # Combine results into a comprehensive description
            description = self._create_initial_description(objects, text_content)
            
            return {
                "success": True,
                "description": description,
                "objects": objects,
                "text": text_content
            }
            
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return {
                "success": False,
                "error": str(e),
                "description": "Unable to process the uploaded image."
            }
    
    def _detect_objects(self, image_data):
        """Use Amazon Rekognition to detect objects in the image"""
        try:
            response = self.rekognition.detect_labels(
                Image={'Bytes': image_data},
                MaxLabels=10,
                MinConfidence=70
            )
            
            objects = []
            for label in response['Labels']:
                objects.append({
                    'name': label['Name'],
                    'confidence': label['Confidence']
                })
            
            return objects
            
        except Exception as e:
            logger.error(f"Error detecting objects: {e}")
            return []
    
    def _extract_text(self, image_data):
        """Use Amazon Textract to extract text from the image"""
        try:
            response = self.textract.detect_document_text(
                Document={'Bytes': image_data}
            )
            
            text_blocks = []
            for block in response['Blocks']:
                if block['BlockType'] == 'LINE':
                    text_blocks.append(block['Text'])
            
            return ' '.join(text_blocks)
            
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return ""
    
    def _create_initial_description(self, objects, text_content):
        """Create an initial description combining objects and text"""
        description_parts = []
        
        if objects:
            object_names = [obj['name'] for obj in objects[:5]]  # Top 5 objects
            description_parts.append(f"This image contains: {', '.join(object_names)}")
        
        if text_content:
            if len(text_content) > 200:
                text_summary = text_content[:200] + "..."
            else:
                text_summary = text_content
            description_parts.append(f"Text content includes: {text_summary}")
        
        if not description_parts:
            return "An educational image or diagram"
        
        return ". ".join(description_parts)