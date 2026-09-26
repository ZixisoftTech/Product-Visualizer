<?php
header('Content-Type: application/json');
require __DIR__ . '/../app/Libraries/OpenAIService.php';
$svc = new \App\Libraries\OpenAIService();

$ref = new \ReflectionClass($svc);
$prop = $ref->getProperty('apiKey');
$apiKey = $prop->getValue($svc);

$testModel = $_GET['model'] ?? 'gpt-image-1';

$ch = curl_init('https://api.openai.com/v1/images/generations');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_TIMEOUT        => 80,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'model'  => $testModel,
        'prompt' => 'A luxury modern velvet green armchair placed in a bright living room with hardwood floor, 3D photorealistic, architectural photography',
        'size'   => '1024x1024',
        'n'      => 1,
    ]),
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

$data = json_decode($res, true);

echo json_encode([
    'tested_model' => $testModel,
    'http_code' => $code,
    'curl_error' => $err,
    'has_url' => !empty($data['data'][0]['url']),
    'has_b64' => !empty($data['data'][0]['b64_json']),
    'preview' => !empty($data['data'][0]['url']) ? $data['data'][0]['url'] : substr((string)$res, 0, 500),
]);
