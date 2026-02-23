<?php

use App\Manga\Domain\Events\VolumeAddedToCollection;
use App\Manga\Domain\Models\Volume;

test('VolumeAddedToCollection event stores volume and userId', function () {
    $volume = new Volume(
        id: 1,
        edition_id: 2,
        api_id: 'api123',
        isbn: '123456',
        number: '1',
        title: 'Title',
        authors: ['Author'],
        description: null,
        published_date: null,
        page_count: null,
        cover_url: null
    );

    $userId = 42;
    $event = new VolumeAddedToCollection($volume, $userId);

    expect($event->volume)->toBe($volume)
        ->and($event->userId)->toBe($userId);
});
