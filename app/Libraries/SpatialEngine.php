<?php

namespace App\Libraries;

/**
 * Spatial Planning & Perspective Engine
 * Acts as an interior designer + spatial planner + product visualizer.
 * Analyzes room geometry, calculates real-world physical scale,
 * manages AI Auto Place (Mode A) and Tap to Place (Mode B),
 * and computes floor contact coordinates and shadows.
 */
class SpatialEngine
{
    /**
     * Converts room and product real-world measurements to meters and computes
     * perspective-accurate physical scale and coordinates on the room image.
     */
    public static function planPlacement(
        int $roomPixelW,
        int $roomPixelH,
        array $product,
        array $roomDims,
        string $placementMode = 'auto',
        ?float $tapX = null,
        ?float $tapY = null,
        int $productIndex = 0,
        int $totalProducts = 1,
        array $adjustments = []
    ): array {
        // 1. Normalize Room Physical Dimensions to meters
        $roomLengthFt = (float) ($roomDims['length'] ?? 15);
        $roomWidthFt  = (float) ($roomDims['width'] ?? 12);
        $roomHeightFt = (float) ($roomDims['height'] ?? 10);
        $roomUnit     = strtolower((string) ($roomDims['unit'] ?? 'ft'));

        $roomWidthMeters = ($roomUnit === 'ft') ? ($roomWidthFt * 0.3048) : (($roomUnit === 'cm') ? ($roomWidthFt * 0.01) : $roomWidthFt);
        if ($roomWidthMeters <= 0.8) $roomWidthMeters = 3.65; // ~12 ft fallback

        // 2. Normalize Product Physical Dimensions to meters
        $prodWidthIn  = (float) ($product['width'] ?? 84);
        $prodDepthIn  = (float) ($product['depth'] ?? 36);
        $prodHeightIn = (float) ($product['height'] ?? 34);
        $prodUnit     = strtolower((string) ($product['unit'] ?? 'inch'));

        $prodWidthMeters = ($prodUnit === 'inch' || $prodUnit === 'in') ? ($prodWidthIn * 0.0254) : (($prodUnit === 'cm') ? ($prodWidthIn * 0.01) : ($prodWidthIn * 0.3048));
        if ($prodWidthMeters <= 0.2) $prodWidthMeters = 2.13; // ~84 in fallback

        // 3. Base Physical Ratio in the room (Ratio of product physical width to room physical width)
        $physicalWidthRatio = $prodWidthMeters / max(1.0, $roomWidthMeters);

        // Clamping base ratio so furniture is physically plausible (between 18% and 65% of room width)
        $physicalWidthRatio = max(0.18, min(0.65, $physicalWidthRatio));

        // 4. Perspective Camera Horizon & Floor Plane Estimation
        // In standard eye-level interior photography:
        // Horizon line (vanishing plane) is around 38-42% from top.
        // Floor plane starts around 40-45% from top and extends to 100% bottom.
        $horizonY = $roomPixelH * 0.40;
        $floorMinY = $roomPixelH * 0.42;
        $floorMaxY = $roomPixelH * 0.90;

        // 5. Determine Placement Coordinates (Normalized 0.0 - 1.0 or pixel coordinates)
        $finalCenterX = 0.50;
        $finalFloorY   = 0.52; // Normalized Y coordinate on floor plane

        $effectiveTapX = $product['tap_x'] ?? $tapX;
        $effectiveTapY = $product['tap_y'] ?? $tapY;

        if ($placementMode === 'tap' && $effectiveTapX !== null && $effectiveTapY !== null) {
            // MODE B: TAP TO PLACE (Convert spatial tap intention into physically grounded placement)
            $finalCenterX = max(0.12, min(0.88, (float) $effectiveTapX));

            // If user tapped on a wall (above floor plane), interpret as "against that wall/back floor"
            if ((float) $effectiveTapY < 0.42) {
                $finalFloorY = 0.44; // Back wall floor border
            } elseif ((float) $effectiveTapY > 0.88) {
                $finalFloorY = 0.85; // Foreground floor
            } else {
                $finalFloorY = (float) $effectiveTapY; // Direct floor contact point
            }
        } elseif (!empty($product['ai_x_pct']) && !empty($product['ai_floor_y_pct'])) {
            // AI Vision analyzed optimal placement
            $finalCenterX = max(0.12, min(0.88, (float) $product['ai_x_pct']));
            $finalFloorY   = max(0.44, min(0.85, (float) $product['ai_floor_y_pct']));
        } else {
            // MODE A: AI AUTO PLACE (Interior Designer & Spatial Planner Reasoning)
            if ($totalProducts === 1) {
                // Single piece: Centered, balanced, grounded in middle-back plane
                $finalCenterX = 0.50;
                $finalFloorY = 0.48;

                $placementHint = strtolower((string) ($product['placement_hint'] ?? ''));
                if (str_contains($placementHint, 'left')) {
                    $finalCenterX = 0.25;
                } elseif (str_contains($placementHint, 'right')) {
                    $finalCenterX = 0.75;
                } elseif (str_contains($placementHint, 'back')) {
                    $finalFloorY = 0.44;
                }
            } elseif ($totalProducts === 2) {
                if ($productIndex === 0) {
                    // Primary piece (e.g. Sofa / Bed): Left-center
                    $finalCenterX = 0.32;
                    $finalFloorY = 0.46;
                } else {
                    // Secondary piece (e.g. Table / Chair): Right-center, slightly forward
                    $finalCenterX = 0.72;
                    $finalFloorY = 0.52;
                }
            } else { // 3 products
                if ($productIndex === 0) {
                    // Main central piece (e.g. Sofa / Bed): Back-center
                    $finalCenterX = 0.50;
                    $finalFloorY = 0.44;
                } elseif ($productIndex === 1) {
                    // Side accent (e.g. Chair): Left
                    $finalCenterX = 0.20;
                    $finalFloorY = 0.50;
                } else {
                    // Complementary piece (e.g. Table / Coffee table): Right foreground
                    $finalCenterX = 0.74;
                    $finalFloorY = 0.54;
                }
            }
        }

        // Apply any manual nudges / fine-tuning adjustments for this product
        $prodAdjust = $adjustments[$productIndex] ?? $adjustments;
        $offsetX = (float) ($prodAdjust['offset_x'] ?? 0);
        $offsetY = (float) ($prodAdjust['offset_y'] ?? 0);
        $scaleMultiplier = (float) ($prodAdjust['scale_multiplier'] ?? 1.0);
        $rotation = (float) ($prodAdjust['rotation'] ?? 0);

        $finalCenterX += $offsetX;
        $finalFloorY   += $offsetY;

        // Keep within safe room bounds
        $finalCenterX = max(0.10, min(0.90, $finalCenterX));
        $finalFloorY   = max(0.42, min(0.88, $finalFloorY));

        // 6. Calculate Perspective Depth & Projected Scale
        $depthProgression = ($finalFloorY * $roomPixelH - $floorMinY) / max(1.0, ($floorMaxY - $floorMinY));
        $depthProgression = max(0.0, min(1.0, $depthProgression));

        // Perspective scale factor: objects further away scale down naturally
        $perspectiveFactor = 0.76 + ($depthProgression * 0.42);

        // Calculate Target Pixel Dimensions
        $rawTargetW = $roomPixelW * $physicalWidthRatio * $perspectiveFactor * $scaleMultiplier;

        // Cap to ensure it fits the scene aesthetically
        $targetW = (int) round(max($roomPixelW * 0.16, min($roomPixelW * 0.70, $rawTargetW)));

        // Retrieve original product image aspect ratio
        $prodOrigW = (int) ($product['orig_w'] ?? 600);
        $prodOrigH = (int) ($product['orig_h'] ?? 400);
        $aspectRatio = $prodOrigH / (float) max(1, $prodOrigW);
        $targetH = (int) round($targetW * $aspectRatio);

        // 7. Calculate Pixel Coordinates
        $pixelFloorY = (int) round($finalFloorY * $roomPixelH);
        $pixelCenterX = (int) round($finalCenterX * $roomPixelW);

        $left = (int) round($pixelCenterX - ($targetW / 2));
        $top  = (int) round($pixelFloorY - $targetH);

        // Collision & Bounds Clamping (Prevent product from clipping outside room frame)
        if ($left < 5) $left = 5;
        if (($left + $targetW) > ($roomPixelW - 5)) $left = $roomPixelW - $targetW - 5;
        if ($top < (int) ($roomPixelH * 0.10)) $top = (int) ($roomPixelH * 0.10);

        // 8. Ground Contact Shadow Coordinates
        $shadowW  = (int) round($targetW * 1.06);
        $shadowH  = (int) round($targetH * 0.22);
        $shadowCx = (int) round($left + ($targetW / 2));
        $shadowCy = (int) round($top + $targetH - ($shadowH * 0.25));

        // Shadow angle shift based on room lighting
        $shadowAngle = (float) ($adjustments['shadow_angle_deg'] ?? 0);
        if ($shadowAngle != 0) {
            $shadowCx += (int) round(tan(deg2rad($shadowAngle)) * ($shadowH * 0.5));
        }

        $shadowRx = (int) round($shadowW / 2);
        $shadowRy = (int) round($shadowH / 2);

        return [
            'left'               => $left,
            'top'                => $top,
            'target_w'           => $targetW,
            'target_h'           => $targetH,
            'shadow_cx'          => $shadowCx,
            'shadow_cy'          => $shadowCy,
            'shadow_rx'          => $shadowRx,
            'shadow_ry'          => $shadowRy,
            'rotation'           => $rotation,
            'perspective_depth'  => round($depthProgression, 2),
            'physical_scale_pct' => round($physicalWidthRatio * 100, 1),
            'ground_y'           => $pixelFloorY,
        ];
    }
}
