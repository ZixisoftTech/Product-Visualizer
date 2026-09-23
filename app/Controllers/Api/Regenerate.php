<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\VisualizationModel;
use App\Libraries\ImageProcessor;
use App\Libraries\OpenAIService;
use App\Libraries\StorageService;
use CodeIgniter\HTTP\ResponseInterface;

class Regenerate extends BaseController
{
    public function index(string $id): ResponseInterface
    {
        $model = new VisualizationModel();
        $record = null;
        try {
            $record = $model->find($id);
        } catch (\Throwable $e) {
            log_message('warning', '[DB Find Warning] ' . $e->getMessage());
        }

        if (!$record) {
            return $this->response->setStatusCode(404)->setJSON([
                'success' => false,
                'error'   => 'Visualization record not found.',
            ]);
        }

        $rawBody = $this->request->getBody();
        $jsonData = json_decode($rawBody, true) ?: [];

        $newPlacement = (string) ($this->request->getPost('placement') ?: ($jsonData['placement'] ?? $record['placement']));
        $newInstructions = (string) ($this->request->getPost('instructions') ?: ($jsonData['instructions'] ?? $record['instructions'] ?? ''));

        $placementMode = (string) ($this->request->getPost('placement_mode') ?: ($jsonData['placement_mode'] ?? 'auto'));
        $tapX = $this->request->getPost('tap_x') !== null ? (float) $this->request->getPost('tap_x') : ($jsonData['tap_x'] ?? null);
        $tapY = $this->request->getPost('tap_y') !== null ? (float) $this->request->getPost('tap_y') : ($jsonData['tap_y'] ?? null);

        $adjustments = [
            'offset_x'         => (float) ($this->request->getPost('offset_x') ?: ($jsonData['offset_x'] ?? 0)),
            'offset_y'         => (float) ($this->request->getPost('offset_y') ?: ($jsonData['offset_y'] ?? 0)),
            'scale_multiplier' => (float) ($this->request->getPost('scale_multiplier') ?: ($jsonData['scale_multiplier'] ?? 1.0)),
            'rotation'         => (float) ($this->request->getPost('rotation') ?: ($jsonData['rotation'] ?? 0)),
        ];

        $hallsDir = StorageService::getUploadDir('halls');
        $productsDir = StorageService::getUploadDir('products');

        $hallFileName = basename($record['hall_image_path']);
        $prodFileName = basename($record['product_image_path']);

        $hallAbsPath = $hallsDir . '/' . $hallFileName;
        $prodAbsPath = $productsDir . '/' . $prodFileName;

        if (!file_exists($hallAbsPath)) {
            $hallAbsPath = FCPATH . $record['hall_image_path'];
        }
        if (!file_exists($prodAbsPath)) {
            $prodAbsPath = FCPATH . $record['product_image_path'];
        }

        if (!file_exists($hallAbsPath)) {
            return $this->response->setStatusCode(400)->setJSON([
                'success' => false,
                'error'   => 'Original room photo is missing from server storage.',
            ]);
        }

        $adjustProductIndex = isset($jsonData['product_index']) ? (int) $jsonData['product_index'] : (int) ($this->request->getPost('product_index') ?: 0);

        // Reconstruct products list
        $productsList = [];
        if (!empty($record['products_json'])) {
            $decodedProds = json_decode((string) $record['products_json'], true) ?: [];
            foreach ($decodedProds as $dp) {
                $pFilename = basename($dp['rel_path'] ?? $dp['path'] ?? '');
                $pAbs = $productsDir . '/' . $pFilename;
                if (!file_exists($pAbs) && !empty($dp['path']) && file_exists($dp['path'])) {
                    $pAbs = $dp['path'];
                }
                $productsList[] = [
                    'path'   => $pAbs,
                    'width'  => (float) ($dp['width'] ?? 84),
                    'depth'  => (float) ($dp['depth'] ?? 36),
                    'height' => (float) ($dp['height'] ?? 34),
                    'unit'   => (string) ($dp['unit'] ?? 'inch'),
                    'tap_x'  => isset($dp['tap_x']) && $dp['tap_x'] !== null ? (float) $dp['tap_x'] : null,
                    'tap_y'  => isset($dp['tap_y']) && $dp['tap_y'] !== null ? (float) $dp['tap_y'] : null,
                ];
            }
        }

        if (empty($productsList)) {
            $productsList = [
                [
                    'path'   => $prodAbsPath,
                    'width'  => (float) ($record['product_width'] ?? 84),
                    'depth'  => (float) ($record['product_depth'] ?? 36),
                    'height' => (float) ($record['product_height'] ?? 34),
                    'unit'   => (string) ($record['dimension_unit'] ?? 'inch'),
                    'tap_x'  => $tapX,
                    'tap_y'  => $tapY,
                ]
            ];
        }

        $roomDims = [
            'length' => (float) ($record['room_length'] ?? 15),
            'width'  => (float) ($record['room_width'] ?? 12),
            'height' => (float) ($record['room_height'] ?? 10),
            'unit'   => (string) ($record['room_unit'] ?? 'ft'),
        ];

        $genFileName = 'gen_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.png';
        $genDir = StorageService::getUploadDir('generated');
        $genAbsPath = $genDir . '/' . $genFileName;
        $genRelPath = 'uploads/generated/' . $genFileName;

        // Apply adjustments either per product or globally
        $allAdjustments = $adjustments;
        $allAdjustments[$adjustProductIndex] = $adjustments;

        $compositeOk = ImageProcessor::createMultiProductComposite(
            $hallAbsPath,
            $productsList,
            $genAbsPath,
            $roomDims,
            $placementMode,
            $tapX !== null ? (float) $tapX : null,
            $tapY !== null ? (float) $tapY : null,
            $allAdjustments
        );

        $imageData = null;
        if ($compositeOk && file_exists($genAbsPath)) {
            $rawContent = file_get_contents($genAbsPath);
            $isSvg = str_starts_with(trim($rawContent), '<?xml') || str_starts_with(trim($rawContent), '<svg');
            $mime = $isSvg ? 'image/svg+xml' : 'image/png';
            $imageData = 'data:' . $mime . ';base64,' . base64_encode($rawContent);
        }

        if (file_exists($genAbsPath)) {
            $updateData = [
                'placement'            => $newPlacement,
                'instructions'         => $newInstructions,
                'generated_image_path' => $genRelPath,
                'status'               => 'COMPLETED',
                'error_message'        => null,
            ];

            try {
                $model->update($id, $updateData);
            } catch (\Throwable $e) {
                log_message('warning', '[DB Update Warning] ' . $e->getMessage());
            }

            return $this->response->setJSON([
                'success'       => true,
                'visualization' => array_merge($record, $updateData, [
                    'generated_image_path' => base_url($genRelPath),
                    'generated_image_data' => $imageData,
                    'hall_image_path'      => base_url($record['hall_image_path']),
                    'product_image_path'   => base_url($record['product_image_path']),
                ]),
            ]);
        }

        return $this->response->setStatusCode(500)->setJSON([
            'success' => false,
            'error'   => 'Regeneration failed.',
        ]);
    }
}
