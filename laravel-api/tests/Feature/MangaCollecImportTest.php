<?php

declare(strict_types=1);

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

    // Create a local volume that matches the first imported volume by api_id
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume1 = Volume::factory()->create([
        'edition_id' => $edition->id,
        'api_id' => 'de103e3c-79f6-4018-82eb-ad2a156f1742',
    ]);

    $this->mock(MangaCollecScraperService::class, function (MockInterface $mock) {
        $mock->shouldReceive('getUserCollection')
            ->with('xutech')
            ->once()
            ->andReturn([
                'possessions' => [
                    ['volume_id' => 'de103e3c-79f6-4018-82eb-ad2a156f1742'],
                    ['volume_id' => 'missing-vol-id'],
                ],
                'box_possessions' => [
                    ['box_id' => 'missing-box-id'],
                ],
                'editions' => [
                    ['series_id' => 'missing-series-id'],
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
            'data' => [
                'imported' => 1,
                'failed' => 2, // Since our mock doesn't actually create the missing volume and box
            ],
        ]);

    // Verify the existing volume was attached
    expect($user->volumes()->where('volume_id', $volume1->id)->exists())->toBeTrue();
});

test('mangacollec import route has rate limiting', function () {
    $user = User::factory()->create();
    actingAs($user);

    $this->mock(MangaCollecScraperService::class, function (MockInterface $mock) {
        $mock->shouldReceive('getUserCollection')
            ->times(2) // Two successful calls before rate limit
            ->andReturn(['possessions' => [], 'box_possessions' => [], 'editions' => []]);
    });

    $payload = ['url' => 'https://www.mangacollec.com/user/test/collection'];

    // First attempt
    postJson('/api/user/settings/import/mangacollec', $payload)->assertSuccessful();

    // Second attempt
    postJson('/api/user/settings/import/mangacollec', $payload)->assertSuccessful();

    // Third attempt should be rate limited
    $response = postJson('/api/user/settings/import/mangacollec', $payload);

    $response->assertStatus(429);
});
