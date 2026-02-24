<?php

use App\User\Infrastructure\EloquentModels\User;

it('updates user settings successfully', function () {
    $user = User::factory()->create([
        'username' => 'old_username',
        'is_public' => false,
    ]);

    $response = $this->actingAs($user)->putJson('/api/user/settings', [
        'username' => 'new_username',
        'is_public' => true,
    ]);

    $response->assertOk()
        ->assertJson([
            'data' => [
                'username' => 'new_username',
                'is_public' => true,
            ],
        ]);

    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'new_username',
        'is_public' => true,
    ]);
});

it('prevents duplicate usernames', function () {
    User::factory()->create([
        'username' => 'taken_username',
    ]);

    $user = User::factory()->create([
        'username' => 'my_username',
    ]);

    $response = $this->actingAs($user)->putJson('/api/user/settings', [
        'username' => 'taken_username',
        'is_public' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

it('allows updating settings without changing username', function () {
    $user = User::factory()->create([
        'username' => 'my_username',
        'is_public' => false,
    ]);

    $response = $this->actingAs($user)->putJson('/api/user/settings', [
        'username' => 'my_username',
        'is_public' => true,
    ]);

    $response->assertOk();
    $this->assertDatabaseHas('users', [
        'id' => $user->id,
        'username' => 'my_username',
        'is_public' => true,
    ]);
});
