<?php

namespace App\Libraries;

class ImageProcessor
{
    /**
     * Validates an uploaded file format and size
     */
    public static function validateImage(\CodeIgniter\HTTP\Files\UploadedFile $file, int $maxBytes = 20971520): array
    {
        if (!$file->isValid()) {
            return ['valid' => false, 'error' => $file->getErrorString()];
        }

        if ($file->getSize() > $maxBytes) {
            return ['valid' => false, 'error' => 'File exceeds maximum allowed size of 20MB.'];
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/heic', 'image/heif', 'image/svg+xml'];
        $mime = strtolower($file->getMimeType());
        
        if (!in_array($mime, $allowedMimes, true) && !str_starts_with($mime, 'image/')) {
            return ['valid' => false, 'error' => 'Unsupported image format. Allowed: JPG, PNG, WEBP.'];
        }

        return ['valid' => true];
    }

    /**
     * Multi-Product Composite Placing up to 3 products into the customer's room
     * with physical dimension scaling and natural contact shadows.
     * GUARANTEES 100% preservation of the customer's actual room.
     */
    public static function createMultiProductComposite(
        string $roomPath,
        array $products,
        string $outputPath,
        array $roomDims = [],
        string $placement = 'Center'
    ): bool {
        // If GD is available, can attempt GD; SVG composite is universal and 100% crisp
        return self::createSvgMultiComposite($roomPath, $products, $outputPath, $roomDims, $placement);
    }

    /**
     * Single-product backward compatibility wrapper
     */
    public static function createRoomComposite(
        string $roomPath,
        string $productPath,
        string $outputPath,
        string $placement = 'Center',
        float $productWidth = 84,
        float $productDepth = 36,
        float $productHeight = 34,
        string $unit = 'inch'
    ): bool {
        $products = [
            [
                'path'   => $productPath,
                'width'  => $productWidth,
                'depth'  => $productDepth,
                'height' => $productHeight,
                'unit'   => $unit,
            ]
        ];

        return self::createMultiProductComposite(
            $roomPath,
            $products,
            $outputPath,
            ['length' => 15, 'width' => 12, 'height' => 10, 'unit' => 'ft'],
            $placement
        );
    }

    /**
     * Pure SVG-based Multi-Product Composite (no GD/Imagick dependency)
     * Real-world dimension scaling: room dimensions (ft/m) & product dimensions (in/cm)
     */
    protected static function createSvgMultiComposite(
        string $roomPath,
        array $products,
        string $outputPath,
        array $roomDims = [],
        string $placement = 'Center'
    ): bool {
        $roomInfo = @getimagesize($roomPath);
        $roomW = $roomInfo ? ($roomInfo[0] ?? 1200) : 1200;
        $roomH = $roomInfo ? ($roomInfo[1] ?? 900) : 900;
        $roomMime = $roomInfo['mime'] ?? 'image/jpeg';
        $roomB64 = base64_encode(file_get_contents($roomPath));

        // Real-world room width in meters
        $rWidth = (float) ($roomDims['width'] ?? 12);
        $rUnit = strtolower((string) ($roomDims['unit'] ?? 'ft'));
        $roomWidthMeters = ($rUnit === 'ft') ? ($rWidth * 0.3048) : (($rUnit === 'cm') ? ($rWidth * 0.01) : $rWidth);
        if ($roomWidthMeters <= 0.5) $roomWidthMeters = 3.65; // ~12ft fallback

        $count = count($products);
        $shadowElements = [];
        $productElements = [];

        foreach ($products as $idx => $prod) {
            $pPath = $prod['path'] ?? '';
            if (!file_exists($pPath)) continue;

            $pInfo = @getimagesize($pPath);
            $pW = $pInfo ? ($pInfo[0] ?? 600) : 600;
            $pH = $pInfo ? ($pInfo[1] ?? 400) : 400;
            $pMime = $pInfo['mime'] ?? 'image/png';
            $pB64 = base64_encode(file_get_contents($pPath));

            // Product width in meters
            $pw = (float) ($prod['width'] ?? 84);
            $pu = strtolower((string) ($prod['unit'] ?? 'inch'));
            $prodWidthMeters = ($pu === 'inch' || $pu === 'in') ? ($pw * 0.0254) : (($pu === 'cm') ? ($pw * 0.01) : ($pw * 0.3048));
            if ($prodWidthMeters <= 0.1) $prodWidthMeters = 2.13; // ~84in fallback

            // Physical scale ratio relative to room width
            $scaleRatio = $prodWidthMeters / max(1.0, $roomWidthMeters);

            // Layout based on product count
            if ($count === 1) {
                $scaleRatio = max(0.25, min(0.60, $scaleRatio));
                $targetW = (int) round($roomW * $scaleRatio);
                $aspect = $pH / (float) max(1, $pW);
                $targetH = (int) round($targetW * $aspect);

                $left = (int) round(($roomW - $targetW) / 2);
                $top = (int) round($roomH * 0.46);

                $pLower = strtolower($placement);
                if (str_contains($pLower, 'left')) {
                    $left = (int) round($roomW * 0.12);
                } elseif (str_contains($pLower, 'right')) {
                    $left = (int) round($roomW * 0.88 - $targetW);
                } elseif (str_contains($pLower, 'corner')) {
                    $left = (int) round($roomW * 0.10);
                    $top = (int) round($roomH * 0.40);
                }
                if (str_contains($pLower, 'back')) {
                    $top = (int) round($roomH * 0.38);
                }
            } elseif ($count === 2) {
                $scaleRatio = max(0.20, min(0.48, $scaleRatio));
                $targetW = (int) round($roomW * $scaleRatio);
                $aspect = $pH / (float) max(1, $pW);
                $targetH = (int) round($targetW * $aspect);

                if ($idx === 0) {
                    // Product 1: Left / Center
                    $left = (int) round($roomW * 0.14);
                    $top = (int) round($roomH * 0.44);
                } else {
                    // Product 2: Right / Slightly forward
                    $left = (int) round($roomW * 0.54);
                    $top = (int) round($roomH * 0.47);
                }
            } else { // 3 products
                $scaleRatio = max(0.18, min(0.42, $scaleRatio));
                $targetW = (int) round($roomW * $scaleRatio);
                $aspect = $pH / (float) max(1, $pW);
                $targetH = (int) round($targetW * $aspect);

                if ($idx === 0) {
                    // Product 1 (Primary / Center-Back)
                    $left = (int) round(($roomW - $targetW) / 2);
                    $top = (int) round($roomH * 0.40);
                } elseif ($idx === 1) {
                    // Product 2 (Left side)
                    $left = (int) round($roomW * 0.08);
                    $top = (int) round($roomH * 0.47);
                } else {
                    // Product 3 (Right / Foreground)
                    $left = (int) round($roomW * 0.60);
                    $top = (int) round($roomH * 0.49);
                }
            }

            // Shadow calculation for this product
            $shadowW = $targetW + 35;
            $shadowH = (int) round($targetH * 0.22);
            $shadowCx = (int) round($left + $targetW / 2);
            $shadowCy = (int) round($top + $targetH - $shadowH * 0.25);
            $shadowRx = (int) round($shadowW / 2);
            $shadowRy = (int) round($shadowH / 2);

            $shadowElements[] = '  <ellipse cx="' . $shadowCx . '" cy="' . $shadowCy . '" rx="' . $shadowRx . '" ry="' . $shadowRy . '" fill="rgba(10,8,6,0.50)" filter="url(#softShadow)" />';
            $productElements[] = '  <image href="data:' . $pMime . ';base64,' . $pB64 . '" x="' . $left . '" y="' . $top . '" width="' . $targetW . '" height="' . $targetH . '" preserveAspectRatio="xMidYMid meet" />';
        }

        $svg = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' . $roomW . ' ' . $roomH . '" width="' . $roomW . '" height="' . $roomH . '">' . "\n"
            . '  <defs>' . "\n"
            . '    <filter id="softShadow" x="-40%" y="-40%" width="180%" height="180%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="12" />' . "\n"
            . '    </filter>' . "\n"
            . '  </defs>' . "\n"
            . '  <!-- Customer Real Room (100% Unchanged) -->' . "\n"
            . '  <image href="data:' . $roomMime . ';base64,' . $roomB64 . '" width="' . $roomW . '" height="' . $roomH . '" preserveAspectRatio="none" />' . "\n"
            . '  <!-- Floor Contact Shadows -->' . "\n"
            . implode("\n", $shadowElements) . "\n"
            . '  <!-- Isolated Products -->' . "\n"
            . implode("\n", $productElements) . "\n"
            . '</svg>';

        return file_put_contents($outputPath, $svg) !== false;
    }
}
