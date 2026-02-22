<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Edition extends Model
{
    protected $fillable = [
        'series_id',
        'name',
        'publisher',
        'language',
        'total_volumes',
    ];

    /**
     * @return BelongsTo<Series, $this>
     */
    public function series(): BelongsTo
    {
        return $this->belongsTo(Series::class);
    }

    /**
     * @return HasMany<Volume, $this>
     */
    public function volumes(): HasMany
    {
        return $this->hasMany(Volume::class);
    }
}
