<?php

header('Content-Type: text/plain');
echo "PHP version: " . PHP_VERSION . "\n";
echo "Server Software: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') . "\n";
echo "Loaded Extensions: " . implode(', ', get_loaded_extensions()) . "\n";
