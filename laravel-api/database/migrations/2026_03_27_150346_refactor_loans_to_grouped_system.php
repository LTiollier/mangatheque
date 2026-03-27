<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the loan_items pivot table
        Schema::create('loan_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('loan_id')->constrained('loans')->cascadeOnDelete();
            $table->string('loanable_type');
            $table->unsignedBigInteger('loanable_id');
            $table->timestamps();

            $table->index(['loanable_type', 'loanable_id']);
            $table->unique(['loan_id', 'loanable_type', 'loanable_id']);
        });

        // 2. Migrate existing data from loans to loan_items
        DB::transaction(function (): void {
            $loans = DB::table('loans')->get();
            foreach ($loans as $loan) {
                DB::table('loan_items')->insert([
                    'loan_id' => $loan->id,
                    'loanable_type' => $loan->loanable_type,
                    'loanable_id' => $loan->loanable_id,
                    'created_at' => $loan->created_at,
                    'updated_at' => $loan->updated_at,
                ]);
            }
        });

        // 3. Remove the polymorphic columns from loans
        Schema::table('loans', function (Blueprint $table): void {
            $table->dropColumn(['loanable_type', 'loanable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loans', function (Blueprint $table): void {
            $table->string('loanable_type')->nullable()->after('user_id');
            $table->unsignedBigInteger('loanable_id')->nullable()->after('loanable_type');
            $table->index(['loanable_type', 'loanable_id']);
        });

        // Restore from loan_items (first item per loan only)
        DB::table('loan_items')->get()->each(function (object $item): void {
            DB::table('loans')->where('id', $item->loan_id)->update([
                'loanable_type' => $item->loanable_type,
                'loanable_id' => $item->loanable_id,
            ]);
        });

        Schema::dropIfExists('loan_items');
    }
};
