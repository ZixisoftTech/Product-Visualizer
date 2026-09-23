<?php

// Enable error display during debugging on serverless
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
ini_set('memory_limit', '256M');
ini_set('max_execution_time', '120');
error_reporting(E_ALL);

// Normalize SCRIPT_NAME on Vercel serverless so CodeIgniter 4 resolves routes accurately
if (isset($_SERVER['SCRIPT_NAME']) && str_starts_with($_SERVER['SCRIPT_NAME'], '/api/index.php')) {
    $_SERVER['SCRIPT_NAME'] = '/index.php';
}

try {
    require __DIR__ . '/../public/index.php';
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error'   => 'Server Error: ' . $e->getMessage() . ' (' . basename($e->getFile()) . ':' . $e->getLine() . ')',
    ]);
}
