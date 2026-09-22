/**
 * Rajgarhwala AI Visualizer Frontend Controller
 * Fully optimized for Mobile Browsers & Native Mobile WebViews
 * (Android WebView, iOS WKWebView, Flutter WebView, React Native WebView)
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Cross-Platform Native Bridge Helper
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

    // Flutter WebView (flutter_inappwebview or custom channel)
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

  // DOM Elements
  const roomFileInput = document.getElementById('roomFileInput');
  const roomCameraInput = document.getElementById('roomCameraInput');
  const prodFileInput = document.getElementById('prodFileInput');
  const prodCameraInput = document.getElementById('prodCameraInput');

  const roomDropzone = document.getElementById('roomDropzone');
  const roomPreviewBox = document.getElementById('roomPreviewBox');
  const roomPreviewImg = document.getElementById('roomPreviewImg');
  const removeRoomBtn = document.getElementById('removeRoomBtn');

  const prodDropzone = document.getElementById('prodDropzone');
  const prodPreviewBox = document.getElementById('prodPreviewBox');
  const prodPreviewImg = document.getElementById('prodPreviewImg');
  const removeProdBtn = document.getElementById('removeProdBtn');

  const widthInput = document.getElementById('productWidth');
  const depthInput = document.getElementById('productDepth');
  const heightInput = document.getElementById('productHeight');
  const unitInputs = document.querySelectorAll('input[name="dimension_unit"]');
  const instructionsInput = document.getElementById('instructions');
  const charCounter = document.getElementById('charCounter');

  const placementBtns = document.querySelectorAll('.btn-placement');
  const placementHiddenInput = document.getElementById('selectedPlacement');

  const generateBtn = document.getElementById('generateBtn');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnText = document.getElementById('btnText');
  const missingRequirementsText = document.getElementById('missingRequirementsText');

  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  const visualizerFormCard = document.getElementById('visualizerFormCard');
  const resultCard = document.getElementById('resultCard');
  const startNewBtn = document.getElementById('startNewBtn');
  const headerResetBtn = document.getElementById('headerResetBtn');

  // Slider elements
  const sliderBeforeImg = document.getElementById('sliderBeforeImg');
  const sliderAfterImg = document.getElementById('sliderAfterImg');
  const fullResLink = document.getElementById('fullResLink');
  const downloadLink = document.getElementById('downloadLink');
  const shareBtn = document.getElementById('shareBtn');
  const resultSummaryText = document.getElementById('resultSummaryText');

  // Regeneration elements
  const regenPlacementSelect = document.getElementById('regenPlacementSelect');
  const regenInstructionsInput = document.getElementById('regenInstructionsInput');
  const regenBtn = document.getElementById('regenBtn');
  const regenSpinner = document.getElementById('regenSpinner');

  // State
  let currentRoomFile = null;
  let currentProdFile = null;
  let currentVisualization = null;
  let isSubmitting = false;

  // Init Slider
  initImageSlider('sliderContainer', 'sliderRange', 'sliderClip', 'sliderDivider');

  // Instructions Character Count
  if (instructionsInput && charCounter) {
    instructionsInput.addEventListener('input', () => {
      charCounter.textContent = instructionsInput.value.length;
    });
  }

  // Placement Selection
  placementBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      placementBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      placementHiddenInput.value = btn.dataset.placement;
      validateFormState();
    });
  });

  // Room File Selection
  function handleRoomSelect(file) {
    if (!file) return;
    currentRoomFile = file;
    const url = URL.createObjectURL(file);
    roomPreviewImg.src = url;
    roomDropzone.classList.add('d-none');
    roomPreviewBox.classList.remove('d-none');
    hideError();
    validateFormState();
    notifyNativeApp('onRoomPhotoSelected', { name: file.name, size: file.size });
  }

  if (roomFileInput) roomFileInput.addEventListener('change', (e) => handleRoomSelect(e.target.files[0]));
  if (roomCameraInput) roomCameraInput.addEventListener('change', (e) => handleRoomSelect(e.target.files[0]));

  function resetRoom() {
    currentRoomFile = null;
    if (roomFileInput) roomFileInput.value = '';
    if (roomCameraInput) roomCameraInput.value = '';
    roomPreviewImg.src = '';
    roomPreviewBox.classList.add('d-none');
    roomDropzone.classList.remove('d-none');
    validateFormState();
  }

  if (removeRoomBtn) removeRoomBtn.addEventListener('click', resetRoom);

  // Product File Selection
  function handleProdSelect(file) {
    if (!file) return;
    currentProdFile = file;
    const url = URL.createObjectURL(file);
    prodPreviewImg.src = url;
    prodDropzone.classList.add('d-none');
    prodPreviewBox.classList.remove('d-none');
    hideError();
    validateFormState();
    notifyNativeApp('onProductPhotoSelected', { name: file.name, size: file.size });
  }

  if (prodFileInput) prodFileInput.addEventListener('change', (e) => handleProdSelect(e.target.files[0]));
  if (prodCameraInput) prodCameraInput.addEventListener('change', (e) => handleProdSelect(e.target.files[0]));

  function resetProduct() {
    currentProdFile = null;
    if (prodFileInput) prodFileInput.value = '';
    if (prodCameraInput) prodCameraInput.value = '';
    prodPreviewImg.src = '';
    prodPreviewBox.classList.add('d-none');
    prodDropzone.classList.remove('d-none');
    validateFormState();
  }

  if (removeProdBtn) removeProdBtn.addEventListener('click', resetProduct);

  // Dimension input listeners
  [widthInput, depthInput, heightInput].forEach((input) => {
    if (input) input.addEventListener('input', validateFormState);
  });

  function validateFormState() {
    const w = parseFloat(widthInput?.value);
    const d = parseFloat(depthInput?.value);
    const h = parseFloat(heightInput?.value);

    const hasRoom = !!currentRoomFile;
    const hasProd = !!currentProdFile;
    const hasDims = !isNaN(w) && w > 0 && !isNaN(d) && d > 0 && !isNaN(h) && h > 0;
    const hasPlacement = !!placementHiddenInput?.value;

    const missing = [];
    if (!hasRoom) missing.push('Customer Room');
    if (!hasProd) missing.push('Furniture Product');
    if (!hasDims) missing.push('Dimensions');
    if (!hasPlacement) missing.push('Placement');

    const isValid = hasRoom && hasProd && hasDims && hasPlacement;
    if (generateBtn) generateBtn.disabled = !isValid || isSubmitting;

    if (!isValid && missing.length > 0) {
      if (missingRequirementsText) {
        missingRequirementsText.textContent = `Please provide: ${missing.join(', ')} to generate`;
        missingRequirementsText.classList.remove('d-none');
      }
    } else {
      if (missingRequirementsText) missingRequirementsText.classList.add('d-none');
    }

    return isValid;
  }

  function showError(msg) {
    if (errorMessage) errorMessage.textContent = msg;
    if (errorAlert) errorAlert.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notifyNativeApp('onVisualizationError', { error: msg });
  }

  function hideError() {
    if (errorAlert) errorAlert.classList.add('d-none');
  }

  // Form Reset
  function resetAll() {
    resetRoom();
    resetProduct();
    if (instructionsInput) instructionsInput.value = '';
    if (charCounter) charCounter.textContent = '0';
    currentVisualization = null;
    hideError();
    resultCard.classList.add('d-none');
    visualizerFormCard.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    notifyNativeApp('onReset');
  }

  if (headerResetBtn) headerResetBtn.addEventListener('click', resetAll);
  if (startNewBtn) startNewBtn.addEventListener('click', resetAll);

  // Form Submit Handler
  generateBtn.addEventListener('click', async () => {
    if (!validateFormState() || isSubmitting) return;

    isSubmitting = true;
    generateBtn.disabled = true;
    btnSpinner.classList.remove('d-none');
    btnText.textContent = 'Placing in Customer Room...';
    hideError();

    notifyNativeApp('onVisualizationStart');

    try {
      // 1. Client-side compress images (room -> JPEG, product -> transparent PNG)
      const [readyRoom, readyProd] = await Promise.all([
        compressImageForUpload(currentRoomFile, 1600, false),
        compressImageForUpload(currentProdFile, 1600, true),
      ]);

      const selectedUnit = document.querySelector('input[name="dimension_unit"]:checked')?.value || 'cm';

      const formData = new FormData();
      formData.append('hall_image', readyRoom, 'customer_room.jpg');
      formData.append('product_image', readyProd, 'showroom_product.png');
      formData.append('product_width', widthInput.value);
      formData.append('product_depth', depthInput.value);
      formData.append('product_height', heightInput.value);
      formData.append('dimension_unit', selectedUnit);
      formData.append('placement', placementHiddenInput.value);
      formData.append('instructions', instructionsInput.value.trim());

      const res = await fetch('/api/visualize', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Server responded with error (${res.status})`);
      }

      currentVisualization = data.visualization;
      displayVisualization(data.visualization);
      notifyNativeApp('onVisualizationComplete', data.visualization);
    } catch (err) {
      console.error(err);
      showError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      isSubmitting = false;
      btnSpinner.classList.add('d-none');
      btnText.textContent = 'Generate AI Visualization';
      validateFormState();
    }
  });

  // Display Visualization Result
  function displayVisualization(vis) {
    const generatedSrc = vis.generated_image_data || vis.generated_image_path;
    const roomSrc = roomPreviewImg.src || vis.hall_image_path;

    sliderAfterImg.src = generatedSrc;
    sliderBeforeImg.src = roomSrc;
    fullResLink.href = generatedSrc;

    downloadLink.onclick = (e) => {
      e.preventDefault();
      downloadAsPng(generatedSrc, `rajgarhwala_${vis.id || Date.now()}.png`);
    };

    // Native & Web Share Support
    if (shareBtn) {
      shareBtn.onclick = async (e) => {
        e.preventDefault();
        notifyNativeApp('onShareRequest', {
          image_data: generatedSrc,
          title: 'Rajgarhwala Furniture Room Visualization',
        });

        // If Web Share API is available (iOS Safari, Android Chrome, WebView with WebShare)
        if (navigator.share) {
          try {
            // Convert data URL to Blob File for native share sheet
            const res = await fetch(generatedSrc);
            const blob = await res.blob();
            const file = new File([blob], `rajgarhwala_visualization.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'Rajgarhwala AI Room Visualization',
                text: `Here is how the showroom furniture looks placed in your actual room!`,
                files: [file],
              });
              return;
            } else {
              await navigator.share({
                title: 'Rajgarhwala AI Room Visualization',
                text: `Here is how the showroom furniture looks placed in your room!`,
                url: window.location.href,
              });
              return;
            }
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              console.warn('[Share error]', shareErr);
            }
          }
        }

        // Fallback: download the image
        downloadAsPng(generatedSrc, `rajgarhwala_${vis.id || Date.now()}.png`);
      };
    }

    resultSummaryText.textContent = `${vis.product_width}×${vis.product_depth}×${vis.product_height} ${vis.dimension_unit} • ${vis.placement}`;

    // Fill regen controls
    regenPlacementSelect.value = vis.placement;
    regenInstructionsInput.value = vis.instructions || '';

    visualizerFormCard.classList.add('d-none');
    resultCard.classList.remove('d-none');
    window.scrollTo({ top: resultCard.offsetTop - 20, behavior: 'smooth' });
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

  // Handle Regeneration
  regenBtn.addEventListener('click', async () => {
    if (!currentVisualization || isSubmitting) return;

    const newPlacement = regenPlacementSelect.value;
    const newInstructions = regenInstructionsInput.value.trim();

    isSubmitting = true;
    regenBtn.disabled = true;
    regenSpinner.classList.remove('d-none');
    notifyNativeApp('onVisualizationStart');

    try {
      if (currentRoomFile && currentProdFile) {
        const [readyRoom, readyProd] = await Promise.all([
          compressImageForUpload(currentRoomFile, 1600, false),
          compressImageForUpload(currentProdFile, 1600, true),
        ]);

        const selectedUnit = document.querySelector('input[name="dimension_unit"]:checked')?.value || 'cm';

        const formData = new FormData();
        formData.append('hall_image', readyRoom, 'customer_room.jpg');
        formData.append('product_image', readyProd, 'showroom_product.png');
        formData.append('product_width', widthInput.value);
        formData.append('product_depth', depthInput.value);
        formData.append('product_height', heightInput.value);
        formData.append('dimension_unit', selectedUnit);
        formData.append('placement', newPlacement);
        formData.append('instructions', newInstructions);

        const res = await fetch('/api/visualize', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || `Server responded with error (${res.status})`);
        }

        currentVisualization = data.visualization;
        displayVisualization(data.visualization);
        notifyNativeApp('onVisualizationComplete', data.visualization);
      } else {
        const res = await fetch(`/api/visualize/${currentVisualization.id}/regenerate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            placement: newPlacement,
            instructions: newInstructions,
            ...currentVisualization,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || 'Regeneration failed.');
        }

        currentVisualization = data.visualization;
        displayVisualization(data.visualization);
        notifyNativeApp('onVisualizationComplete', data.visualization);
      }
    } catch (err) {
      alert('Regeneration Error: ' + err.message);
    } finally {
      isSubmitting = false;
      regenBtn.disabled = false;
      regenSpinner.classList.add('d-none');
    }
  });

  // Initial validation check
  validateFormState();
});
