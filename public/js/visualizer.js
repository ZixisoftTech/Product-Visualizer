/**
 * Rajgarhwala AI Visualizer Frontend Controller
 * 4-Screen Mobile WebView Workflow:
 * Screen 1: Add Room
 * Screen 2: Add Products (Up to 3)
 * Screen 3: Creating Visualization (Loading)
 * Screen 4: Final AI Visualization (Save & Share)
 */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Cross-Platform Native Bridge Dispatcher
  function notifyNativeApp(eventType, payload = {}) {
    const messageObj = {
      event: eventType,
      data: payload,
      timestamp: Date.now(),
    };
    const jsonStr = JSON.stringify(messageObj);

    // React Native WebView
    if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === 'function') {
      try { window.ReactNativeWebView.postMessage(jsonStr); } catch (e) { console.warn(e); }
    }

    // Android WebView JavascriptInterface
    if (window.AndroidBridge) {
      if (typeof window.AndroidBridge[eventType] === 'function') {
        try { window.AndroidBridge[eventType](jsonStr); } catch (e) { console.warn(e); }
      } else if (typeof window.AndroidBridge.postMessage === 'function') {
        try { window.AndroidBridge.postMessage(jsonStr); } catch (e) { console.warn(e); }
      }
    }

    // iOS WKScriptMessageHandler
    if (window.webkit && window.webkit.messageHandlers) {
      if (window.webkit.messageHandlers[eventType]) {
        try { window.webkit.messageHandlers[eventType].postMessage(messageObj); } catch (e) { console.warn(e); }
      } else if (window.webkit.messageHandlers.nativeApp) {
        try { window.webkit.messageHandlers.nativeApp.postMessage(messageObj); } catch (e) { console.warn(e); }
      }
    }

    // Flutter WebView
    if (window.FlutterBridge && typeof window.FlutterBridge.postMessage === 'function') {
      try { window.FlutterBridge.postMessage(jsonStr); } catch (e) { console.warn(e); }
    }
  }

  // 2. Detect WebView Mode from URL or User Agent
  const urlParams = new URLSearchParams(window.location.search);
  const isWebViewParam = urlParams.get('webview') === '1' || urlParams.get('webview') === 'true';
  const isAppParam = urlParams.get('app') === '1' || urlParams.get('app') === 'true';
  const hideHeaderParam = urlParams.get('hide_header') === '1' || urlParams.get('hide_header') === 'true';
  const isNativeBridgePresent = !!(window.ReactNativeWebView || window.AndroidBridge || window.webkit?.messageHandlers || window.FlutterBridge);

  if (isWebViewParam || isAppParam || isNativeBridgePresent) {
    document.body.classList.add('is-webview');
  }
  if (hideHeaderParam) {
    document.body.classList.add('hide-header');
  }

  notifyNativeApp('onAppReady', { url: window.location.href });

  // 3. Screen Elements
  const screen1 = document.getElementById('screen1');
  const screen2 = document.getElementById('screen2');
  const screen3 = document.getElementById('screen3');
  const screen4 = document.getElementById('screen4');

  const stepBadge1 = document.getElementById('stepBadge1');
  const stepBadge2 = document.getElementById('stepBadge2');
  const stepBadge3 = document.getElementById('stepBadge3');

  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    if (errorAlert) errorAlert.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notifyNativeApp('onVisualizationError', { error: msg });
  }

  function hideError() {
    if (errorAlert) errorAlert.classList.add('d-none');
  }

  function showScreen(num) {
    hideError();
    screen1.classList.toggle('d-none', num !== 1);
    screen2.classList.toggle('d-none', num !== 2);
    screen3.classList.toggle('d-none', num !== 3);
    screen4.classList.toggle('d-none', num !== 4);

    // Update progress badge
    stepBadge1.classList.toggle('active', num === 1);
    stepBadge2.classList.toggle('active', num === 2 || num === 3);
    stepBadge3.classList.toggle('active', num === 4);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 4. State
  let roomFile = null;
  let roomPreviewUrl = '';
  let products = []; // Array of { id, file, previewUrl, width, depth, height, unit }
  let currentVisualization = null;

  // Spatial Placement & Adjustment State
  let currentPlacementMode = 'auto'; // 'auto' or 'tap'
  let currentTapX = null;
  let currentTapY = null;
  let currentAdjustments = {
    offset_x: 0,
    offset_y: 0,
    scale_multiplier: 1.0,
    rotation: 0,
  };

  // Init Slider
  initImageSlider('sliderContainer', 'sliderRange', 'sliderClip', 'sliderDivider');

  // ==========================================
  // SCREEN 1: ROOM SETUP
  // ==========================================
  const roomCameraInput = document.getElementById('roomCameraInput');
  const roomGalleryInput = document.getElementById('roomGalleryInput');
  const roomChangeInput = document.getElementById('roomChangeInput');
  const roomEmptyState = document.getElementById('roomEmptyState');
  const roomLoadedState = document.getElementById('roomLoadedState');
  const roomPreviewImg = document.getElementById('roomPreviewImg');

  const roomLengthInput = document.getElementById('roomLength');
  const roomWidthInput = document.getElementById('roomWidth');
  const roomHeightInput = document.getElementById('roomHeight');
  const continueToProductsBtn = document.getElementById('continueToProductsBtn');
  const roomValidationHint = document.getElementById('roomValidationHint');

  async function handleRoomPhotoSelect(file) {
    if (!file) return;
    try {
      roomFile = await compressImageForUpload(file, 1600, false);
      if (roomPreviewUrl) URL.revokeObjectURL(roomPreviewUrl);
      roomPreviewUrl = URL.createObjectURL(roomFile);

      roomPreviewImg.src = roomPreviewUrl;
      roomEmptyState.classList.add('d-none');
      roomLoadedState.classList.remove('d-none');
      hideError();
      validateScreen1();
      notifyNativeApp('onRoomPhotoSelected', { name: roomFile.name, size: roomFile.size });
    } catch (err) {
      showError('Failed to process room image.');
    }
  }

  if (roomCameraInput) roomCameraInput.addEventListener('change', (e) => handleRoomPhotoSelect(e.target.files[0]));
  if (roomGalleryInput) roomGalleryInput.addEventListener('change', (e) => handleRoomPhotoSelect(e.target.files[0]));
  if (roomChangeInput) roomChangeInput.addEventListener('change', (e) => handleRoomPhotoSelect(e.target.files[0]));

  [roomLengthInput, roomWidthInput, roomHeightInput].forEach((inp) => {
    if (inp) inp.addEventListener('input', validateScreen1);
  });

  function validateScreen1() {
    const l = parseFloat(roomLengthInput.value);
    const w = parseFloat(roomWidthInput.value);
    const h = parseFloat(roomHeightInput.value);

    const hasPhoto = !!roomFile;
    const hasDims = !isNaN(l) && l > 0 && !isNaN(w) && w > 0 && !isNaN(h) && h > 0;

    const isValid = hasPhoto && hasDims;
    continueToProductsBtn.disabled = !isValid;

    if (!hasPhoto) {
      roomValidationHint.textContent = 'Please upload room photo to continue';
      roomValidationHint.classList.remove('d-none');
    } else if (!hasDims) {
      roomValidationHint.textContent = 'Please enter valid room dimensions';
      roomValidationHint.classList.remove('d-none');
    } else {
      roomValidationHint.classList.add('d-none');
    }

    return isValid;
  }

  continueToProductsBtn.addEventListener('click', () => {
    if (!validateScreen1()) return;

    // Update mini room preview on Screen 2
    const miniRoomThumb = document.getElementById('miniRoomThumb');
    const miniRoomDims = document.getElementById('miniRoomDims');
    if (miniRoomThumb) miniRoomThumb.src = roomPreviewUrl;
    if (miniRoomDims) {
      miniRoomDims.textContent = `${roomLengthInput.value}×${roomWidthInput.value}×${roomHeightInput.value} ft`;
    }

    showScreen(2);
    if (tapRoomImg && roomPreviewUrl) {
      tapRoomImg.src = roomPreviewUrl;
    }
  });

  document.getElementById('editRoomBtn')?.addEventListener('click', () => showScreen(1));
  document.getElementById('backToRoomBtn')?.addEventListener('click', () => showScreen(1));


  // ==========================================
  // SCREEN 2: ADD PRODUCTS (UP TO 3)
  // ==========================================
  const productCameraInput = document.getElementById('productCameraInput');
  const productGalleryInput = document.getElementById('productGalleryInput');
  const productsContainer = document.getElementById('productsContainer');
  const addProductBox = document.getElementById('addProductBox');
  const maxProductsNotice = document.getElementById('maxProductsNotice');
  const productCountBadge = document.getElementById('productCountBadge');
  const optionalPlacement = document.getElementById('optionalPlacement');
  const generateVisualizationBtn = document.getElementById('generateVisualizationBtn');

  // Mode A / Mode B Placement Elements
  const modeAutoRadio = document.getElementById('modeAutoRadio');
  const modeTapRadio = document.getElementById('modeTapRadio');
  const modeAutoDesc = document.getElementById('modeAutoDesc');
  const modeTapContainer = document.getElementById('modeTapContainer');
  const tapRoomImg = document.getElementById('tapRoomImg');
  const tapRoomCanvasWrapper = document.getElementById('tapRoomCanvasWrapper');
  const tapMarkerPin = document.getElementById('tapMarkerPin');
  const tapCoordinatesLabel = document.getElementById('tapCoordinatesLabel');

  function updatePlacementModeUI() {
    if (modeAutoRadio?.checked) {
      currentPlacementMode = 'auto';
      if (modeAutoDesc) modeAutoDesc.classList.remove('d-none');
      if (modeTapContainer) modeTapContainer.classList.add('d-none');
    } else {
      currentPlacementMode = 'tap';
      if (modeAutoDesc) modeAutoDesc.classList.add('d-none');
      if (modeTapContainer) modeTapContainer.classList.remove('d-none');
      if (tapRoomImg && roomPreviewUrl) tapRoomImg.src = roomPreviewUrl;
    }
  }

  if (modeAutoRadio) modeAutoRadio.addEventListener('change', updatePlacementModeUI);
  if (modeTapRadio) modeTapRadio.addEventListener('change', updatePlacementModeUI);

  // Handle Tap on Room Preview Canvas
  if (tapRoomCanvasWrapper) {
    tapRoomCanvasWrapper.addEventListener('click', (e) => {
      const rect = tapRoomCanvasWrapper.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      let normX = clickX / rect.width;
      let normY = clickY / rect.height;

      normX = Math.max(0.08, Math.min(0.92, normX));
      normY = Math.max(0.10, Math.min(0.95, normY));

      currentTapX = Math.round(normX * 1000) / 1000;
      currentTapY = Math.round(normY * 1000) / 1000;

      // Position visual marker pin
      if (tapMarkerPin) {
        tapMarkerPin.style.left = (normX * 100) + '%';
        tapMarkerPin.style.top = (normY * 100) + '%';
        tapMarkerPin.classList.remove('d-none');
      }

      // Readable position label
      let horizDesc = 'Center';
      if (normX < 0.35) horizDesc = 'Left side';
      else if (normX > 0.65) horizDesc = 'Right side';

      let depthDesc = 'Floor contact';
      if (normY < 0.42) depthDesc = 'Against back wall';
      else if (normY > 0.70) depthDesc = 'Foreground floor';

      if (tapCoordinatesLabel) {
        tapCoordinatesLabel.innerHTML = `<i class="bi bi-geo-alt-fill text-warning"></i> Selected: <strong>${horizDesc}</strong> (${depthDesc})`;
      }
    });
  }

  async function handleProductPhotoSelect(file) {
    if (!file || products.length >= 3) return;

    try {
      // Compress and isolate product background
      const processedFile = await compressImageForUpload(file, 1600, true);
      const url = URL.createObjectURL(processedFile);

      const newProd = {
        id: Date.now() + Math.random(),
        file: processedFile,
        previewUrl: url,
        width: 84,
        depth: 36,
        height: 34,
        unit: 'inch',
      };

      products.push(newProd);
      renderProductsList();
      validateScreen2();
      notifyNativeApp('onProductAdded', { count: products.length });
    } catch (err) {
      showError('Failed to isolate product photo.');
    } finally {
      if (productCameraInput) productCameraInput.value = '';
      if (productGalleryInput) productGalleryInput.value = '';
    }
  }

  if (productCameraInput) productCameraInput.addEventListener('change', (e) => handleProductPhotoSelect(e.target.files[0]));
  if (productGalleryInput) productGalleryInput.addEventListener('change', (e) => handleProductPhotoSelect(e.target.files[0]));

  function renderProductsList() {
    productsContainer.innerHTML = '';

    products.forEach((prod, idx) => {
      const card = document.createElement('div');
      card.className = 'product-item-card';
      card.innerHTML = `
        <div class="d-flex align-items-center justify-content-between">
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-dark rounded-pill px-2 py-1 font-monospace">Product ${idx + 1}</span>
            <span class="small text-muted fw-semibold" style="font-size: 0.75rem;">Background Isolated</span>
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm py-0 px-2 rounded-2 remove-prod-btn" data-id="${prod.id}">
            <i class="bi bi-trash3"></i> Remove
          </button>
        </div>

        <div class="d-flex gap-3 align-items-center">
          <img src="${prod.previewUrl}" alt="Product ${idx + 1}" class="prod-thumb-img flex-shrink-0">
          <div class="flex-grow-1">
            <div class="row g-1">
              <div class="col-4">
                <label class="form-label text-muted mb-0" style="font-size: 0.7rem;">Width</label>
                <div class="input-group input-group-sm">
                  <input type="number" step="any" min="1" class="form-control prod-w-input px-1 text-center" value="${prod.width}" data-id="${prod.id}" inputmode="decimal">
                  <span class="input-group-text px-1" style="font-size: 0.7rem;">in</span>
                </div>
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-0" style="font-size: 0.7rem;">Depth</label>
                <div class="input-group input-group-sm">
                  <input type="number" step="any" min="1" class="form-control prod-d-input px-1 text-center" value="${prod.depth}" data-id="${prod.id}" inputmode="decimal">
                  <span class="input-group-text px-1" style="font-size: 0.7rem;">in</span>
                </div>
              </div>
              <div class="col-4">
                <label class="form-label text-muted mb-0" style="font-size: 0.7rem;">Height</label>
                <div class="input-group input-group-sm">
                  <input type="number" step="any" min="1" class="form-control prod-h-input px-1 text-center" value="${prod.height}" data-id="${prod.id}" inputmode="decimal">
                  <span class="input-group-text px-1" style="font-size: 0.7rem;">in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      productsContainer.appendChild(card);
    });

    // Update count badge & add box visibility
    productCountBadge.textContent = `${products.length} / 3 Added`;
    if (products.length >= 3) {
      addProductBox.classList.add('d-none');
      maxProductsNotice.classList.remove('d-none');
    } else {
      addProductBox.classList.remove('d-none');
      maxProductsNotice.classList.add('d-none');
    }

    // Attach listeners
    productsContainer.querySelectorAll('.remove-prod-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseFloat(btn.dataset.id);
        const removed = products.find(p => p.id === id);
        if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
        products = products.filter(p => p.id !== id);
        renderProductsList();
        validateScreen2();
      });
    });

    productsContainer.querySelectorAll('.prod-w-input').forEach((input) => {
      input.addEventListener('input', () => {
        const p = products.find(x => x.id === parseFloat(input.dataset.id));
        if (p) p.width = parseFloat(input.value) || 0;
        validateScreen2();
      });
    });

    productsContainer.querySelectorAll('.prod-d-input').forEach((input) => {
      input.addEventListener('input', () => {
        const p = products.find(x => x.id === parseFloat(input.dataset.id));
        if (p) p.depth = parseFloat(input.value) || 0;
        validateScreen2();
      });
    });

    productsContainer.querySelectorAll('.prod-h-input').forEach((input) => {
      input.addEventListener('input', () => {
        const p = products.find(x => x.id === parseFloat(input.dataset.id));
        if (p) p.height = parseFloat(input.value) || 0;
        validateScreen2();
      });
    });
  }

  function validateScreen2() {
    const hasProducts = products.length >= 1;
    const allValidDims = products.every(p => p.width > 0 && p.depth > 0 && p.height > 0);
    const isValid = hasProducts && allValidDims;
    generateVisualizationBtn.disabled = !isValid;
    return isValid;
  }


  // ==========================================
  // SCREEN 3: CREATING VISUALIZATION
  // ==========================================
  const loadingRoomBg = document.getElementById('loadingRoomBg');
  const loadingStatusText = document.getElementById('loadingStatusText');

  let loadingInterval = null;
  const loadingMessages = [
    'Analyzing room...',
    'Preparing products...',
    'Calculating scale...',
    'Placing products...',
    'Creating image...',
  ];

  function startLoadingCycle() {
    if (loadingRoomBg) loadingRoomBg.src = roomPreviewUrl;
    let idx = 0;
    loadingStatusText.textContent = loadingMessages[0];
    if (loadingInterval) clearInterval(loadingInterval);
    loadingInterval = setInterval(() => {
      idx = (idx + 1) % loadingMessages.length;
      loadingStatusText.textContent = loadingMessages[idx];
    }, 2200);
  }

  function stopLoadingCycle() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }


  // ==========================================
  // GENERATE ACTION
  // ==========================================
  generateVisualizationBtn.addEventListener('click', async () => {
    if (!validateScreen2()) return;

    showScreen(3);
    startLoadingCycle();
    notifyNativeApp('onVisualizationStart');

    try {
      const formData = new FormData();
      formData.append('hall_image', roomFile, 'customer_room.jpg');
      formData.append('room_length', roomLengthInput.value);
      formData.append('room_width', roomWidthInput.value);
      formData.append('room_height', roomHeightInput.value);
      formData.append('room_unit', 'ft');

      const productsMeta = [];
      products.forEach((prod, index) => {
        formData.append(`product_image_${index}`, prod.file, `product_${index}.png`);
        productsMeta.push({
          width: prod.width,
          depth: prod.depth,
          height: prod.height,
          unit: prod.unit,
        });
      });

      formData.append('products_data', JSON.stringify(productsMeta));
      formData.append('placement', optionalPlacement.value.trim() || 'Center');
      formData.append('placement_mode', currentPlacementMode);
      if (currentPlacementMode === 'tap' && currentTapX !== null && currentTapY !== null) {
        formData.append('tap_x', currentTapX);
        formData.append('tap_y', currentTapY);
      }

      // Reset manual fine-tuning offsets for fresh generation
      currentAdjustments = {
        offset_x: 0,
        offset_y: 0,
        scale_multiplier: 1.0,
        rotation: 0,
      };

      const res = await fetch('/api/visualize', {
        method: 'POST',
        body: formData,
      });

      let data = null;
      let text = '';
      try {
        text = await res.text();
        data = JSON.parse(text);
      } catch (parseErr) {
        console.warn('Response parse note:', text);
      }

      if (!res.ok || !data?.success) {
        const errMsg = data?.error || (text && text.length < 300 && !text.includes('<html') ? text : null) || `Server responded with error (${res.status})`;
        throw new Error(errMsg);
      }

      currentVisualization = data.visualization;
      displayVisualizationResult(data.visualization);
      notifyNativeApp('onVisualizationComplete', data.visualization);
    } catch (err) {
      console.error(err);
      showScreen(2);
      showError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      stopLoadingCycle();
    }
  });


  // ==========================================
  // SCREEN 4: FINAL AI VISUALIZATION
  // ==========================================
  const sliderAfterImg = document.getElementById('sliderAfterImg');
  const sliderBeforeImg = document.getElementById('sliderBeforeImg');
  const resultProductsThumbList = document.getElementById('resultProductsThumbList');
  const resultProductsHeader = document.getElementById('resultProductsHeader');
  const saveImageBtn = document.getElementById('saveImageBtn');
  const shareImageBtn = document.getElementById('shareImageBtn');
  const tryAgainBtn = document.getElementById('tryAgainBtn');
  const startOverBtn = document.getElementById('startOverBtn');

  // Fine-Tune Controls Elements
  const nudgeLeftBtn = document.getElementById('nudgeLeftBtn');
  const nudgeRightBtn = document.getElementById('nudgeRightBtn');
  const rotateBtn = document.getElementById('rotateBtn');
  const scaleMinusBtn = document.getElementById('scaleMinusBtn');
  const scalePlusBtn = document.getElementById('scalePlusBtn');
  const resetAdjustBtn = document.getElementById('resetAdjustBtn');
  const adjustStatus = document.getElementById('adjustStatus');

  let isAdjusting = false;

  async function applyAdjustment(type) {
    if (!currentVisualization || isAdjusting) return;
    isAdjusting = true;

    if (type === 'left') {
      currentAdjustments.offset_x -= 0.04;
    } else if (type === 'right') {
      currentAdjustments.offset_x += 0.04;
    } else if (type === 'rotate') {
      currentAdjustments.rotation = (currentAdjustments.rotation + 15) % 360;
    } else if (type === 'scaleMinus') {
      currentAdjustments.scale_multiplier = Math.max(0.60, Math.round((currentAdjustments.scale_multiplier - 0.08) * 100) / 100);
    } else if (type === 'scalePlus') {
      currentAdjustments.scale_multiplier = Math.min(1.50, Math.round((currentAdjustments.scale_multiplier + 0.08) * 100) / 100);
    } else if (type === 'reset') {
      currentAdjustments = { offset_x: 0, offset_y: 0, scale_multiplier: 1.0, rotation: 0 };
    }

    if (adjustStatus) {
      adjustStatus.innerHTML = '<span class="spinner-border spinner-border-sm me-1 text-warning" role="status"></span> Updating...';
    }

    try {
      const payload = {
        placement_mode: currentPlacementMode,
        tap_x: currentTapX,
        tap_y: currentTapY,
        offset_x: currentAdjustments.offset_x,
        offset_y: currentAdjustments.offset_y,
        scale_multiplier: currentAdjustments.scale_multiplier,
        rotation: currentAdjustments.rotation,
      };

      const res = await fetch(`/api/regenerate/${currentVisualization.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data?.success && data?.visualization) {
        currentVisualization = data.visualization;
        const newSrc = data.visualization.generated_image_data || data.visualization.generated_image_path;
        sliderAfterImg.src = newSrc;
        if (adjustStatus) {
          adjustStatus.textContent = 'Adjusted ✓';
          setTimeout(() => {
            if (adjustStatus) adjustStatus.textContent = 'Tap to nudge';
          }, 1800);
        }
      } else {
        throw new Error(data?.error || 'Adjustment failed');
      }
    } catch (err) {
      console.warn('Fine-tune adjust notice:', err);
      if (adjustStatus) adjustStatus.textContent = 'Error updating';
    } finally {
      isAdjusting = false;
    }
  }

  if (nudgeLeftBtn) nudgeLeftBtn.addEventListener('click', () => applyAdjustment('left'));
  if (nudgeRightBtn) nudgeRightBtn.addEventListener('click', () => applyAdjustment('right'));
  if (rotateBtn) rotateBtn.addEventListener('click', () => applyAdjustment('rotate'));
  if (scaleMinusBtn) scaleMinusBtn.addEventListener('click', () => applyAdjustment('scaleMinus'));
  if (scalePlusBtn) scalePlusBtn.addEventListener('click', () => applyAdjustment('scalePlus'));
  if (resetAdjustBtn) resetAdjustBtn.addEventListener('click', () => applyAdjustment('reset'));

  function displayVisualizationResult(vis) {
    const generatedSrc = vis.generated_image_data || vis.generated_image_path;
    const roomSrc = roomPreviewUrl || vis.hall_image_path;

    sliderAfterImg.src = generatedSrc;
    sliderBeforeImg.src = roomSrc;

    // Thumbnails of products placed
    resultProductsThumbList.innerHTML = '';
    const count = products.length;
    resultProductsHeader.textContent = `${count} Product${count > 1 ? 's' : ''} Placed`;

    products.forEach((prod, i) => {
      const div = document.createElement('div');
      div.className = 'd-flex align-items-center gap-1 p-1 px-2 bg-white rounded-3 border';
      div.innerHTML = `
        <img src="${prod.previewUrl}" alt="Product ${i + 1}" style="width: 28px; height: 28px; object-fit: contain;">
        <span class="small font-monospace text-dark" style="font-size: 0.75rem;">${prod.width}×${prod.depth} in</span>
      `;
      resultProductsThumbList.appendChild(div);
    });

    showScreen(4);
  }

  function downloadAsPng(imgSrc, fileName) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1200;
      canvas.height = img.naturalHeight || 900;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = fileName;
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = imgSrc;
  }

  // Save Image Action
  saveImageBtn.addEventListener('click', () => {
    if (!currentVisualization) return;
    const generatedSrc = currentVisualization.generated_image_data || currentVisualization.generated_image_path;
    notifyNativeApp('onSaveImage', {
      image_data: generatedSrc,
      filename: `rajgarhwala_visualization_${Date.now()}.png`,
    });
    downloadAsPng(generatedSrc, `rajgarhwala_visualization_${Date.now()}.png`);
  });

  // Share Image Action (WhatsApp / Native Share Sheet)
  shareImageBtn.addEventListener('click', async () => {
    if (!currentVisualization) return;
    const generatedSrc = currentVisualization.generated_image_data || currentVisualization.generated_image_path;

    notifyNativeApp('onShareRequest', {
      image_data: generatedSrc,
      title: 'Rajgarhwala AI Room Visualization',
      text: 'Here is how your showroom furniture looks placed in your actual room!',
    });

    if (navigator.share) {
      try {
        const res = await fetch(generatedSrc);
        const blob = await res.blob();
        const file = new File([blob], `rajgarhwala_visualization.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Rajgarhwala AI Room Visualization',
            text: 'Here is how your showroom furniture looks placed in your room!',
            files: [file],
          });
          return;
        } else {
          await navigator.share({
            title: 'Rajgarhwala AI Room Visualization',
            text: 'Here is how your showroom furniture looks placed in your room!',
            url: window.location.href,
          });
          return;
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.warn(err);
      }
    }

    // Fallback: save image
    downloadAsPng(generatedSrc, `rajgarhwala_visualization_${Date.now()}.png`);
  });

  // Try Again / Edit Products -> Screen 2
  tryAgainBtn.addEventListener('click', () => {
    showScreen(2);
  });

  // Start Over -> Screen 1
  startOverBtn.addEventListener('click', () => {
    roomFile = null;
    if (roomPreviewUrl) URL.revokeObjectURL(roomPreviewUrl);
    roomPreviewUrl = '';
    roomEmptyState.classList.remove('d-none');
    roomLoadedState.classList.add('d-none');

    products.forEach(p => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
    });
    products = [];
    renderProductsList();
    optionalPlacement.value = '';
    currentVisualization = null;

    validateScreen1();
    showScreen(1);
    notifyNativeApp('onReset');
  });

  // Initial validation check
  validateScreen1();
});
