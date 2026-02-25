<?php

use App\Manga\Domain\Models\Edition;
use App\Manga\Domain\Models\Series;
use App\Manga\Domain\Models\Volume;

test('volume model can be instantiated and returns correct values', function () {
    $edition = new Edition(1, 10, 'Standard', 'Kana', 'fr', 20);
    $series = new Series(10, 'api-series', 'Naruto', ['Kishi'], 'desc', 'Ongoing', 72, 'url');

    $volume = new Volume(
        id: 1,
        edition_id: 2,
        api_id: 'api123',
        isbn: '9781234567890',
        number: '1',
        title: 'Naruto Vol. 1',
        authors: ['Masashi Kishimoto'],
        description: 'First volume',
        published_date: '2000-01-01',
        page_count: 200,
        cover_url: 'http://example.com/volume1.jpg',
        edition: $edition,
        series: $series
    );

    expect($volume->getId())->toBe(1)
        ->and($volume->getEditionId())->toBe(2)
        ->and($volume->getApiId())->toBe('api123')
        ->and($volume->getIsbn())->toBe('9781234567890')
        ->and($volume->getNumber())->toBe('1')
        ->and($volume->getTitle())->toBe('Naruto Vol. 1')
        ->and($volume->getAuthors())->toBe(['Masashi Kishimoto'])
        ->and($volume->getDescription())->toBe('First volume')
        ->and($volume->getPublishedDate())->toBe('2000-01-01')
        ->and($volume->getPageCount())->toBe(200)
        ->and($volume->getCoverUrl())->toBe('http://example.com/volume1.jpg')
        ->and($volume->getEdition())->toBe($edition)
        ->and($volume->getSeries())->toBe($series)
        ->and($volume->isOwned())->toBeFalse()
        ->and($volume->isLoaned())->toBeFalse()
        ->and($volume->getLoanedTo())->toBeNull();
});

test('volume model can be instantiated with ownership and loan flags', function () {
    $volume = new Volume(
        id: 2,
        edition_id: 1,
        api_id: null,
        isbn: '1234567890123',
        number: '2',
        title: 'Bleach Vol. 2',
        authors: ['Kubo'],
        description: null,
        published_date: null,
        page_count: null,
        cover_url: null,
        isOwned: true,
        isLoaned: true,
        loanedTo: 'John',
    );

    expect($volume->isOwned())->toBeTrue()
        ->and($volume->isLoaned())->toBeTrue()
        ->and($volume->getLoanedTo())->toBe('John');
});
