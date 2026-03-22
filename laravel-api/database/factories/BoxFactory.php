<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\BoxSet;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Manga\Infrastructure\EloquentModels\Box>
 */
class BoxFactory extends Factory
{
    protected $model = Box::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'box_set_id' => BoxSet::factory(),
            'api_id' => Str::orderedUuid()->toString(),
            'title' => $this->faker->sentence(3).' Box',
            'number' => (string) $this->faker->numberBetween(1, 10),
            'isbn' => $this->faker->isbn13(),
            'release_date' => $this->faker->date(),
            'cover_url' => $this->faker->imageUrl(),
            'is_empty' => false,
        ];
    }
}
