<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\VisualizationModel;
use App\Libraries\ImageProcessor;
use App\Libraries\StorageService;
use CodeIgniter\HTTP\ResponseInterface;

class Visualize extends BaseController
{
    public function index(): ResponseInterface
    {
        try {
            // 1. Room Image
            $hallImage = $this->request->getFile('hall_image');
            if (!$hallImage || !$hallImage->isValid()) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Customer room photo is required.',
                ]);
            }

            $hallVal = ImageProcessor::validateImage($hallImage);
            if (!$hallVal['valid']) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Room photo error: ' . $hallVal['error'],
                ]);
            }

            // Room Dimensions (Default: 15x12x10 ft)
            $roomLength = (float) ($this->request->getPost('room_length') ?: 15);
            $roomWidth  = (float) ($this->request->getPost('room_width') ?: 12);
            $roomHeight = (float) ($this->request->getPost('room_height') ?: 10);
            $roomUnit   = (string) ($this->request->getPost('room_unit') ?: 'ft');

            $roomDims = [
                'length' => $roomLength > 0 ? $roomLength : 15,
                'width'  => $roomWidth > 0 ? $roomWidth : 12,
                'height' => $roomHeight > 0 ? $roomHeight : 10,
                'unit'   => $roomUnit,
            ];

            // 2. Collect Products (up to 3 products)
            $productsList = [];
            $productsDataRaw = $this->request->getPost('products_data');
            $productsMeta = [];
            if (!empty($productsDataRaw)) {
                $productsMeta = json_decode((string) $productsDataRaw, true) ?: [];
            }

            $hallsDir = StorageService::getUploadDir('halls');
            $productsDir = StorageService::getUploadDir('products');

            // Save Room Image
            $hallExt = $hallImage->getClientExtension() ?: 'jpg';
            $hallFileName = 'hall_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $hallExt;
            $hallAbsPath = $hallsDir . '/' . $hallFileName;
            $hallImage->move($hallsDir, $hallFileName);
            $hallRelPath = 'uploads/halls/' . $hallFileName;

            // Check multi-product files product_image_0, product_image_1, product_image_2
            for ($i = 0; $i < 3; $i++) {
                $pFile = $this->request->getFile("product_image_{$i}");
                if ($pFile && $pFile->isValid()) {
                    $pExt = $pFile->getClientExtension() ?: 'png';
                    $pFileName = "prod_{$i}_" . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $pExt;
                    $pAbsPath = $productsDir . '/' . $pFileName;
                    $pFile->move($productsDir, $pFileName);

                    $meta = $productsMeta[$i] ?? [];
                    $pTapX = isset($meta['tap_x']) && $meta['tap_x'] !== null ? (float) $meta['tap_x'] : ($this->request->getPost("tap_x_{$i}") !== null ? (float) $this->request->getPost("tap_x_{$i}") : null);
                    $pTapY = isset($meta['tap_y']) && $meta['tap_y'] !== null ? (float) $meta['tap_y'] : ($this->request->getPost("tap_y_{$i}") !== null ? (float) $this->request->getPost("tap_y_{$i}") : null);

                    $productsList[] = [
                        'path'     => $pAbsPath,
                        'rel_path' => 'uploads/products/' . $pFileName,
                        'width'    => (float) ($meta['width'] ?? 84),
                        'depth'    => (float) ($meta['depth'] ?? 36),
                        'height'   => (float) ($meta['height'] ?? 34),
                        'unit'     => (string) ($meta['unit'] ?? 'inch'),
                        'tap_x'    => $pTapX,
                        'tap_y'    => $pTapY,
                    ];
                }
            }

            // Fallback for single product input 'product_image'
            if (empty($productsList)) {
                $singleProd = $this->request->getFile('product_image');
                if ($singleProd && $singleProd->isValid()) {
                    $pExt = $singleProd->getClientExtension() ?: 'png';
                    $pFileName = 'prod_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $pExt;
                    $pAbsPath = $productsDir . '/' . $pFileName;
                    $singleProd->move($productsDir, $pFileName);

                    $productsList[] = [
                        'path'     => $pAbsPath,
                        'rel_path' => 'uploads/products/' . $pFileName,
                        'width'    => (float) ($this->request->getPost('product_width') ?: 84),
                        'depth'    => (float) ($this->request->getPost('product_depth') ?: 36),
                        'height'   => (float) ($this->request->getPost('product_height') ?: 34),
                        'unit'     => (string) ($this->request->getPost('dimension_unit') ?: 'inch'),
                        'tap_x'    => $this->request->getPost('tap_x') !== null ? (float) $this->request->getPost('tap_x') : null,
                        'tap_y'    => $this->request->getPost('tap_y') !== null ? (float) $this->request->getPost('tap_y') : null,
                    ];
                }
            }

            if (empty($productsList)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'At least one furniture product photo is required.',
                ]);
            }

            $placementMode = strtolower(trim((string) $this->request->getPost('placement_mode'))) ?: 'auto';
            $tapX = $this->request->getPost('tap_x') !== null ? (float) $this->request->getPost('tap_x') : null;
            $tapY = $this->request->getPost('tap_y') !== null ? (float) $this->request->getPost('tap_y') : null;
            $placement = trim((string) $this->request->getPost('placement')) ?: ($placementMode === 'tap' ? 'Tap Placement' : 'Center');
            $instructions = trim((string) $this->request->getPost('instructions'));

            $adjustments = [
                'offset_x'         => (float) ($this->request->getPost('offset_x') ?: 0),
                'offset_y'         => (float) ($this->request->getPost('offset_y') ?: 0),
                'scale_multiplier' => (float) ($this->request->getPost('scale_multiplier') ?: 1.0),
                'rotation'         => (float) ($this->request->getPost('rotation') ?: 0),
            ];

            // 3. OpenAI Intelligence: Analyze Room Lighting, Perspective, and Spatial Placement
            $openAI = new \App\Libraries\OpenAIService();
            $aiAnalysis = null;
            $aiUsed = false;

            if ($openAI->isConfigured()) {
                $analysisRes = $openAI->analyzeRoomAndProducts(
                    $hallAbsPath,
                    $productsList,
                    $roomDims,
                    $instructions ?: $placement
                );

                if ($analysisRes['success'] && !empty($analysisRes['analysis'])) {
                    $aiAnalysis = $analysisRes['analysis'];
                    $aiUsed = true;

                    // Align shadow angles with OpenAI detected room lighting
                    if (isset($aiAnalysis['shadow_angle_deg'])) {
                        $adjustments['shadow_angle_deg'] = (float) $aiAnalysis['shadow_angle_deg'];
                    }

                    // In Mode A (AI Auto Place), apply OpenAI Vision spatial placements
                    if ($placementMode === 'auto' && !empty($aiAnalysis['placements'])) {
                        foreach ($aiAnalysis['placements'] as $pl) {
                            $pIdx = (int) ($pl['index'] ?? 0);
                            if (isset($productsList[$pIdx])) {
                                $productsList[$pIdx]['ai_x_pct'] = (float) ($pl['x_pct'] ?? 0.50);
                                $productsList[$pIdx]['ai_floor_y_pct'] = (float) ($pl['floor_y_pct'] ?? 0.48);
                            }
                        }
                    }
                }
            }

            // 4. Create Record
            $visualizationId = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $firstProd = $productsList[0];
            $recordData = [
                'id'                 => $visualizationId,
                'hall_image_path'    => $hallRelPath,
                'product_image_path' => $firstProd['rel_path'],
                'product_width'      => $firstProd['width'],
                'product_depth'      => $firstProd['depth'],
                'product_height'     => $firstProd['height'],
                'dimension_unit'     => $firstProd['unit'],
                'room_length'        => $roomDims['length'],
                'room_width'         => $roomDims['width'],
                'room_height'        => $roomDims['height'],
                'room_unit'          => $roomDims['unit'],
                'products_json'      => json_encode($productsList),
                'placement'          => $placement,
                'instructions'       => $instructions,
                'status'             => 'PROCESSING',
            ];

            try {
                $model = new VisualizationModel();
                $model->insert($recordData);
            } catch (\Throwable $e) {
                log_message('warning', '[DB Insert Skipped] ' . $e->getMessage());
            }

            // 5. Generate Visualization: Real Customer Room + Real Products + Photorealistic Spatial Grounding
            $genFileName = 'gen_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.png';
            $genDir = StorageService::getUploadDir('generated');
            $genAbsPath = $genDir . '/' . $genFileName;
            $genRelPath = 'uploads/generated/' . $genFileName;

            $engineUsed = 'spatial_photoreal_engine';

            $compositeOk = ImageProcessor::createMultiProductComposite(
                $hallAbsPath,
                $productsList,
                $genAbsPath,
                $roomDims,
                $placementMode,
                $tapX,
                $tapY,
                $adjustments
            );

            if ($compositeOk && file_exists($genAbsPath)) {
                $rawContent = file_get_contents($genAbsPath);
                $isSvg = str_starts_with(trim($rawContent), '<?xml') || str_starts_with(trim($rawContent), '<svg');
                $mime = $isSvg ? 'image/svg+xml' : 'image/png';
                $imageData = 'data:' . $mime . ';base64,' . base64_encode($rawContent);

                $updateData = [
                    'generated_image_path' => $genRelPath,
                    'status'               => 'COMPLETED',
                ];

                try {
                    $model = new VisualizationModel();
                    $model->update($visualizationId, $updateData);
                } catch (\Throwable $e) {
                    log_message('warning', '[DB Update Skipped] ' . $e->getMessage());
                }

                return $this->response->setJSON([
                    'success'       => true,
                    'visualization' => array_merge($recordData, [
                        'generated_image_path' => base_url($genRelPath),
                        'generated_image_data' => $imageData,
                        'hall_image_path'      => base_url($hallRelPath),
                        'product_image_path'   => base_url($firstProd['rel_path']),
                        'products'             => array_map(function($p) {
                            return [
                                'image_url' => base_url($p['rel_path']),
                                'width'     => $p['width'],
                                'depth'     => $p['depth'],
                                'height'    => $p['height'],
                                'unit'      => $p['unit'],
                            ];
                        }, $productsList),
                        'status'               => 'COMPLETED',
                        'ai_intelligence_used' => $aiUsed,
                        'ai_analysis'          => $aiAnalysis,
                        'engine_used'          => $engineUsed,
                        'ai_prompt'            => null,
                    ]),
                ]);
            }

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'error'   => 'Failed to generate visual composite.',
            ]);
        } catch (\Throwable $ex) {
            log_message('error', '[Visualize Exception] ' . $ex->getMessage() . "\n" . $ex->getTraceAsString());
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'error'   => 'Server Error: ' . $ex->getMessage(),
            ]);
        }
    }
}
