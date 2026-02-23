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
    $bibkey = 'ISBN:'.$isbn;

    Http::fake([
        'https://openlibrary.org/api/books*' => Http::response([
            $bibkey => [
                'title' => 'Naruto Vol 1',
                'authors' => [['name' => 'Masashi Kishimoto']],
                'publish_date' => '1999',
                'cover' => ['large' => 'https://example.com/cover.jpg'],
            ],
        ], 200),
    ]);

    $service = new OpenLibraryLookupService;
    $result = $service->findByIsbn($isbn);

    expect($result)->not->toBeNull()
        ->and($result['title'])->toBe('Naruto Vol 1')
        ->and($result['authors'])->toBe(['Masashi Kishimoto'])
        ->and($result['cover_url'])->toBe('https://example.com/cover.jpg');
});
