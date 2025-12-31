class HorionLikeArrayList {
    constructor(selector, options = {}) {
        this.parentElement = document.querySelector(selector);
        if (!this.parentElement) {
            throw new Error(`Element with selector '${selector}' not found`);
        }
        this._font = options.font || 'inherit';
        this._bottom = options.bottom || false;
        this._rainbow_flow_speed = options.rainbow_flow_speed !== undefined ? options.rainbow_flow_speed : 2;
        this._opacity = options.opacity !== undefined ? options.opacity : 1.0;
        this._scale = options.scale !== undefined ? options.scale : 1.0;
        this._font_size = options.font_size !== undefined ? options.font_size : 16.0;
        this._border_width = options.border_width !== undefined ? options.border_width : 3.0;
        this._colors = options.colors || {
            visual: '#7FE566',
            movement: '#FF994C',
            player: '#1999E5',
            world: '#E57FE5',
            misc: '#FFE54C',
            combat: '#E53333'
        };
        this._color = options.color || 'rainbow';
        this._slideAnimDisabled = options.slideAnimDisabled || false;

        this.container = document.createElement('div');
        this.container.className = 'horionlike-arraylist-container';
        this.listContainer = document.createElement('div');
        this.listContainer.className = 'horionlike-arraylist-list';
        this.container.appendChild(this.listContainer);
        this.parentElement.appendChild(this.container);
        this.features = [];
        this.animatingItems = new Set();
        this.rainbowColors = [
            '#FF0000', '#FF7F00', '#FFFF00',
            '#00FF00', '#0000FF', '#4B0082',
            '#9400D3'
        ];
        this.rainbowOffset = 0;
        this.lastAnimationTime = 0;
        this.applyConfigStyles();
        this.updateAnimationSpeed();
        this.startAnimation();
    }
    get font() { return this._font; }
    set font(value) {
        this._font = value;
        this.container.style.fontFamily = value;
    }
    get bottom() { return this._bottom; }
    set bottom(value) {
        this._bottom = value;
        this.container.classList.toggle('bottom', value);
        this.updateListOrder();
    }
    get rainbow_flow_speed() { return this._rainbow_flow_speed; }
    set rainbow_flow_speed(value) {
        this._rainbow_flow_speed = Math.max(0.1, value);
        this.updateAnimationSpeed();
    }
    get opacity() { return this._opacity; }
    set opacity(value) {
        this._opacity = Math.min(1, Math.max(0, value));
        this.container.style.opacity = this._opacity;
    }
    get scale() { return this._scale; }
    set scale(value) {
        this._scale = Math.min(1.5, Math.max(0.5, value));
        this.container.style.transform = `scale(${this._scale})`;
    }
    get font_size() { return this._font_size; }
    set font_size(value) {
        this._font_size = Math.min(24, Math.max(8, value));
        this.container.style.fontSize = `${this._font_size}px`;
    }
    get border_width() { return this._border_width; }
    set border_width(value) {
        this._border_width = Math.min(10, Math.max(1, value));
        const lines = this.listContainer.querySelectorAll('.horionlike-arraylist-line');
        lines.forEach(line => {
            line.style.width = `${this._border_width}px`;
        });
    }
    get colors() { return this._colors; }
    set colors(value) {
        this._colors = value;
        this.updateRainbowEffect();
    }
    get color() { return this._color; }
    set color(value) {
        this._color = value;
        this.updateRainbowEffect();
    }
    updateAnimationSpeed() {
        this.animationSpeed = 0.01 * this._rainbow_flow_speed;
    }
    applyConfigStyles() {
        this.font = this._font;
        this.bottom = this._bottom;
        this.opacity = this._opacity;
        this.scale = this._scale;
        this.font_size = this._font_size;
        this.border_width = this._border_width;
    }
    startAnimation() {
        const animate = (timestamp) => {
            if (!this.lastAnimationTime) this.lastAnimationTime = timestamp;
            const deltaTime = timestamp - this.lastAnimationTime;
            this.lastAnimationTime = timestamp;
            if (deltaTime > 0) {
                this.rainbowOffset = (this.rainbowOffset + this.animationSpeed * deltaTime / 16) % this.rainbowColors.length;
                this.updateRainbowEffect();
            }
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
    updateRainbowEffect() {
        const items = Array.from(this.listContainer.querySelectorAll('.horionlike-arraylist-item'))
            .filter(item => !this.animatingItems.has(item));
        items.forEach((item, index) => {
            const feature = this.features.find(f => f.name === item.dataset.name);
            if (!feature) return;

            const line = item.querySelector('.horionlike-arraylist-line');
            const text = item.querySelector('.horionlike-arraylist-text');

            let color;
            if (this._color === 'rainbow') {
                let colorIndex;
                if (this._bottom) {
                    colorIndex = (items.length - 1 - index + this.rainbowOffset) % this.rainbowColors.length;
                } else {
                    colorIndex = (index + this.rainbowOffset) % this.rainbowColors.length;
                }
                const color1 = this.rainbowColors[Math.floor(colorIndex) % this.rainbowColors.length];
                const color2 = this.rainbowColors[Math.ceil(colorIndex) % this.rainbowColors.length];
                const ratio = colorIndex - Math.floor(colorIndex);
                const r1 = parseInt(color1.substring(1, 3), 16);
                const g1 = parseInt(color1.substring(3, 5), 16);
                const b1 = parseInt(color1.substring(5, 7), 16);
                const r2 = parseInt(color2.substring(1, 3), 16);
                const g2 = parseInt(color2.substring(3, 5), 16);
                const b2 = parseInt(color2.substring(5, 7), 16);
                const r = Math.round(r1 + (r2 - r1) * ratio).toString(16).padStart(2, '0');
                const g = Math.round(g1 + (g2 - g1) * ratio).toString(16).padStart(2, '0');
                const b = Math.round(b1 + (b2 - b1) * ratio).toString(16).padStart(2, '0');
                color = `#${r}${g}${b}`;
            } else if (this._color === 'categorized' && feature.category && this._colors[feature.category]) {
                color = this._colors[feature.category];
            } else if (this._color.startsWith('#')) {
                color = this._color;
            } else {
                color = '#FFFFFF';
            }

            line.style.backgroundColor = color;
            text.style.color = color;
        });
    }
    calculateTextWidth(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${this._font_size}px ${this._font}`;
        return context.measureText(text).width;
    }
    enable(featureName, displayName = null, category = null) {
        const existingIndex = this.features.findIndex(f => f.name === featureName);
        if (existingIndex >= 0) {
            if (!this.features[existingIndex].enabled) {
                this.features[existingIndex].enabled = true;
                this.features[existingIndex].timestamp = Date.now();
            }
            if (displayName !== null) {
                this.features[existingIndex].displayName = displayName;
            }
            if (category !== null) {
                this.features[existingIndex].category = category;
            }
        } else {
            this.features.push({
                name: featureName,
                displayName: displayName || featureName,
                category: category,
                enabled: true,
                timestamp: Date.now()
            });
        }
        this.updateListOrder();
        const item = this.listContainer.querySelector(`.horionlike-arraylist-item[data-name="${featureName}"]`);
        if (item) {
            const line = item.querySelector('.horionlike-arraylist-line');
            const text = item.querySelector('.horionlike-arraylist-text');
            const feature = this.features.find(f => f.name === featureName);
            if (feature) {
                let color;
                if (this._color === 'rainbow') {
                    const items = Array.from(this.listContainer.querySelectorAll('.horionlike-arraylist-item'))
                        .filter(i => !this.animatingItems.has(i));
                    const itemIndex = items.indexOf(item);
                    if (itemIndex >= 0) {
                        let colorIndex;
                        if (this._bottom) {
                            colorIndex = (items.length - 1 - itemIndex + this.rainbowOffset) % this.rainbowColors.length;
                        } else {
                            colorIndex = (itemIndex + this.rainbowOffset) % this.rainbowColors.length;
                        }
                        const color1 = this.rainbowColors[Math.floor(colorIndex) % this.rainbowColors.length];
                        const color2 = this.rainbowColors[Math.ceil(colorIndex) % this.rainbowColors.length];
                        const ratio = colorIndex - Math.floor(colorIndex);
                        const r1 = parseInt(color1.substring(1, 3), 16);
                        const g1 = parseInt(color1.substring(3, 5), 16);
                        const b1 = parseInt(color1.substring(5, 7), 16);
                        const r2 = parseInt(color2.substring(1, 3), 16);
                        const g2 = parseInt(color2.substring(3, 5), 16);
                        const b2 = parseInt(color2.substring(5, 7), 16);
                        const r = Math.round(r1 + (r2 - r1) * ratio).toString(16).padStart(2, '0');
                        const g = Math.round(g1 + (g2 - g1) * ratio).toString(16).padStart(2, '0');
                        const b = Math.round(b1 + (b2 - b1) * ratio).toString(16).padStart(2, '0');
                        color = `#${r}${g}${b}`;
                    }
                } else if (this._color === 'categorized' && feature.category && this._colors[feature.category]) {
                    color = this._colors[feature.category];
                } else if (this._color.startsWith('#')) {
                    color = this._color;
                } else {
                    color = '#FFFFFF';
                }
                line.style.backgroundColor = color;
                text.style.color = color;
            }
        }
    }
    disable(featureName) {
        const featureIndex = this.features.findIndex(f => f.name === featureName);
        if (featureIndex >= 0) {
            this.features[featureIndex].enabled = false;
            const itemToDisable = this.listContainer.querySelector(`.horionlike-arraylist-item[data-name="${featureName}"]`);
            if (itemToDisable) {
                if (this._slideAnimDisabled) {
                    this.listContainer.removeChild(itemToDisable);
                    this.updateListOrder();
                } else {
                    this.animatingItems.add(itemToDisable);
                    itemToDisable.classList.add('horionlike-arraylist-removing');
                    setTimeout(() => {
                        if (itemToDisable.parentNode === this.listContainer) {
                            this.listContainer.removeChild(itemToDisable);
                        }
                        this.animatingItems.delete(itemToDisable);
                        this.updateListOrder();
                    }, 200);
                }
            }
        }
    }
    updateListOrder() {
        const enabledFeatures = this.features.filter(f => f.enabled);
        if (this._bottom) {
            enabledFeatures.sort((a, b) => {
                const widthA = this.calculateTextWidth(a.displayName);
                const widthB = this.calculateTextWidth(b.displayName);
                if (widthA !== widthB) {
                    return widthA - widthB;
                }
                return b.timestamp - a.timestamp;
            });
        } else {
            enabledFeatures.sort((a, b) => {
                const widthA = this.calculateTextWidth(a.displayName);
                const widthB = this.calculateTextWidth(b.displayName);
                if (widthA !== widthB) {
                    return widthB - widthA;
                }
                return a.timestamp - b.timestamp;
            });
        }
        const currentItems = Array.from(this.listContainer.querySelectorAll('.horionlike-arraylist-item:not(.horionlike-arraylist-removing)'));
        const newItemsOrder = [];
        enabledFeatures.forEach(feature => {
            const existingItem = currentItems.find(item => item.dataset.name === feature.name);
            if (existingItem) {
                newItemsOrder.push(existingItem);
            } else {
                const item = document.createElement('div');
                item.className = this._slideAnimDisabled ? 'horionlike-arraylist-item' : 'horionlike-arraylist-item horionlike-arraylist-new';
                item.dataset.name = feature.name;
                const line = document.createElement('div');
                line.className = 'horionlike-arraylist-line';
                line.style.width = `${this._border_width}px`;
                const text = document.createElement('div');
                text.className = 'horionlike-arraylist-text';
                text.textContent = feature.displayName;
                text.style.padding = '0 3px';
                item.appendChild(line);
                item.appendChild(text);
                newItemsOrder.push(item);
                if (!this._slideAnimDisabled) {
                    this.animatingItems.add(item);
                    setTimeout(() => {
                        item.classList.remove('horionlike-arraylist-new');
                        this.animatingItems.delete(item);
                    }, 200);
                }
            }
        });
        this.listContainer.innerHTML = '';
        newItemsOrder.forEach(item => {
            this.listContainer.appendChild(item);
        });
    }
    show() {
        this.container.style.display = 'block';
    }
    hide() {
        this.container.style.display = 'none';
    }
}