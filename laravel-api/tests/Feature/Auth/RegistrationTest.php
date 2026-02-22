<?php

namespace Tests\Feature\Auth;

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

test('a user can register', function () {
    /** @var TestCase $this */
    $response = $this->postJson('/api/auth/register', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'user' => [
                'id',
                'name',
                'email',
            ],
            'token',
        ])
        ->assertJson([
            'user' => [
                'name' => 'John Doe',
                'email' => 'john@example.com',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $user = User::where('email', 'john@example.com')->first();
    expect(Hash::check('password', $user->password))->toBeTrue();
});

test('it validates registration data', function () {
    /** @var TestCase $this */
    $response = $this->postJson('/api/auth/register', [
        'name' => '',
        'email' => 'invalid-email',
        'password' => 'short',
        'password_confirmation' => 'mismatch',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name', 'email', 'password']);
});
