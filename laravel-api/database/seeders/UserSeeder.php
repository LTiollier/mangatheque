<?php

namespace Database\Seeders;

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::factory()->create([
            'name' => 'Demo User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Assumes MangeSeeder runs first, or run it here, but DatabaseSeeder decides order.
        // It's better to fetch and attach here.
        $volumes = Volume::inRandomOrder()->take(10)->get();
        if ($volumes->isNotEmpty()) {
            $user->volumes()->attach($volumes->pluck('id'));
        }
    }
}
