<?php

use App\Manga\Domain\Models\Series;

test('series model can be instantiated and returns correct values', function () {
    $series = new Series(
        id: 1,
        api_id: 'api123',
        title: 'Naruto',
        authors: ['Masashi Kishimoto'],
        description: 'A great manga',
        status: 'Finished',
        total_volumes: 72,
        cover_url: 'http://example.com/cover.jpg'
    );

    expect($series->getId())->toBe(1)
        ->and($series->getApiId())->toBe('api123')
        ->and($series->getTitle())->toBe('Naruto')
        ->and($series->getAuthors())->toBe(['Masashi Kishimoto'])
        ->and($series->getDescription())->toBe('A great manga')
        ->and($series->getStatus())->toBe('Finished')
        ->and($series->getTotalVolumes())->toBe(72)
        ->and($series->getCoverUrl())->toBe('http://example.com/cover.jpg');
});
