<?php

namespace Database\Seeders;

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'username' => 'testuser',
                'password' => bcrypt('password'),
                'is_public' => true,
            ]
        );
    }
}
