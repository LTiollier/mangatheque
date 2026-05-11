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
        DB::statement('ALTER TABLE series ALTER COLUMN cover_url TYPE text, ALTER COLUMN cover_url DROP NOT NULL, ALTER COLUMN cover_url DROP DEFAULT');
        DB::statement('ALTER TABLE volumes ALTER COLUMN cover_url TYPE text, ALTER COLUMN cover_url DROP NOT NULL, ALTER COLUMN cover_url DROP DEFAULT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('UPDATE series SET cover_url = LEFT(cover_url, 255)');
            DB::statement('UPDATE volumes SET cover_url = LEFT(cover_url, 255)');
        }

        DB::statement('ALTER TABLE series ALTER COLUMN cover_url TYPE varchar(255), ALTER COLUMN cover_url DROP NOT NULL, ALTER COLUMN cover_url DROP DEFAULT');
        DB::statement('ALTER TABLE volumes ALTER COLUMN cover_url TYPE varchar(255), ALTER COLUMN cover_url DROP NOT NULL, ALTER COLUMN cover_url DROP DEFAULT');
    }
};
