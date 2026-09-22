<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="theme-color" content="#1c1917">
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
<body>

  <!-- Top Navbar / Header (can be hidden with ?hide_header=1 in native app) -->
  <header class="bg-white border-bottom py-2 py-sm-3 sticky-top app-header">
    <div class="container d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="bg-dark text-white rounded-3 p-2 d-flex align-items-center justify-content-center flex-shrink-0" style="width: 36px; height: 36px;">
          <i class="bi bi-house-door-fill fs-5"></i>
        </div>
        <div>
          <h1 class="h6 h5-sm mb-0 brand-title text-dark">Rajgarhwala AI</h1>
          <p class="small text-muted mb-0 d-none d-sm-block">Visualize furniture in customer's actual room</p>
        </div>
      </div>
      <div class="d-flex align-items-center gap-2">
        <button type="button" id="headerResetBtn" class="btn btn-outline-secondary btn-sm px-2 py-1 rounded-3 d-flex align-items-center gap-1" title="Reset Form">
          <i class="bi bi-arrow-counterclockwise"></i> <span class="d-none d-sm-inline">Reset</span>
        </button>
        <span class="badge px-2 py-1 px-sm-3 py-sm-2 rounded-pill font-monospace" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a !important;">
          <i class="bi bi-stars text-warning me-1"></i> AI Active
        </span>
      </div>
    </div>
  </header>

  <main class="container my-3 my-sm-4" style="max-width: 860px;">

    <!-- Error Alert banner -->
    <div id="errorAlert" class="alert alert-danger d-flex align-items-center mb-3 mb-sm-4 d-none shadow-sm rounded-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 fs-5"></i>
      <div id="errorMessage" class="small fw-semibold"></div>
    </div>

    <!-- Showroom Workflow Notice -->
    <div class="card card-custom p-3 mb-3 mb-sm-4 bg-light border-0">
      <div class="d-flex gap-2 align-items-start">
        <i class="bi bi-info-circle-fill text-warning fs-5 mt-1 flex-shrink-0"></i>
        <div>
          <p class="small text-secondary mb-1">
            <strong>Showroom Workflow:</strong> Take or select photos of the customer's room & showroom piece. The AI isolates the product and <strong>preserves the customer's real room 100%</strong> without altering walls, flooring, or lighting.
          </p>
          <p class="small text-muted mb-0" style="font-size: 0.78rem;">
            <i class="bi bi-phone me-1"></i><strong>App Tip:</strong> If camera does not trigger directly inside your app, verify Camera permissions are enabled for this app in Settings or select from Gallery.
          </p>
        </div>
      </div>
    </div>

    <!-- MAIN VISUALIZER FORM -->
    <div id="visualizerFormCard">

      <!-- 1. Room Upload Card -->
      <div class="card card-custom p-3 p-sm-4 mb-3 mb-sm-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">1</span>
            <h2 class="h6 mb-0 fw-bold">Customer Room Photo</h2>
          </div>
          <span class="small text-muted" style="font-size: 0.78rem;">JPG, PNG (Max 20MB)</span>
        </div>

        <!-- Room Dropzone -->
        <div id="roomDropzone" class="upload-dropzone">
          <div class="mb-2 text-warning fs-2"><i class="bi bi-house-heart"></i></div>
          <h3 class="h6 fw-bold mb-1">Customer's Room or Hall</h3>
          <p class="small text-muted mb-3 mx-auto" style="max-width: 420px; font-size: 0.82rem;">
            Take or upload the customer's real room photo. Room structure, walls, floor, and lighting are 100% kept intact.
          </p>
          <div class="d-flex justify-content-center gap-2 flex-wrap">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 cursor-pointer d-flex align-items-center gap-1 shadow-sm">
              <i class="bi bi-camera-fill"></i> Take Photo
              <input type="file" id="roomCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 cursor-pointer d-flex align-items-center gap-1">
              <i class="bi bi-image"></i> From Gallery
              <input type="file" id="roomFileInput" accept="image/*" class="d-none">
            </label>
          </div>
        </div>

        <!-- Room Preview -->
        <div id="roomPreviewBox" class="preview-container d-none">
          <img id="roomPreviewImg" src="" alt="Customer Room Preview">
          <div class="preview-overlay">
            <span class="text-white small fw-semibold"><i class="bi bi-check-circle-fill text-success me-1"></i> Room Loaded</span>
            <button type="button" id="removeRoomBtn" class="btn btn-danger btn-sm rounded-3 py-1 px-2">
              <i class="bi bi-trash-fill"></i> Remove
            </button>
          </div>
        </div>
      </div>

      <!-- 2. Product Upload Card -->
      <div class="card card-custom p-3 p-sm-4 mb-3 mb-sm-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">2</span>
            <h2 class="h6 mb-0 fw-bold">Furniture Product Photo</h2>
          </div>
          <span class="small text-muted" style="font-size: 0.78rem;">Auto-Isolated PNG</span>
        </div>

        <!-- Product Dropzone -->
        <div id="prodDropzone" class="upload-dropzone">
          <div class="mb-2 text-warning fs-2"><i class="bi bi-lamp"></i></div>
          <h3 class="h6 fw-bold mb-1">Showroom Furniture Piece</h3>
          <p class="small text-muted mb-3 mx-auto" style="max-width: 420px; font-size: 0.82rem;">
            Photo of sofa, bed, chair, or table. Background is automatically stripped and isolated for clean placement.
          </p>
          <div class="d-flex justify-content-center gap-2 flex-wrap">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 cursor-pointer d-flex align-items-center gap-1 shadow-sm">
              <i class="bi bi-camera-fill"></i> Take Photo
              <input type="file" id="prodCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 cursor-pointer d-flex align-items-center gap-1">
              <i class="bi bi-image"></i> From Gallery
              <input type="file" id="prodFileInput" accept="image/*" class="d-none">
            </label>
          </div>
        </div>

        <!-- Product Preview -->
        <div id="prodPreviewBox" class="preview-container d-none">
          <img id="prodPreviewImg" src="" alt="Furniture Product Preview">
          <div class="preview-overlay">
            <span class="text-white small fw-semibold"><i class="bi bi-check-circle-fill text-success me-1"></i> Furniture Isolated</span>
            <button type="button" id="removeProdBtn" class="btn btn-danger btn-sm rounded-3 py-1 px-2">
              <i class="bi bi-trash-fill"></i> Remove
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Dimensions Form Card -->
      <div class="card card-custom p-3 p-sm-4 mb-3 mb-sm-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">3</span>
            <h2 class="h6 mb-0 fw-bold">Dimensions</h2>
          </div>

          <!-- Unit Selector -->
          <div class="btn-group unit-toggle" role="group" aria-label="Dimension Unit">
            <input type="radio" class="btn-check" name="dimension_unit" id="unitCm" value="cm" checked>
            <label class="btn btn-outline-dark" for="unitCm">cm</label>

            <input type="radio" class="btn-check" name="dimension_unit" id="unitInch" value="inch">
            <label class="btn btn-outline-dark" for="unitInch">inch</label>

            <input type="radio" class="btn-check" name="dimension_unit" id="unitFt" value="ft">
            <label class="btn btn-outline-dark" for="unitFt">ft</label>
          </div>
        </div>

        <div class="row g-2 g-sm-3">
          <div class="col-4">
            <label for="productWidth" class="form-label small fw-semibold text-secondary mb-1">Width (W)</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productWidth" value="240" placeholder="e.g. 240" required inputmode="decimal">
          </div>
          <div class="col-4">
            <label for="productDepth" class="form-label small fw-semibold text-secondary mb-1">Depth (D)</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productDepth" value="90" placeholder="e.g. 90" required inputmode="decimal">
          </div>
          <div class="col-4">
            <label for="productHeight" class="form-label small fw-semibold text-secondary mb-1">Height (H)</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productHeight" value="85" placeholder="e.g. 85" required inputmode="decimal">
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0" style="font-size: 0.78rem;">
          <i class="bi bi-rulers me-1"></i> Used as scale reference to preserve realistic room proportions
        </p>
      </div>

      <!-- 4. Placement Selector Card -->
      <div class="card card-custom p-3 p-sm-4 mb-3 mb-sm-4">
        <div class="d-flex align-items-center gap-2 mb-3">
          <span class="step-badge">4</span>
          <h2 class="h6 mb-0 fw-bold">Placement in Room</h2>
        </div>

        <input type="hidden" id="selectedPlacement" value="Center">

        <div class="row g-2">
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement active" data-placement="Center">Center</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Left">Left Side</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Right">Right Side</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Back Wall">Back Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Left Wall">Left Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Right Wall">Right Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Corner">Corner</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Custom">Custom</button>
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0" style="font-size: 0.78rem;">
          <i class="bi bi-compass me-1"></i> Floor contact shadow and perspective scale adjust automatically
        </p>
      </div>

      <!-- 5. Additional Instructions Card -->
      <div class="card card-custom p-3 p-sm-4 mb-3 mb-sm-4">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="step-badge">5</span>
          <h2 class="h6 mb-0 fw-bold">Instructions (Optional)</h2>
        </div>
        <div class="position-relative">
          <textarea id="instructions" class="form-control rounded-3" rows="2" maxlength="1000" placeholder="e.g. Place facing center table, keep walking clearance"></textarea>
          <div class="position-absolute bottom-0 end-0 p-2 small text-muted font-monospace" style="font-size: 0.72rem;"><span id="charCounter">0</span>/1000</div>
        </div>
      </div>

      <!-- Generate Button -->
      <div class="text-center pb-5">
        <button type="button" id="generateBtn" class="btn btn-dark btn-lg w-100 py-3 rounded-4 fw-bold shadow-lg" disabled>
          <span id="btnSpinner" class="spinner-border spinner-border-sm me-2 d-none" role="status" aria-hidden="true"></span>
          <i class="bi bi-stars text-warning me-1"></i>
          <span id="btnText">Generate AI Visualization</span>
        </button>
        <p id="missingRequirementsText" class="small text-muted mt-2 mb-0"></p>
      </div>

    </div>

    <!-- RESULT VIEWER CARD (HIDDEN INITIALLY) -->
    <div id="resultCard" class="card card-custom p-3 p-sm-4 mb-5 d-none shadow-lg">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 mb-3 pb-3 border-bottom">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill small fw-semibold mb-1">
            <i class="bi bi-check-circle-fill me-1"></i> Real Room Visualization Ready
          </span>
          <h2 class="h5 brand-title mb-1">Customer Room Preview</h2>
          <p id="resultSummaryText" class="small text-muted mb-0"></p>
        </div>
        <div>
          <button type="button" id="startNewBtn" class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3">
            <i class="bi bi-plus-circle me-1"></i> New Visual
          </button>
        </div>
      </div>

      <!-- Interactive Before / After Slider -->
      <div class="mb-3">
        <div id="sliderContainer" class="slider-container">
          <!-- After (AI Generated Image) -->
          <img id="sliderAfterImg" class="slider-img-after" src="" alt="AI Visualized Room">
          <span class="badge-pill-ai">Furniture Placed</span>

          <!-- Before (Original Room Clipped) -->
          <div id="sliderClip" class="slider-clip-container">
            <img id="sliderBeforeImg" class="slider-img-before" src="" alt="Original Customer Room">
            <span class="badge-pill-room">Original Room</span>
          </div>

          <!-- Divider Handle -->
          <div id="sliderDivider" class="slider-divider">
            <div class="slider-handle"><i class="bi bi-arrows"></i></div>
          </div>

          <!-- Range Input Overlay -->
          <input type="range" id="sliderRange" class="slider-range-input" min="0" max="100" value="50" aria-label="Comparison slider">
        </div>
        <p class="text-center text-muted small mt-2 mb-0" style="font-size: 0.78rem;">
          <i class="bi bi-arrow-left-right me-1"></i> Drag slider sideways to compare before and after
        </p>
      </div>

      <!-- Mobile-Friendly Action Buttons -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
        <div class="d-flex gap-2 flex-wrap w-100 w-sm-auto">
          <button type="button" id="shareBtn" class="btn btn-success btn-sm rounded-3 fw-semibold flex-grow-1 flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1 shadow-sm">
            <i class="bi bi-whatsapp"></i> Share Image
          </button>
          <a id="downloadLink" href="#" download="rajgarhwala-room-visualization.png" class="btn btn-dark btn-sm rounded-3 fw-semibold flex-grow-1 flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1">
            <i class="bi bi-download"></i> Save Image
          </a>
          <a id="fullResLink" href="#" target="_blank" class="btn btn-light btn-sm rounded-3 fw-semibold border flex-grow-1 flex-sm-grow-0 d-flex align-items-center justify-content-center gap-1">
            <i class="bi bi-arrows-fullscreen"></i> Full Screen
          </a>
        </div>
      </div>

      <!-- Regeneration Controls -->
      <div class="card p-3 bg-light border-0 rounded-4">
        <h3 class="h6 fw-bold mb-1"><i class="bi bi-arrow-repeat me-1 text-warning"></i> Adjust & Reposition</h3>
        <p class="small text-muted mb-3" style="font-size: 0.8rem;">Change placement or orientation without taking new photos.</p>

        <div class="row g-2 g-sm-3">
          <div class="col-sm-5">
            <label for="regenPlacementSelect" class="form-label small fw-semibold text-secondary mb-1">New Placement</label>
            <select id="regenPlacementSelect" class="form-select rounded-3">
              <option value="Center">Center</option>
              <option value="Left">Left Side</option>
              <option value="Right">Right Side</option>
              <option value="Against Back Wall">Back Wall</option>
              <option value="Against Left Wall">Left Wall</option>
              <option value="Against Right Wall">Right Wall</option>
              <option value="Corner">Corner</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div class="col-sm-7">
            <label for="regenInstructionsInput" class="form-label small fw-semibold text-secondary mb-1">Updated Instructions</label>
            <input type="text" id="regenInstructionsInput" class="form-control rounded-3" placeholder="e.g. Move slightly right, face towards window">
          </div>
        </div>

        <div class="mt-3 text-end">
          <button type="button" id="regenBtn" class="btn btn-dark btn-sm px-3 py-2 rounded-3 fw-semibold w-100 w-sm-auto">
            <span id="regenSpinner" class="spinner-border spinner-border-sm me-1 d-none" role="status"></span>
            <i class="bi bi-stars text-warning me-1"></i> Reposition Piece
          </button>
        </div>
      </div>

    </div>

  </main>

  <footer class="text-center py-3 text-muted small border-top bg-white app-footer">
    <div class="container">
      &copy; <?= date('Y') ?> Rajgarhwala AI Furniture Visualizer &bull; Showroom Sales Edition
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
