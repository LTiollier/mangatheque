<?php

namespace Database\Factories;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Manga\Infrastructure\EloquentModels\Edition>
 */
class EditionFactory extends Factory
{
    protected $model = Edition::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'series_id' => Series::factory(),
            'name' => 'Édition Standard',
            'publisher' => $this->faker->company(),
            'language' => 'fr',
            'total_volumes' => $this->faker->numberBetween(1, 100),
        ];
    }

    public function kana(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Édition Kana',
            'publisher' => 'Kana',
            'total_volumes' => 72,
        ]);
    }

    public function glenat(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Édition Glénat',
            'publisher' => 'Glénat',
            'total_volumes' => 42,
        ]);
    }
}
