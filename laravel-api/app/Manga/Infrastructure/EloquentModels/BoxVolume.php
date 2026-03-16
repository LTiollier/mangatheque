<?php

namespace App\Manga\Infrastructure\EloquentModels;

use Illuminate\Database\Eloquent\Model;

class BoxVolume extends Model
{
    protected $fillable = [
        'box_id',
        'volume_id',
    ];
}
