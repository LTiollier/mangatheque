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
        Schema::create('box_sets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('series_id')->constrained('series')->onDelete('cascade');
            $table->string('api_id')->nullable()->unique();
            $table->string('title');
            $table->string('publisher')->nullable();
            $table->timestamps();
        });

        Schema::create('boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('box_set_id')->constrained('box_sets')->onDelete('cascade');
            $table->string('api_id')->nullable()->unique();
            $table->string('title');
            $table->string('number')->nullable();
            $table->string('isbn')->nullable()->unique();
            $table->string('release_date')->nullable();
            $table->text('cover_url')->nullable();
            $table->boolean('is_empty')->default(false);
            $table->timestamps();
        });

        Schema::create('box_volumes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('box_id')->constrained('boxes')->onDelete('cascade');
            $table->foreignId('volume_id')->constrained('volumes')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['box_id', 'volume_id']);
        });

        Schema::create('user_boxes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('box_id')->constrained('boxes')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'box_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_boxes');
        Schema::dropIfExists('box_volumes');
        Schema::dropIfExists('boxes');
        Schema::dropIfExists('box_sets');
    }
};
