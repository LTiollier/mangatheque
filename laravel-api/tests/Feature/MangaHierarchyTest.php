<?php

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\getJson;

test('can show a series', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Sample Series', 'authors' => ['Test Author']]);

    $response = getJson("/api/series/{$series->id}");

    $response->assertStatus(200)
        ->assertJsonPath('data.title', 'Sample Series')
        ->assertJsonPath('data.authors.0', 'Test Author');
});

test('returns 404 for non-existent series', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = getJson("/api/series/9999");

    $response->assertStatus(404);
});

test('can list editions for a series', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Sample Series', 'authors' => []]);
    Edition::create(['series_id' => $series->id, 'name' => 'Legacy', 'language' => 'fr']);
    Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $response = getJson("/api/series/{$series->id}/editions");

    $response->assertStatus(200)
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.name', 'Legacy');
});

test('can list volumes for an edition', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Sample Series', 'authors' => []]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    Volume::create([
        'api_id' => 'v1',
        'title' => 'Vol 1',
        'edition_id' => $edition->id,
        'authors' => [],
        'number' => 1
    ]);

    $response = getJson("/api/editions/{$edition->id}/volumes");

    $response->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Vol 1')
        ->assertJsonPath('data.0.number', '1');
});
