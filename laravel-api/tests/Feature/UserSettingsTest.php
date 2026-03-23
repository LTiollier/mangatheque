<?php

declare(strict_types=1);

use App\User\Infrastructure\EloquentModels\User;

it('updates user settings successfully', function () {
    $user = User::factory()->create([
        'username' => 'old_username',
        'is_public' => false,
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => 'new_username',
        'is_public' => true,
        'theme' => 'void',
        'palette' => 'oni',
    ]);

    $response->assertOk()
        ->assertJson([
            'data' => [
                'username' => 'new_username',
                'is_public' => true,
                'theme' => 'void',
                'palette' => 'oni',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'new_username',
        'is_public' => true,
        'theme' => 'void',
        'palette' => 'oni',
    ]);
});

it('prevents duplicate usernames', function () {
    User::factory()->create([
        'username' => 'taken_username',
    ]);

    $user = User::factory()->create([
        'username' => 'my_username',
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => 'taken_username',
        'is_public' => true,
        'theme' => 'void',
        'palette' => 'oni',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

it('allows updating settings without changing username', function () {
    $user = User::factory()->create([
        'username' => 'my_username',
        'is_public' => false,
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => 'my_username',
        'is_public' => true,
        'theme' => 'void',
        'palette' => 'oni',
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'my_username',
        'is_public' => true,
    ]);
});

it('persists theme and palette choices', function () {
    $user = User::factory()->create([
        'theme' => 'void',
        'palette' => 'oni',
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => $user->username,
        'is_public' => false,
        'theme' => 'light',
        'palette' => 'kaminari',
    ]);

    $response->assertOk()
        ->assertJson([
            'data' => [
                'theme' => 'light',
                'palette' => 'kaminari',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'theme' => 'light',
        'palette' => 'kaminari',
    ]);
});

it('rejects invalid theme', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => $user->username,
        'is_public' => false,
        'theme' => 'dark',
        'palette' => 'oni',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['theme']);
});

it('rejects invalid palette', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patchJson('/api/user/settings', [
        'username' => $user->username,
        'is_public' => false,
        'theme' => 'void',
        'palette' => 'pink',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['palette']);
});

it('updates user email successfully', function () {
    $user = User::factory()->create([
        'email' => 'old@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/email', [
        'email' => 'new@example.com',
        'current_password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJson([
            'data' => [
                'email' => 'new@example.com',
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'email' => 'new@example.com',
    ]);
});

it('prevents updating email with incorrect password', function () {
    $user = User::factory()->create([
        'email' => 'old@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/email', [
        'email' => 'new@example.com',
        'current_password' => 'wrong_password',
    ]);

    $response->assertStatus(401);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'email' => 'old@example.com',
    ]);
});

it('prevents duplicate emails during email update', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $user = User::factory()->create([
        'email' => 'my@example.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/email', [
        'email' => 'taken@example.com',
        'current_password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('updates user password successfully', function () {
    $user = User::factory()->create([
        'password' => Hash::make('OldPassword123!'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/password', [
        'current_password' => 'OldPassword123!',
        'password' => 'NewSecurePassword123!',
        'password_confirmation' => 'NewSecurePassword123!',
    ]);

    $response->assertOk();

    $user->refresh();
    expect(Hash::check('NewSecurePassword123!', $user->password))->toBeTrue();
});

it('prevents updating password with incorrect current password', function () {
    $user = User::factory()->create([
        'password' => Hash::make('CorrectPassword123!'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/password', [
        'current_password' => 'WrongPassword123!',
        'password' => 'NewSecurePassword123!',
        'password_confirmation' => 'NewSecurePassword123!',
    ]);

    $response->assertStatus(401);

    $user->refresh();
    expect(Hash::check('CorrectPassword123!', $user->password))->toBeTrue();
});

it('validates new password strength', function () {
    $user = User::factory()->create([
        'password' => Hash::make('CorrectPassword123!'),
    ]);

    $response = $this->actingAs($user)->patchJson('/api/user/settings/password', [
        'current_password' => 'CorrectPassword123!',
        'password' => 'weak',
        'password_confirmation' => 'weak',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});
