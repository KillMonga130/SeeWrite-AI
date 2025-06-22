// Configuration - Live API Gateway endpoints
const API_CONFIG = {
    IMAGE_PROCESSOR_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/process-image',
    CHAT_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/chat',
    AUDIO_URL: 'https://jr9ip82s08.execute-api.us-east-1.amazonaws.com/prod/generate-audio'
};

// Global variables
let currentDescription = '';
let allAudioElements = [];

// DOM Elements
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const processingStatus = document.getElementById('processingStatus');
const resultsSection = document.getElementById('resultsSection');
const errorDisplay = document.getElementById('errorDisplay');
const errorMessage = document.getElementById('errorMessage');
const descriptionText = document.getElementById('descriptionText');
const audioPlayer = document.getElementById('audioPlayer');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const questionInput = document.getElementById('questionInput');
const askBtn = document.getElementById('askBtn');
const chatHistory = document.getElementById('chatHistory');

// Event Listeners
imageInput.addEventListener('change', handleImageSelect);
processBtn.addEventListener('click', processImage);
clearBtn.addEventListener('click', clearImage);
playBtn.addEventListener('click', playAudio);
pauseBtn.addEventListener('click', pauseAudio);
askBtn.addEventListener('click', askQuestion);
questionInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') askQuestion();
});

// Quick question buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('quick-question')) {
        questionInput.value = e.target.textContent;
        askQuestion();
    }
});

// Audio player events
audioPlayer.addEventListener('play', () => {
    playBtn.classList.add('hidden');
    pauseBtn.classList.remove('hidden');
});

audioPlayer.addEventListener('pause', () => {
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
});

audioPlayer.addEventListener('ended', () => {
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
});

// Functions
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
        previewImg.src = e.target.result;
        imagePreview.classList.remove('hidden');
        hideError();
        hideResults();
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    hideResults();
    hideError();
    hideProcessing();
}

async function processImage() {
    const file = imageInput.files[0];
    if (!file) {
        showError('Please select an image first');
        return;
    }

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
            displayResultsOptimized(result);
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

function displayResultsOptimized(result) {
    currentDescription = result.description;
    
    resultsSection.classList.remove('hidden');
    descriptionText.innerHTML = '';
    chatHistory.innerHTML = '';
    
    // Apply text enhancer with canvas visualization
    setTimeout(() => {
        if (window.textEnhancer) {
            console.log('✅ Applying enhanced text with canvas visualization');
            window.textEnhancer.enhanceText(result.description, descriptionText);
        } else {
            console.log('❌ Text enhancer not available, using fallback');
            streamTextPremium(result.description, descriptionText);
        }
    }, 100);
    
    setupOnDemandAudio(result.description);
}

function streamTextPremium(text, element) {
    element.innerHTML = '';
    const words = text.split(' ');
    let currentIndex = 0;
    
    function addNextWord() {
        if (currentIndex < words.length) {
            const word = words[currentIndex];
            const span = document.createElement('span');
            span.textContent = word;
            span.className = 'streaming-word';
            
            element.appendChild(span);
            
            // Add space after word (except last word)
            if (currentIndex < words.length - 1) {
                element.appendChild(document.createTextNode(' '));
            }
            
            // Animate in with stagger
            requestAnimationFrame(() => {
                span.classList.add('visible');
            });
            
            currentIndex++;
            setTimeout(addNextWord, 25);
        }
    }
    
    addNextWord();
}

function setupOnDemandAudio(text) {
    audioPlayer.src = '';
    playBtn.onclick = () => generateAndPlayAudio(text);
    playBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
}

async function askQuestion() {
    const question = questionInput.value.trim();
    if (!question) return;

    if (!currentDescription) {
        showError('Please process an image first');
        return;
    }

    addChatMessage(question, 'user');
    questionInput.value = '';
    
    const loadingId = addChatMessage('✨ Analyzing your question...', 'assistant', true);

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
            const messageId = addChatMessageStreaming(result.answer, 'assistant');
            addOnDemandAudioToMessage(messageId, result.answer);
        } else {
            throw new Error(result.error || 'Failed to get answer');
        }

    } catch (error) {
        console.error('Error asking question:', error);
        document.getElementById(loadingId).remove();
        addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
    }
}

function addChatMessage(message, sender, isLoading = false) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `chat-message flex ${sender === 'user' ? 'justify-end' : 'justify-start'} ${sender}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `message-bubble ${sender} px-4 py-2 rounded-lg`;
    
    if (isLoading) {
        contentDiv.innerHTML = `<i class="fas fa-sparkles fa-spin mr-2"></i>${message}`;
    } else {
        contentDiv.textContent = message;
    }
    
    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    return messageId;
}

function addChatMessageStreaming(message, sender) {
    const messageId = 'msg-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = messageId;
    messageDiv.className = `chat-message flex ${sender === 'user' ? 'justify-end' : 'justify-start'} ${sender}`;
    messageDiv.setAttribute('role', 'article');
    messageDiv.setAttribute('aria-label', `${sender === 'user' ? 'Your question' : 'AI response'}`);
    
    const contentDiv = document.createElement('div');
    contentDiv.className = `message-bubble ${sender} px-4 py-2 rounded-lg`;
    
    messageDiv.appendChild(contentDiv);
    chatHistory.appendChild(messageDiv);
    
    // Enhanced text for AI responses
    if (sender === 'assistant' && message.length > 50) {
        setTimeout(() => {
            if (window.textEnhancer) {
                console.log('✅ Applying text enhancer to Q&A response');
                window.textEnhancer.enhanceText(message, contentDiv);
            } else {
                console.log('❌ Text enhancer not available for Q&A, using fallback');
                typeTextPremium(message, contentDiv);
            }
        }, 1000);
    } else {
        typeTextPremium(message, contentDiv);
    }
    
    // Announce to screen reader
    if (window.accessibilityManager) {
        setTimeout(() => {
            window.accessibilityManager.announceToScreenReader(
                sender === 'user' ? 'Question sent' : 'AI response received'
            );
        }, 100);
    }
    
    return messageId;
}

function typeTextPremium(text, element) {
    element.innerHTML = '';
    let currentIndex = 0;
    
    function addNextChar() {
        if (currentIndex < text.length) {
            element.textContent += text[currentIndex];
            currentIndex++;
            
            chatHistory.scrollTop = chatHistory.scrollHeight;
            setTimeout(addNextChar, 15);
        }
    }
    
    addNextChar();
}

function addOnDemandAudioToMessage(messageId, text) {
    setTimeout(() => {
        const messageDiv = document.getElementById(messageId);
        if (!messageDiv) return;
        
        const contentDiv = messageDiv.querySelector('.message-bubble');
        if (!contentDiv) return;
        
        // Create audio button container
        const audioContainer = document.createElement('div');
        audioContainer.className = 'mt-3 audio-button-container';
        
        const playButton = document.createElement('button');
        playButton.className = 'premium-audio-btn';
        playButton.innerHTML = '<i class="fas fa-headphones" aria-hidden="true"></i><span>Listen to Response</span>';
        playButton.setAttribute('aria-label', 'Generate and play audio version of this response');
        
        playButton.onclick = () => generateChatAudioPremium(text, audioContainer);
        
        audioContainer.appendChild(playButton);
        contentDiv.appendChild(audioContainer);
        
        // Announce audio availability
        if (window.accessibilityManager) {
            window.accessibilityManager.announceToScreenReader('Audio option available for this response');
        }
        
        // Smooth entrance animation
        audioContainer.style.opacity = '0';
        audioContainer.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
            audioContainer.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            audioContainer.style.opacity = '1';
            audioContainer.style.transform = 'translateY(0)';
        });
        
    }, 3000);
}

async function generateChatAudioPremium(text, container) {
    const button = container.querySelector('.premium-audio-btn');
    
    try {
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creating...</span>';
        button.disabled = true;
        
        const response = await fetch(API_CONFIG.AUDIO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const audioBlob = base64ToBlob(result.audio_base64, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audioElement = document.createElement('audio');
            audioElement.src = audioUrl;
            audioElement.controls = true;
            audioElement.className = 'w-full mt-2';
            
            allAudioElements.push(audioElement);
            audioElement.addEventListener('play', stopOtherAudio);
            
            container.innerHTML = '';
            container.appendChild(audioElement);
            
            setTimeout(() => {
                audioElement.play().catch(e => console.log('Auto-play prevented:', e));
            }, 300);
            
        } else {
            throw new Error(result.error || 'Audio generation failed');
        }
    } catch (error) {
        console.error('Error generating audio:', error);
        button.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Retry</span>';
        button.disabled = false;
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-headphones"></i><span>Listen to Response</span>';
        }, 2000);
    }
}

async function generateAndPlayAudio(text) {
    try {
        playBtn.innerHTML = '<i class="fas fa-magic fa-spin"></i>';
        playBtn.disabled = true;
        playBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
        
        // Progress indicator
        const progressBar = document.createElement('div');
        progressBar.className = 'premium-progress-bar';
        progressBar.innerHTML = '<div class="progress-fill"></div>';
        playBtn.parentElement.appendChild(progressBar);
        
        setTimeout(() => {
            progressBar.querySelector('.progress-fill').style.width = '100%';
        }, 100);
        
        const response = await fetch(API_CONFIG.AUDIO_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const audioBlob = base64ToBlob(result.audio_base64, 'audio/mp3');
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            
            if (!allAudioElements.includes(audioPlayer)) {
                allAudioElements.push(audioPlayer);
            }
            
            audioPlayer.addEventListener('play', stopOtherAudio);
            
            // Success animation
            progressBar.remove();
            playBtn.innerHTML = '<i class="fas fa-check"></i>';
            playBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            
            setTimeout(() => {
                audioPlayer.play();
            }, 300);
        } else {
            throw new Error(result.error || 'Audio generation failed');
        }
    } catch (error) {
        console.error('Error generating audio:', error);
        
        const progressBar = playBtn.parentElement.querySelector('.premium-progress-bar');
        if (progressBar) progressBar.remove();
        
        playBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
        playBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        setTimeout(() => {
            playBtn.innerHTML = '<i class="fas fa-magic"></i>';
            playBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
            playBtn.disabled = false;
        }, 2000);
    }
}

function playAudio() {
    if (audioPlayer.src) {
        audioPlayer.play();
    }
}

function pauseAudio() {
    audioPlayer.pause();
}

function stopOtherAudio(event) {
    const currentAudio = event.target;
    allAudioElements.forEach(audio => {
        if (audio !== currentAudio && !audio.paused) {
            audio.pause();
        }
    });
}

function showProcessing() {
    processingStatus.classList.remove('hidden');
}

function hideProcessing() {
    processingStatus.classList.add('hidden');
}

function showResults() {
    resultsSection.classList.remove('hidden');
}

function hideResults() {
    resultsSection.classList.add('hidden');
}

function showError(message) {
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
}

function hideError() {
    errorDisplay.classList.add('hidden');
}

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

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 SeeWrite AI - Ultimate Premium Experience Loaded');
    hideError();
    hideResults();
    hideProcessing();
    
    // Add keyboard support for file input label
    const fileLabel = document.querySelector('label[for="imageInput"]');
    if (fileLabel) {
        fileLabel.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('imageInput').click();
            }
        });
    }
    
    // Announce app ready
    setTimeout(() => {
        if (window.accessibilityManager) {
            window.accessibilityManager.announceToScreenReader('SeeWrite AI application loaded and ready for use');
        }
    }, 1000);
});