/**
 * Rajgarhwala AI Visualizer Frontend Controller
 */
document.addEventListener('DOMContentLoaded', () => {
  // Elements
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

  // Slider elements
  const sliderBeforeImg = document.getElementById('sliderBeforeImg');
  const sliderAfterImg = document.getElementById('sliderAfterImg');
  const fullResLink = document.getElementById('fullResLink');
  const downloadLink = document.getElementById('downloadLink');
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
  }

  roomFileInput.addEventListener('change', (e) => handleRoomSelect(e.target.files[0]));
  roomCameraInput.addEventListener('change', (e) => handleRoomSelect(e.target.files[0]));

  removeRoomBtn.addEventListener('click', () => {
    currentRoomFile = null;
    roomFileInput.value = '';
    roomCameraInput.value = '';
    roomPreviewImg.src = '';
    roomPreviewBox.classList.add('d-none');
    roomDropzone.classList.remove('d-none');
    validateFormState();
  });

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
  }

  prodFileInput.addEventListener('change', (e) => handleProdSelect(e.target.files[0]));
  prodCameraInput.addEventListener('change', (e) => handleProdSelect(e.target.files[0]));

  removeProdBtn.addEventListener('click', () => {
    currentProdFile = null;
    prodFileInput.value = '';
    prodCameraInput.value = '';
    prodPreviewImg.src = '';
    prodPreviewBox.classList.add('d-none');
    prodDropzone.classList.remove('d-none');
    validateFormState();
  });

  // Dimension input listeners
  [widthInput, depthInput, heightInput].forEach((input) => {
    input.addEventListener('input', validateFormState);
  });

  function validateFormState() {
    const w = parseFloat(widthInput.value);
    const d = parseFloat(depthInput.value);
    const h = parseFloat(heightInput.value);

    const hasRoom = !!currentRoomFile;
    const hasProd = !!currentProdFile;
    const hasDims = !isNaN(w) && w > 0 && !isNaN(d) && d > 0 && !isNaN(h) && h > 0;
    const hasPlacement = !!placementHiddenInput.value;

    const missing = [];
    if (!hasRoom) missing.push('Customer Room');
    if (!hasProd) missing.push('Furniture Product');
    if (!hasDims) missing.push('Dimensions');
    if (!hasPlacement) missing.push('Placement');

    const isValid = hasRoom && hasProd && hasDims && hasPlacement;
    generateBtn.disabled = !isValid || isSubmitting;

    if (!isValid && missing.length > 0) {
      missingRequirementsText.textContent = `Please provide: ${missing.join(', ')} to generate`;
      missingRequirementsText.classList.remove('d-none');
    } else {
      missingRequirementsText.classList.add('d-none');
    }

    return isValid;
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hideError() {
    errorAlert.classList.add('d-none');
  }

  // Form Submit Handler
  generateBtn.addEventListener('click', async () => {
    if (!validateFormState() || isSubmitting) return;

    isSubmitting = true;
    generateBtn.disabled = true;
    btnSpinner.classList.remove('d-none');
    btnText.textContent = 'Processing with AI & Placing Product...';
    hideError();

    try {
      // 1. Client-side compress images
      const [readyRoom, readyProd] = await Promise.all([
        compressImageForUpload(currentRoomFile),
        compressImageForUpload(currentProdFile),
      ]);

      const selectedUnit = document.querySelector('input[name="dimension_unit"]:checked')?.value || 'cm';

      const formData = new FormData();
      formData.append('hall_image', readyRoom, 'customer_room.jpg');
      formData.append('product_image', readyProd, 'showroom_product.jpg');
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
    downloadLink.href = generatedSrc;

    resultSummaryText.textContent = `${vis.product_width}×${vis.product_depth}×${vis.product_height} ${vis.dimension_unit} • ${vis.placement}`;

    // Fill regen controls
    regenPlacementSelect.value = vis.placement;
    regenInstructionsInput.value = vis.instructions || '';

    visualizerFormCard.classList.add('d-none');
    resultCard.classList.remove('d-none');
    window.scrollTo({ top: resultCard.offsetTop - 30, behavior: 'smooth' });
  }

  // Start New Visual
  startNewBtn.addEventListener('click', () => {
    resultCard.classList.add('d-none');
    visualizerFormCard.classList.remove('d-none');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Handle Regeneration
  regenBtn.addEventListener('click', async () => {
    if (!currentVisualization || isSubmitting) return;

    const newPlacement = regenPlacementSelect.value;
    const newInstructions = regenInstructionsInput.value.trim();

    isSubmitting = true;
    regenBtn.disabled = true;
    regenSpinner.classList.remove('d-none');

    try {
      const res = await fetch(`/api/visualize/${currentVisualization.id}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placement: newPlacement,
          instructions: newInstructions,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Regeneration failed.');
      }

      currentVisualization = data.visualization;
      displayVisualization(data.visualization);
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
