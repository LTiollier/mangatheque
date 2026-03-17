<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\RateLimiter;

test('login route has rate limiting', function () {
    $user = User::factory()->create([
        'password' => bcrypt('password'),
    ]);

    // First 5 attempts should not be rate limited
    for ($i = 0; $i < 5; $i++) {
        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);
        
        $response->assertStatus(401);
    }

    // 6th attempt should be rate limited (429)
    $response = $this->postJson('/api/auth/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(429);
});

test('registration route has rate limiting', function () {
    // First 5 attempts
    for ($i = 0; $i < 5; $i++) {
        $response = $this->postJson('/api/auth/register', [
            'name' => "User {$i}",
            'username' => "user{$i}",
            'email' => "user{$i}@example.com",
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);
        
        $response->assertStatus(201);
    }

    // 6th attempt should be rate limited
    $response = $this->postJson('/api/auth/register', [
        'name' => 'User 6',
        'username' => 'user6',
        'email' => 'user6@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(429);
});
