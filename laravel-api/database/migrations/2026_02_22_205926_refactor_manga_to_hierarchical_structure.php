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
        Schema::create('series', function (Blueprint $table) {
            $table->id();
            $table->string('api_id')->nullable()->unique();
            $table->string('title');
            $table->json('authors')->nullable();
            $table->text('description')->nullable();
            $table->string('status')->nullable();
            $table->integer('total_volumes')->nullable();
            $table->text('cover_url')->nullable();
            $table->timestamps();
        });

        Schema::create('editions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('series_id')->constrained('series')->onDelete('cascade');
            $table->string('name'); // Standard, Perfect, Double, etc.
            $table->string('publisher')->nullable(); // Kana, Glenat, etc.
            $table->string('language')->default('fr');
            $table->integer('total_volumes')->nullable();
            $table->timestamps();
        });

        Schema::rename('mangas', 'volumes');

        Schema::table('volumes', function (Blueprint $table) {
            $table->foreignId('edition_id')->nullable()->constrained('editions')->onDelete('cascade');
            $table->string('number')->nullable(); // e.g. "1", "2", "1-2"
        });

        Schema::rename('user_manga', 'user_volumes');

        Schema::table('user_volumes', function (Blueprint $table) {
            $table->renameColumn('manga_id', 'volume_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_volumes', function (Blueprint $table) {
            $table->renameColumn('volume_id', 'manga_id');
        });

        Schema::rename('user_volumes', 'user_manga');

        Schema::table('volumes', function (Blueprint $table) {
            $table->dropForeign(['edition_id']);
            $table->dropColumn(['edition_id', 'number']);
        });

        Schema::rename('volumes', 'mangas');

        Schema::dropIfExists('editions');
        Schema::dropIfExists('series');
    }
};
