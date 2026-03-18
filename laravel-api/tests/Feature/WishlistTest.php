<?php

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

uses(RefreshDatabase::class);

test('can add manga to wishlist by api_id (stores edition)', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create([
        'edition_id' => $edition->id,
        'api_id' => 'manga-wish-123'
    ]);

    actingAs($user);

    $response = postJson('/api/wishlist', [
        'api_id' => 'manga-wish-123',
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('wishlist_items', [
        'user_id' => $user->id,
        'wishlistable_id' => $edition->id,
        'wishlistable_type' => 'edition'
    ]);
});

test('can add edition directly to wishlist by edition_id', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    actingAs($user);

    $response = postJson('/api/wishlist', [
        'edition_id' => $edition->id,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('wishlist_items', [
        'user_id' => $user->id,
        'wishlistable_id' => $edition->id,
        'wishlistable_type' => 'edition'
    ]);
});

test('it handles adding non-existent manga to wishlist by api_id', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/wishlist', [
        'api_id' => 'non-existent-api-id',
    ]);

    $response->assertStatus(404);
});

test('can list wishlist items (editions)', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create(['title' => 'Naruto']);
    $edition = Edition::factory()->create(['series_id' => $series->id, 'name' => 'Edition Standard']);

    $user->wishlistEditions()->attach($edition->id);

    actingAs($user);

    $response = getJson('/api/wishlist');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', 'edition')
        ->assertJsonPath('data.0.name', 'Edition Standard');
});

test('can remove edition from wishlist', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);

    $user->wishlistEditions()->attach($edition->id);

    actingAs($user);

    $response = deleteJson("/api/wishlist/{$edition->id}", ['type' => 'edition']);

    $response->assertStatus(200);

    assertDatabaseMissing('wishlist_items', [
        'user_id' => $user->id,
        'wishlistable_id' => $edition->id,
        'wishlistable_type' => 'edition'
    ]);
});
