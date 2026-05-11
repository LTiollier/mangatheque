<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('manga_loans', 'loans');

        Schema::table('loans', function (Blueprint $table) {
            $table->string('loanable_type')->nullable()->after('user_id');
            $table->unsignedBigInteger('loanable_id')->nullable()->after('loanable_type');
            $table->index(['loanable_type', 'loanable_id']);
        });

        // Migrate existing data
        DB::table('loans')->update([
            'loanable_type' => 'volume',
            'loanable_id' => DB::raw('volume_id'),
        ]);

        DB::statement('ALTER TABLE loans ALTER COLUMN loanable_type TYPE varchar(255), ALTER COLUMN loanable_type SET NOT NULL, ALTER COLUMN loanable_type DROP DEFAULT');
        DB::statement('ALTER TABLE loans ALTER COLUMN loanable_id TYPE bigint, ALTER COLUMN loanable_id SET NOT NULL, ALTER COLUMN loanable_id DROP DEFAULT');

        // PostgreSQL doesn't automatically rename constraints when renaming tables in some versions/drivers
        // or Laravel expects the name based on the current table name.
        try {
            Schema::table('loans', function (Blueprint $table) {
                $table->dropForeign('manga_loans_volume_id_foreign');
            });
        } catch (\Throwable $e) {
            try {
                Schema::table('loans', function (Blueprint $table) {
                    $table->dropForeign('loans_volume_id_foreign');
                });
            } catch (\Throwable $e) {
                // Fallback to the default name Laravel would generate
            }
        }

        Schema::table('loans', function (Blueprint $table) {
            $table->dropColumn('volume_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table) {
            $table->unsignedBigInteger('volume_id')->nullable()->after('user_id');
        });

        DB::table('loans')->where('loanable_type', 'volume')->update([
            'volume_id' => DB::raw('loanable_id'),
        ]);

        Schema::table('loans', function (Blueprint $table) {
            $table->foreign('volume_id')->references('id')->on('volumes')->onDelete('cascade');
            $table->dropColumn(['loanable_type', 'loanable_id']);
        });

        Schema::rename('loans', 'manga_loans');
    }
};
