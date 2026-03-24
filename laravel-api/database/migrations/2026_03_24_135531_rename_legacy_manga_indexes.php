<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // volumes (previously mangas)
        DB::statement('ALTER INDEX mangas_pkey RENAME TO volumes_pkey');
        DB::statement('ALTER INDEX mangas_api_id_unique RENAME TO volumes_api_id_unique');

        // user_volumes (previously user_manga)
        DB::statement('ALTER INDEX user_manga_pkey RENAME TO user_volumes_pkey');
        DB::statement('ALTER INDEX user_manga_user_id_manga_id_unique RENAME TO user_volumes_user_id_volume_id_unique');

        // loans (previously manga_loans)
        DB::statement('ALTER INDEX manga_loans_pkey RENAME TO loans_pkey');

        // wishlist_items (previously wishlist_volumes)
        DB::statement('ALTER INDEX wishlist_volumes_pkey RENAME TO wishlist_items_pkey');
    }

    public function down(): void
    {
        DB::statement('ALTER INDEX volumes_pkey RENAME TO mangas_pkey');
        DB::statement('ALTER INDEX volumes_api_id_unique RENAME TO mangas_api_id_unique');

        DB::statement('ALTER INDEX user_volumes_pkey RENAME TO user_manga_pkey');
        DB::statement('ALTER INDEX user_volumes_user_id_volume_id_unique RENAME TO user_manga_user_id_manga_id_unique');

        DB::statement('ALTER INDEX loans_pkey RENAME TO manga_loans_pkey');

        DB::statement('ALTER INDEX wishlist_items_pkey RENAME TO wishlist_volumes_pkey');
    }
};
