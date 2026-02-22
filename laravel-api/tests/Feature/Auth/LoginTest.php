<?php

namespace Tests\Feature\Auth;

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

test('a user can login', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'jane@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'jane@example.com',
        'password' => 'password',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'user' => [
                'id',
                'name',
                'email',
            ],
            'token',
        ])
        ->assertJsonPath('user.email', 'jane@example.com');

    expect($response->json('token'))->not->toBeNull();
});

test('a user cannot login with invalid credentials', function () {
    /** @var TestCase $this */
    User::factory()->create([
        'email' => 'jane@example.com',
        'password' => Hash::make('password'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'jane@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'Invalid credentials provided.',
        ]);
});

test('it validates login data', function () {
    /** @var TestCase $this */
    $response = $this->postJson('/api/auth/login', [
        'email' => 'invalid-email',
        'password' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'password']);
});
