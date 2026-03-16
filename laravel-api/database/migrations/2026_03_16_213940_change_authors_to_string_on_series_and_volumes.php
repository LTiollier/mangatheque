<?php

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
        Schema::table('series', function (Blueprint $table) {
            $table->string('authors')->nullable()->change();
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->string('authors')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('series', function (Blueprint $table) {
            $table->json('authors')->nullable()->change();
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->json('authors')->nullable()->change();
        });
    }
};
