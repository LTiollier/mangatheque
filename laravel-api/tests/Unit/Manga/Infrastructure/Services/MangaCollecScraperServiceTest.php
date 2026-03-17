<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\MangaCollecScraperService;
use Illuminate\Support\Facades\Http;

test('MangaCollecScraperService can be instantiated', function () {
    $service = new MangaCollecScraperService;
    expect($service)->toBeInstanceOf(MangaCollecScraperService::class);
});

test('login returns true on successful authentication', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->login();

    expect($result)->toBeTrue();
});

test('login returns false on authentication failure', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response(['error' => 'invalid_credentials'], 401),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->login();

    expect($result)->toBeFalse();
});

test('getSeriesList returns series array after successful login', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        'https://api.mangacollec.com/v2/series' => Http::response([
            'series' => [
                ['uuid' => 'uuid-1', 'title' => 'Naruto'],
                ['uuid' => 'uuid-2', 'title' => 'Dragon Ball'],
            ],
        ], 200),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesList();

    expect($result)->toHaveCount(2);
    expect($result[0]['title'])->toBe('Naruto');
    expect($result[1]['title'])->toBe('Dragon Ball');
});

test('getSeriesList returns empty array when login fails', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response(['error' => 'invalid_credentials'], 401),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesList();

    expect($result)->toBeEmpty();
});

test('getSeriesList returns empty array when series endpoint fails', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        'https://api.mangacollec.com/v2/series' => Http::response([], 500),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesList();

    expect($result)->toBeEmpty();
});

test('getSeriesDetail returns series details after successful login', function () {
    $uuid = 'series-uuid-001';

    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        "https://api.mangacollec.com/v2/series/{$uuid}" => Http::response([
            'uuid' => $uuid,
            'title' => 'Naruto',
            'volumes' => [
                ['uuid' => 'vol-1', 'title' => 'Tome 1'],
            ],
        ], 200),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesDetail($uuid);

    expect($result)->not->toBeNull();
    expect($result['uuid'])->toBe($uuid);
    expect($result['title'])->toBe('Naruto');
});

test('getSeriesDetail returns null when login fails', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response(['error' => 'invalid_credentials'], 401),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesDetail('some-uuid');

    expect($result)->toBeNull();
});

test('getSeriesDetail returns null when series detail endpoint fails', function () {
    $uuid = 'series-uuid-002';

    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        "https://api.mangacollec.com/v2/series/{$uuid}" => Http::response([], 404),
    ]);

    $service = new MangaCollecScraperService;
    $result = $service->getSeriesDetail($uuid);

    expect($result)->toBeNull();
});

test('getSeriesList uses cached token without logging in again', function () {
    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        'https://api.mangacollec.com/v2/series' => Http::response([
            'series' => [['uuid' => 'uuid-1', 'title' => 'Naruto']],
        ], 200),
    ]);

    $service = new MangaCollecScraperService;
    $service->login();

    // Second call - series list call should work since token is cached
    $result = $service->getSeriesList();

    expect($result)->toHaveCount(1);

    // Verify login was only called once (the token request)
    Http::assertSentCount(2); // one login + one series list
});

test('getSeriesDetail uses cached token without logging in again', function () {
    $uuid = 'series-uuid-003';

    Http::fake([
        'https://api.mangacollec.com/oauth/token' => Http::response([
            'access_token' => 'fake-token-abc123',
        ], 200),
        "https://api.mangacollec.com/v2/series/{$uuid}" => Http::response([
            'uuid' => $uuid,
            'title' => 'One Piece',
        ], 200),
    ]);

    $service = new MangaCollecScraperService;
    $service->login();

    $result = $service->getSeriesDetail($uuid);

    expect($result)->not->toBeNull();
    expect($result['title'])->toBe('One Piece');

    // Verify login was only called once
    Http::assertSentCount(2); // one login + one detail
});
