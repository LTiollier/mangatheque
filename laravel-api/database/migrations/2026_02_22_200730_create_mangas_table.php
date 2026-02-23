<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mangas', function (Blueprint $table) {
            $table->id();
            $table->string('api_id')->unique()->nullable();
            $table->string('isbn')->unique()->nullable();
            $table->string('title');
            $table->json('authors')->nullable();
            $table->text('description')->nullable();
            $table->string('published_date')->nullable();
            $table->integer('page_count')->nullable();
            $table->text('cover_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mangas');
    }
};
