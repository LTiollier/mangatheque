<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE series ALTER COLUMN authors TYPE text, ALTER COLUMN authors DROP NOT NULL, ALTER COLUMN authors DROP DEFAULT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE series ALTER COLUMN authors TYPE varchar(255), ALTER COLUMN authors DROP NOT NULL, ALTER COLUMN authors DROP DEFAULT');
    }
};
