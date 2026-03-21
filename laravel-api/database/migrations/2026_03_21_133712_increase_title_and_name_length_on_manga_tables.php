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
            $table->text('title')->change();
        });

        Schema::table('editions', function (Blueprint $table) {
            $table->text('name')->change();
            $table->text('publisher')->change();
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->text('title')->change();
        });

        Schema::table('box_sets', function (Blueprint $table) {
            $table->text('title')->change();
            $table->text('publisher')->change();
        });

        Schema::table('boxes', function (Blueprint $table) {
            $table->text('title')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('series', function (Blueprint $table) {
            $table->string('title')->change();
        });

        Schema::table('editions', function (Blueprint $table) {
            $table->string('name')->change();
            $table->string('publisher')->change();
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->string('title')->change();
        });

        Schema::table('box_sets', function (Blueprint $table) {
            $table->string('title')->change();
            $table->string('publisher')->change();
        });

        Schema::table('boxes', function (Blueprint $table) {
            $table->string('title')->change();
        });
    }
};
