<?php

namespace App\Models;

use CodeIgniter\Model;

class VisualizationModel extends Model
{
    protected $table            = 'visualizations';
    protected $primaryKey       = 'id';
    protected $useAutoIncrement = false;
    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $protectFields    = true;
    protected $allowedFields    = [
        'id',
        'hall_image_path',
        'product_image_path',
        'product_width',
        'product_depth',
        'product_height',
        'dimension_unit',
        'placement',
        'instructions',
        'generated_image_path',
        'status',
        'error_message',
        'created_at',
        'updated_at',
    ];

    protected bool $allowEmptyInserts = false;
    protected bool $updateOnlyChanged = true;

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat    = 'datetime';
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
}
