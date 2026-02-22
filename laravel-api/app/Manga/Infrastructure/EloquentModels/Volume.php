<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Volume extends Model
{
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
}
