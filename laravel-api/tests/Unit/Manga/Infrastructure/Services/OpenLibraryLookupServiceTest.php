<?php

namespace Tests\Unit\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\Services\OpenLibraryLookupService;
use Illuminate\Support\Facades\Http;

test('it searches for books on OpenLibrary', function () {
    Http::fake([
        'https://openlibrary.org/search.json*' => Http::response([
            'docs' => [
                [
                    'key' => '/works/OL123W',
                    'title' => 'Naruto',
                    'author_name' => ['Masashi Kishimoto'],
                    'isbn' => ['9784088728407'],
                    'first_publish_year' => 1999,
                ],
            ],
        ], 200),
    ]);

    $service = new OpenLibraryLookupService;
    $results = $service->search('Naruto');

    expect($results)->toHaveCount(1)
        ->and($results[0]['title'])->toBe('Naruto')
        ->and($results[0]['authors'])->toBe(['Masashi Kishimoto'])
        ->and($results[0]['isbn'])->toBe('9784088728407');
});

test('it finds a book by ISBN on OpenLibrary', function () {
    $isbn = '9784088728407';
    $bibkey = 'ISBN:' . $isbn;

    Http::fake([
        'https://openlibrary.org/api/books*' => Http::response([
            $bibkey => [
                'title' => 'Naruto Vol 1',
                'authors' => [['name' => 'Masashi Kishimoto']],
                'publish_date' => '1999',
                'number_of_pages' => 200,
                'cover' => ['large' => 'https://example.com/cover.jpg'],
            ],
        ], 200),
    ]);

    $service = new OpenLibraryLookupService;
    $result = $service->findByIsbn($isbn);

    expect($result)->not->toBeNull()
        ->and($result['title'])->toBe('Naruto Vol 1')
        ->and($result['authors'])->toBe(['Masashi Kishimoto'])
        ->and($result['cover_url'])->toBe('https://example.com/cover.jpg')
        ->and($result['page_count'])->toBe(200);
});

test('it finds a book by API ID on OpenLibrary', function () {
    $isbn = '9784088728407';
    $bibkey = 'ISBN:' . $isbn;

    Http::fake([
        'https://openlibrary.org/api/books*' => Http::response([
            $bibkey => [
                'title' => 'Naruto Vol 1',
                'authors' => [['name' => 'Masashi Kishimoto']],
            ],
        ], 200),
    ]);

    $service = new OpenLibraryLookupService;
    // For OpenLibrary, findByApiId calls findByIsbn
    $result = $service->findByApiId($isbn);

    expect($result)->not->toBeNull()
        ->and($result['title'])->toBe('Naruto Vol 1');
});

test('it handles search failure on OpenLibrary', function () {
    Http::fake([
        'https://openlibrary.org/search.json*' => Http::response([], 500),
    ]);

    $service = new OpenLibraryLookupService;
    $results = $service->search('Naruto');

    expect($results)->toBeEmpty();
});

test('it handles empty search results on OpenLibrary', function () {
    Http::fake([
        'https://openlibrary.org/search.json*' => Http::response(['docs' => []], 200),
    ]);

    $service = new OpenLibraryLookupService;
    $results = $service->search('Unknown');

    expect($results)->toBeEmpty();
});

test('it handles ISBN lookup failure on OpenLibrary', function () {
    Http::fake([
        'https://openlibrary.org/api/books*' => Http::response([], 500),
    ]);

    $service = new OpenLibraryLookupService;
    $result = $service->findByIsbn('9784088728407');

    expect($result)->toBeNull();
});

test('it handles invalid ISBNs for lookup', function () {
    $service = new OpenLibraryLookupService;
    $result = $service->findByIsbn('invalid');

    expect($result)->toBeNull();
});
