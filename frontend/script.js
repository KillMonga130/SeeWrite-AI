// Configuration - Update these URLs with your actual API Gateway endpoints
const API_CONFIG = {
    IMAGE_PROCESSOR_URL: 'https://your-api-gateway-url/process-image',
    CHAT_URL: 'https://your-api-gateway-url/chat'
};

// Global variables
let currentDescription = '';
let selectedFile = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const previewSection = document.getElementById('previewSection');
const imagePreview = document.getElementById('imagePreview');
const resultsSection = document.getElementById('resultsSection');
const descriptionText = document.getElementById('descriptionText');
const audioPlayer = document.getElementById('audioPlayer');
const replayBtn = document.getElementById('replayBtn');
const chatSection = document.getElementById('chatSection');
const chatHistory = document.getElementById('chatHistory');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Upload area click
    uploadArea.addEventListener('click', () => imageInput.click());
    
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Process button
    processBtn.addEventListener('click', processImage);
    
    // Replay button
    replayBtn.addEventListener('click', () => audioPlayer.play());
    
    // Chat functionality
    askBtn.addEventListener('click', askQuestion);
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') askQuestion();
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        displayImagePreview(file);
        processBtn.disabled = false;
    }
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        selectedFile = files[0];
        displayImagePreview(files[0]);
        processBtn.disabled = false;
    }
}

function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
        previewSection.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

async function processImage() {
    if (!selectedFile) return;
    
    showLoading('Processing your image...');
    
    try {
        // Convert image to base64
        const base64Image = await fileToBase64(selectedFile);
        
        // Call the image processing API
        const response = await fetch(API_CONFIG.IMAGE_PROCESSOR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image.split(',')[1] // Remove data:image/jpeg;base64, prefix
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
        } else {
            showError(result.error || 'Failed to process image');
        }
        
    } catch (error) {
        console.error('Error processing image:', error);
        showError('Network error. Please check your API configuration.');
    } finally {
        hideLoading();
    }
}

function displayResults(result) {
    currentDescription = result.description;
    
    // Display text description
    descriptionText.textContent = result.description;
    
    // Setup audio player
    const audioBlob = base64ToBlob(result.audio_base64, result.content_type);
    const audioUrl = URL.createObjectURL(audioBlob);
    audioPlayer.src = audioUrl;
    
    // Show results and chat sections
    resultsSection.style.display = 'block';
    chatSection.style.display = 'block';
    
    // Auto-play audio
    audioPlayer.play().catch(e => {
        console.log('Auto-play prevented by browser:', e);
    });
    
    // Clear previous chat history
    chatHistory.innerHTML = '';
}

async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question || !currentDescription) return;
    
    // Add user message to chat
    addChatMessage(question, 'user');
    questionInput.value = '';
    
    // Show loading in chat
    const loadingId = addChatMessage('Thinking...', 'ai', true);
    
    try {
        const response = await fetch(API_CONFIG.CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                original_description: currentDescription
            })
        });
        
        const result = await response.json();
        
        // Remove loading message
        document.getElementById(loadingId).remove();
        
        if (result.success) {
            // Add AI response to chat
            const messageId = addChatMessage(result.answer, 'ai');
            
            // Create audio for the response
            const audioBlob = base64ToBlob(result.audio_base64, result.content_type);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Add audio player to the message
            const messageElement = document.getElementById(messageId);
            const audioElement = document.createElement('audio');
            audioElement.controls = true;
            audioElement.src = audioUrl;
            audioElement.style.width = '100%';
            audioElement.style.marginTop = '10px';
            messageElement.appendChild(audioElement);
            
            // Auto-play response
            audioElement.play().catch(e => {
                console.log('Auto-play prevented by browser:', e);
            });
            
        } else {
            addChatMessage('Sorry, I had trouble answering that question.', 'ai');
        }
        
    } catch (error) {
        console.error('Error asking question:', error);
        document.getElementById(loadingId).remove();
        addChatMessage('Network error. Please try again.', 'ai');
    }
}

function addChatMessage(message, sender, isLoading = false) {
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    messageDiv.id = messageId;
    messageDiv.textContent = message;
    
    if (isLoading) {
        messageDiv.innerHTML = '<em>Thinking...</em>';
    }
    
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageId;
}

function showLoading(message) {
    loadingText.textContent = message;
    loadingSection.style.display = 'block';
    resultsSection.style.display = 'none';
    chatSection.style.display = 'none';
}

function hideLoading() {
    loadingSection.style.display = 'none';
}

function showError(message) {
    alert('Error: ' + message);
}

// Utility functions
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function base64ToBlob(base64, contentType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: contentType });
}