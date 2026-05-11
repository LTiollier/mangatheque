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
        DB::statement('ALTER TABLE series ALTER COLUMN title TYPE text');
        DB::statement('ALTER TABLE editions ALTER COLUMN name TYPE text, ALTER COLUMN publisher TYPE text');
        DB::statement('ALTER TABLE volumes ALTER COLUMN title TYPE text');
        DB::statement('ALTER TABLE box_sets ALTER COLUMN title TYPE text, ALTER COLUMN publisher TYPE text');
        DB::statement('ALTER TABLE boxes ALTER COLUMN title TYPE text');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE series ALTER COLUMN title TYPE varchar(255)');
        DB::statement('ALTER TABLE editions ALTER COLUMN name TYPE varchar(255), ALTER COLUMN publisher TYPE varchar(255)');
        DB::statement('ALTER TABLE volumes ALTER COLUMN title TYPE varchar(255)');
        DB::statement('ALTER TABLE box_sets ALTER COLUMN title TYPE varchar(255), ALTER COLUMN publisher TYPE varchar(255)');
        DB::statement('ALTER TABLE boxes ALTER COLUMN title TYPE varchar(255)');
    }
};
