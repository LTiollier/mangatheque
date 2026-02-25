<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Volume extends Model
{
    /** @use HasFactory<\Database\Factories\VolumeFactory> */
    use HasFactory;

    protected $fillable = [
        'edition_id',
        'api_id',
        'isbn',
        'number',
        'title',
        'authors',
        'description',
        'published_date',
        'page_count',
        'cover_url',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'authors' => 'array',
        ];
    }

    /**
     * @return BelongsTo<Edition, $this>
     */
    public function edition(): BelongsTo
    {
        return $this->belongsTo(Edition::class);
    }

    /**
     * @return BelongsToMany<\App\User\Infrastructure\EloquentModels\User, $this>
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(\App\User\Infrastructure\EloquentModels\User::class, 'user_volumes');
    }

    /**
     * @return HasMany<\App\Borrowing\Infrastructure\EloquentModels\Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(\App\Borrowing\Infrastructure\EloquentModels\Loan::class);
    }
}
