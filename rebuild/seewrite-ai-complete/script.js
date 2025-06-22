// SeeWrite AI - Premium Competition Version
// AWS Breaking Barriers Challenge Winner

const API_CONFIG = {
    IMAGE_PROCESSOR_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/process-image',
    CHAT_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/chat',
    AUDIO_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/generate-audio'
};

// Global state
let currentDescription = '';
let currentAudio = null;
let analysisStartTime = null;
let chatCount = 0;

// DOM Elements
const elements = {
    imageInput: document.getElementById('imageInput'),
    imagePreview: document.getElementById('imagePreview'),
    previewImg: document.getElementById('previewImg'),
    processBtn: document.getElementById('processBtn'),
    clearBtn: document.getElementById('clearBtn'),
    processingStatus: document.getElementById('processingStatus'),
    resultsSection: document.getElementById('resultsSection'),
    errorDisplay: document.getElementById('errorDisplay'),
    errorMessage: document.getElementById('errorMessage'),
    descriptionText: document.getElementById('descriptionText'),
    audioPlayer: document.getElementById('audioPlayer'),
    playAudioBtn: document.getElementById('playAudioBtn'),
    questionInput: document.getElementById('questionInput'),
    askBtn: document.getElementById('askBtn'),
    chatHistory: document.getElementById('chatHistory'),
    analysisTime: document.getElementById('analysisTime'),
    wordCount: document.getElementById('wordCount'),
    audioLength: document.getElementById('audioLength')
};

// Premium animations and effects
function triggerSuccessAnimation() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#667eea', '#764ba2', '#f093fb']
    });
}

function typewriterEffect(text, element, speed = 30) {
    element.innerHTML = '';
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
            element.classList.add('success-bounce');
        }
    }, speed);
}

function streamTextWithHighlights(text, element) {
    element.innerHTML = '';
    const sentences = text.split('. ');
    let delay = 0;
    
    sentences.forEach((sentence, index) => {
        setTimeout(() => {
            const span = document.createElement('span');
            span.className = 'text-stream';
            span.style.animationDelay = `${index * 0.1}s`;
            span.textContent = sentence + (index < sentences.length - 1 ? '. ' : '');
            element.appendChild(span);
            
            // Add special highlighting for educational terms
            if (sentence.includes('important') || sentence.includes('key') || sentence.includes('main')) {
                span.classList.add('bg-yellow-100', 'px-1', 'rounded');
            }
        }, delay);
        delay += 200;
    });
}

// Enhanced event listeners
function initializeEventListeners() {
    elements.imageInput.addEventListener('change', handleImageSelect);
    elements.processBtn.addEventListener('click', processImage);
    elements.clearBtn.addEventListener('click', clearImage);
    elements.playAudioBtn.addEventListener('click', playMainAudio);
    elements.askBtn.addEventListener('click', askQuestion);
    
    elements.questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            askQuestion();
            e.preventDefault();
        }
    });

    // Enhanced drag and drop
    const uploadZone = document.querySelector('.upload-zone');
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('glow-effect', 'scale-105');
    });
    
    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('glow-effect', 'scale-105');
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('glow-effect', 'scale-105');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            elements.imageInput.files = files;
            handleImageSelect({ target: { files } });
        }
    });

    // Quick question buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-question')) {
            elements.questionInput.value = e.target.textContent;
            elements.questionInput.focus();
            askQuestion();
        }
    });
}

// Enhanced image handling
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        showError('File size must be less than 10MB');
        return;
    }

    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        elements.previewImg.src = e.target.result;
        elements.imagePreview.classList.remove('hidden');
        elements.imagePreview.classList.add('success-bounce');
        hideError();
        hideResults();
        
        // Trigger success sound/animation
        setTimeout(() => {
            elements.processBtn.classList.add('glow-effect');
        }, 500);
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    elements.imageInput.value = '';
    elements.imagePreview.classList.add('hidden');
    elements.processBtn.classList.remove('glow-effect');
    hideResults();
    hideError();
    hideProcessing();
    currentDescription = '';
    chatCount = 0;
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
}

// Enhanced image processing
async function processImage() {
    const file = elements.imageInput.files[0];
    if (!file) {
        showError('Please select an image first');
        return;
    }

    analysisStartTime = Date.now();
    showProcessing();
    hideError();
    hideResults();

    try {
        const base64Image = await fileToBase64(file);
        
        const response = await fetch(API_CONFIG.IMAGE_PROCESSOR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Image
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            displayResults(result);
            triggerSuccessAnimation();
        } else {
            throw new Error(result.error || 'Processing failed');
        }

    } catch (error) {
        console.error('Error processing image:', error);
        showError('Failed to process image. Please try again.');
    } finally {
        hideProcessing();
    }
}

function displayResults(result) {
    currentDescription = result.description;
    const analysisTime = ((Date.now() - analysisStartTime) / 1000).toFixed(1);
    
    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.classList.add('success-bounce');
    
    // Update stats
    elements.analysisTime.textContent = `${analysisTime}s`;
    elements.wordCount.textContent = result.description.split(' ').length;
    
    // Enhanced text display with streaming effect
    streamTextWithHighlights(result.description, elements.descriptionText);
    
    elements.chatHistory.innerHTML = '';
    
    // Setup audio if available
    if (result.audio_base64) {
        setupMainAudio(result.audio_base64);
        // Calculate approximate audio length
        const audioLength = Math.ceil(result.description.split(' ').length / 3); // ~3 words per second
        elements.audioLength.textContent = `${audioLength}s`;
    }
    
    // Scroll to results
    setTimeout(() => {
        elements.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 1000);
}

function setupMainAudio(audioBase64) {
    const audioBlob = base64ToBlob(audioBase64, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    elements.audioPlayer.src = audioUrl;
    elements.audioPlayer.style.display = 'block';
    
    elements.playAudioBtn.onclick = () => {
        if (currentAudio && !currentAudio.paused) {
            currentAudio.pause();
        }
        currentAudio = elements.audioPlayer;
        elements.audioPlayer.play();
        elements.playAudioBtn.innerHTML = '<i class="fas fa-pause mr-2"></i>🎧 Playing...';
    };
    
    elements.audioPlayer.onended = () => {
        elements.playAudioBtn.innerHTML = '<i class="fas fa-play mr-2"></i>🎧 Premium Audio';
    };
}

// Enhanced Q&A functionality
async function askQuestion() {
    const question = elements.questionInput.value.trim();
    if (!question) return;

    if (!currentDescription) {
        showError('Please process an image first');
        return;
    }

    chatCount++;
    addChatMessage(question, 'user');
    elements.questionInput.value = '';
    
    const loadingId = addChatMessage('🤔 AI is thinking...', 'ai', true);

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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        document.getElementById(loadingId).remove();
        
        if (result.success) {
            const messageId = addChatMessageStreaming(result.answer, 'ai');
            if (result.audio_base64) {
                addAudioToMessage(messageId, result.audio_base64);
            }
            
            // Trigger mini celebration for successful Q&A
            if (chatCount === 1) {
                setTimeout(() => {
                    confetti({
                        particleCount: 50,
                        spread: 45,
                        origin: { y: 0.8 },
                        colors: ['#10b981', '#059669']
                    });
                }, 1000);
            }
        } else {
            throw new Error(result.error || 'Failed to get answer');
        }

    } catch (error) {
        console.error('Error asking question:', error);
        document.getElementById(loadingId).remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
    }
}

function addChatMessage(message, sender, isLoading = false) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
        sender === 'user' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-800 border border-gray-200'
    }`;
    
    if (isLoading) {
        contentDiv.innerHTML = `<div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.1s;"></div>
            <div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
            <span class="ml-2">${message}</span>
        </div>`;
    } else {
        contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(contentDiv);
    elements.chatHistory.appendChild(messageDiv);
    
    // Smooth scroll to new message
    setTimeout(() => {
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
    
    return messageId;
}

function addChatMessageStreaming(message, sender) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-6`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `max-w-xs lg:max-w-md px-6 py-4 rounded-2xl shadow-lg ${
        sender === 'user' 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
            : 'bg-gradient-to-r from-gray-50 to-blue-50 text-gray-800 border border-gray-200'
    }`;
    
    messageDiv.appendChild(contentDiv);
    elements.chatHistory.appendChild(messageDiv);
    
    // Typewriter effect for AI responses
    typewriterEffect(message, contentDiv, 20);
    
    return messageId;
}

function addAudioToMessage(messageId, audioBase64) {
    setTimeout(() => {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('div');
        
        const audioContainer = document.createElement('div');
        audioContainer.className = 'mt-4 flex items-center space-x-3';
        
        const playButton = document.createElement('button');
        playButton.className = 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all transform hover:scale-105 shadow-md';
        playButton.innerHTML = '<i class="fas fa-headphones mr-2"></i>Listen';
        
        playButton.onclick = () => playMessageAudio(audioBase64, playButton);
        
        audioContainer.appendChild(playButton);
        contentDiv.appendChild(audioContainer);
        
        // Entrance animation
        audioContainer.style.opacity = '0';
        audioContainer.style.transform = 'translateY(10px)';
        setTimeout(() => {
            audioContainer.style.transition = 'all 0.5s ease';
            audioContainer.style.opacity = '1';
            audioContainer.style.transform = 'translateY(0)';
        }, 100);
        
    }, 2000);
}

function playMessageAudio(audioBase64, button) {
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
    }
    
    const audioBlob = base64ToBlob(audioBase64, 'audio/mp3');
    const audioUrl = URL.createObjectURL(audioBlob);
    
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    
    button.innerHTML = '<i class="fas fa-pause mr-2"></i>Playing...';
    button.disabled = true;
    
    audio.onended = () => {
        button.innerHTML = '<i class="fas fa-headphones mr-2"></i>Listen';
        button.disabled = false;
    };
    
    audio.play();
}

// Enhanced UI state management
function showProcessing() {
    elements.processingStatus.classList.remove('hidden');
    elements.processingStatus.classList.add('success-bounce');
}

function hideProcessing() {
    elements.processingStatus.classList.add('hidden');
}

function showResults() {
    elements.resultsSection.classList.remove('hidden');
}

function hideResults() {
    elements.resultsSection.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorDisplay.classList.remove('hidden');
    elements.errorDisplay.classList.add('success-bounce');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    elements.errorDisplay.classList.add('hidden');
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

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

// Initialize app with premium features
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    hideError();
    hideResults();
    hideProcessing();
    
    // Welcome animation
    setTimeout(() => {
        confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.3 },
            colors: ['#667eea', '#764ba2', '#f093fb'],
            shapes: ['star']
        });
    }, 1000);
    
    console.log('🚀 SeeWrite AI - Competition Winner Edition Loaded!');
    console.log('🏆 AWS Breaking Barriers Challenge - Premium Experience');
});