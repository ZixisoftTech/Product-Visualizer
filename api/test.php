<?php
header('Content-Type: application/json');
require __DIR__ . '/../app/Libraries/OpenAIService.php';
$svc = new \App\Libraries\OpenAIService();

$ref = new \ReflectionClass($svc);
$prop = $ref->getProperty('apiKey');
$apiKey = $prop->getValue($svc);

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'model' => 'gpt-4o-mini',
        'messages' => [['role' => 'user', 'content' => 'Say OK']],
        'max_tokens' => 5,
    ]),
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$err = curl_error($ch);
curl_close($ch);

echo json_encode([
    'configured' => $svc->isConfigured(),
    'apiKeyPrefix' => substr($apiKey, 0, 10),
    'http_code' => $code,
    'curl_error' => $err,
    'response' => json_decode($res, true) ?: $res,
]);
