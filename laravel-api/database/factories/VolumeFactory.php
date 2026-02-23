<?php

namespace Database\Factories;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Manga\Infrastructure\EloquentModels\Volume>
 */
class VolumeFactory extends Factory
{
    protected $model = Volume::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'edition_id' => Edition::factory(),
            'api_id' => Str::orderedUuid()->toString(),
            'isbn' => $this->faker->isbn13(),
            'number' => $this->faker->numberBetween(1, 100),
            'title' => 'Tome '.$this->faker->numberBetween(1, 100),
            'authors' => [$this->faker->name()],
            'description' => $this->faker->paragraph(),
            'published_date' => $this->faker->date(),
            'page_count' => $this->faker->numberBetween(150, 250),
            'cover_url' => $this->faker->imageUrl(),
        ];
    }
}
