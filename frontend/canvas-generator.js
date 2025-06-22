// Intelligent Canvas Generator for Educational Content
class CanvasGenerator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentVisualization = null;
    }

    analyzeAndVisualize(text, container) {
        const analysis = this.analyzeContent(text);
        this.createVisualization(analysis, container);
    }

    analyzeContent(text) {
        const type = this.detectContentType(text);
        const elements = this.extractElements(text, type);
        
        return {
            type: type,
            elements: elements,
            relationships: this.findRelationships(elements, text),
            flow: this.determineFlow(text, type)
        };
    }

    detectContentType(text) {
        const patterns = {
            process: /\b(step|process|method|procedure|workflow)\b/gi,
            system: /\b(system|architecture|framework|structure)\b/gi,
            network: /\b(network|connection|node|link|protocol)\b/gi,
            hierarchy: /\b(level|tier|layer|hierarchy|top|bottom)\b/gi,
            comparison: /\b(versus|compared|difference|similar|contrast)\b/gi,
            cycle: /\b(cycle|circular|loop|repeat|continuous)\b/gi
        };

        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(text)) return type;
        }
        return 'concept';
    }

    extractElements(text, type) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const elements = [];

        sentences.forEach((sentence, index) => {
            const element = {
                id: index,
                text: sentence.trim(),
                keywords: this.extractKeywords(sentence),
                importance: this.calculateImportance(sentence),
                position: null
            };
            elements.push(element);
        });

        return elements.sort((a, b) => b.importance - a.importance).slice(0, 6);
    }

    extractKeywords(sentence) {
        const words = sentence.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
        const important = ['system', 'process', 'method', 'network', 'data', 'model', 'framework'];
        return words.filter(word => important.includes(word) || word.length > 6);
    }

    calculateImportance(sentence) {
        const keyTerms = ['framework', 'system', 'process', 'network', 'model', 'algorithm'];
        return keyTerms.reduce((score, term) => 
            score + (sentence.toLowerCase().includes(term) ? 1 : 0), 0);
    }

    findRelationships(elements, text) {
        const relationships = [];
        const connectWords = ['connects', 'leads to', 'results in', 'causes', 'enables', 'supports'];
        
        for (let i = 0; i < elements.length - 1; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const hasConnection = connectWords.some(word => 
                    text.toLowerCase().includes(word));
                if (hasConnection) {
                    relationships.push({ from: i, to: j, strength: 0.7 });
                }
            }
        }
        return relationships;
    }

    determineFlow(text, type) {
        const flows = {
            process: 'sequential',
            system: 'hierarchical',
            network: 'connected',
            hierarchy: 'vertical',
            comparison: 'parallel',
            cycle: 'circular'
        };
        return flows[type] || 'radial';
    }

    createVisualization(analysis, container) {
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'canvas-container';
        canvasContainer.innerHTML = `
            <div class="canvas-header">
                <h4><i class="fas fa-project-diagram"></i> Visual Understanding</h4>
                <div class="canvas-controls">
                    <button class="canvas-btn" data-type="diagram">Diagram</button>
                    <button class="canvas-btn" data-type="flowchart">Flow</button>
                    <button class="canvas-btn" data-type="mindmap">Mind Map</button>
                </div>
            </div>
            <canvas id="educational-canvas" width="600" height="400"></canvas>
            <div class="canvas-legend"></div>
        `;

        container.appendChild(canvasContainer);
        
        this.canvas = document.getElementById('educational-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.setupCanvasControls(canvasContainer, analysis);
        this.drawVisualization(analysis, 'diagram');
    }

    setupCanvasControls(container, analysis) {
        const buttons = container.querySelectorAll('.canvas-btn');
        buttons.forEach(btn => {
            btn.onclick = () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.drawVisualization(analysis, btn.dataset.type);
            };
        });
        buttons[0].classList.add('active');
    }

    drawVisualization(analysis, type) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        switch(type) {
            case 'diagram':
                this.drawSystemDiagram(analysis);
                break;
            case 'flowchart':
                this.drawFlowchart(analysis);
                break;
            case 'mindmap':
                this.drawMindMap(analysis);
                break;
        }
        
        this.updateLegend(analysis, type);
    }

    drawSystemDiagram(analysis) {
        const elements = analysis.elements;
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 120;

        // Draw connections first
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 2;
        analysis.relationships.forEach(rel => {
            const fromAngle = (rel.from / elements.length) * 2 * Math.PI;
            const toAngle = (rel.to / elements.length) * 2 * Math.PI;
            
            const fromX = centerX + Math.cos(fromAngle) * radius;
            const fromY = centerY + Math.sin(fromAngle) * radius;
            const toX = centerX + Math.cos(toAngle) * radius;
            const toY = centerY + Math.sin(toAngle) * radius;
            
            this.ctx.beginPath();
            this.ctx.moveTo(fromX, fromY);
            this.ctx.lineTo(toX, toY);
            this.ctx.stroke();
        });

        // Draw elements
        elements.forEach((element, index) => {
            const angle = (index / elements.length) * 2 * Math.PI;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.drawNode(x, y, element, index);
        });

        // Draw center concept
        this.drawCenterNode(centerX, centerY, analysis.type);
    }

    drawFlowchart(analysis) {
        const elements = analysis.elements;
        const startX = 50;
        const stepWidth = (this.canvas.width - 100) / Math.max(elements.length - 1, 1);
        const y = this.canvas.height / 2;

        elements.forEach((element, index) => {
            const x = startX + index * stepWidth;
            
            // Draw arrow to next element
            if (index < elements.length - 1) {
                this.drawArrow(x + 40, y, x + stepWidth - 40, y);
            }
            
            this.drawFlowNode(x, y, element, index);
        });
    }

    drawMindMap(analysis) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const elements = analysis.elements;

        // Draw center topic
        this.drawCenterNode(centerX, centerY, analysis.type);

        // Draw branches
        elements.forEach((element, index) => {
            const angle = (index / elements.length) * 2 * Math.PI;
            const branchLength = 80 + element.importance * 20;
            const endX = centerX + Math.cos(angle) * branchLength;
            const endY = centerY + Math.sin(angle) * branchLength;

            // Draw branch line
            this.ctx.strokeStyle = this.getColorForIndex(index);
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();

            // Draw branch node
            this.drawBranchNode(endX, endY, element, index);
        });
    }

    drawNode(x, y, element, index) {
        const radius = 25 + element.importance * 5;
        
        // Draw circle
        this.ctx.fillStyle = this.getColorForIndex(index);
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText((index + 1).toString(), x, y + 4);
    }

    drawFlowNode(x, y, element, index) {
        const width = 80;
        const height = 40;
        
        // Draw rectangle
        this.ctx.fillStyle = this.getColorForIndex(index);
        this.ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 11px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Step ${index + 1}`, x, y + 3);
    }

    drawCenterNode(x, y, type) {
        const radius = 35;
        
        // Draw circle
        this.ctx.fillStyle = '#667eea';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 12px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(type.toUpperCase(), x, y + 4);
    }

    drawBranchNode(x, y, element, index) {
        const width = 60;
        const height = 25;
        
        // Draw rounded rectangle
        this.ctx.fillStyle = this.getColorForIndex(index);
        this.ctx.beginPath();
        this.ctx.roundRect(x - width/2, y - height/2, width, height, 12);
        this.ctx.fill();
        
        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '10px Inter';
        this.ctx.textAlign = 'center';
        const shortText = element.keywords[0] || `Item ${index + 1}`;
        this.ctx.fillText(shortText.substring(0, 8), x, y + 3);
    }

    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Draw line
        this.ctx.strokeStyle = '#94a3b8';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        this.ctx.stroke();
        
        // Draw arrowhead
        this.ctx.beginPath();
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI/6), 
                        toY - headLength * Math.sin(angle - Math.PI/6));
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI/6), 
                        toY - headLength * Math.sin(angle + Math.PI/6));
        this.ctx.stroke();
    }

    getColorForIndex(index) {
        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        return colors[index % colors.length];
    }

    updateLegend(analysis, type) {
        const legend = document.querySelector('.canvas-legend');
        const items = analysis.elements.map((element, index) => 
            `<div class="legend-item">
                <span class="legend-color" style="background: ${this.getColorForIndex(index)}"></span>
                <span class="legend-text">${index + 1}. ${element.text.substring(0, 50)}...</span>
            </div>`
        ).join('');
        
        legend.innerHTML = `
            <div class="legend-title">${type.charAt(0).toUpperCase() + type.slice(1)} Elements:</div>
            ${items}
        `;
    }
}

// Initialize canvas generator
window.canvasGenerator = new CanvasGenerator();