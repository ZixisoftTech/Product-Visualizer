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
     * with physical dimension scaling, perspective depth, and natural contact shadows.
     * GUARANTEES 100% preservation of the customer's actual room.
     */
    public static function createMultiProductComposite(
        string $roomPath,
        array $products,
        string $outputPath,
        array $roomDims = [],
        string $placementMode = 'auto',
        ?float $tapX = null,
        ?float $tapY = null,
        array $adjustments = []
    ): bool {
        return self::createSvgMultiComposite(
            $roomPath,
            $products,
            $outputPath,
            $roomDims,
            $placementMode,
            $tapX,
            $tapY,
            $adjustments
        );
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
        string $unit = 'inch',
        array $adjustments = []
    ): bool {
        $products = [
            [
                'path'           => $productPath,
                'width'          => $productWidth,
                'depth'          => $productDepth,
                'height'         => $productHeight,
                'unit'           => $unit,
                'placement_hint' => $placement,
            ]
        ];

        return self::createMultiProductComposite(
            $roomPath,
            $products,
            $outputPath,
            ['length' => 15, 'width' => 12, 'height' => 10, 'unit' => 'ft'],
            'auto',
            null,
            null,
            $adjustments
        );
    }

    /**
     * Pure SVG-based Multi-Product Composite with SpatialEngine (no GD/Imagick dependency)
     * Real-world physical dimension scaling: room dimensions (ft/m) & product dimensions (in/cm)
     * Perspective depth calculation, floor-ground contact positioning, and multi-layer soft shadows.
     */
    protected static function createSvgMultiComposite(
        string $roomPath,
        array $products,
        string $outputPath,
        array $roomDims = [],
        string $placementMode = 'auto',
        ?float $tapX = null,
        ?float $tapY = null,
        array $adjustments = []
    ): bool {
        $roomInfo = @getimagesize($roomPath);
        $roomW = $roomInfo ? ($roomInfo[0] ?? 1200) : 1200;
        $roomH = $roomInfo ? ($roomInfo[1] ?? 900) : 900;
        $roomMime = $roomInfo['mime'] ?? 'image/jpeg';
        $roomB64 = base64_encode(file_get_contents($roomPath));

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

            $prodWithDims = array_merge($prod, [
                'orig_w' => $pW,
                'orig_h' => $pH,
            ]);

            // Call the Spatial Planning & Perspective Engine
            $spatial = SpatialEngine::planPlacement(
                $roomW,
                $roomH,
                $prodWithDims,
                $roomDims,
                $placementMode,
                $tapX,
                $tapY,
                $idx,
                $count,
                $adjustments
            );

            $left     = $spatial['left'];
            $top      = $spatial['top'];
            $targetW  = $spatial['target_w'];
            $targetH  = $spatial['target_h'];
            $rotation = $spatial['rotation'] ?? 0;

            // Multi-layered floor contact shadows for photoreal grounding
            $cx = $spatial['shadow_cx'];
            $cy = $spatial['shadow_cy'];
            $rx = $spatial['shadow_rx'];
            $ry = $spatial['shadow_ry'];

            // Deep contact occlusion core (darker, tighter directly underneath)
            $coreRx = (int) round($rx * 0.75);
            $coreRy = (int) round($ry * 0.60);
            $shadowElements[] = '    <ellipse cx="' . $cx . '" cy="' . $cy . '" rx="' . $coreRx . '" ry="' . $coreRy . '" fill="rgba(15,12,10,0.65)" filter="url(#coreShadow)" />';

            // Ambient diffused floor shadow
            $shadowElements[] = '    <ellipse cx="' . $cx . '" cy="' . $cy . '" rx="' . $rx . '" ry="' . $ry . '" fill="rgba(25,20,16,0.38)" filter="url(#ambientShadow)" />';

            // Product image element with optional subtle rotation transform around its center
            if ($rotation != 0) {
                $pCenterCenterX = $left + ($targetW / 2);
                $pCenterCenterY = $top + ($targetH / 2);
                $transform = ' transform="rotate(' . $rotation . ' ' . $pCenterCenterX . ' ' . $pCenterCenterY . ')"';
            } else {
                $transform = '';
            }

            $productElements[] = '    <image href="data:' . $pMime . ';base64,' . $pB64 . '" x="' . $left . '" y="' . $top . '" width="' . $targetW . '" height="' . $targetH . '" preserveAspectRatio="xMidYMid meet"' . $transform . ' />';
        }

        $svg = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' . $roomW . ' ' . $roomH . '" width="' . $roomW . '" height="' . $roomH . '">' . "\n"
            . '  <defs>' . "\n"
            . '    <filter id="coreShadow" x="-30%" y="-30%" width="160%" height="160%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="6" />' . "\n"
            . '    </filter>' . "\n"
            . '    <filter id="ambientShadow" x="-50%" y="-50%" width="200%" height="200%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="16" />' . "\n"
            . '    </filter>' . "\n"
            . '  </defs>' . "\n"
            . '  <!-- Customer Real Room (100% Unchanged) -->' . "\n"
            . '  <image href="data:' . $roomMime . ';base64,' . $roomB64 . '" width="' . $roomW . '" height="' . $roomH . '" preserveAspectRatio="none" />' . "\n"
            . '  <!-- Floor Contact Shadows (Multi-layered Occlusion) -->' . "\n"
            . implode("\n", $shadowElements) . "\n"
            . '  <!-- Authoritative Isolated Products -->' . "\n"
            . implode("\n", $productElements) . "\n"
            . '</svg>';

        return file_put_contents($outputPath, $svg) !== false;
    }
}
