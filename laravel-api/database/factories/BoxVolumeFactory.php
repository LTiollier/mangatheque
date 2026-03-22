<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\BoxVolume;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Manga\Infrastructure\EloquentModels\BoxVolume>
 */
class BoxVolumeFactory extends Factory
{
    protected $model = BoxVolume::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'box_id' => Box::factory(),
            'volume_id' => Volume::factory(),
        ];
    }
}
