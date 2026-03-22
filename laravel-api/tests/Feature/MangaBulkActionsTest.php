<?php

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can bulk scan mangas', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Test Series', 'authors' => null]);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $isbn1 = '9781111111111';
    $isbn2 = '9782222222222';

    $v1 = Volume::create([
        'api_id' => 'api_1',
        'title' => 'Manga 1',
        'isbn' => $isbn1,
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $v2 = Volume::create([
        'api_id' => 'api_2',
        'title' => 'Manga 2',
        'isbn' => $isbn2,
        'edition_id' => $edition->id,
        'authors' => null,
    ]);

    $response = postJson('/api/mangas/scan-bulk', [
        'isbns' => [$isbn1, $isbn2],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(2, 'data');

    expect($user->volumes()->where('volumes.id', $v1->id)->exists())->toBeTrue()
        ->and($user->volumes()->where('volumes.id', $v2->id)->exists())->toBeTrue();
});

test('can bulk add local volumes to an edition', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $series = Series::create(['title' => 'Test Series', 'authors' => null]);
    $edition = Edition::create([
        'series_id' => $series->id,
        'name' => 'Standard',
        'language' => 'fr',
    ]);

    $response = postJson('/api/mangas/bulk', [
        'edition_id' => $edition->id,
        'numbers' => [1, 5, 10],
    ]);

    $response->assertStatus(201)
        ->assertJsonCount(3, 'data');

    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 1]);
    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 5]);
    assertDatabaseHas('volumes', ['edition_id' => $edition->id, 'number' => 10]);
});

test('can bulk remove volumes from collection', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $volumes = Volume::factory()->count(3)->create();
    $user->volumes()->attach($volumes->pluck('id')->toArray());

    $response = postJson('/api/mangas/bulk-remove', [
        'volume_ids' => $volumes->pluck('id')->toArray(),
    ]);

    $response->assertSuccessful();
    expect($user->volumes()->whereIn('volumes.id', $volumes->pluck('id')->toArray())->exists())->toBeFalse();
});
