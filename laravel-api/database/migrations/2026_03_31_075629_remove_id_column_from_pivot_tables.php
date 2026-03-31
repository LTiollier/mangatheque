<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $pivotTables = [
            'user_volumes' => [
                'columns' => ['user_id', 'volume_id'],
                'unique' => 'user_volumes_user_id_volume_id_unique',
            ],
            'wishlist_items' => [
                'columns' => ['user_id', 'wishlistable_id', 'wishlistable_type'],
                'unique' => 'wishlist_items_user_wishlistable_unique',
            ],
            'box_volumes' => [
                'columns' => ['box_id', 'volume_id'],
                'unique' => 'box_volumes_box_id_volume_id_unique',
            ],
            'user_boxes' => [
                'columns' => ['user_id', 'box_id'],
                'unique' => 'user_boxes_user_id_box_id_unique',
            ],
            'reading_progress' => [
                'columns' => ['user_id', 'volume_id'],
                'unique' => 'reading_progress_user_id_volume_id_unique',
            ],
            'loan_items' => [
                'columns' => ['loan_id', 'loanable_type', 'loanable_id'],
                'unique' => 'loan_items_loan_id_loanable_type_loanable_id_unique',
            ],

        ];

        foreach ($pivotTables as $table => $config) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $tableSchema) use ($config) {
                // Be explicit: drop unique first, then primary, then column
                $tableSchema->dropUnique($config['unique']);

                if (Schema::hasColumn($tableSchema->getTable(), 'id')) {
                    $tableSchema->dropColumn('id');
                }

                $tableSchema->primary($config['columns']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $pivotTables = [
            'user_volumes' => [
                'columns' => ['user_id', 'volume_id'],
                'unique' => 'user_volumes_user_id_volume_id_unique',
            ],
            'wishlist_items' => [
                'columns' => ['user_id', 'wishlistable_id', 'wishlistable_type'],
                'unique' => 'wishlist_items_user_wishlistable_unique',
            ],
            'box_volumes' => [
                'columns' => ['box_id', 'volume_id'],
                'unique' => 'box_volumes_box_id_volume_id_unique',
            ],
            'user_boxes' => [
                'columns' => ['user_id', 'box_id'],
                'unique' => 'user_boxes_user_id_box_id_unique',
            ],
            'reading_progress' => [
                'columns' => ['user_id', 'volume_id'],
                'unique' => 'reading_progress_user_id_volume_id_unique',
            ],
            'loan_items' => [
                'columns' => ['loan_id', 'loanable_type', 'loanable_id'],
                'unique' => 'loan_items_loan_id_loanable_type_loanable_id_unique',
            ],

        ];

        foreach ($pivotTables as $table => $config) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $tableSchema) use ($config) {
                // Drop composite primary key
                $tableSchema->dropPrimary();

                // Restore id column (PostgreSQL doesn't support ->first())
                $tableSchema->id();

                // Restore original unique constraint
                $tableSchema->unique($config['columns'], $config['unique']);
            });
        }
    }
};
