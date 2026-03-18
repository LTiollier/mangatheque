<?php

namespace App\Borrowing\Infrastructure\EloquentModels;

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Loan extends Model
{
    protected $fillable = [
        'user_id',
        'loanable_id',
        'loanable_type',
        'borrower_name',
        'loaned_at',
        'returned_at',
        'notes',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'loaned_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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
