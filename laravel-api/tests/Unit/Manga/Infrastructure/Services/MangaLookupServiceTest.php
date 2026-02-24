<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\MangaLookupService;
use Illuminate\Support\Facades\Http;

test('search returns transformed data', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes*' => Http::response([
            'items' => [
                [
                    'id' => 'api123',
                    'volumeInfo' => [
                        'title' => 'Naruto',
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new MangaLookupService;
    $result = $service->search('Naruto');

    expect($result)->toHaveCount(1);
    expect($result[0]['api_id'])->toBe('api123');
    expect($result[0]['title'])->toBe('Naruto');
});

test('findByIsbn returns transformed data', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes*' => Http::response([
            'items' => [
                [
                    'id' => 'api123',
                    'volumeInfo' => [
                        'title' => 'Naruto',
                        'industryIdentifiers' => [
                            ['type' => 'ISBN_13', 'identifier' => '1234567890123'],
                        ],
                    ],
                ],
            ],
        ], 200),
    ]);

    $service = new MangaLookupService;
    $result = $service->findByIsbn('1234567890123');

    expect($result)->not->toBeNull();
    expect($result['api_id'])->toBe('api123');
    expect($result['isbn'])->toBe('1234567890123');
});

test('findByApiId returns transformed data', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes/api123' => Http::response([
            'id' => 'api123',
            'volumeInfo' => [
                'title' => 'Naruto',
            ],
        ], 200),
    ]);

    $service = new MangaLookupService;
    $result = $service->findByApiId('api123');

    expect($result)->not->toBeNull();
    expect($result['api_id'])->toBe('api123');
});

test('search handles API failure', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes*' => Http::response([], 500),
    ]);

    $service = new MangaLookupService;
    $result = $service->search('Naruto');

    expect($result)->toBeEmpty();
});

test('findByIsbn handles API failure', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes*' => Http::response([], 500),
    ]);

    $service = new MangaLookupService;
    $result = $service->findByIsbn('1234567890123');

    expect($result)->toBeNull();
});

test('findByApiId handles API failure', function () {
    Http::fake([
        'https://www.googleapis.com/books/v1/volumes/api123' => Http::response([], 500),
    ]);

    $service = new MangaLookupService;
    $result = $service->findByApiId('api123');

    expect($result)->toBeNull();
});
