<?php

declare(strict_types=1);

namespace App\Manga\Infrastructure\EloquentModels;

use Database\Factories\BoxVolumeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BoxVolume extends Model
{
    /** @use HasFactory<BoxVolumeFactory> */
    use HasFactory;

    protected $fillable = [
        'box_id',
        'volume_id',
    ];
}
