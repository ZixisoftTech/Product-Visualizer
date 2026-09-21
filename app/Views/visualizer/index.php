<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rajgarhwala AI — Furniture Room Visualizer</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <!-- Bootstrap Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  <!-- Custom Luxury Showroom Style -->
  <link rel="stylesheet" href="<?= base_url('css/style.css') ?>">
</head>
<body>

  <!-- Top Navbar / Header -->
  <header class="bg-white border-bottom py-3 sticky-top">
    <div class="container d-flex align-items-center justify-content-between">
      <div class="d-flex align-items-center gap-2">
        <div class="bg-dark text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;">
          <i class="bi bi-house-door-fill fs-5"></i>
        </div>
        <div>
          <h1 class="h5 mb-0 brand-title text-dark">Rajgarhwala AI</h1>
          <p class="small text-muted mb-0 d-none d-sm-block">Visualize furniture in customer's actual room</p>
        </div>
      </div>
      <div>
        <span class="badge px-3 py-2 rounded-pill font-monospace" style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a !important;">
          <i class="bi bi-stars text-warning me-1"></i> AI Active
        </span>
      </div>
    </div>
  </header>

  <main class="container my-4" style="max-width: 860px;">

    <!-- Error Alert banner -->
    <div id="errorAlert" class="alert alert-danger d-flex align-items-center mb-4 d-none shadow-sm rounded-4" role="alert">
      <i class="bi bi-exclamation-triangle-fill flex-shrink-0 me-2 fs-5"></i>
      <div id="errorMessage" class="small fw-semibold"></div>
    </div>

    <!-- Showroom Workflow Notice -->
    <div class="card card-custom p-3 mb-4 bg-light border-0">
      <div class="d-flex gap-2">
        <i class="bi bi-info-circle-fill text-warning fs-5"></i>
        <p class="small text-secondary mb-0">
          <strong>Showroom Workflow:</strong> Take a photo of the customer's room & showroom piece. The AI isolates the product and <strong>preserves the customer's real room 100%</strong> without altering walls, flooring, or lighting.
        </p>
      </div>
    </div>

    <!-- MAIN VISUALIZER FORM -->
    <div id="visualizerFormCard">

      <!-- 1. Room Upload Card -->
      <div class="card card-custom p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">1</span>
            <h2 class="h6 mb-0 fw-bold">Upload Customer Room</h2>
          </div>
          <span class="small text-muted">JPG, PNG, WEBP (Max 20MB)</span>
        </div>

        <!-- Room Dropzone -->
        <div id="roomDropzone" class="upload-dropzone">
          <div class="mb-2 text-warning fs-2"><i class="bi bi-house-heart"></i></div>
          <h3 class="h6 fw-bold mb-1">Customer's Living Room or Hall</h3>
          <p class="small text-muted mb-3 mx-auto" style="max-width: 420px;">
            Upload the customer's real room photograph. Room structure, lighting, and existing decor will be preserved.
          </p>
          <div class="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 cursor-pointer">
              <i class="bi bi-camera-fill me-1"></i> Take Photo
              <input type="file" id="roomCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 cursor-pointer">
              <i class="bi bi-image me-1"></i> From Gallery
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
      <div class="card card-custom p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">2</span>
            <h2 class="h6 mb-0 fw-bold">Upload Furniture Product</h2>
          </div>
          <span class="small text-muted">JPG, PNG, WEBP (Max 20MB)</span>
        </div>

        <!-- Product Dropzone -->
        <div id="prodDropzone" class="upload-dropzone">
          <div class="mb-2 text-warning fs-2"><i class="bi bi-lamp"></i></div>
          <h3 class="h6 fw-bold mb-1">Actual Showroom Furniture Piece</h3>
          <p class="small text-muted mb-3 mx-auto" style="max-width: 420px;">
            Photo of actual sofa, bed, or table. AI will strip showroom floor & background and isolate the product.
          </p>
          <div class="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <label class="btn btn-dark btn-sm px-3 py-2 rounded-3 cursor-pointer">
              <i class="bi bi-camera-fill me-1"></i> Take Photo
              <input type="file" id="prodCameraInput" accept="image/*" capture="environment" class="d-none">
            </label>
            <label class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3 cursor-pointer">
              <i class="bi bi-image me-1"></i> From Gallery
              <input type="file" id="prodFileInput" accept="image/*" class="d-none">
            </label>
          </div>
        </div>

        <!-- Product Preview -->
        <div id="prodPreviewBox" class="preview-container d-none">
          <img id="prodPreviewImg" src="" alt="Furniture Product Preview">
          <div class="preview-overlay">
            <span class="text-white small fw-semibold"><i class="bi bi-check-circle-fill text-success me-1"></i> Furniture Loaded</span>
            <button type="button" id="removeProdBtn" class="btn btn-danger btn-sm rounded-3 py-1 px-2">
              <i class="bi bi-trash-fill"></i> Remove
            </button>
          </div>
        </div>
      </div>

      <!-- 3. Dimensions Form Card -->
      <div class="card card-custom p-4 mb-4">
        <div class="d-flex align-items-center justify-content-between mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="step-badge">3</span>
            <h2 class="h6 mb-0 fw-bold">Product Dimensions</h2>
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

        <div class="row g-3">
          <div class="col-4">
            <label for="productWidth" class="form-label small fw-semibold text-secondary mb-1">Width</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productWidth" value="240" placeholder="e.g. 240" required>
          </div>
          <div class="col-4">
            <label for="productDepth" class="form-label small fw-semibold text-secondary mb-1">Depth</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productDepth" value="90" placeholder="e.g. 90" required>
          </div>
          <div class="col-4">
            <label for="productHeight" class="form-label small fw-semibold text-secondary mb-1">Height</label>
            <input type="number" step="any" min="1" class="form-control rounded-3" id="productHeight" value="85" placeholder="e.g. 85" required>
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0"><i class="bi bi-rulers me-1"></i> Used as scale reference to preserve realistic room proportions</p>
      </div>

      <!-- 4. Placement Selector Card -->
      <div class="card card-custom p-4 mb-4">
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
            <button type="button" class="btn btn-placement" data-placement="Left">Left</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Right">Right</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Back Wall">Against Back Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Left Wall">Against Left Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Against Right Wall">Against Right Wall</button>
          </div>
          <div class="col-6 col-sm-3">
            <button type="button" class="btn btn-placement" data-placement="Custom">Custom</button>
          </div>
        </div>
        <p class="small text-muted mt-2 mb-0"><i class="bi bi-compass me-1"></i> Selected placement determines perspective orientation and floor alignment</p>
      </div>

      <!-- 5. Additional Instructions Card -->
      <div class="card card-custom p-4 mb-4">
        <div class="d-flex align-items-center gap-2 mb-2">
          <span class="step-badge">5</span>
          <h2 class="h6 mb-0 fw-bold">Additional Instructions (Optional)</h2>
        </div>
        <p class="small text-muted mb-2">Specify walking clearance, orientation facing TV/windows, or alignment details for the AI model.</p>
        <div class="position-relative">
          <textarea id="instructions" class="form-control rounded-3" rows="3" maxlength="1000" placeholder="e.g. Place against the back wall centered in open space facing the entrance. Keep realistic walking space."></textarea>
          <div class="position-absolute bottom-0 end-0 p-2 small text-muted font-monospace"><span id="charCounter">0</span>/1000</div>
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
    <div id="resultCard" class="card card-custom p-4 mb-5 d-none shadow-lg">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-3 mb-4 pb-3 border-bottom">
        <div>
          <span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-1 rounded-pill small fw-semibold mb-2">
            <i class="bi bi-check-circle-fill me-1"></i> Photorealistic Visualization Ready
          </span>
          <h2 class="h4 brand-title mb-1">Visualized in Customer's Actual Room</h2>
          <p id="resultSummaryText" class="small text-muted mb-0"></p>
        </div>
        <div>
          <button type="button" id="startNewBtn" class="btn btn-outline-secondary btn-sm px-3 py-2 rounded-3">
            <i class="bi bi-plus-circle me-1"></i> New Visual
          </button>
        </div>
      </div>

      <!-- Interactive Before / After Slider -->
      <div class="mb-4">
        <div id="sliderContainer" class="slider-container">
          <!-- After (AI Generated Image) -->
          <img id="sliderAfterImg" class="slider-img-after" src="" alt="AI Visualized Room">
          <span class="badge-pill-ai">AI Visualization</span>

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
      </div>

      <!-- Action Buttons -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-4 mb-4 border-bottom">
        <div class="d-flex gap-2">
          <a id="fullResLink" href="#" target="_blank" class="btn btn-light btn-sm rounded-3 fw-semibold border">
            <i class="bi bi-box-arrow-up-right me-1"></i> Open Full Res
          </a>
          <a id="downloadLink" href="#" download="rajgarhwala-room-visualization.png" class="btn btn-light btn-sm rounded-3 fw-semibold border">
            <i class="bi bi-download me-1"></i> Save Image
          </a>
        </div>
      </div>

      <!-- Regeneration Controls -->
      <div class="card p-3 bg-light border-0 rounded-4">
        <h3 class="h6 fw-bold mb-2"><i class="bi bi-arrow-repeat me-1 text-warning"></i> Adjust & Regenerate</h3>
        <p class="small text-muted mb-3">Refine position or instructions without re-uploading photos.</p>

        <div class="row g-3">
          <div class="col-sm-5">
            <label for="regenPlacementSelect" class="form-label small fw-semibold text-secondary">New Placement</label>
            <select id="regenPlacementSelect" class="form-select rounded-3">
              <option value="Center">Center</option>
              <option value="Left">Left</option>
              <option value="Right">Right</option>
              <option value="Against Back Wall">Against Back Wall</option>
              <option value="Against Left Wall">Against Left Wall</option>
              <option value="Against Right Wall">Against Right Wall</option>
              <option value="Custom">Custom</option>
            </select>
          </div>
          <div class="col-sm-7">
            <label for="regenInstructionsInput" class="form-label small fw-semibold text-secondary">Updated Instructions</label>
            <input type="text" id="regenInstructionsInput" class="form-control rounded-3" placeholder="e.g. Move slightly right, face towards window">
          </div>
        </div>

        <div class="mt-3 text-end">
          <button type="button" id="regenBtn" class="btn btn-dark btn-sm px-4 py-2 rounded-3 fw-semibold">
            <span id="regenSpinner" class="spinner-border spinner-border-sm me-1 d-none" role="status"></span>
            <i class="bi bi-stars text-warning me-1"></i> Regenerate Visual
          </button>
        </div>
      </div>

    </div>

  </main>

  <footer class="text-center py-4 text-muted small border-top bg-white">
    <div class="container">
      &copy; <?= date('Y') ?> Rajgarhwala AI Furniture Visualizer &bull; Built with CodeIgniter 4 (PHP 8), MySQL & Bootstrap 5
    </div>
  </footer>

  <!-- Bootstrap 5 JS Bundle -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  <!-- Client compression for mobile photos -->
  <script src="<?= base_url('js/client-compress.js') ?>"></script>
  <!-- Before / After Slider -->
  <script src="<?= base_url('js/image-slider.js') ?>"></script>
  <!-- Main Visualizer Application Script -->
  <script src="<?= base_url('js/visualizer.js') ?>"></script>
</body>
</html>
