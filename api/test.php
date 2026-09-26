<?php
header('Content-Type: application/json');
require __DIR__ . '/../app/Libraries/OpenAIService.php';
$svc = new \App\Libraries\OpenAIService();

$ref = new \ReflectionClass($svc);
$prop = $ref->getProperty('apiKey');
$apiKey = $prop->getValue($svc);

$t0 = microtime(true);
$ch = curl_init('https://api.openai.com/v1/images/generations');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_TIMEOUT        => 35,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS     => json_encode([
        'model'   => 'dall-e-3',
        'prompt'  => 'A modern luxury teal armchair in an empty room, 3D photorealistic',
        'size'    => '1024x1024',
        'quality' => 'standard',
        'n'       => 1,
    ]),
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);
$t1 = microtime(true);

$data = json_decode($res, true);
$hasB64 = !empty($data['data'][0]['b64_json']);

echo json_encode([
    'time_seconds' => round($t1 - $t0, 2),
    'http_code' => $code,
    'curl_error' => $err,
    'has_b64' => $hasB64,
    'raw_preview' => $hasB64 ? 'BASE64_RECEIVED' : substr((string)$res, 0, 500),
]);
