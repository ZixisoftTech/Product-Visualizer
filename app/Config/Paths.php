<?php

namespace Config;

/**
 * Paths Configuration
 */
class Paths
{
    public string $systemDirectory = __DIR__ . '/../../vendor/codeigniter4/framework/system';
    public string $appDirectory = __DIR__ . '/..';
    public string $writableDirectory;
    public string $testsDirectory = __DIR__ . '/../../tests';
    public string $viewDirectory = __DIR__ . '/../Views';
    public string $envDirectory = __DIR__ . '/../../';

    public function __construct()
    {
        // On serverless platforms like Vercel Lambda, /var/task is read-only.
        // Use sys_get_temp_dir() (/tmp/ci4_writable) so logs, cache, and sessions can be written.
        if (getenv('VERCEL') || !empty($_ENV['VERCEL']) || !is_writable(__DIR__ . '/../../writable')) {
            $tmpWritable = sys_get_temp_dir() . '/ci4_writable';
            if (!is_dir($tmpWritable)) {
                @mkdir($tmpWritable, 0777, true);
                @mkdir($tmpWritable . '/cache', 0777, true);
                @mkdir($tmpWritable . '/logs', 0777, true);
                @mkdir($tmpWritable . '/session', 0777, true);
                @mkdir($tmpWritable . '/uploads', 0777, true);
            }
            $this->writableDirectory = $tmpWritable;
        } else {
            $this->writableDirectory = __DIR__ . '/../../writable';
        }
    }
}
