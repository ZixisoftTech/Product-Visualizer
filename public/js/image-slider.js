/**
 * Interactive Before/After Image Comparison Slider
 * Touch-optimized for Mobile WebViews & Touchscreens.
 */
function initImageSlider(sliderContainerId, rangeInputId, clipContainerId, dividerId) {
  const container = document.getElementById(sliderContainerId);
  const rangeInput = document.getElementById(rangeInputId);
  const clipContainer = document.getElementById(clipContainerId);
  const divider = document.getElementById(dividerId);

  if (!container || !rangeInput || !clipContainer || !divider) return;

  function updateSlider(val) {
    const clamped = Math.max(0, Math.min(100, val));
    clipContainer.style.width = clamped + '%';
    divider.style.left = clamped + '%';
  }

  rangeInput.addEventListener('input', (e) => {
    updateSlider(e.target.value);
  });

  // Pointer drag support with capture
  let isDragging = false;
  let activePointerId = null;

  function handleMove(clientX) {
    const rect = container.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    rangeInput.value = percent;
    updateSlider(percent);
  }

  container.addEventListener('pointerdown', (e) => {
    isDragging = true;
    activePointerId = e.pointerId;
    try {
      container.setPointerCapture(e.pointerId);
    } catch (_) {}
    handleMove(e.clientX);
    e.preventDefault();
  });

  container.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
    e.preventDefault();
  });

  function stopDrag(e) {
    if (isDragging && activePointerId !== null) {
      try {
        container.releasePointerCapture(activePointerId);
      } catch (_) {}
    }
    isDragging = false;
    activePointerId = null;
  }

  container.addEventListener('pointerup', stopDrag);
  container.addEventListener('pointercancel', stopDrag);

  // Initialize at 50%
  updateSlider(50);
}
