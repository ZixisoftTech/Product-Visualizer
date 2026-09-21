<?php

namespace App\Libraries;

class OpenAIService
{
    protected string $apiKey;
    protected string $visionModel;
    protected string $genModel;

    public function __construct()
    {
        $this->apiKey = env('OPENAI_API_KEY', '') ?: (getenv('OPENAI_API_KEY') ?: '');
        $this->visionModel = env('OPENAI_VISION_MODEL', 'gpt-4o');
        $this->genModel = env('OPENAI_GEN_MODEL', 'gpt-image-1');
    }

    public function isConfigured(): bool
    {
        return !empty(trim($this->apiKey));
    }

    /**
     * Executes room preservation visualization via OpenAI image edit endpoint
     * Sends both the customer room photograph and the showroom furniture piece.
     */
    public function generateVisualization(
        string $roomPath,
        string $productPath,
        string $outputPath,
        array $metadata = []
    ): array {
        if (!$this->isConfigured()) {
            return [
                'success' => false,
                'is_mock' => true,
                'error'   => 'OpenAI API key not configured.',
            ];
        }

        $width = $metadata['product_width'] ?? 240;
        $depth = $metadata['product_depth'] ?? 90;
        $height = $metadata['product_height'] ?? 85;
        $unit = $metadata['dimension_unit'] ?? 'cm';
        $placement = $metadata['placement'] ?? 'Center';
        $instructions = trim($metadata['instructions'] ?? '');

        // Prompt enforcing 100% room preservation and faithful furniture placement
        $prompt = "You are an architectural interior visualizer. "
            . "IMAGE 1 is the customer's ACTUAL room photograph. "
            . "IMAGE 2 is the actual furniture product from the showroom. "
            . "CRITICAL MANDATES: "
            . "1. ROOM PRESERVATION: Keep the customer's room from Image 1 100% intact. Keep the walls, paint, wallpaper, windows, doors, floor, and lighting completely unchanged. Do NOT redesign or remodel the room. "
            . "2. PRODUCT PLACEMENT: Place the EXACT furniture from Image 2 into Image 1. Do NOT alter its color, upholstery, material, or design. "
            . "3. SCALE & POSITION: Place the piece at the {$placement} position on the floor. Match the dimensions ({$width}x{$depth}x{$height} {$unit}) with realistic scale relative to the room. "
            . "4. CONTACT & LIGHTING: Natural floor contact with soft contact shadows matching the room's ambient lighting. "
            . (!empty($instructions) ? "5. SPECIAL INSTRUCTIONS: \"{$instructions}\". " : '')
            . "Output the customer's real room with the showroom product placed naturally inside.";

        $url = 'https://api.openai.com/v1/images/edits';

        // Multipart form-data with indexed file keys for PHP cURL
        $postData = [
            'model'    => $this->genModel,
            'image[0]' => new \CURLFile($roomPath, 'image/jpeg', 'customer_room.jpg'),
            'image[1]' => new \CURLFile($productPath, 'image/png', 'furniture_product.png'),
            'prompt'   => $prompt,
            'size'     => '1024x1024',
        ];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 90,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS     => $postData,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            log_message('error', '[OpenAI cURL Error] ' . $curlError);
            return [
                'success' => false,
                'error'   => 'Network error connecting to OpenAI: ' . $curlError,
            ];
        }

        $result = json_decode($response, true);

        if ($httpCode >= 200 && $httpCode < 300) {
            $b64 = $result['data'][0]['b64_json'] ?? null;
            if ($b64) {
                file_put_contents($outputPath, base64_decode($b64));
                return [
                    'success'    => true,
                    'prompt'     => $prompt,
                    'is_mock'    => false,
                    'image_data' => 'data:image/png;base64,' . $b64,
                ];
            }

            $imageUrl = $result['data'][0]['url'] ?? null;
            if ($imageUrl) {
                $imgData = @file_get_contents($imageUrl);
                if ($imgData) {
                    file_put_contents($outputPath, $imgData);
                    return [
                        'success'    => true,
                        'prompt'     => $prompt,
                        'is_mock'    => false,
                        'image_data' => 'data:image/png;base64,' . base64_encode($imgData),
                    ];
                }
            }
        }

        $errorMsg = $result['error']['message'] ?? "OpenAI API returned HTTP {$httpCode}";
        log_message('warning', '[OpenAI API Warning] ' . $errorMsg);

        return [
            'success' => false,
            'error'   => $errorMsg,
        ];
    }
}
