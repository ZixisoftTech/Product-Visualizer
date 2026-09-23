<?php

namespace App\Libraries;

class StorageService
{
    /**
     * Gets writable upload base path (supports Vercel Lambda /tmp fallback)
     */
    public static function getUploadDir(string $subfolder = ''): string
    {
        $tempBase = sys_get_temp_dir() . '/uploads';
        $fcpathBase = defined('FCPATH') ? (FCPATH . 'uploads') : $tempBase;

        // If running in serverless lambda or FCPATH is read-only, always use /tmp
        $isServerless = !empty(getenv('VERCEL')) || !empty($_ENV['VERCEL']) || !empty($_SERVER['VERCEL']) || !empty(getenv('AWS_LAMBDA_FUNCTION_NAME'));
        $baseDir = ($isServerless || !@is_writable(defined('FCPATH') ? FCPATH : '')) ? $tempBase : $fcpathBase;

        if (!empty($subfolder)) {
            $targetDir = $baseDir . '/' . trim($subfolder, '/');
        } else {
            $targetDir = $baseDir;
        }

        if (!is_dir($targetDir)) {
            @mkdir($targetDir, 0777, true);
        }

        return $targetDir;
    }
}
