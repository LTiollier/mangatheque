<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('wishlist_volumes', 'wishlist_items');

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->string('wishlistable_type')->nullable()->after('user_id');
            $table->unsignedBigInteger('wishlistable_id')->nullable()->after('wishlistable_type');
            $table->index(['wishlistable_type', 'wishlistable_id']);
        });

        // Migrate existing data
        DB::table('wishlist_items')->update([
            'wishlistable_type' => 'volume',
            'wishlistable_id' => DB::raw('volume_id')
        ]);

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->string('wishlistable_type')->nullable(false)->change();
            $table->unsignedBigInteger('wishlistable_id')->nullable(false)->change();

            $table->dropUnique('wishlist_volumes_user_id_volume_id_unique');
            $table->dropForeign('wishlist_volumes_volume_id_foreign');
            $table->dropColumn('volume_id');
            
            $table->unique(['user_id', 'wishlistable_id', 'wishlistable_type'], 'wishlist_items_user_wishlistable_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->dropUnique('wishlist_items_user_wishlistable_unique');
            $table->unsignedBigInteger('volume_id')->nullable()->after('user_id');
        });

        DB::table('wishlist_items')->where('wishlistable_type', 'volume')->update([
            'volume_id' => DB::raw('wishlistable_id')
        ]);

        Schema::table('wishlist_items', function (Blueprint $table) {
            $table->foreign('volume_id')->references('id')->on('volumes')->onDelete('cascade');
            $table->unique(['user_id', 'volume_id'], 'wishlist_volumes_user_id_volume_id_unique');
            $table->dropColumn(['wishlistable_type', 'wishlistable_id']);
        });

        Schema::rename('wishlist_items', 'wishlist_volumes');
    }
};
