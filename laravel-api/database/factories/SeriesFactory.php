<?php

namespace Database\Factories;

use App\Manga\Infrastructure\EloquentModels\Series;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Manga\Infrastructure\EloquentModels\Series>
 */
class SeriesFactory extends Factory
{
    protected $model = Series::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'api_id' => Str::orderedUuid()->toString(),
            'title' => $this->faker->sentence(3),
            'authors' => [$this->faker->name()],
            'description' => $this->faker->paragraph(),
            'status' => $this->faker->randomElement(['publishing', 'finished', 'on_hiatus']),
            'total_volumes' => $this->faker->numberBetween(1, 100),
            'cover_url' => $this->faker->imageUrl(),
        ];
    }

    public function naruto(): static
    {
        return $this->state(fn (array $attributes) => [
            'api_id' => 'naruto-api-id-xxxx',
            'title' => 'Naruto',
            'authors' => ['Masashi Kishimoto'],
            'description' => 'Naruto is a Japanese manga series written and illustrated by Masashi Kishimoto.',
            'status' => 'finished',
            'total_volumes' => 72,
            'cover_url' => 'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',
        ]);
    }

    public function dragonBall(): static
    {
        return $this->state(fn (array $attributes) => [
            'api_id' => 'dragonball-api-id-xxxx',
            'title' => 'Dragon Ball',
            'authors' => ['Akira Toriyama'],
            'description' => 'Dragon Ball is a Japanese manga series written and illustrated by Akira Toriyama.',
            'status' => 'finished',
            'total_volumes' => 42,
            'cover_url' => 'https://upload.wikimedia.org/wikipedia/en/c/c3/Dragon_Ball_vol_1.png',
        ]);
    }
}
