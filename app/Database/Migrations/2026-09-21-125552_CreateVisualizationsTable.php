<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateVisualizationsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 36,
            ],
            'hall_image_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
            ],
            'product_image_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
            ],
            'product_width' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'product_depth' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'product_height' => [
                'type'       => 'DECIMAL',
                'constraint' => '10,2',
            ],
            'dimension_unit' => [
                'type'       => 'VARCHAR',
                'constraint' => 10,
                'default'    => 'cm',
            ],
            'placement' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'instructions' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'generated_image_path' => [
                'type'       => 'VARCHAR',
                'constraint' => 500,
                'null'       => true,
            ],
            'status' => [
                'type'       => 'VARCHAR',
                'constraint' => 50,
                'default'    => 'PENDING',
            ],
            'error_message' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
            ],
            'updated_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
            ],
        ]);

        $this->forge->addKey('id', true);
        $this->forge->createTable('visualizations', true);
    }

    public function down()
    {
        $this->forge->dropTable('visualizations', true);
    }
}
