<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#1c1917">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <title>Rajgarhwala AI — Furniture Room Visualizer</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Custom Luxury Showroom Style -->
  <link rel="stylesheet" href="/css/style.css">
</head>
<body class="mobile-app-body">

  <!-- Top App Header -->
  <header class="bg-white border-bottom py-2 sticky-top app-header">
    <div class="container d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="bg-dark text-white rounded-3 p-1 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
          <i class="bi bi-house-door-fill fs-6"></i>
        </div>
        <div>
          <h1 class="h6 mb-0 fw-bold brand-title text-dark">AI Visualizer</h1>
        </div>
      </div>
      <!-- Progress Indicator -->
      <div class="d-flex align-items-center gap-1 font-monospace" style="font-size: 0.75rem;">
        <span id="stepBadge1" class="step-pill active">1 Room</span>
        <span class="text-muted">→</span>
        <span id="stepBadge2" class="step-pill">2 Products</span>
        <span class="text-muted">→</span>
        <span id="stepBadge3" class="step-pill">3 Result</span>
      </div>
    </div>
  </header>

  <main class="container my-3" style="max-width: 580px;">

    <!-- Error Alert Banner -->
    <div id="errorAlert" class="alert alert-danger d-flex align-items-center mb-3 d-none shadow-sm rounded-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 fs-5"></i>
      <div id="errorMessage" class="small fw-semibold"></div>
    </div>

    <!-- ========================================== -->
    <!-- SCREEN 1: ADD ROOM -->
    <!-- ========================================== -->
    <section id="screen1" class="app-screen">
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h2 class="h5 fw-bold mb-0">Add Room</h2>
        <span class="badge bg-light text-dark border">Step 1 of 2</span>
      </div>

      <!-- Large Room Image Upload Area -->
      <div class="card card-custom p-3 mb-3">
        <!-- Before Upload -->
        <div id="roomEmptyState" class="upload-dropzone py-4">
          <div class="mb-2 text-warning fs-1"><i class="bi bi-camera"></i></div>
          <h3 class="h6 fw-bold mb-1">+ Add Room Photo</h3>
          <p class="small text-muted mb-3 mx-auto" style="max-width: 340px; font-size: 0.82rem;">
            Take or upload the customer's actual room photograph. Walls, doors, windows, and lighting are 100% preserved.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 shadow-sm">
              <i class="bi bi-camera-fill"></i> Take Photo
              <input type="file" id="roomCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1">
              <i class="bi bi-image"></i> Gallery
              <input type="file" id="roomGalleryInput" accept="image/*" class="d-none">
            </label>
          </div>
        </div>

        <!-- After Upload (Room Preview) -->
        <div id="roomLoadedState" class="preview-container d-none">
          <img id="roomPreviewImg" src="" alt="Customer Room Photo">
          <div class="preview-overlay">
            <span class="text-white small fw-semibold"><i class="bi bi-check-circle-fill text-success me-1"></i> Room Photo Loaded</span>
            <div class="d-flex gap-1">
              <label class="btn btn-light btn-sm rounded-3 py-1 px-2 cursor-pointer mb-0">
                <i class="bi bi-arrow-repeat"></i> Change
                <input type="file" id="roomChangeInput" accept="image/*" class="d-none">
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Room Size Section -->
      <div class="card card-custom p-3 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <h3 class="h6 fw-bold mb-0"><i class="bi bi-rulers me-1 text-warning"></i> Room Size</h3>
          <span class="small text-muted font-monospace">Unit: Feet (ft)</span>
        </div>
        <p class="small text-muted mb-3" style="font-size: 0.8rem;">
          Real room measurements to ensure accurate physical scale of products.
        </p>

        <div class="row g-2">
          <div class="col-4">
            <label for="roomLength" class="form-label small fw-semibold text-secondary mb-1">Length</label>
            <div class="input-group input-group-sm">
              <input type="number" step="any" min="1" class="form-control rounded-start-3" id="roomLength" value="15" placeholder="15" required inputmode="decimal">
              <span class="input-group-text rounded-end-3">ft</span>
            </div>
          </div>
          <div class="col-4">
            <label for="roomWidth" class="form-label small fw-semibold text-secondary mb-1">Width</label>
            <div class="input-group input-group-sm">
              <input type="number" step="any" min="1" class="form-control rounded-start-3" id="roomWidth" value="12" placeholder="12" required inputmode="decimal">
              <span class="input-group-text rounded-end-3">ft</span>
            </div>
          </div>
          <div class="col-4">
            <label for="roomHeight" class="form-label small fw-semibold text-secondary mb-1">Height</label>
            <div class="input-group input-group-sm">
              <input type="number" step="any" min="1" class="form-control rounded-start-3" id="roomHeight" value="10" placeholder="10" required inputmode="decimal">
              <span class="input-group-text rounded-end-3">ft</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Continue Button -->
      <div class="pt-2 pb-4">
        <button type="button" id="continueToProductsBtn" class="btn btn-dark btn-lg w-100 py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2" disabled>
          <span>Continue</span> <i class="bi bi-arrow-right"></i>
        </button>
        <p id="roomValidationHint" class="text-center small text-muted mt-2 mb-0" style="font-size: 0.8rem;">
          Please upload room photo to continue
        </p>
      </div>
    </section>


    <!-- ========================================== -->
    <!-- SCREEN 2: ADD PRODUCTS -->
    <!-- ========================================== -->
    <section id="screen2" class="app-screen d-none">
      <!-- Mini Room Summary Banner -->
      <div class="card p-2 px-3 mb-3 bg-light border-0 rounded-4 d-flex flex-row align-items-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <img id="miniRoomThumb" src="" alt="Room thumbnail" class="rounded-2" style="width: 44px; height: 36px; object-fit: cover;">
          <div>
            <div class="small fw-bold text-dark">Customer Room</div>
            <div id="miniRoomDims" class="text-muted" style="font-size: 0.72rem;">15×12×10 ft</div>
          </div>
        </div>
        <button type="button" id="editRoomBtn" class="btn btn-link text-decoration-none btn-sm p-0 small fw-semibold text-warning">
          <i class="bi bi-pencil-square"></i> Change
        </button>
      </div>

      <div class="d-flex align-items-center justify-content-between mb-2">
        <div>
          <h2 class="h5 fw-bold mb-0">Add Products</h2>
          <p class="small text-muted mb-0" style="font-size: 0.8rem;">Up to 3 products in one room</p>
        </div>
        <span id="productCountBadge" class="badge bg-dark rounded-pill px-2 py-1 small font-monospace">0 / 3 Added</span>
      </div>

      <!-- Container for Uploaded Product Cards -->
      <div id="productsContainer" class="d-flex flex-column gap-3 mb-3"></div>

      <!-- Add Product Button Box (Hidden if 3 reached) -->
      <div id="addProductBox" class="card card-custom p-3 mb-3 border-dashed text-center">
        <input type="file" id="newProductFileInput" accept="image/*" class="d-none">
        <div class="py-2">
          <div class="text-warning fs-3 mb-1"><i class="bi bi-plus-circle"></i></div>
          <h3 class="h6 fw-bold mb-1">+ Add Product</h3>
          <p class="small text-muted mb-3" style="font-size: 0.8rem;">
            Take photo of showroom piece or pick from gallery. Background is removed automatically.
          </p>
          <div class="d-flex justify-content-center gap-2">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1 shadow-sm">
              <i class="bi bi-camera-fill"></i> Camera
              <input type="file" id="productCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 d-flex align-items-center gap-1">
              <i class="bi bi-image"></i> Gallery
              <input type="file" id="productGalleryInput" accept="image/*" class="d-none">
            </label>
          </div>
        </div>
      </div>

      <!-- Max Products Reached Notice -->
      <div id="maxProductsNotice" class="alert alert-secondary py-2 px-3 small text-center rounded-3 d-none mb-3">
        <i class="bi bi-check-circle-fill text-success me-1"></i> Maximum of 3 products added
      </div>

      <!-- Placement Mode Selector (Mode A: AI Auto Place vs Mode B: Tap to Place) -->
      <div class="card card-custom p-3 mb-3">
        <label class="form-label small fw-bold text-dark mb-2">
          <i class="bi bi-geo-alt-fill text-warning me-1"></i> Placement Mode
        </label>
        
        <div class="btn-group w-100 mb-2" role="group" aria-label="Placement mode">
          <input type="radio" class="btn-check" name="placementModeRadio" id="modeAutoRadio" value="auto" checked autocomplete="off">
          <label class="btn btn-outline-dark btn-sm py-2 fw-semibold" for="modeAutoRadio">
            <i class="bi bi-magic me-1 text-warning"></i> AI Auto Place
          </label>

          <input type="radio" class="btn-check" name="placementModeRadio" id="modeTapRadio" value="tap" autocomplete="off">
          <label class="btn btn-outline-dark btn-sm py-2 fw-semibold" for="modeTapRadio">
            <i class="bi bi-cursor-fill me-1 text-warning"></i> Tap to Place
          </label>
        </div>

        <!-- Mode A Description -->
        <div id="modeAutoDesc" class="small text-muted p-2 rounded-3 bg-light">
          <i class="bi bi-lightbulb text-warning me-1"></i>
          AI spatial engine calculates depth, eye-level perspective, and natural circulation to place products optimally.
        </div>

        <!-- Mode B Interactive Room Canvas -->
        <div id="modeTapContainer" class="d-none mt-2">
          <p class="small text-muted mb-2">
            <i class="bi bi-hand-index-thumb text-warning me-1"></i>
            Tap anywhere on the floor where you want the furniture placed:
          </p>
          <div id="tapRoomCanvasWrapper" class="position-relative rounded-3 overflow-hidden border shadow-sm" style="cursor: crosshair;">
            <img id="tapRoomImg" src="" alt="Room for tap placement" class="w-100 d-block" style="max-height: 240px; object-fit: contain; background: #1c1917;">
            <!-- Tap Marker Pin -->
            <div id="tapMarkerPin" class="position-absolute d-none" style="transform: translate(-50%, -50%); pointer-events: none; z-index: 10;">
              <span class="tap-pin-pulse"></span>
              <span class="tap-pin-dot">●</span>
            </div>
          </div>
          <div id="tapCoordinatesLabel" class="small font-monospace text-muted mt-1 text-center" style="font-size: 0.75rem;">
            No spot selected yet (tap on floor)
          </div>
        </div>
      </div>

      <!-- Optional Placement Hint -->
      <div class="card card-custom p-3 mb-4">
        <label for="optionalPlacement" class="form-label small fw-bold text-dark mb-1">
          Placement Hint <span class="text-muted fw-normal">(optional)</span>
        </label>
        <input type="text" id="optionalPlacement" class="form-control rounded-3" placeholder="Example: against left wall, or center" maxlength="150">
        <p class="small text-muted mt-1 mb-0" style="font-size: 0.75rem;">
          Optional guidance for AI placement (e.g. against back wall, left side, near window).
        </p>
      </div>

      <!-- Bottom Actions -->
      <div class="d-flex flex-column gap-2 pt-2 pb-4">
        <button type="button" id="generateVisualizationBtn" class="btn btn-dark btn-lg w-100 py-3 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2" disabled>
          <i class="bi bi-stars text-warning"></i>
          <span>Generate Visualization</span>
        </button>
        <button type="button" id="backToRoomBtn" class="btn btn-link text-muted text-decoration-none btn-sm py-1">
          <i class="bi bi-arrow-left"></i> Back to Room Setup
        </button>
      </div>
    </section>


    <!-- ========================================== -->
    <!-- SCREEN 3: CREATING VISUALIZATION (LOADING) -->
    <!-- ========================================== -->
    <section id="screen3" class="app-screen d-none text-center py-4">
      <div class="card card-custom p-4 shadow-lg position-relative overflow-hidden" style="min-height: 420px; background: #0f172a;">
        <!-- Blurred Room Background -->
        <img id="loadingRoomBg" src="" alt="Room Loading Background" class="position-absolute inset-0 w-100 h-100" style="object-fit: cover; opacity: 0.28; filter: blur(6px);">

        <div class="position-relative z-1 d-flex flex-column align-items-center justify-content-center my-auto py-5 text-white">
          <!-- Animated Spinner Glow -->
          <div class="spinner-grow text-warning mb-4" role="status" style="width: 3.5rem; height: 3.5rem;">
            <span class="visually-hidden">Loading...</span>
          </div>

          <h2 class="h4 fw-bold mb-2">Creating your visualization...</h2>
          <p class="text-light-50 small mb-4" style="color: #cbd5e1; font-size: 0.9rem;">
            Placing your products in the room.
          </p>

          <!-- Cycling Status Message -->
          <div class="px-3 py-2 rounded-pill font-monospace shadow-sm" style="background: rgba(255, 255, 255, 0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); font-size: 0.85rem;">
            <i class="bi bi-magic text-warning me-1"></i> <span id="loadingStatusText">Analyzing room...</span>
          </div>
        </div>
      </div>
    </section>


    <!-- ========================================== -->
    <!-- SCREEN 4: FINAL AI VISUALIZATION -->
    <!-- ========================================== -->
    <section id="screen4" class="app-screen d-none">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="h5 fw-bold mb-0">Your Result</h2>
        <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill small">
          <i class="bi bi-check-circle-fill me-1"></i> Real Room Kept 100%
        </span>
      </div>

      <!-- Dominant Result Viewer -->
      <div class="card card-custom p-2 mb-3 shadow-lg">
        <div id="sliderContainer" class="slider-container">
          <!-- After (Final Visualization) -->
          <img id="sliderAfterImg" class="slider-img-after" src="" alt="AI Visualized Room">
          <span class="badge-pill-ai">With Products</span>

          <!-- Before (Original Room) -->
          <div id="sliderClip" class="slider-clip-container">
            <img id="sliderBeforeImg" class="slider-img-before" src="" alt="Original Room">
            <span class="badge-pill-room">Original Room</span>
          </div>

          <!-- Divider -->
          <div id="sliderDivider" class="slider-divider">
            <div class="slider-handle"><i class="bi bi-arrows"></i></div>
          </div>

          <!-- Range Input Overlay -->
          <input type="range" id="sliderRange" class="slider-range-input" min="0" max="100" value="50" aria-label="Comparison slider">
        </div>
        <p class="text-center text-muted small mt-2 mb-1" style="font-size: 0.75rem;">
          <i class="bi bi-arrow-left-right me-1"></i> Slide horizontally to compare with original room
        </p>
      </div>

      <!-- Quick Non-Technical Adjustment Bar -->
      <div class="card card-custom p-3 mb-3">
        <div class="d-flex align-items-center justify-content-between mb-2">
          <span class="small fw-bold text-dark"><i class="bi bi-sliders text-warning me-1"></i> Fine-Tune Placement</span>
          <span id="adjustStatus" class="small text-muted font-monospace" style="font-size: 0.72rem;">Tap to nudge</span>
        </div>
        <div class="row g-1">
          <div class="col-4">
            <button type="button" id="nudgeLeftBtn" class="btn btn-outline-dark btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem;">
              <i class="bi bi-arrow-left"></i> Left
            </button>
          </div>
          <div class="col-4">
            <button type="button" id="nudgeRightBtn" class="btn btn-outline-dark btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem;">
              Right <i class="bi bi-arrow-right"></i>
            </button>
          </div>
          <div class="col-4">
            <button type="button" id="rotateBtn" class="btn btn-outline-dark btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem;">
              <i class="bi bi-arrow-clockwise"></i> Rotate
            </button>
          </div>
          <div class="col-4 mt-1">
            <button type="button" id="scaleMinusBtn" class="btn btn-outline-secondary btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem;">
              <i class="bi bi-dash-lg"></i> Smaller
            </button>
          </div>
          <div class="col-4 mt-1">
            <button type="button" id="scalePlusBtn" class="btn btn-outline-secondary btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1" style="font-size: 0.8rem;">
              <i class="bi bi-plus-lg"></i> Bigger
            </button>
          </div>
          <div class="col-4 mt-1">
            <button type="button" id="resetAdjustBtn" class="btn btn-light border btn-sm w-100 py-2 rounded-3 d-flex align-items-center justify-content-center gap-1 text-muted" style="font-size: 0.8rem;">
              <i class="bi bi-arrow-counterclockwise"></i> Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Products Used Thumbnails -->
      <div class="card card-custom p-3 mb-3 bg-light border-0">
        <div id="resultProductsHeader" class="small fw-bold text-dark mb-2">Products Placed</div>
        <div id="resultProductsThumbList" class="d-flex gap-2 flex-wrap"></div>
      </div>

      <!-- Primary Action Buttons -->
      <div class="d-flex flex-column gap-2 pb-4">
        <button type="button" id="saveImageBtn" class="btn btn-dark btn-lg py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-download"></i>
          <span>Save Image</span>
        </button>

        <button type="button" id="shareImageBtn" class="btn btn-success btn-lg py-3 rounded-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2">
          <i class="bi bi-whatsapp"></i>
          <span>Share Image</span>
        </button>

        <div class="d-flex gap-2 mt-1">
          <button type="button" id="tryAgainBtn" class="btn btn-outline-secondary btn-sm flex-fill py-2 rounded-3 fw-semibold">
            <i class="bi bi-arrow-repeat me-1"></i> Edit Products
          </button>
          <button type="button" id="startOverBtn" class="btn btn-outline-secondary btn-sm flex-fill py-2 rounded-3 fw-semibold">
            <i class="bi bi-plus-circle me-1"></i> New Room
          </button>
        </div>
      </div>
    </section>

  </main>

  <footer class="text-center py-3 text-muted small border-top bg-white app-footer">
    <div class="container" style="font-size: 0.75rem;">
      Rajgarhwala AI &bull; Showroom Furniture Visualizer
    </div>
  </footer>

  <!-- Bootstrap 5 JS Bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  <!-- Client compression & product isolation for mobile photos -->
  <script src="/js/client-compress.js"></script>
  <!-- Touch-friendly Before / After Slider -->
  <script src="/js/image-slider.js"></script>
  <!-- Main Visualizer Application Script with Native WebView Bridge -->
  <script src="/js/visualizer.js"></script>
</body>
</html>
