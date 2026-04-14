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
        Schema::table('jobs', function (Blueprint $table) {
            // Drop existing single queue index as it is redundant with the new composite index.
            $table->dropIndex(['queue']);

            // Add composite index for optimized pop operations.
            $table->index(['queue', 'reserved_at', 'available_at'], 'jobs_queue_reserved_at_available_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jobs', function (Blueprint $table) {
            $table->dropIndex('jobs_queue_reserved_at_available_at_index');
            $table->index(['queue']);
        });
    }
};
