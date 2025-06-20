SeeWrite AI: Empowering Visually Impaired Learners with Generative AIInfuse generative AI with AWS and connectivity to enable equitable digital experiences for allSeeWrite AI is an innovative application designed to break down educational barriers for visually impaired students. Leveraging the power of AWS generative AI services combined with the concept of next-generation connectivity (5G/edge computing), it transforms visual and textual educational content into rich, interactive, and personalized audio descriptions and conversational learning experiences.🌟 FeaturesDynamic Visual-to-Audio Descriptions: Convert complex diagrams, graphs, and images from textbooks or whiteboards into detailed, spoken narratives.Interactive Q&A: Engage with the content by asking follow-up questions in natural language, receiving real-time, context-aware answers.Text Summarization & Elaboration: Get concise summaries or detailed explanations of textual content tailored to individual learning needs.Personalized Learning: The system adapts to the student's interaction style, offering a more engaging and effective learning journey.💡 How It Works (Simplified Flow)Capture: A student uses a device (e.g., smartphone camera) to capture an image of an educational resource (diagram, text, whiteboard).Process & Analyze (AWS Backend):The image is sent to an AWS Lambda function via API Gateway.The Lambda function triggers Amazon Rekognition (for basic object/text detection) or a pre-trained computer vision model (if integrated) to interpret the visual content.This interpretation, along with any extracted text, forms a prompt for Amazon Bedrock.Amazon Bedrock uses its foundational models (e.g., Claude) to generate a detailed, educational description of the image content.Amazon Q is then used to establish a conversational context and enable follow-up questions from the student.The generated text is converted into lifelike speech using Amazon Polly.Deliver: The interactive audio description is streamed back to the student's device in real-time, along with any relevant textual feedback.Interact: The student can then speak follow-up questions, which are processed by Amazon Q and Bedrock to provide dynamic, relevant answers.This entire process, especially with the conceptual integration of 5G/Edge Computing, aims for low-latency, real-time feedback, crucial for an inclusive learning environment.⚙️ Technologies UsedAWS Generative AI Services:Amazon Bedrock: For orchestrating and invoking foundational models (e.g., Anthropic Claude) to generate detailed content descriptions and interactive explanations.Amazon Q: For building the conversational AI layer, understanding student intent, and providing a natural language interface for questions and answers.Amazon Polly: For converting generated text into lifelike speech audio for an accessible user experience.AWS Core Services:AWS Lambda: Serverless compute for handling the backend logic, orchestrating calls between different AWS services.Amazon API Gateway: Provides secure and scalable RESTful API endpoints for the web/mobile frontend to interact with the Lambda functions.Amazon S3: Object storage for temporarily storing captured images and potentially generated audio files.Amazon Rekognition (Optional, for basic vision): For quickly extracting text or detecting general objects in images.Connectivity:5G / Edge Computing (Conceptual Integration): While not fully implemented for the hackathon MVP, the architecture is designed to leverage the low-latency and high-bandwidth capabilities of 5G and localized processing of edge computing for real-time interactions, minimizing cloud roundtrips and enhancing responsiveness.Frontend:HTML, CSS, JavaScript: A simple web-based interface for image capture, displaying text, and playing audio.Backend Language:Python: Used for AWS Lambda functions and Boto3 SDK interactions.🚀 Getting StartedGiven the time constraints of the hackathon, this section will provide a streamlined guide to get the core functionality running.PrerequisitesAWS Account: Ensure you have an active AWS account.AWS CLI Configured: Your AWS CLI should be configured with credentials that have sufficient permissions (see IAM Permissions below).Python 3.x: Installed on your local machine.Required Python Libraries: boto3, Pillow, requests, json. Install with pip install boto3 Pillow requests.1. IAM PermissionsCreate an IAM User or Role with the following permissions:AmazonBedrockFullAccessAmazonQFullAccessAmazonPollyFullAccessAmazonS3FullAccessAWSLambda_FullAccessAmazonAPIGatewayInvokeFullAccessAmazonRekognitionFullAccess (if using Rekognition)2. Amazon Q Application SetupGo to the Amazon Q Console.Create a new application.For a quick start, add a simple "Web crawler" or "S3 bucket" data source, even with just a few .txt files related to general educational topics (e.g., "basic chemistry terms.txt", "human anatomy overview.txt"). This will provide some knowledge base for Amazon Q.Note down your Amazon Q Application ID.3. Backend (AWS Lambda & API Gateway)You will create two main Lambda functions:A. image_processor_lambda.py (Handles image upload and initial description)# image_processor_lambda.py
import json
import boto3
import base64
import os
from botocore.exceptions import ClientError

# Ensure these are configured in your Lambda environment variables or IAM role
REGION_NAME = os.environ.get('AWS_REGION', 'us-east-1') # Bedrock/Q are region-specific
Q_APP_ID = os.environ.get('Q_APPLICATION_ID', 'YOUR_Q_APP_ID') # REPLACE WITH YOUR Q_APP_ID

bedrock_runtime = boto3.client("bedrock-runtime", region_name=REGION_NAME)
polly_client = boto3.client("polly")
# For Amazon Q, use the higher-level client if you manage sessions, or low-level
amazon_q_client = boto3.client("qbusiness", region_name=REGION_NAME) # This is the correct client for Q Business

def get_image_description_with_bedrock_vision(image_base64):
    """
    Uses Bedrock's multimodal capability (e.g., Anthropic Claude 3 Sonnet/Haiku)
    to describe the image and generate a detailed educational description.
    """
    model_id = "anthropic.claude-3-sonnet-20240229-v1:0" # Or Haiku for faster response
    # model_id = "anthropic.claude-3-haiku-20240307-v1:0" # For potentially faster responses
    
    # Prompt for the model - guiding its role as an educator for visually impaired
    prompt_text = "You are an expert educator who specializes in describing complex visual information for visually impaired students. Describe the image in detail, explaining relationships, context, and key features. Ensure the language is clear, concise, and highly descriptive for an audio format. Focus on educational relevance."

    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": prompt_text},
                {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": image_base64}}
            ]
        }
    ]
    
    try:
        response = bedrock_runtime.converse(
            modelId=model_id,
            messages=messages,
            inferenceConfig={"maxTokens": 1000, "temperature": 0.5},
        )
        return response.get("output", {}).get("message", {}).get("content", [])[0].get("text", "")
    except ClientError as e:
        print(f"Error calling Bedrock Converse API: {e}")
        return f"Error describing image: {e.response['Error']['Message']}"
    except Exception as e:
        print(f"Unexpected error in Bedrock vision call: {e}")
        return "An unexpected error occurred while processing the image."


def synthesize_speech(text_description):
    """Converts text into speech using Amazon Polly."""
    try:
        response = polly_client.synthesize_speech(
            Text=text_description,
            OutputFormat="mp3",
            VoiceId="Joanna"  # Choose a clear, natural voice
        )
        audio_stream = response["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_stream).decode('utf-8')
        return audio_base64
    except ClientError as e:
        print(f"Error synthesizing speech with Polly: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error in Polly call: {e}")
        return None

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        image_base64 = body['image_data'] # Expects base64 image data from frontend

        # 1. Get detailed description from Bedrock (vision model)
        bedrock_description = get_image_description_with_bedrock_vision(image_base64)
        if not bedrock_description:
            return {
                'statusCode': 500,
                'headers': { 'Access-Control-Allow-Origin': '*' },
                'body': json.dumps({'error': 'Could not generate image description.'})
            }
        
        # 2. Synthesize speech from the description
        audio_base64 = synthesize_speech(bedrock_description)
        if not audio_base64:
            return {
                'statusCode': 500,
                'headers': { 'Access-Control-Allow-Origin': '*' },
                'body': json.dumps({'error': 'Could not synthesize audio.'})
            }

        return {
            'statusCode': 200,
            'headers': { 'Access-Control-Allow-Origin': '*' }, # IMPORTANT for CORS
            'body': json.dumps({
                'description': bedrock_description,
                'audio_data': audio_base64
            })
        }
    except KeyError:
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': 'Missing image_data in request body.'})
        }
    except Exception as e:
        print(f"Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': str(e)})
        }

B. q_chat_lambda.py (Handles follow-up questions)# q_chat_lambda.py
import json
import boto3
import os
import base64
from botocore.exceptions import ClientError

REGION_NAME = os.environ.get('AWS_REGION', 'us-east-1') # Bedrock/Q are region-specific
Q_APP_ID = os.environ.get('Q_APPLICATION_ID', 'YOUR_Q_APP_ID') # REPLACE WITH YOUR Q_APP_ID

amazon_q_client = boto3.client("qbusiness", region_name=REGION_NAME)
polly_client = boto3.client("polly")

def synthesize_speech(text_description):
    """Converts text into speech using Amazon Polly."""
    try:
        response = polly_client.synthesize_speech(
            Text=text_description,
            OutputFormat="mp3",
            VoiceId="Joanna"
        )
        audio_stream = response["AudioStream"].read()
        audio_base64 = base64.b64encode(audio_stream).decode('utf-8')
        return audio_base64
    except ClientError as e:
        print(f"Error synthesizing speech with Polly: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error in Polly call: {e}")
        return None

def lambda_handler(event, context):
    try:
        body = json.loads(event['body'])
        user_query = body['query']
        # For simplicity in hackathon, use a fixed user_id or generate one if needed
        # In a real app, you'd manage sessions/user IDs more robustly
        user_id = body.get('user_id', 'hackathon_user_123') 
        conversation_id = body.get('conversation_id') # To maintain continuity of Q chat

        chat_args = {
            "applicationId": Q_APP_ID,
            "userId": user_id,
            "message": {"text": user_query}
        }
        if conversation_id:
            chat_args["conversationId"] = conversation_id

        # Call Amazon Q
        q_response = amazon_q_client.chat_sync(**chat_args)
        
        q_answer_text = q_response.get('output', {}).get('message', {}).get('text', 'No answer from Amazon Q.')
        new_conversation_id = q_response.get('conversationId') # Get updated conversation ID

        # Synthesize speech from Amazon Q's answer
        audio_base64 = synthesize_speech(q_answer_text)
        if not audio_base64:
            return {
                'statusCode': 500,
                'headers': { 'Access-Control-Allow-Origin': '*' },
                'body': json.dumps({'error': 'Could not synthesize audio for Q response.'})
            }

        return {
            'statusCode': 200,
            'headers': { 'Access-Control-Allow-Origin': '*' }, # IMPORTANT for CORS
            'body': json.dumps({
                'answer': q_answer_text,
                'audio_data': audio_base64,
                'conversation_id': new_conversation_id # Return for frontend to maintain session
            })
        }
    except KeyError:
        return {
            'statusCode': 400,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': 'Missing query or user_id in request body.'})
        }
    except Exception as e:
        print(f"Q Lambda handler error: {e}")
        return {
            'statusCode': 500,
            'headers': { 'Access-Control-Allow-Origin': '*' },
            'body': json.dumps({'error': str(e)})
        }
Deployment Steps for Lambda Functions:Create Lambda Functions: In the AWS Lambda console, create two new functions: SeeWriteAIIamgeProcessor and SeeWriteAIQChat.Runtime: Python 3.9 or newer.Architecture: x86_64.Execution Role: Attach the IAM role you created with the necessary permissions.Upload Code: Upload the respective Python code files (image_processor_lambda.py and q_chat_lambda.py) to their Lambda functions.Environment Variables: For both Lambda functions, add environment variables:AWS_REGION: us-east-1 (or your chosen Bedrock region)Q_APPLICATION_ID: Your Amazon Q Application ID from step 2.Increase Timeout: Increase the Lambda timeout to at least 30 seconds for image_processor_lambda as Bedrock calls can take time.Configure API Gateway:In the AWS API Gateway console, create a new REST API.Create a POST method for /image-process:Integration Type: Lambda FunctionLambda Proxy Integration: Check the boxLambda Function: Select SeeWriteAIIamgeProcessorCreate a POST method for /chat:Integration Type: Lambda FunctionLambda Proxy Integration: Check the boxLambda Function: Select SeeWriteAIQChatEnable CORS: For both methods, go to "Actions" -> "Enable CORS". This is crucial for your web frontend. Accept default settings.Deploy API: Go to "Actions" -> "Deploy API" and create a new stage (e.g., prod). Note down the Invoke URL for this stage. This is your API endpoint.4. Frontend (HTML, CSS, JavaScript)Create an index.html file. Make sure to replace YOUR_API_GATEWAY_INVOKE_URL with the actual URL you obtained.<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SeeWrite AI</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f4f8;
        }
        .container {
            max-width: 900px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(to right, #6366f1, #8b5cf6);
            color: white;
            padding: 1.5rem;
            text-align: center;
            border-bottom-left-radius: 12px;
            border-bottom-right-radius: 12px;
        }
        .content-area {
            padding: 2rem;
        }
        .button-primary {
            background-color: #6366f1;
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-weight: 600;
            transition: background-color 0.2s ease;
        }
        .button-primary:hover {
            background-color: #4f46e5;
        }
        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #6366f1;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body class="min-h-screen flex items-center justify-center">
    <div class="container">
        <div class="header">
            <h1 class="text-3xl font-bold mb-2">SeeWrite AI</h1>
            <p class="text-lg">Empowering Visually Impaired Learners with Generative AI</p>
        </div>

        <div class="content-area">
            <div class="mb-6 border-b pb-4 border-gray-200">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">1. Describe an Image</h2>
                <input type="file" id="imageInput" accept="image/*" class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-violet-50 file:text-violet-700
                    hover:file:bg-violet-100 mb-4">
                <button id="describeImageBtn" class="button-primary flex items-center justify-center space-x-2">
                    <span id="describeButtonText">Get Description</span>
                    <div id="describeLoadingSpinner" class="loading-spinner hidden"></div>
                </button>
                
                <div id="imagePreview" class="mt-4 hidden max-w-full h-auto rounded-lg shadow-md overflow-hidden">
                    <img src="" alt="Image Preview" class="w-full h-full object-cover">
                </div>
                <div id="descriptionOutput" class="mt-4 p-4 bg-gray-100 rounded-lg text-gray-700 hidden"></div>
                <audio id="audioPlayer" controls class="w-full mt-4 hidden"></audio>
            </div>

            <div class="mb-6">
                <h2 class="text-2xl font-semibold text-gray-800 mb-4">2. Ask Follow-up Questions</h2>
                <input type="text" id="questionInput" placeholder="E.g., 'What is the function of the heart?'"
                       class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent mb-4">
                <button id="askQuestionBtn" class="button-primary flex items-center justify-center space-x-2">
                    <span id="askButtonText">Ask Question</span>
                    <div id="askLoadingSpinner" class="loading-spinner hidden"></div>
                </button>
                <div id="qAnswerOutput" class="mt-4 p-4 bg-blue-50 rounded-lg text-blue-800 hidden"></div>
                <audio id="qAudioPlayer" controls class="w-full mt-4 hidden"></audio>
            </div>
        </div>
    </div>

    <script>
        // REPLACE WITH YOUR ACTUAL API GATEWAY INVOKE URL
        const API_GATEWAY_URL = 'YOUR_API_GATEWAY_INVOKE_URL'; 

        let conversationId = null; // To maintain Amazon Q chat context

        const imageInput = document.getElementById('imageInput');
        const describeImageBtn = document.getElementById('describeImageBtn');
        const descriptionOutput = document.getElementById('descriptionOutput');
        const audioPlayer = document.getElementById('audioPlayer');
        const imagePreview = document.getElementById('imagePreview');
        const describeButtonText = document.getElementById('describeButtonText');
        const describeLoadingSpinner = document.getElementById('describeLoadingSpinner');

        const questionInput = document.getElementById('questionInput');
        const askQuestionBtn = document.getElementById('askQuestionBtn');
        const qAnswerOutput = document.getElementById('qAnswerOutput');
        const qAudioPlayer = document.getElementById('qAudioPlayer');
        const askButtonText = document.getElementById('askButtonText');
        const askLoadingSpinner = document.getElementById('askLoadingSpinner');

        // Function to show loading state
        function showLoading(buttonTextElement, spinnerElement) {
            buttonTextElement.classList.add('hidden');
            spinnerElement.classList.remove('hidden');
            describeImageBtn.disabled = true;
            askQuestionBtn.disabled = true;
        }

        // Function to hide loading state
        function hideLoading(buttonTextElement, spinnerElement, originalText) {
            buttonTextElement.classList.remove('hidden');
            spinnerElement.classList.add('hidden');
            buttonTextElement.textContent = originalText;
            describeImageBtn.disabled = false;
            askQuestionBtn.disabled = false;
        }

        // Handle image selection and preview
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.querySelector('img').src = e.target.result;
                    imagePreview.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.classList.add('hidden');
            }
        });

        // Handle image description button click
        describeImageBtn.addEventListener('click', async () => {
            const file = imageInput.files[0];
            if (!file) {
                alert('Please select an image first.');
                return;
            }

            showLoading(describeButtonText, describeLoadingSpinner);
            describeButtonText.textContent = 'Describing...';

            // Convert image to base64
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = async () => {
                const base64Image = reader.result.split(',')[1]; // Get base64 part

                try {
                    const response = await fetch(`${API_GATEWAY_URL}/image-process`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ image_data: base64Image }),
                    });

                    const data = await response.json();

                    if (response.ok) {
                        descriptionOutput.textContent = data.description;
                        descriptionOutput.classList.remove('hidden');
                        
                        audioPlayer.src = `data:audio/mp3;base64,${data.audio_data}`;
                        audioPlayer.classList.remove('hidden');
                        audioPlayer.play();
                        
                        // Optionally, reset conversation ID for new image context
                        conversationId = null; 

                    } else {
                        alert(`Error: ${data.error || 'Unknown error occurred'}`);
                        descriptionOutput.textContent = `Error: ${data.error || 'Failed to get description.'}`;
                        descriptionOutput.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('Fetch error:', error);
                    alert('An error occurred while connecting to the AI service.');
                    descriptionOutput.textContent = `An error occurred: ${error.message}`;
                    descriptionOutput.classList.remove('hidden');
                } finally {
                    hideLoading(describeButtonText, describeLoadingSpinner, 'Get Description');
                }
            };
        });

        // Handle question asking button click
        askQuestionBtn.addEventListener('click', async () => {
            const query = questionInput.value.trim();
            if (!query) {
                alert('Please type a question.');
                return;
            }

            showLoading(askButtonText, askLoadingSpinner);
            askButtonText.textContent = 'Answering...';

            try {
                const payload = { query: query };
                if (conversationId) {
                    payload.conversation_id = conversationId; // Send current conversation ID
                }

                const response = await fetch(`${API_GATEWAY_URL}/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (response.ok) {
                    qAnswerOutput.textContent = data.answer;
                    qAnswerOutput.classList.remove('hidden');
                    
                    qAudioPlayer.src = `data:audio/mp3;base64,${data.audio_data}`;
                    qAudioPlayer.classList.remove('hidden');
                    qAudioPlayer.play();

                    conversationId = data.conversation_id; // Update conversation ID for next query
                    questionInput.value = ''; // Clear input

                } else {
                    alert(`Error: ${data.error || 'Unknown error occurred'}`);
                    qAnswerOutput.textContent = `Error: ${data.error || 'Failed to get answer.'}`;
                    qAnswerOutput.classList.remove('hidden');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('An error occurred while connecting to the Q&A service.');
                qAnswerOutput.textContent = `An error occurred: ${error.message}`;
                qAnswerOutput.classList.remove('hidden');
            } finally {
                hideLoading(askButtonText, askLoadingSpinner, 'Ask Question');
            }
        });
    </script>
</body>
</html>
5. Run the FrontendSave the HTML code as index.html.Open index.html in your web browser. You can host it locally with a simple HTTP server (e.g., python -m http.server from your terminal in the directory where index.html is located) or simply open the file.🏃‍♂️ UsageUpload Image: Click "Choose File" and select an image (e.g., a diagram of a human heart, a map, or a simple picture).Get Description: Click "Get Description". The AI will process the image, provide a textual description, and speak it aloud.Ask Questions: After getting the initial description, type a question related to the image or its description in the "Ask Follow-up Questions" input field (e.g., "What is the function of the left ventricle?", "Tell me more about photosynthesis.").Get Answer: Click "Ask Question". The AI will provide a spoken and textual answer.📈 Potential Impact"SeeWrite AI" has the potential to significantly enhance the educational experience for visually impaired students by:Increasing Accessibility: Making visual content immediately understandable and interactive.Fostering Independence: Reducing reliance on human assistance or pre-prepared accessible materials.Personalizing Learning: Adapting explanations to individual queries and learning paces.Broadening Curriculum: Enabling access to subjects previously challenging due to their visual nature.Scalability: A cloud-based solution can be scaled to support students globally, bridging the digital divide in education.🚀 Future EnhancementsReal-time Video Processing: Integrate with device cameras for continuous, real-time description of dynamic environments (e.g., a teacher writing on a whiteboard).Tactile Graphics Generation: Develop the capability to generate simplified, printable tactile graphic instructions or SVG paths from complex diagrams.Multilingual Support: Extend beyond English to support various languages for descriptions and interactions.Integration with Learning Platforms: Seamless integration with existing educational management systems.User Profiles & Preferences: Store and adapt to individual student learning styles, preferred voices, and difficulty levels.🤝 ContributingWe welcome contributions! If you have ideas for improvements or new features, please fork this repository and submit a pull request.📄 LicenseThis project is open-source and available under the MIT License.
