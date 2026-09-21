/**
 * Interactive Before/After Image Comparison Slider
 */
function initImageSlider(sliderContainerId, rangeInputId, clipContainerId, dividerId) {
  const container = document.getElementById(sliderContainerId);
  const rangeInput = document.getElementById(rangeInputId);
  const clipContainer = document.getElementById(clipContainerId);
  const divider = document.getElementById(dividerId);

  if (!container || !rangeInput || !clipContainer || !divider) return;

  function updateSlider(val) {
    clipContainer.style.width = val + '%';
    divider.style.left = val + '%';
  }

  rangeInput.addEventListener('input', (e) => {
    updateSlider(e.target.value);
  });

  // Touch and drag support
  let isDragging = false;
  function handleMove(clientX) {
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    rangeInput.value = percent;
    updateSlider(percent);
  }

  container.addEventListener('pointerdown', (e) => {
    isDragging = true;
    handleMove(e.clientX);
  });

  window.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
  });

  updateSlider(50);
}
