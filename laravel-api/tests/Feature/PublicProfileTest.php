<?php

use App\User\Infrastructure\EloquentModels\User;

it('shows public user profile successfully', function () {
    User::factory()->create([
        'username' => 'leoelmy',
        'is_public' => true,
    ]);

    $response = $this->getJson('/api/users/leoelmy');

    $response->assertOk()
        ->assertJson([
            'data' => [
                'username' => 'leoelmy',
                'is_public' => true,
            ],
        ]);
});

it('returns 404 for missing or private user profile', function () {
    User::factory()->create([
        'username' => 'secretUser',
        'is_public' => false,
    ]);

    $response = $this->getJson('/api/users/secretUser');

    $response->assertNotFound();

    $missingResponse = $this->getJson('/api/users/missingUser');

    $missingResponse->assertNotFound();
});

it('retrieves collection for a public user', function () {
    $user = User::factory()->create([
        'username' => 'leoelmy',
        'is_public' => true,
    ]);

    // Add some mangas using Eloquent to test the retrieval
    $volume = \App\Manga\Infrastructure\EloquentModels\Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $response = $this->getJson('/api/users/leoelmy/collection');

    $response->assertOk()
        ->assertJsonCount(1, 'data');
});

it('returns 404 for collection of a private user', function () {
    $user = User::factory()->create([
        'username' => 'secretUser',
        'is_public' => false,
    ]);

    $volume = \App\Manga\Infrastructure\EloquentModels\Volume::factory()->create();
    $user->volumes()->attach($volume->id);

    $response = $this->getJson('/api/users/secretUser/collection');

    $response->assertNotFound();
});
