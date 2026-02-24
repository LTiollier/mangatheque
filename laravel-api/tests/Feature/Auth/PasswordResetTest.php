<?php

use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Password;

use function Pest\Laravel\postJson;

test('it can request a reset password link', function () {
    $user = User::factory()->create(['email' => 'forgot@example.com']);

    $response = postJson('/api/auth/forgot-password', [
        'email' => 'forgot@example.com',
    ]);

    $response->assertStatus(200);
});

test('it fails if email does not exist', function () {
    $response = postJson('/api/auth/forgot-password', [
        'email' => 'nonexistent@example.com',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('it can reset password with token', function () {
    $user = User::factory()->create(['email' => 'reset@example.com']);
    $token = Password::createToken($user);

    $response = postJson('/api/auth/reset-password', [
        'token' => $token,
        'email' => 'reset@example.com',
        'password' => 'newpassword123',
        'password_confirmation' => 'newpassword123',
    ]);

    $response->assertStatus(200);

    // Verify password was changed
    $user->refresh();
    expect(Illuminate\Support\Facades\Hash::check('newpassword123', $user->password))->toBeTrue();
});
