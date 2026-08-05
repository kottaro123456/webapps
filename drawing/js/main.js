class DrawingApp {
  constructor() {
    this.wrapper = document.getElementById('canvas-wrapper');
    this.container = document.getElementById('canvas-container');
    this.tempCanvas = document.getElementById('temp-canvas');
    this.tempCtx = this.tempCanvas.getContext('2d');
    this.indicatorCanvas = document.getElementById('indicator-canvas');
    this.indicatorCtx = this.indicatorCanvas.getContext('2d');
    
    // Set z-index for UI layers
    this.tempCanvas.style.zIndex = 1000;
    this.indicatorCanvas.style.zIndex = 1001;
    
    // Fixed Canvas Dimensions
    this.canvasWidth = 1920;
    this.canvasHeight = 1080;

    // Layers (Index 0 is bottom)
    this.layers = [];
    this.activeLayerId = null;
    this.layerIdCounter = 0;

    // State
    this.currentTool = 'pen'; // pen, eraser, line, rect, circle
    this.currentColor = '#000000';
    this.currentWidth = 5;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;

    // History (Undo/Redo for active layer)
    this.history = []; // Array of {layerId, imageData}
    this.historyStep = -1;

    this.initFirstLayer();
    this.bindEvents();
    this.applyResolution(this.canvasWidth, this.canvasHeight);
    this.saveState();
  }

  // --- Layer Management ---
  createLayerObject(name) {
    const id = `layer-${this.layerIdCounter++}`;
    const canvas = document.createElement('canvas');
    canvas.id = id;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;
    this.container.appendChild(canvas); // Add to DOM
    return {
      id: id,
      name: name,
      canvas: canvas,
      ctx: canvas.getContext('2d'),
      visible: true
    };
  }

  initFirstLayer() {
    const layer = this.createLayerObject('Layer 1');
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    this.updateLayerDOM();
    this.renderLayerPanel();
  }

  addLayer() {
    const layer = this.createLayerObject(`Layer ${this.layerIdCounter}`);
    this.layers.push(layer);
    this.activeLayerId = layer.id;
    this.clearHistory(); // Structure changed
    this.updateLayerDOM();
    this.renderLayerPanel();
  }

  removeActiveLayer() {
    if (this.layers.length <= 1) {
      alert("最後のレイヤーは削除できません。");
      return;
    }
    const idx = this.layers.findIndex(l => l.id === this.activeLayerId);
    if (idx > -1) {
      const layer = this.layers[idx];
      this.container.removeChild(layer.canvas);
      this.layers.splice(idx, 1);
      
      // Select another layer
      const newIdx = Math.max(0, idx - 1);
      this.activeLayerId = this.layers[newIdx].id;
      
      this.clearHistory();
      this.updateLayerDOM();
      this.renderLayerPanel();
    }
  }

  moveLayerUp() {
    const idx = this.layers.findIndex(l => l.id === this.activeLayerId);
    if (idx < this.layers.length - 1) {
      // Swap with next
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx + 1];
      this.layers[idx + 1] = temp;
      
      this.clearHistory();
      this.updateLayerDOM();
      this.renderLayerPanel();
    }
  }

  moveLayerDown() {
    const idx = this.layers.findIndex(l => l.id === this.activeLayerId);
    if (idx > 0) {
      // Swap with prev
      const temp = this.layers[idx];
      this.layers[idx] = this.layers[idx - 1];
      this.layers[idx - 1] = temp;
      
      this.clearHistory();
      this.updateLayerDOM();
      this.renderLayerPanel();
    }
  }

  toggleLayerVisibility(id) {
    const layer = this.layers.find(l => l.id === id);
    if (layer) {
      layer.visible = !layer.visible;
      layer.canvas.style.display = layer.visible ? 'block' : 'none';
      this.renderLayerPanel();
    }
  }

  updateLayerDOM() {
    // Update z-index based on array order
    this.layers.forEach((layer, idx) => {
      layer.canvas.style.zIndex = idx + 1;
    });
  }

  getActiveLayer() {
    return this.layers.find(l => l.id === this.activeLayerId);
  }

  // --- UI Rendering for Panel ---
  renderLayerPanel() {
    const list = document.getElementById('layer-list');
    list.innerHTML = '';
    
    // Render top layer first (reverse order of array)
    for (let i = this.layers.length - 1; i >= 0; i--) {
      const layer = this.layers[i];
      
      const item = document.createElement('div');
      item.className = 'layer-item';
      if (layer.id === this.activeLayerId) {
        item.classList.add('active');
      }
      
      const vis = document.createElement('div');
      vis.className = 'layer-visibility';
      vis.innerHTML = `<span class="material-symbols-outlined">${layer.visible ? 'visibility' : 'visibility_off'}</span>`;
      vis.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleLayerVisibility(layer.id);
      });

      const name = document.createElement('div');
      name.className = 'layer-name';
      name.innerText = layer.name;

      item.appendChild(vis);
      item.appendChild(name);

      item.addEventListener('click', () => {
        this.activeLayerId = layer.id;
        this.renderLayerPanel();
      });

      list.appendChild(item);
    }
  }

  // --- Resolution ---
  applyResolution(width, height) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    
    this.container.style.width = width + 'px';
    this.container.style.height = height + 'px';

    this.layers.forEach(layer => {
      const temp = document.createElement('canvas');
      temp.width = layer.canvas.width;
      temp.height = layer.canvas.height;
      temp.getContext('2d').drawImage(layer.canvas, 0, 0);
      
      layer.canvas.width = width;
      layer.canvas.height = height;
      layer.ctx.drawImage(temp, 0, 0);
    });

    this.tempCanvas.width = width;
    this.tempCanvas.height = height;
    this.indicatorCanvas.width = width;
    this.indicatorCanvas.height = height;
  }

  // --- Event Binding ---
  bindEvents() {
    // Canvas Container
    this.container.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.container.addEventListener('mouseleave', () => { this.clearIndicator(); });

    // Toolbar Tools
    const tools = ['pen', 'eraser', 'line', 'rect', 'circle'];
    tools.forEach(tool => {
      const btn = document.getElementById(`btn-${tool}`);
      if(btn) {
        btn.addEventListener('click', (e) => {
          this.setTool(tool);
          document.querySelectorAll('.tool-btn').forEach(b => {
             // Only remove active from other tools
             if(b.id.startsWith('btn-') && tools.includes(b.id.replace('btn-', ''))) {
               b.classList.remove('active');
             }
          });
          e.currentTarget.classList.add('active');
        });
      }
    });

    // Settings
    const widthInput = document.getElementById('lineWidth');
    const widthVal = document.getElementById('lineWidthValue');
    if (widthInput) {
      widthInput.addEventListener('input', (e) => {
        this.currentWidth = parseInt(e.target.value, 10);
        widthVal.innerText = this.currentWidth;
      });
    }

    const colorInput = document.getElementById('lineColor');
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        this.currentColor = e.target.value;
      });
    }
    
    // Resolution
    const btnResize = document.getElementById('btn-resize');
    if (btnResize) {
      btnResize.addEventListener('click', () => {
        const w = parseInt(document.getElementById('canvas-width').value, 10);
        const h = parseInt(document.getElementById('canvas-height').value, 10);
        if (w > 0 && h > 0) {
          this.applyResolution(w, h);
        }
      });
    }

    // Layer Panel Actions
    document.getElementById('btn-layer-add').addEventListener('click', () => this.addLayer());
    document.getElementById('btn-layer-delete').addEventListener('click', () => this.removeActiveLayer());
    document.getElementById('btn-layer-up').addEventListener('click', () => this.moveLayerUp());
    document.getElementById('btn-layer-down').addEventListener('click', () => this.moveLayerDown());
    
    const btnTogglePanel = document.getElementById('btn-toggle-panel');
    if (btnTogglePanel) {
      btnTogglePanel.addEventListener('click', () => {
        document.getElementById('layer-panel').classList.toggle('hidden');
        btnTogglePanel.classList.toggle('active');
      });
    }

    // Actions
    document.getElementById('btn-clear').addEventListener('click', () => this.clearActiveLayer());
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.redo());
    document.getElementById('btn-save').addEventListener('click', () => this.saveImage());
    
    // Green Screen
    const btnGreenScreen = document.getElementById('btn-greenscreen');
    if(btnGreenScreen) {
      btnGreenScreen.addEventListener('click', () => {
        document.body.classList.toggle('green-screen');
        btnGreenScreen.classList.toggle('active');
      });
    }

    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        this.undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        this.redo();
      }
    });
  }

  setTool(tool) {
    this.currentTool = tool;
  }

  // --- Drawing Logic ---
  onMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    const layer = this.getActiveLayer();
    if (!layer || !layer.visible) return; // Cannot draw on hidden layer

    this.isDragging = true;
    const rect = this.container.getBoundingClientRect();
    this.startX = e.clientX - rect.left;
    this.startY = e.clientY - rect.top;
    this.lastX = this.startX;
    this.lastY = this.startY;

    layer.ctx.lineCap = 'round';
    layer.ctx.lineJoin = 'round';
    layer.ctx.lineWidth = this.currentWidth;
    layer.ctx.strokeStyle = this.currentColor;

    if (this.currentTool === 'eraser') {
      layer.ctx.globalCompositeOperation = 'destination-out';
    } else {
      layer.ctx.globalCompositeOperation = 'source-over';
    }

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      layer.ctx.beginPath();
      layer.ctx.moveTo(this.startX, this.startY);
    }
  }

  onMouseMove(e) {
    const rect = this.container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.drawIndicator(x, y);

    if (!this.isDragging) return;
    
    const layer = this.getActiveLayer();
    if (!layer) return;

    if (this.currentTool === 'pen' || this.currentTool === 'eraser') {
      layer.ctx.lineTo(x, y);
      layer.ctx.stroke();
      layer.ctx.beginPath();
      layer.ctx.moveTo(x, y);
    } else {
      this.drawShapePreview(x, y);
    }
    this.lastX = x;
    this.lastY = y;
  }

  onMouseUp(e) {
    if (!this.isDragging) return;
    this.isDragging = false;

    const layer = this.getActiveLayer();
    if (layer && this.currentTool !== 'pen' && this.currentTool !== 'eraser') {
      layer.ctx.drawImage(this.tempCanvas, 0, 0);
      this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    }
    
    this.saveState();
  }

  drawShapePreview(x, y) {
    this.tempCtx.clearRect(0, 0, this.tempCanvas.width, this.tempCanvas.height);
    this.tempCtx.lineCap = 'round';
    this.tempCtx.lineJoin = 'round';
    this.tempCtx.lineWidth = this.currentWidth;
    this.tempCtx.strokeStyle = this.currentColor;
    this.tempCtx.beginPath();

    if (this.currentTool === 'line') {
      this.tempCtx.moveTo(this.startX, this.startY);
      this.tempCtx.lineTo(x, y);
    } else if (this.currentTool === 'rect') {
      this.tempCtx.rect(this.startX, this.startY, x - this.startX, y - this.startY);
    } else if (this.currentTool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - this.startX, 2) + Math.pow(y - this.startY, 2));
      this.tempCtx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
    }
    this.tempCtx.stroke();
  }

  drawIndicator(x, y) {
    this.indicatorCtx.clearRect(0, 0, this.indicatorCanvas.width, this.indicatorCanvas.height);
    this.indicatorCtx.beginPath();
    this.indicatorCtx.arc(x, y, this.currentWidth / 2, 0, 2 * Math.PI);
    this.indicatorCtx.strokeStyle = this.currentTool === 'eraser' ? '#ff0000' : '#000000';
    this.indicatorCtx.lineWidth = 1;
    this.indicatorCtx.stroke();
  }
  
  clearIndicator() {
    this.indicatorCtx.clearRect(0, 0, this.indicatorCanvas.width, this.indicatorCanvas.height);
  }

  clearActiveLayer() {
    const layer = this.getActiveLayer();
    if (layer && confirm("現在のレイヤーを消去しますか？")) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      this.saveState();
    }
  }

  // --- History ---
  clearHistory() {
    this.history = [];
    this.historyStep = -1;
    this.saveState();
  }

  saveState() {
    const layer = this.getActiveLayer();
    if (!layer) return;

    this.historyStep++;
    this.history = this.history.slice(0, this.historyStep);
    const imageData = layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
    this.history.push({
      layerId: layer.id,
      imageData: imageData
    });
  }

  undo() {
    if (this.historyStep > 0) {
      this.historyStep--;
      this.restoreState();
    }
  }

  redo() {
    if (this.historyStep < this.history.length - 1) {
      this.historyStep++;
      this.restoreState();
    }
  }

  restoreState() {
    const state = this.history[this.historyStep];
    const layer = this.layers.find(l => l.id === state.layerId);
    if (layer) {
      layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
      layer.ctx.putImageData(state.imageData, 0, 0);
      
      this.activeLayerId = layer.id;
      this.renderLayerPanel();
    }
  }

  // --- Export ---
  saveImage() {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvasWidth;
    exportCanvas.height = this.canvasHeight;
    const exportCtx = exportCanvas.getContext('2d');

    this.layers.forEach(layer => {
      if (layer.visible) {
        exportCtx.drawImage(layer.canvas, 0, 0);
      }
    });

    const link = document.createElement('a');
    link.download = `drawing_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  new DrawingApp();
});