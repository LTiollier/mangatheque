<?php

declare(strict_types=1);

namespace App\Borrowing\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphPivot;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * @property int|null $id
 * @property int $loan_id
 * @property int $loanable_id
 * @property string $loanable_type
 * @property Model|null $loanable
 */
final class LoanItem extends MorphPivot
{
    protected $table = 'loan_items';

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
