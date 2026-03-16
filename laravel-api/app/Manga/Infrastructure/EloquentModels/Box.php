<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Box extends Model
{
    protected $fillable = [
        'box_set_id',
        'api_id',
        'title',
        'number',
        'isbn',
        'release_date',
        'cover_url',
        'is_empty',
    ];

    public function boxSet(): BelongsTo
    {
        return $this->belongsTo(BoxSet::class);
    }

    public function volumes(): BelongsToMany
    {
        return $this->belongsToMany(Volume::class, 'box_volumes', 'box_id', 'volume_id');
    }
}
