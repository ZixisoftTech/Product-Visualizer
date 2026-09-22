<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\VisualizationModel;
use App\Libraries\ImageProcessor;
use App\Libraries\OpenAIService;
use App\Libraries\StorageService;
use CodeIgniter\HTTP\ResponseInterface;

class Visualize extends BaseController
{
    public function index(): ResponseInterface
    {
        try {
            // 1. Validate Form Inputs
            $rules = [
                'product_width'  => 'required|numeric|greater_than[0]',
                'product_depth'  => 'required|numeric|greater_than[0]',
                'product_height' => 'required|numeric|greater_than[0]',
                'dimension_unit' => 'required|in_list[cm,inch,ft]',
                'placement'      => 'required',
            ];

            if (!$this->validate($rules)) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => implode(', ', $this->validator->getErrors()),
                ]);
            }

            $hallImage = $this->request->getFile('hall_image');
            $productImage = $this->request->getFile('product_image');

            if (!$hallImage || !$hallImage->isValid()) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Customer room image is required.',
                ]);
            }

            if (!$productImage || !$productImage->isValid()) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Furniture product image is required.',
                ]);
            }

            // Validate image constraints
            $hallVal = ImageProcessor::validateImage($hallImage);
            if (!$hallVal['valid']) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Room image error: ' . $hallVal['error'],
                ]);
            }

            $prodVal = ImageProcessor::validateImage($productImage);
            if (!$prodVal['valid']) {
                return $this->response->setStatusCode(400)->setJSON([
                    'success' => false,
                    'error'   => 'Product image error: ' . $prodVal['error'],
                ]);
            }

            // 2. Save Uploaded Images
            $hallExt = $hallImage->getClientExtension() ?: 'jpg';
            $prodExt = $productImage->getClientExtension() ?: 'png';

            $hallFileName = 'hall_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $hallExt;
            $prodFileName = 'prod_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $prodExt;

            $hallsDir = StorageService::getUploadDir('halls');
            $productsDir = StorageService::getUploadDir('products');

            $hallAbsPath = $hallsDir . '/' . $hallFileName;
            $prodAbsPath = $productsDir . '/' . $prodFileName;

            $hallImage->move($hallsDir, $hallFileName);
            $productImage->move($productsDir, $prodFileName);

            $hallRelPath = 'uploads/halls/' . $hallFileName;
            $prodRelPath = 'uploads/products/' . $prodFileName;

            // 3. Prepare Metadata & Create Record
            $visualizationId = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff), mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
            );

            $recordData = [
                'id'                 => $visualizationId,
                'hall_image_path'    => $hallRelPath,
                'product_image_path' => $prodRelPath,
                'product_width'      => (float) $this->request->getPost('product_width'),
                'product_depth'      => (float) $this->request->getPost('product_depth'),
                'product_height'     => (float) $this->request->getPost('product_height'),
                'dimension_unit'     => (string) $this->request->getPost('dimension_unit'),
                'placement'          => (string) $this->request->getPost('placement'),
                'instructions'       => (string) $this->request->getPost('instructions'),
                'status'             => 'PROCESSING',
            ];

            try {
                $model = new VisualizationModel();
                $model->insert($recordData);
            } catch (\Throwable $e) {
                log_message('warning', '[DB Insert Skipped] ' . $e->getMessage());
            }

            // 4. Generate Visualization (OpenAI API with photorealistic composite fallback)
            $genFileName = 'gen_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.png';
            $genDir = StorageService::getUploadDir('generated');
            $genAbsPath = $genDir . '/' . $genFileName;
            $genRelPath = 'uploads/generated/' . $genFileName;

            $openAI = new OpenAIService();
            $aiResult = $openAI->generateVisualization($hallAbsPath, $prodAbsPath, $genAbsPath, $recordData);

            $imageData = null;
            if ($aiResult['success'] && file_exists($genAbsPath)) {
                $imageData = $aiResult['image_data'] ?? null;
            } else {
                // High-fidelity fallback composite strictly preserving customer room
                $compositeOk = ImageProcessor::createRoomComposite(
                    $hallAbsPath,
                    $prodAbsPath,
                    $genAbsPath,
                    $recordData['placement'],
                    $recordData['product_width'],
                    $recordData['product_depth'],
                    $recordData['product_height'],
                    $recordData['dimension_unit']
                );

                if ($compositeOk && file_exists($genAbsPath)) {
                    $rawContent = file_get_contents($genAbsPath);
                    $isSvg = str_starts_with(trim($rawContent), '<?xml') || str_starts_with(trim($rawContent), '<svg');
                    $mime = $isSvg ? 'image/svg+xml' : 'image/png';
                    $imageData = 'data:' . $mime . ';base64,' . base64_encode($rawContent);
                }
            }

            if (file_exists($genAbsPath)) {
                $updateData = [
                    'generated_image_path' => $genRelPath,
                    'status'               => 'COMPLETED',
                    'error_message'        => $aiResult['success'] ? null : ($aiResult['error'] ?? null),
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
                        'product_image_path'   => base_url($prodRelPath),
                        'status'               => 'COMPLETED',
                    ]),
                ]);
            }

            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'error'   => 'Failed to generate visual composite: ' . ($aiResult['error'] ?? 'Image generation error'),
            ]);
        } catch (\Throwable $ex) {
            log_message('error', '[Visualize Exception] ' . $ex->getMessage() . "\n" . $ex->getTraceAsString());
            return $this->response->setStatusCode(500)->setJSON([
                'success' => false,
                'error'   => 'Server Error: ' . $ex->getMessage() . ' (' . basename($ex->getFile()) . ':' . $ex->getLine() . ')',
            ]);
        }
    }
}
