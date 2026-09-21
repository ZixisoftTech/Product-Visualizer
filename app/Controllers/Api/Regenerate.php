<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\VisualizationModel;
use App\Libraries\ImageProcessor;
use App\Libraries\OpenAIService;
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

        $hallAbsPath = FCPATH . $record['hall_image_path'];
        $prodAbsPath = FCPATH . $record['product_image_path'];

        if (!file_exists($hallAbsPath) || !file_exists($prodAbsPath)) {
            return $this->response->setStatusCode(400)->setJSON([
                'success' => false,
                'error'   => 'Original room or product photos are missing from server storage.',
            ]);
        }

        $genFileName = 'gen_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.png';
        $genRelPath = 'uploads/generated/' . $genFileName;
        $genAbsPath = FCPATH . $genRelPath;

        $metadata = array_merge($record, [
            'placement'    => $newPlacement,
            'instructions' => $newInstructions,
        ]);

        $openAI = new OpenAIService();
        $aiResult = $openAI->generateVisualization($hallAbsPath, $prodAbsPath, $genAbsPath, $metadata);

        $imageData = null;
        if ($aiResult['success'] && file_exists($genAbsPath)) {
            $imageData = $aiResult['image_data'] ?? null;
        } else {
            $compositeOk = ImageProcessor::createRoomComposite(
                $hallAbsPath,
                $prodAbsPath,
                $genAbsPath,
                $newPlacement,
                (float) $record['product_width'],
                (float) $record['product_depth'],
                (float) $record['product_height'],
                (string) $record['dimension_unit']
            );

            if ($compositeOk && file_exists($genAbsPath)) {
                $imageData = 'data:image/png;base64,' . base64_encode(file_get_contents($genAbsPath));
            }
        }

        if (file_exists($genAbsPath)) {
            $updateData = [
                'placement'            => $newPlacement,
                'instructions'         => $newInstructions,
                'generated_image_path' => $genRelPath,
                'status'               => 'COMPLETED',
                'error_message'        => $aiResult['success'] ? null : ($aiResult['error'] ?? null),
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
