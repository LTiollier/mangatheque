<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\MangaDexLookupService;
use Illuminate\Support\Facades\Http;

test('MangaDexLookupService can be instantiated', function () {
    $service = new MangaDexLookupService;
    expect($service)->toBeInstanceOf(MangaDexLookupService::class);
});

test('search returns transformed results', function () {
    Http::fake([
        'https://api.mangadex.org/manga*' => Http::response([
            'data' => [
                [
                    'id' => 'manga-uuid-001',
                    'attributes' => [
                        'title' => ['en' => 'Naruto'],
                        'description' => ['en' => 'A ninja story'],
                        'status' => 'completed',
                        'lastVolume' => '72',
                    ],
                    'relationships' => [
                        [
                            'type' => 'author',
                            'attributes' => ['name' => 'Masashi Kishimoto'],
                        ],
                        [
                            'type' => 'cover_art',
                            'attributes' => ['fileName' => 'cover.jpg'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->search('Naruto');

    expect($result)->toHaveCount(1);
    expect($result[0]['api_id'])->toBe('manga-uuid-001');
    expect($result[0]['title'])->toBe('Naruto');
    expect($result[0]['description'])->toBe('A ninja story');
    expect($result[0]['status'])->toBe('completed');
    expect($result[0]['total_volumes'])->toBe('72');
    expect($result[0]['authors'])->toContain('Masashi Kishimoto');
    expect($result[0]['cover_url'])->toBe('https://uploads.mangadex.org/covers/manga-uuid-001/cover.jpg');
});

test('search returns empty array on API failure', function () {
    Http::fake([
        'https://api.mangadex.org/manga*' => Http::response([], 500),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->search('Naruto');

    expect($result)->toBeEmpty();
});

test('search returns empty array when data is missing', function () {
    Http::fake([
        'https://api.mangadex.org/manga*' => Http::response(['result' => 'ok'], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->search('Naruto');

    expect($result)->toBeEmpty();
});

test('findByIsbn always returns null', function () {
    $service = new MangaDexLookupService;
    $result = $service->findByIsbn('9784088728407');

    expect($result)->toBeNull();
});

test('findByApiId returns transformed result', function () {
    Http::fake([
        'https://api.mangadex.org/manga/manga-uuid-001*' => Http::response([
            'data' => [
                'id' => 'manga-uuid-001',
                'attributes' => [
                    'title' => ['fr' => 'Naruto (FR)', 'en' => 'Naruto'],
                    'description' => ['fr' => 'Une histoire de ninja'],
                    'status' => 'completed',
                    'lastVolume' => '72',
                ],
                'relationships' => [],
            ],
        ], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->findByApiId('manga-uuid-001');

    expect($result)->not->toBeNull();
    expect($result['api_id'])->toBe('manga-uuid-001');
    expect($result['title'])->toBe('Naruto (FR)');
});

test('findByApiId returns null on API failure', function () {
    Http::fake([
        'https://api.mangadex.org/manga/nonexistent*' => Http::response([], 404),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->findByApiId('nonexistent');

    expect($result)->toBeNull();
});

test('findByApiId returns null when data key is missing', function () {
    Http::fake([
        'https://api.mangadex.org/manga/manga-uuid-002*' => Http::response(['result' => 'ok'], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->findByApiId('manga-uuid-002');

    expect($result)->toBeNull();
});

test('search uses french title when available', function () {
    Http::fake([
        'https://api.mangadex.org/manga*' => Http::response([
            'data' => [
                [
                    'id' => 'manga-uuid-003',
                    'attributes' => [
                        'title' => ['fr' => 'Titre Français', 'en' => 'English Title'],
                        'description' => [],
                        'status' => 'ongoing',
                        'lastVolume' => null,
                    ],
                    'relationships' => [],
                ],
            ],
        ], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->search('test');

    expect($result[0]['title'])->toBe('Titre Français');
});

test('search handles artist relationships', function () {
    Http::fake([
        'https://api.mangadex.org/manga*' => Http::response([
            'data' => [
                [
                    'id' => 'manga-uuid-004',
                    'attributes' => [
                        'title' => ['en' => 'Test Manga'],
                        'description' => [],
                        'status' => null,
                        'lastVolume' => null,
                    ],
                    'relationships' => [
                        [
                            'type' => 'artist',
                            'attributes' => ['name' => 'Artist Name'],
                        ],
                        [
                            'type' => 'author',
                            'attributes' => ['name' => 'Artist Name'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new MangaDexLookupService;
    $result = $service->search('test');

    // array_unique should deduplicate the same author/artist name
    expect($result[0]['authors'])->toHaveCount(1);
});
