<?php

declare(strict_types=1);

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\getJson;

uses(RefreshDatabase::class);

test('can find a manga by isbn', function () {
    $series = Series::factory()->create([
        'title' => 'One Piece',
        'authors' => 'Eiichiro Oda',
    ]);
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create([
        'edition_id' => $edition->id,
        'isbn' => '9782723492843',
        'title' => 'One Piece Tome 1',
        'published_date' => '1999-09-01',
        'api_id' => 'OP-api-001',
        'cover_url' => 'https://example.com/cover.jpg',
    ]);

    $response = getJson('/api/volumes/search/isbn?isbn=9782723492843');

    $response->assertSuccessful()
        ->assertJsonPath('data.id', $volume->id)
        ->assertJsonPath('data.api_id', 'OP-api-001')
        ->assertJsonPath('data.title', 'One Piece Tome 1')
        ->assertJsonPath('data.authors', ['Eiichiro Oda'])
        ->assertJsonPath('data.isbn', '9782723492843')
        ->assertJsonPath('data.published_date', '1999-09-01')
        ->assertJsonPath('data.cover_url', 'https://example.com/cover.jpg')
        ->assertJsonPath('data.description', null)
        ->assertJsonPath('data.page_count', null);
});

test('returns 404 when isbn is not found', function () {
    getJson('/api/volumes/search/isbn?isbn=0000000000000')
        ->assertNotFound();
});

test('isbn param is required', function () {
    getJson('/api/volumes/search/isbn')
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['isbn']);
});

test('isbn search does not require authentication', function () {
    $volume = Volume::factory()->create(['isbn' => '9782723492843']);

    getJson('/api/volumes/search/isbn?isbn=9782723492843')
        ->assertSuccessful();
});
