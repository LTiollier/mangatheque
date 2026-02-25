<?php

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

test('can add manga to wishlist by scan', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $isbn = '9781234567890';

    Http::fake([
        'www.googleapis.com/books/v1/volumes*' => Http::response([
            'items' => [
                [
                    'id' => 'api_id_123',
                    'volumeInfo' => [
                        'title' => 'Wishlist Manga',
                        'authors' => ['Author Name'],
                        'publishedDate' => '2023',
                        'industryIdentifiers' => [['type' => 'ISBN_13', 'identifier' => $isbn]],
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/api/wishlist/scan', [
        'isbn' => $isbn,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('volumes', [
        'isbn' => $isbn,
    ]);

    assertDatabaseHas('wishlist_volumes', [
        'user_id' => $user->id,
    ]);
});

test('can add manga to wishlist by api_id', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $apiId = 'api123';
    $series = Series::create(['title' => 'Test Series', 'authors' => []]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    Volume::create([
        'api_id' => $apiId,
        'title' => 'Existing Manga',
        'edition_id' => $edition->id,
        'authors' => [],
    ]);

    $response = postJson('/api/wishlist', [
        'api_id' => $apiId,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('wishlist_volumes', [
        'user_id' => $user->id,
    ]);
});

test('it handles adding non-existent manga to wishlist by api_id', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = postJson('/api/wishlist', [
        'api_id' => 'nonexistent',
    ]);

    $response->assertStatus(404);
});

test('it handles manga not found on wishlist scan', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $isbn = '9999999999999';

    Http::fake([
        'www.googleapis.com/books/v1/volumes*' => Http::response(['items' => []], 200),
    ]);

    $response = postJson('/api/wishlist/scan', [
        'isbn' => $isbn,
    ]);

    $response->assertStatus(404);
});

test('it extracts volume number on wishlist scan', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $isbn = '9781234567890';

    Http::fake([
        'www.googleapis.com/books/v1/volumes*' => Http::response([
            'items' => [
                [
                    'id' => 'api_id_123',
                    'volumeInfo' => [
                        'title' => 'Naruto Vol. 23',
                        'authors' => ['Masashi Kishimoto'],
                        'industryIdentifiers' => [['type' => 'ISBN_13', 'identifier' => $isbn]],
                    ],
                ],
            ],
        ], 200),
    ]);

    $response = postJson('/api/wishlist/scan', [
        'isbn' => $isbn,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('volumes', [
        'isbn' => $isbn,
        'number' => '23',
    ]);
});

test('can list wishlist items', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    // Create a volume and add to wishlist
    $series = Series::create(['title' => 'Wish Series', 'authors' => []]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'wish123',
        'title' => 'Wish Volume',
        'edition_id' => $edition->id,
        'authors' => [],
    ]);
    $user->wishlistVolumes()->attach($volume->id);

    $response = getJson('/api/wishlist');

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Wish Volume');
});

test('can remove volume from wishlist', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Wish Series', 'authors' => []]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => 'wish123',
        'title' => 'Wish Volume',
        'edition_id' => $edition->id,
        'authors' => [],
    ]);
    $user->wishlistVolumes()->attach($volume->id);

    $response = deleteJson("/api/wishlist/{$volume->id}");

    $response->assertStatus(200);

    assertDatabaseMissing('wishlist_volumes', [
        'user_id' => $user->id,
        'volume_id' => $volume->id,
    ]);
});
