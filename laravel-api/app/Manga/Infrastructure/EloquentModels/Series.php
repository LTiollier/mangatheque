<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Database\Factories\SeriesFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Series extends Model
{
    /** @use HasFactory<SeriesFactory> */
    use HasFactory;

    protected $fillable = [
        'api_id',
        'title',
        'authors',
        'cover_url',
    ];

    /**
     * @return HasMany<Edition, $this>
     */
    public function editions(): HasMany
    {
        return $this->hasMany(Edition::class);
    }

    /**
     * @return HasMany<BoxSet, $this>
     */
    public function boxSets(): HasMany
    {
        return $this->hasMany(BoxSet::class);
    }
}
