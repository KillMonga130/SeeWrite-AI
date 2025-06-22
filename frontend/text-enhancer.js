// Intelligent Text Enhancement Engine
class TextEnhancer {
    constructor() {
        this.definitions = {
            '6G': 'Sixth generation wireless technology with ultra-low latency',
            'AI': 'Artificial Intelligence - computer systems that mimic human intelligence',
            'ML': 'Machine Learning - AI systems that learn from data',
            'IoT': 'Internet of Things - network of connected devices',
            'API': 'Application Programming Interface - software communication protocol',
            'framework': 'Structured approach or system for organizing work',
            'algorithm': 'Step-by-step procedure for solving problems',
            'model': 'Mathematical representation of a real-world process',
            'network': 'Interconnected system of components',
            'system': 'Organized set of components working together'
        };
        this.userLevel = localStorage.getItem('user-level') || 'intermediate';
    }

    enhanceText(text, container) {
        const analysis = this.analyzeText(text);
        this.renderEnhancedContent(analysis, container);
        this.addInteractivity(container, analysis);
        
        // Add visual understanding
        setTimeout(() => {
            const visualSection = container.querySelector('.visual-section');
            if (visualSection && window.canvasGenerator) {
                window.canvasGenerator.analyzeAndVisualize(text, visualSection);
            }
        }, 1000);
    }

    analyzeText(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        
        return {
            original: text,
            summary: this.extractSummary(sentences),
            keyTerms: this.identifyKeyTerms(text),
            concepts: this.extractConcepts(sentences),
            questions: this.generateSmartQuestions(text),
            actionItems: this.extractActionItems(text),
            complexity: this.assessComplexity(words)
        };
    }

    extractSummary(sentences) {
        // Find the most informative sentence (usually the first or one with key terms)
        const scored = sentences.map(s => ({
            text: s.trim(),
            score: this.scoreSentence(s)
        })).sort((a, b) => b.score - a.score);
        
        return scored[0]?.text + '.' || 'Key information extracted from the content.';
    }

    scoreSentence(sentence) {
        const keyWords = ['framework', 'system', 'process', 'method', 'approach', 'technology'];
        return keyWords.reduce((score, word) => 
            score + (sentence.toLowerCase().includes(word) ? 1 : 0), 0);
    }

    identifyKeyTerms(text) {
        const acronyms = text.match(/\b[A-Z]{2,}\b/g) || [];
        const technicalTerms = text.match(/\b(framework|algorithm|model|system|network|process|method)\b/gi) || [];
        const numbers = text.match(/\b\d+[A-Z]?\b/g) || [];
        
        return [...new Set([...acronyms, ...technicalTerms, ...numbers])].slice(0, 6);
    }

    extractConcepts(sentences) {
        return sentences.slice(0, 3).map((sentence, i) => ({
            title: this.generateConceptTitle(sentence),
            content: sentence.trim() + '.',
            importance: 3 - i
        }));
    }

    generateConceptTitle(sentence) {
        const words = sentence.split(' ').filter(w => w.length > 3);
        const important = words.find(w => /^[A-Z]/.test(w)) || words[0] || 'Concept';
        return important.charAt(0).toUpperCase() + important.slice(1).toLowerCase();
    }

    generateSmartQuestions(text) {
        const questions = [];
        
        if (text.includes('framework') || text.includes('system')) {
            questions.push('How does this system work in practice?');
        }
        if (text.includes('process') || text.includes('method')) {
            questions.push('What are the key steps involved?');
        }
        if (text.includes('technology') || text.includes('innovation')) {
            questions.push('What makes this approach innovative?');
        }
        if (text.includes('test') || text.includes('evaluation')) {
            questions.push('How is effectiveness measured?');
        }
        
        return questions.length > 0 ? questions.slice(0, 3) : [
            'What are the main benefits?',
            'How does this compare to alternatives?',
            'What are potential challenges?'
        ];
    }

    extractActionItems(text) {
        const actions = [];
        
        if (text.includes('develop') || text.includes('create')) {
            actions.push('Consider development opportunities');
        }
        if (text.includes('test') || text.includes('evaluate')) {
            actions.push('Plan testing and validation');
        }
        if (text.includes('implement') || text.includes('deploy')) {
            actions.push('Explore implementation strategies');
        }
        if (text.includes('optimize') || text.includes('improve')) {
            actions.push('Identify optimization areas');
        }
        
        return actions.slice(0, 3);
    }

    assessComplexity(words) {
        const complexWords = words.filter(w => w.length > 8).length;
        const ratio = complexWords / words.length;
        
        if (ratio > 0.15) return 'advanced';
        if (ratio > 0.08) return 'intermediate';
        return 'beginner';
    }

    renderEnhancedContent(analysis, container) {
        container.innerHTML = `
            <div class="enhanced-content">
                <!-- Summary Card -->
                <div class="summary-card">
                    <h4><i class="fas fa-lightbulb"></i> Key Insight</h4>
                    <p>${analysis.summary}</p>
                </div>

                <!-- Key Terms -->
                <div class="key-terms-section">
                    <h4><i class="fas fa-tags"></i> Important Terms</h4>
                    <div class="terms-grid">
                        ${analysis.keyTerms.map(term => 
                            `<span class="key-term" data-term="${term}">${term}</span>`
                        ).join('')}
                    </div>
                </div>

                <!-- Concepts -->
                <div class="concepts-section">
                    <h4><i class="fas fa-brain"></i> Key Concepts</h4>
                    ${analysis.concepts.map((concept, i) => `
                        <div class="concept-item" data-concept="${i}">
                            <div class="concept-header">
                                <span class="concept-title">${concept.title}</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="concept-content hidden">
                                ${this.highlightText(concept.content)}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Visual Understanding -->
                <div class="visual-section" id="visual-section-${Date.now()}">
                    <!-- Canvas will be inserted here -->
                </div>

                <!-- Smart Questions -->
                <div class="questions-section">
                    <h4><i class="fas fa-question-circle"></i> Explore Further</h4>
                    <div class="questions-list">
                        ${analysis.questions.map(q => 
                            `<button class="smart-question" data-question="${q}">${q}</button>`
                        ).join('')}
                    </div>
                </div>

                ${analysis.actionItems.length > 0 ? `
                    <div class="actions-section">
                        <h4><i class="fas fa-tasks"></i> Next Steps</h4>
                        <ul class="actions-list">
                            ${analysis.actionItems.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Learning Controls -->
                <div class="learning-controls">
                    <div class="complexity-indicator">
                        <span class="complexity-label">Content Level:</span>
                        <span class="complexity-badge complexity-${analysis.complexity}">${analysis.complexity}</span>
                    </div>
                    <select class="level-selector">
                        <option value="beginner">Beginner Explanation</option>
                        <option value="intermediate" selected>Standard Detail</option>
                        <option value="advanced">Technical Depth</option>
                    </select>
                </div>
            </div>
        `;
    }

    highlightText(text) {
        return text
            .replace(/\b([A-Z]{2,})\b/g, '<span class="highlight-acronym" data-term="$1">$1</span>')
            .replace(/\b(\d+[A-Z]?)\b/g, '<span class="highlight-number">$1</span>')
            .replace(/\b(framework|algorithm|model|system|network|process|method)\b/gi, 
                '<span class="highlight-concept">$1</span>');
    }

    addInteractivity(container, analysis) {
        // Expandable concepts - WORKING
        container.querySelectorAll('.concept-item').forEach((item, index) => {
            const header = item.querySelector('.concept-header');
            const content = item.querySelector('.concept-content');
            const icon = item.querySelector('i');
            
            if (header && content && icon) {
                header.onclick = (e) => {
                    e.preventDefault();
                    content.classList.toggle('hidden');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                    console.log(`Concept ${index + 1} toggled`);
                };
                header.style.cursor = 'pointer';
            }
        });

        // Key terms with definitions - WORKING
        container.querySelectorAll('.key-term, .highlight-acronym').forEach(term => {
            if (term) {
                term.onclick = (e) => {
                    e.preventDefault();
                    const termText = term.dataset.term || term.textContent.trim();
                    const definition = this.definitions[termText] || 
                        `${termText}: Technical term used in this context`;
                    this.showTooltip(term, definition);
                    console.log(`Definition shown for: ${termText}`);
                };
                term.style.cursor = 'pointer';
                term.title = 'Click for definition';
            }
        });

        // Smart questions - WORKING
        container.querySelectorAll('.smart-question').forEach((btn, index) => {
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const question = btn.dataset.question || btn.textContent.trim();
                    const questionInput = document.getElementById('questionInput');
                    const askBtn = document.getElementById('askBtn');
                    
                    if (questionInput && askBtn && question) {
                        questionInput.value = question;
                        questionInput.focus();
                        console.log(`Question set: ${question}`);
                        
                        // Auto-submit after short delay
                        setTimeout(() => {
                            if (typeof askQuestion === 'function') {
                                askQuestion();
                            } else {
                                askBtn.click();
                            }
                        }, 500);
                    }
                };
                btn.style.cursor = 'pointer';
            }
        });

        // Level selector - WORKING
        const selector = container.querySelector('.level-selector');
        if (selector) {
            selector.value = this.userLevel;
            selector.onchange = (e) => {
                e.preventDefault();
                this.userLevel = e.target.value;
                localStorage.setItem('user-level', this.userLevel);
                this.adjustContentLevel(container, this.userLevel);
                console.log(`Level changed to: ${this.userLevel}`);
            };
        }

        // Highlight interactions - WORKING
        container.querySelectorAll('.highlight-concept, .highlight-number').forEach(highlight => {
            if (highlight) {
                highlight.onclick = (e) => {
                    e.preventDefault();
                    const text = highlight.textContent.trim();
                    this.showTooltip(highlight, `${text}: Key element in this context`);
                    console.log(`Highlight clicked: ${text}`);
                };
                highlight.style.cursor = 'pointer';
                highlight.title = 'Click for more info';
            }
        });
    }

    showTooltip(element, text) {
        // Remove existing tooltips
        document.querySelectorAll('.smart-tooltip').forEach(t => t.remove());
        
        if (!element || !text) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'smart-tooltip';
        tooltip.textContent = text;
        
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        tooltip.style.position = 'absolute';
        tooltip.style.top = (rect.bottom + scrollTop + 8) + 'px';
        tooltip.style.left = (rect.left + scrollLeft) + 'px';
        tooltip.style.zIndex = '10000';
        tooltip.style.maxWidth = '300px';
        tooltip.style.wordWrap = 'break-word';
        
        document.body.appendChild(tooltip);
        
        // Click anywhere to close
        const closeTooltip = (e) => {
            if (!tooltip.contains(e.target)) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeTooltip);
        }, 100);
        
        // Auto-remove after 6 seconds
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
                document.removeEventListener('click', closeTooltip);
            }
        }, 6000);
    }

    adjustContentLevel(container, level) {
        const indicator = container.querySelector('.complexity-badge');
        if (indicator) {
            indicator.textContent = level.charAt(0).toUpperCase() + level.slice(1);
            indicator.className = `complexity-badge complexity-${level}`;
        }
        
        // Transform content based on level
        this.transformContentForLevel(container, level);
        
        // Show visual feedback
        const levelMsg = {
            'beginner': 'Simple explanations, larger text, basic terms',
            'intermediate': 'Balanced detail with moderate complexity',
            'advanced': 'Technical depth, compact layout, full terminology'
        };
        
        this.showTooltip(indicator, levelMsg[level] || 'Content level adjusted');
    }
    
    transformContentForLevel(container, level) {
        const concepts = container.querySelectorAll('.concept-content');
        const questions = container.querySelectorAll('.smart-question');
        const terms = container.querySelectorAll('.key-term');
        const highlights = container.querySelectorAll('.highlight-acronym, .highlight-concept');
        
        if (level === 'beginner') {
            // Beginner: Simple language, larger text, fewer technical terms
            concepts.forEach(concept => {
                concept.style.fontSize = '17px';
                concept.style.lineHeight = '2.0';
                concept.style.fontWeight = '400';
                concept.style.padding = '20px';
                
                // Simplify text content
                let text = concept.textContent;
                text = text.replace(/framework/gi, 'system');
                text = text.replace(/algorithm/gi, 'method');
                text = text.replace(/implementation/gi, 'setup');
                text = text.replace(/optimization/gi, 'improvement');
                concept.innerHTML = this.highlightText(text);
            });
            
            // Show only basic questions
            questions.forEach((q, i) => {
                if (i < 2) {
                    q.style.display = 'block';
                    q.style.fontSize = '15px';
                } else {
                    q.style.display = 'none';
                }
            });
            
            // Hide complex terms
            highlights.forEach(h => {
                if (h.textContent.length > 8) {
                    h.style.opacity = '0.6';
                }
            });
            
        } else if (level === 'advanced') {
            // Advanced: Technical language, compact layout, all terms visible
            concepts.forEach(concept => {
                concept.style.fontSize = '14px';
                concept.style.lineHeight = '1.5';
                concept.style.fontWeight = '500';
                concept.style.padding = '14px';
                
                // Add technical details
                let text = concept.textContent;
                if (!text.includes('implementation')) {
                    text = text.replace(/setup/gi, 'implementation');
                    text = text.replace(/system/gi, 'framework architecture');
                    text = text.replace(/method/gi, 'algorithmic approach');
                    concept.innerHTML = this.highlightText(text);
                }
            });
            
            // Show all questions
            questions.forEach(q => {
                q.style.display = 'block';
                q.style.fontSize = '13px';
            });
            
            // Highlight all technical terms
            highlights.forEach(h => {
                h.style.opacity = '1';
                h.style.fontWeight = '600';
            });
            
        } else {
            // Intermediate: Balanced approach
            concepts.forEach(concept => {
                concept.style.fontSize = '15px';
                concept.style.lineHeight = '1.7';
                concept.style.fontWeight = '400';
                concept.style.padding = '16px';
            });
            
            questions.forEach(q => {
                q.style.display = 'block';
                q.style.fontSize = '14px';
            });
            
            highlights.forEach(h => {
                h.style.opacity = '1';
                h.style.fontWeight = '500';
            });
        }
        
        // Update definitions based on level
        this.updateDefinitionsForLevel(level);
    }
    
    updateDefinitionsForLevel(level) {
        if (level === 'beginner') {
            this.definitions = {
                ...this.definitions,
                'framework': 'A basic structure or system for organizing work',
                'algorithm': 'A set of simple steps to solve a problem',
                'model': 'A simple representation of how something works',
                'system': 'A group of parts working together',
                'network': 'Connected devices that can communicate'
            };
        } else if (level === 'advanced') {
            this.definitions = {
                ...this.definitions,
                'framework': 'Structured architectural approach providing foundational components and design patterns',
                'algorithm': 'Computational procedure with defined input/output specifications and complexity analysis',
                'model': 'Mathematical abstraction representing system behavior with quantifiable parameters',
                'system': 'Integrated architecture with defined interfaces, protocols, and operational constraints',
                'network': 'Distributed infrastructure with topology, routing protocols, and performance metrics'
            };
        } else {
            // Reset to intermediate definitions
            this.definitions = {
                '6G': 'Sixth generation wireless technology with ultra-low latency',
                'AI': 'Artificial Intelligence - computer systems that mimic human intelligence',
                'ML': 'Machine Learning - AI systems that learn from data',
                'IoT': 'Internet of Things - network of connected devices',
                'API': 'Application Programming Interface - software communication protocol',
                'framework': 'Structured approach or system for organizing work',
                'algorithm': 'Step-by-step procedure for solving problems',
                'model': 'Mathematical representation of a real-world process',
                'network': 'Interconnected system of components',
                'system': 'Organized set of components working together'
            };
        }
    }
}

// Initialize with intelligent loading
document.addEventListener('DOMContentLoaded', () => {
    window.textEnhancer = new TextEnhancer();
    console.log('🧠 Intelligent Text Enhancer loaded');
});