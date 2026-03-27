<?php

declare(strict_types=1);

namespace App\Borrowing\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final class LoanItem extends Model
{
    protected $fillable = ['loan_id', 'loanable_type', 'loanable_id'];

    /**
     * @return BelongsTo<Loan, $this>
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class, 'loan_id');
    }

    /**
     * Get the parent loanable model (volume or box).
     *
     * @return MorphTo<Model, $this>
     */
    public function loanable(): MorphTo
    {
        return $this->morphTo();
    }
}
