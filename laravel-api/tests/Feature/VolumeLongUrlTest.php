<?php

declare(strict_types=1);

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\User\Infrastructure\EloquentModels\User;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

test('can add manga with a very long cover url', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $longUrl = 'https://books.google.com/books/content?id=long_id&'.str_repeat('a', 500);
    $apiId = '9781234567890';

    $series = Series::create(['title' => 'LongUrlSeries', 'authors' => 'Author Name']);
    $edition = Edition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = Volume::create([
        'api_id' => $apiId,
        'title' => 'LongUrlSeries - Tome 23',
        'isbn' => $apiId,
        'edition_id' => $edition->id,
        'authors' => null,
        'cover_url' => $longUrl,
    ]);

    $response = postJson('/api/volumes', [
        'api_id' => $apiId,
    ]);

    $response->assertStatus(201);

    assertDatabaseHas('series', [
        'title' => 'LongUrlSeries',
    ]);

    assertDatabaseHas('volumes', [
        'api_id' => $apiId,
        'cover_url' => $longUrl,
    ]);

    expect($user->volumes()->where('volumes.id', $volume->id)->exists())->toBeTrue();
});
