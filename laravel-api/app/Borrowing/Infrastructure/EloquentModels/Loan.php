<?php

declare(strict_types=1);

namespace App\Borrowing\Infrastructure\EloquentModels;

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Loan extends Model
{
    protected $fillable = [
        'user_id',
        'borrower_name',
        'loaned_at',
        'returned_at',
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
     * @return HasMany<LoanItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(LoanItem::class, 'loan_id');
    }
}
