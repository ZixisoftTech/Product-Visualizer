<?php
header('Content-Type: application/json');
require __DIR__ . '/../app/Libraries/OpenAIService.php';
$svc = new \App\Libraries\OpenAIService();

$ref = new \ReflectionClass($svc);
$prop = $ref->getProperty('apiKey');
$apiKey = $prop->getValue($svc);

$ch = curl_init('https://api.openai.com/v1/models');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 20,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $apiKey,
    ],
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

$data = json_decode($res, true);
$models = [];
if (!empty($data['data'])) {
    foreach ($data['data'] as $m) {
        $models[] = $m['id'];
    }
}

echo json_encode([
    'http_code' => $code,
    'models_count' => count($models),
    'models' => array_values(array_filter($models, fn($m) => str_contains($m, 'dall') || str_contains($m, 'gpt-4') || str_contains($m, 'image'))),
    'all_models' => $models,
    'raw_response' => substr((string)$res, 0, 400),
]);
