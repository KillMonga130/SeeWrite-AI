#!/usr/bin/env python3
"""
Local test script for SeeWrite AI components
Run this to test your AWS services before deploying to Lambda
"""

import os
import sys
import base64
from PIL import Image
import io

# Add backend utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from bedrock_client import BedrockClient
from polly_client import PollyClient
from image_processor import ImageProcessor

def test_bedrock():
    """Test Bedrock client"""
    print("🧠 Testing Bedrock client...")
    
    try:
        client = BedrockClient()
        
        # Test with a sample description
        test_description = "A diagram showing the human heart with four chambers, arteries, and veins labeled"
        
        result = client.generate_educational_description(test_description)
        print(f"✅ Bedrock response: {result[:100]}...")
        
        # Test follow-up question
        question = "What is the function of the left ventricle?"
        answer = client.answer_followup_question(result, question)
        print(f"✅ Follow-up answer: {answer[:100]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Bedrock test failed: {e}")
        return False

def test_polly():
    """Test Polly client"""
    print("\n🎵 Testing Polly client...")
    
    try:
        client = PollyClient()
        
        test_text = "This is a test of the Amazon Polly text-to-speech service for SeeWrite AI."
        
        result = client.synthesize_speech(test_text)
        
        if result['success']:
            print("✅ Polly synthesis successful")
            print(f"   Audio data length: {len(result['audio_base64'])} characters")
            
            # Save test audio file
            audio_data = base64.b64decode(result['audio_base64'])
            with open('test_audio.mp3', 'wb') as f:
                f.write(audio_data)
            print("   Test audio saved as 'test_audio.mp3'")
            
            return True
        else:
            print(f"❌ Polly test failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Polly test failed: {e}")
        return False

def test_image_processor():
    """Test image processor with a sample image"""
    print("\n📸 Testing Image Processor...")
    
    try:
        # Create a simple test image
        img = Image.new('RGB', (400, 300), color='white')
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        processor = ImageProcessor()
        result = processor.process_image_base64(img_base64)
        
        if result['success']:
            print("✅ Image processing successful")
            print(f"   Description: {result['description']}")
            print(f"   Objects detected: {len(result.get('objects', []))}")
            return True
        else:
            print(f"❌ Image processing failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Image processor test failed: {e}")
        return False

def test_full_pipeline():
    """Test the complete pipeline"""
    print("\n🔄 Testing full pipeline...")
    
    try:
        # Create test image
        img = Image.new('RGB', (400, 300), color='lightblue')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Process image
        processor = ImageProcessor()
        image_result = processor.process_image_base64(img_base64)
        
        if not image_result['success']:
            print(f"❌ Pipeline failed at image processing: {image_result['error']}")
            return False
        
        # Generate description
        bedrock = BedrockClient()
        description = bedrock.generate_educational_description(image_result['description'])
        
        # Generate audio
        polly = PollyClient()
        audio_result = polly.synthesize_speech(description)
        
        if audio_result['success']:
            print("✅ Full pipeline successful!")
            print(f"   Final description: {description[:100]}...")
            
            # Save final audio
            audio_data = base64.b64decode(audio_result['audio_base64'])
            with open('pipeline_test_audio.mp3', 'wb') as f:
                f.write(audio_data)
            print("   Pipeline audio saved as 'pipeline_test_audio.mp3'")
            
            return True
        else:
            print(f"❌ Pipeline failed at audio generation: {audio_result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Full pipeline test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 SeeWrite AI - Local Component Testing")
    print("=" * 50)
    
    # Check AWS credentials
    if not os.environ.get('AWS_ACCESS_KEY_ID') and not os.path.exists(os.path.expanduser('~/.aws/credentials')):
        print("⚠️  Warning: AWS credentials not found. Make sure to configure them first:")
        print("   aws configure")
        print("   or set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables")
        return
    
    tests = [
        ("Bedrock", test_bedrock),
        ("Polly", test_polly),
        ("Image Processor", test_image_processor),
        ("Full Pipeline", test_full_pipeline)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except KeyboardInterrupt:
            print("\n⏹️  Testing interrupted by user")
            break
        except Exception as e:
            print(f"❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if success:
            passed += 1
    
    print(f"\nOverall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your SeeWrite AI backend is ready.")
    else:
        print("⚠️  Some tests failed. Check your AWS configuration and permissions.")

if __name__ == "__main__":
    main()