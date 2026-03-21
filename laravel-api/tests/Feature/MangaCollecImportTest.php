<?php

namespace Tests\Feature;

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use App\Manga\Infrastructure\Services\MangaCollecSeriesImportService;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

test('cannot import manga collec with invalid url', function () {
    $user = User::factory()->create();
    actingAs($user);

    $response = postJson('/api/user/settings/import/mangacollec', [
        'url' => 'https://random-website.com/user/xutech/collection',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['url']);
});

test('returns 403 when profile is private or not found', function () {
    $user = User::factory()->create();
    actingAs($user);

    $this->mock(MangaCollecScraperService::class, function (MockInterface $mock) {
        $mock->shouldReceive('getUserCollection')
            ->with('xutech')
            ->once()
            ->andReturn(null);
    });

    $response = postJson('/api/user/settings/import/mangacollec', [
        'url' => 'https://www.mangacollec.com/user/xutech/collection',
    ]);

    $response->assertStatus(403)
        ->assertJsonFragment(['message' => 'Unable to fetch collection. The profile might be private or invalid.']);
});

test('successfully imports existing local volumes and tries importing missing ones', function () {
    $user = User::factory()->create();
    actingAs($user);

    // Create a local volume that matches the first imported volume by ISBN
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume1 = Volume::factory()->create([
        'edition_id' => $edition->id,
        'isbn' => '9782344071120', // volume 1 (existing)
    ]);

    $this->mock(MangaCollecScraperService::class, function (MockInterface $mock) {
        $mock->shouldReceive('getUserCollection')
            ->with('xutech')
            ->once()
            ->andReturn([
                'volumes' => [
                    [
                        'id' => 'de103e3c-79f6-4018-82eb-ad2a156f1742',
                        'isbn' => '9782344071120',
                        'edition_id' => 'ed-1',
                    ],
                    [
                        'id' => 'missing-vol-id',
                        'isbn' => '978-missing',
                        'edition_id' => 'ed-test-missing',
                    ],
                ],
                'editions' => [
                    ['id' => 'ed-test-missing', 'series_id' => 'missing-series-id'],
                ],
            ]);

        // Mock series detail fetch for the missing volume
        $mock->shouldReceive('getSeriesDetail')
            ->with('missing-series-id')
            ->once()
            ->andReturn(['title' => 'Missing Series']);
    });

    $this->mock(MangaCollecSeriesImportService::class, function (MockInterface $mock) {
        // Assert that the import service is called to import the missing series
        $mock->shouldReceive('import')
            ->with('missing-series-id', ['title' => 'Missing Series'])
            ->once();
    });

    $response = postJson('/api/user/settings/import/mangacollec', [
        'url' => 'https://www.mangacollec.com/user/xutech/collection',
    ]);

    $response->assertStatus(200)
        ->assertJson([
            'imported' => 1,
            'failed' => 1, // Since our mock of import() above doesn't actually create the missing volume
        ]);

    // Verify the existing volume was attached
    expect($user->volumes()->where('volume_id', $volume1->id)->exists())->toBeTrue();
});
