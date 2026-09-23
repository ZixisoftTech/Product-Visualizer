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
        $reflectionElements = [];

        $shadowAngle = (float) ($adjustments['shadow_angle_deg'] ?? 15);

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

            $groundY = $top + $targetH;
            $contactW = (int) round($targetW * 0.88);
            $contactRx = (int) round($contactW / 2);

            // 1. Core Contact Occlusion (tighter, dark crack beneath furniture legs)
            $shadowElements[] = '    <ellipse cx="' . $cx . '" cy="' . ($groundY - 1) . '" rx="' . $contactRx . '" ry="4" fill="rgba(8,6,4,0.85)" filter="url(#contactOcclusion)" />';

            // 2. Directional Floor Cast Shadow (shifted with room lighting angle)
            $castShiftX = (int) round(tan(deg2rad($shadowAngle)) * ($ry * 0.9));
            $castCx = $cx + $castShiftX;
            $castCy = (int) round($groundY + ($ry * 0.12));
            $shadowElements[] = '    <ellipse cx="' . $castCx . '" cy="' . $castCy . '" rx="' . (int)round($rx * 1.05) . '" ry="' . (int)round($ry * 0.80) . '" fill="rgba(18,14,10,0.48)" filter="url(#directionalShadow)" />';

            // 3. Ambient Floor Penumbra (diffuse ceiling bounce spread)
            $shadowElements[] = '    <ellipse cx="' . $cx . '" cy="' . ($groundY + 4) . '" rx="' . (int)round($rx * 1.35) . '" ry="' . (int)round($ry * 1.25) . '" fill="rgba(30,24,18,0.22)" filter="url(#ambientPenumbra)" />';

            // 4. Subtle Floor Bounce Reflection for polished/wood floors
            $reflH = (int) round($targetH * 0.28);
            $reflTop = $groundY - 1;
            $reflectionElements[] = '    <g opacity="0.08" clip-path="url(#reflClip_' . $idx . ')">'
                . '<image href="data:' . $pMime . ';base64,' . $pB64 . '" x="' . $left . '" y="' . $top . '" width="' . $targetW . '" height="' . $targetH . '" preserveAspectRatio="xMidYMid meet" transform="translate(0, ' . ($groundY * 2) . ') scale(1, -1)" />'
                . '</g>';

            // Product image element with optional rotation transform around its center
            if ($rotation != 0) {
                $pCenterCenterX = $left + ($targetW / 2);
                $pCenterCenterY = $top + ($targetH / 2);
                $transform = ' transform="rotate(' . $rotation . ' ' . $pCenterCenterX . ' ' . $pCenterCenterY . ')"';
            } else {
                $transform = '';
            }

            $productElements[] = '    <image href="data:' . $pMime . ';base64,' . $pB64 . '" x="' . $left . '" y="' . $top . '" width="' . $targetW . '" height="' . $targetH . '" preserveAspectRatio="xMidYMid meet"' . $transform . ' filter="url(#roomLightHarmonize)" />';
        }

        // Reflection clip rects
        $reflClips = [];
        foreach ($products as $idx => $prod) {
            $pPath = $prod['path'] ?? '';
            if (!file_exists($pPath)) continue;
            $reflClips[] = '    <clipPath id="reflClip_' . $idx . '"><rect x="0" y="' . ($roomH * 0.50) . '" width="' . $roomW . '" height="' . ($roomH * 0.50) . '" /></clipPath>';
        }

        $svg = '<?xml version="1.0" encoding="UTF-8"?>' . "\n"
            . '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ' . $roomW . ' ' . $roomH . '" width="' . $roomW . '" height="' . $roomH . '">' . "\n"
            . '  <defs>' . "\n"
            . '    <!-- Contact Occlusion Filter (sharp, tight contact underneath furniture) -->' . "\n"
            . '    <filter id="contactOcclusion" x="-20%" y="-50%" width="140%" height="200%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />' . "\n"
            . '    </filter>' . "\n"
            . '    <!-- Directional Cast Shadow Filter (soft floor shadow) -->' . "\n"
            . '    <filter id="directionalShadow" x="-30%" y="-40%" width="160%" height="180%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="9" />' . "\n"
            . '    </filter>' . "\n"
            . '    <!-- Ambient Penumbra Filter (broad floor spread) -->' . "\n"
            . '    <filter id="ambientPenumbra" x="-50%" y="-50%" width="200%" height="200%">' . "\n"
            . '      <feGaussianBlur in="SourceGraphic" stdDeviation="20" />' . "\n"
            . '    </filter>' . "\n"
            . '    <!-- Subtle Room Light Color Harmonizer -->' . "\n"
            . '    <filter id="roomLightHarmonize">' . "\n"
            . '      <feColorMatrix type="matrix" values="1.01 0 0 0 0.01  0 1.00 0 0 0.005  0 0 0.98 0 0  0 0 0 1 0" />' . "\n"
            . '    </filter>' . "\n"
            . implode("\n", $reflClips) . "\n"
            . '  </defs>' . "\n"
            . '  <!-- Customer Real Room (100% Immutable Actual Photo) -->' . "\n"
            . '  <image href="data:' . $roomMime . ';base64,' . $roomB64 . '" width="' . $roomW . '" height="' . $roomH . '" preserveAspectRatio="none" />' . "\n"
            . '  <!-- Floor Bounce Reflections -->' . "\n"
            . implode("\n", $reflectionElements) . "\n"
            . '  <!-- Floor Contact Shadows (Multi-tier Ambient Occlusion + Directional Shadow) -->' . "\n"
            . implode("\n", $shadowElements) . "\n"
            . '  <!-- Authoritative Customer Products (100% Real Piece Placed on Floor) -->' . "\n"
            . implode("\n", $productElements) . "\n"
            . '</svg>';

        return file_put_contents($outputPath, $svg) !== false;
    }
}

