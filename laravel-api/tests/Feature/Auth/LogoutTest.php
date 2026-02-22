<?php

namespace Tests\Feature\Auth;

use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

test('a user can logout', function () {
    /** @var TestCase $this */
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/auth/logout');

    $response->assertStatus(200)
        ->assertJson([
            'message' => 'Successfully logged out.',
        ]);

    expect($user->tokens()->count())->toBe(0);
});

test('unauthenticated user cannot logout', function () {
    /** @var TestCase $this */
    $response = $this->postJson('/api/auth/logout');

    $response->assertStatus(401);
});
