<?php

namespace App\Libraries;

class StorageService
{
    /**
     * Gets writable upload base path (supports Vercel Lambda /tmp fallback)
     */
    public static function getUploadDir(string $subfolder = ''): string
    {
        $isVercel = getenv('VERCEL') || !empty($_ENV['VERCEL']);
        $baseDir = $isVercel ? (sys_get_temp_dir() . '/uploads') : (FCPATH . 'uploads');

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
