// Accessibility Enhancement Module
class AccessibilityManager {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        this.createAccessibilityPanel();
        this.applySettings();
        this.setupKeyboardNavigation();
        this.enhanceScreenReaderSupport();
    }

    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.className = 'accessibility-panel';
        panel.innerHTML = `
            <button class="accessibility-toggle" aria-label="Open accessibility settings">
                <i class="fas fa-universal-access"></i>
            </button>
            <div class="accessibility-content hidden">
                <h3>Accessibility Settings</h3>
                
                <div class="setting-group">
                    <label for="font-size">Font Size</label>
                    <select id="font-size" aria-describedby="font-size-desc">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xl">Extra Large</option>
                    </select>
                    <div id="font-size-desc" class="sr-only">Adjust text size for better readability</div>
                </div>

                <div class="setting-group">
                    <label for="contrast">Contrast</label>
                    <select id="contrast" aria-describedby="contrast-desc">
                        <option value="normal">Normal</option>
                        <option value="high">High Contrast</option>
                        <option value="dark">Dark Mode</option>
                    </select>
                    <div id="contrast-desc" class="sr-only">Change color contrast for better visibility</div>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="reduce-motion" aria-describedby="motion-desc">
                        Reduce Motion
                    </label>
                    <div id="motion-desc" class="sr-only">Minimize animations and transitions</div>
                </div>

                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="audio-descriptions" aria-describedby="audio-desc">
                        Audio Descriptions
                    </label>
                    <div id="audio-desc" class="sr-only">Enable detailed audio descriptions of visual elements</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.setupPanelEvents();
    }

    setupPanelEvents() {
        const toggle = document.querySelector('.accessibility-toggle');
        const content = document.querySelector('.accessibility-content');
        
        toggle.addEventListener('click', () => {
            content.classList.toggle('hidden');
            const isOpen = !content.classList.contains('hidden');
            toggle.setAttribute('aria-expanded', isOpen);
        });

        // Settings event listeners
        document.getElementById('font-size').addEventListener('change', (e) => {
            this.settings.fontSize = e.target.value;
            this.applyFontSize();
            this.saveSettings();
        });

        document.getElementById('contrast').addEventListener('change', (e) => {
            this.settings.contrast = e.target.value;
            this.applyContrast();
            this.saveSettings();
        });

        document.getElementById('reduce-motion').addEventListener('change', (e) => {
            this.settings.reduceMotion = e.target.checked;
            this.applyMotionSettings();
            this.saveSettings();
        });

        document.getElementById('audio-descriptions').addEventListener('change', (e) => {
            this.settings.audioDescriptions = e.target.checked;
            this.saveSettings();
        });
    }

    applySettings() {
        document.getElementById('font-size').value = this.settings.fontSize;
        document.getElementById('contrast').value = this.settings.contrast;
        document.getElementById('reduce-motion').checked = this.settings.reduceMotion;
        document.getElementById('audio-descriptions').checked = this.settings.audioDescriptions;

        this.applyFontSize();
        this.applyContrast();
        this.applyMotionSettings();
    }

    applyFontSize() {
        document.documentElement.className = document.documentElement.className.replace(/font-\w+/g, '');
        document.documentElement.classList.add(`font-${this.settings.fontSize}`);
    }

    applyContrast() {
        document.documentElement.className = document.documentElement.className.replace(/contrast-\w+/g, '');
        document.documentElement.classList.add(`contrast-${this.settings.contrast}`);
    }

    applyMotionSettings() {
        if (this.settings.reduceMotion) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }

    setupKeyboardNavigation() {
        // Skip to main content
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content landmark
        const main = document.querySelector('main');
        if (main) main.id = 'main-content';

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switch(e.key) {
                    case '1':
                        e.preventDefault();
                        document.getElementById('imageInput')?.focus();
                        this.announceToScreenReader('Image upload focused');
                        break;
                    case '2':
                        e.preventDefault();
                        document.getElementById('questionInput')?.focus();
                        this.announceToScreenReader('Question input focused');
                        break;
                    case 'a':
                        e.preventDefault();
                        document.querySelector('.accessibility-toggle')?.click();
                        break;
                }
            }
        });
    }

    enhanceScreenReaderSupport() {
        // Add ARIA live regions
        const liveRegion = document.createElement('div');
        liveRegion.id = 'live-region';
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);

        // Enhance existing elements
        this.addAriaLabels();
        this.setupProgressAnnouncements();
    }

    addAriaLabels() {
        // Image upload
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            imageInput.setAttribute('aria-describedby', 'upload-instructions');
            const instructions = document.createElement('div');
            instructions.id = 'upload-instructions';
            instructions.className = 'sr-only';
            instructions.textContent = 'Upload an educational image to receive detailed audio description and interactive Q&A';
            imageInput.parentNode.appendChild(instructions);
        }

        // Process button
        const processBtn = document.getElementById('processBtn');
        if (processBtn) {
            processBtn.setAttribute('aria-describedby', 'process-instructions');
            const instructions = document.createElement('div');
            instructions.id = 'process-instructions';
            instructions.className = 'sr-only';
            instructions.textContent = 'Analyze the uploaded image using AI to generate description and enable audio playback';
            processBtn.parentNode.appendChild(instructions);
        }

        // Chat area
        const chatHistory = document.getElementById('chatHistory');
        if (chatHistory) {
            chatHistory.setAttribute('role', 'log');
            chatHistory.setAttribute('aria-label', 'Conversation history');
            chatHistory.setAttribute('aria-live', 'polite');
        }
    }

    setupProgressAnnouncements() {
        // Override existing functions to add announcements
        const originalShowProcessing = window.showProcessing;
        window.showProcessing = () => {
            originalShowProcessing?.();
            this.announceToScreenReader('Processing image, please wait');
        };

        const originalHideProcessing = window.hideProcessing;
        window.hideProcessing = () => {
            originalHideProcessing?.();
            this.announceToScreenReader('Image processing complete');
        };
    }

    announceToScreenReader(message) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = message;
            setTimeout(() => liveRegion.textContent = '', 1000);
        }
    }

    describeVisualElement(element, description) {
        if (this.settings.audioDescriptions) {
            element.setAttribute('aria-describedby', element.id + '-description');
            const descElement = document.createElement('div');
            descElement.id = element.id + '-description';
            descElement.className = 'sr-only';
            descElement.textContent = description;
            element.parentNode.appendChild(descElement);
        }
    }

    loadSettings() {
        const defaults = {
            fontSize: 'medium',
            contrast: 'normal',
            reduceMotion: false,
            audioDescriptions: true
        };
        
        try {
            const saved = localStorage.getItem('accessibility-settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch {
            return defaults;
        }
    }

    saveSettings() {
        localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    }
}

// Initialize accessibility manager
document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
});