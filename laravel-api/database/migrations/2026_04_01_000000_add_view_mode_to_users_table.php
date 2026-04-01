<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('view_mode_mobile')->default('cover')->after('notify_planning_releases');
            $table->string('view_mode_desktop')->default('cover')->after('view_mode_mobile');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['view_mode_mobile', 'view_mode_desktop']);
        });
    }
};
