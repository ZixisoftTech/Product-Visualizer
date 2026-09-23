<?php

namespace App\Libraries;

/**
 * OpenAI Intelligence Service
 * Uses GPT-4o Vision for spatial interior reasoning (lighting angle, floor plane, optimal placement)
 * and DALL-E / Image generation with graceful fallback to the local Spatial Engine.
 */
class OpenAIService
{
    protected string $apiKey;
    protected string $visionModel;
    protected string $genModel;

    public function __construct()
    {
        $key = getenv('OPENAI_API_KEY');
        if (empty($key) && function_exists('\env')) {
            $key = \env('OPENAI_API_KEY', '');
        }
        $root = defined('ROOTPATH') ? ROOTPATH : (dirname(__DIR__, 2) . '/');
        if (empty($key) && file_exists($root . '.env')) {
            $lines = file($root . '.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (str_starts_with(trim($line), 'OPENAI_API_KEY')) {
                    $parts = explode('=', $line, 2);
                    if (isset($parts[1])) {
                        $key = trim(trim($parts[1]), '"\'');
                        break;
                    }
                }
            }
        }
        $this->apiKey = trim((string) $key);
        $this->visionModel = getenv('OPENAI_VISION_MODEL') ?: 'gpt-4o-mini';
        $this->genModel = getenv('OPENAI_GEN_MODEL') ?: 'dall-e-3';
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && str_starts_with($this->apiKey, 'sk-');
    }

    /**
     * Uses GPT-4o Vision to analyze the customer's actual room photograph,
     * detect lighting angle, ambient shadow warmth, horizon plane,
     * and recommend harmonious placement coordinates for each furniture product.
     */
    public function analyzeRoomAndProducts(
        string $roomPath,
        array $productsList,
        array $roomDims = [],
        string $placementHint = ''
    ): array {
        if (!$this->isConfigured() || !file_exists($roomPath)) {
            return ['success' => false, 'error' => 'OpenAI not configured or room image missing.'];
        }

        try {
            $roomMime = mime_content_type($roomPath) ?: 'image/jpeg';
            $roomB64 = base64_encode(file_get_contents($roomPath));

            $prompt = "You are an expert interior designer and spatial lighting engineer.\n"
                . "Analyze this customer room photograph.\n"
                . "Real-world Room Dimensions: " . ($roomDims['length'] ?? 15) . "x" . ($roomDims['width'] ?? 12) . "x" . ($roomDims['height'] ?? 10) . " ft.\n"
                . "Products to place count: " . count($productsList) . ".\n"
                . (!empty($placementHint) ? "User placement hint: \"{$placementHint}\".\n" : "")
                . "Analyze the natural lighting direction, shadow angle, floor horizon line, and best coordinates.\n"
                . "Return ONLY a valid JSON object matching this schema:\n"
                . "{\n"
                . "  \"lighting_direction\": \"left-to-right\" | \"right-to-left\" | \"overhead\" | \"diffuse\",\n"
                . "  \"shadow_angle_deg\": number (-45 to 45, where positive shifts shadow to the right),\n"
                . "  \"shadow_opacity\": number (0.30 to 0.65),\n"
                . "  \"shadow_blur\": number (8 to 22),\n"
                . "  \"horizon_y_pct\": number (0.35 to 0.46, normalized horizon height),\n"
                . "  \"floor_start_y_pct\": number (0.40 to 0.50, where floor begins),\n"
                . "  \"placements\": [\n"
                . "    {\"index\": 0, \"x_pct\": number (0.15 to 0.85), \"floor_y_pct\": number (0.44 to 0.85)}\n"
                . "  ],\n"
                . "  \"designer_summary\": string (concise 1-sentence design note)\n"
                . "}";

            $messages = [
                [
                    'role' => 'user',
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => $prompt
                        ],
                        [
                            'type' => 'image_url',
                            'image_url' => [
                                'url' => "data:{$roomMime};base64,{$roomB64}",
                                'detail' => 'low'
                            ]
                        ]
                    ]
                ]
            ];

            $ch = curl_init('https://api.openai.com/v1/chat/completions');
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST           => true,
                CURLOPT_TIMEOUT        => 25,
                CURLOPT_HTTPHEADER     => [
                    'Authorization: Bearer ' . $this->apiKey,
                    'Content-Type: application/json',
                ],
                CURLOPT_POSTFIELDS     => json_encode([
                    'model'           => $this->visionModel,
                    'messages'        => $messages,
                    'response_format' => ['type' => 'json_object'],
                    'temperature'     => 0.2,
                ]),
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            curl_close($ch);

            if ($curlError || $httpCode < 200 || $httpCode >= 300) {
                log_message('warning', "[OpenAI Vision Analysis] HTTP {$httpCode} Error: " . ($curlError ?: $response));
                return ['success' => false, 'error' => "OpenAI HTTP {$httpCode}"];
            }

            $json = json_decode($response, true);
            $content = $json['choices'][0]['message']['content'] ?? '';
            $data = json_decode($content, true);

            if (!empty($data) && is_array($data)) {
                return [
                    'success' => true,
                    'analysis' => $data,
                ];
            }

            return ['success' => false, 'error' => 'Invalid JSON from OpenAI Vision.'];
        } catch (\Throwable $e) {
            log_message('error', '[OpenAI Vision Exception] ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
