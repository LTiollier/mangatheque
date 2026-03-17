<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateBoxDTO;
use App\Manga\Domain\Models\Box;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Repositories\EloquentBoxRepository;

test('findByApiId returns box when found', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
    EloquentBox::create([
        'box_set_id' => $boxSet->id,
        'title' => 'Test Box',
        'api_id' => 'box-api-uuid-001',
        'is_empty' => false,
    ]);

    $repo = new EloquentBoxRepository;
    $result = $repo->findByApiId('box-api-uuid-001');

    expect($result)->toBeInstanceOf(Box::class);
    expect($result->getApiId())->toBe('box-api-uuid-001');
    expect($result->getTitle())->toBe('Test Box');
});

test('findByApiId returns null when not found', function () {
    $repo = new EloquentBoxRepository;
    $result = $repo->findByApiId('nonexistent-uuid');

    expect($result)->toBeNull();
});

test('findByIsbn returns box when found', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
    EloquentBox::create([
        'box_set_id' => $boxSet->id,
        'title' => 'ISBN Box',
        'isbn' => '9784088728407',
        'is_empty' => false,
    ]);

    $repo = new EloquentBoxRepository;
    $result = $repo->findByIsbn('9784088728407');

    expect($result)->toBeInstanceOf(Box::class);
    expect($result->getIsbn())->toBe('9784088728407');
    expect($result->getTitle())->toBe('ISBN Box');
});

test('findByIsbn returns null when not found', function () {
    $repo = new EloquentBoxRepository;
    $result = $repo->findByIsbn('0000000000000');

    expect($result)->toBeNull();
});

test('create creates a box in the database', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);

    $dto = new CreateBoxDTO(
        boxSetId: $boxSet->id,
        title: 'Naruto Collector Box',
        number: '1',
        isbn: '9784088728408',
        apiId: 'box-api-uuid-002',
        releaseDate: '2024-03-01',
        coverUrl: 'https://example.com/cover.jpg',
        isEmpty: false,
    );

    $repo = new EloquentBoxRepository;
    $result = $repo->create($dto);

    expect($result)->toBeInstanceOf(Box::class);
    expect($result->getTitle())->toBe('Naruto Collector Box');
    expect($result->getNumber())->toBe('1');
    expect($result->getIsbn())->toBe('9784088728408');
    expect($result->getApiId())->toBe('box-api-uuid-002');
    expect($result->getReleaseDate())->toBe('2024-03-01');
    expect($result->getCoverUrl())->toBe('https://example.com/cover.jpg');
    expect($result->isEmpty())->toBeFalse();
    expect($result->getBoxSetId())->toBe($boxSet->id);
    expect(EloquentBox::find($result->getId()))->not->toBeNull();
});

test('create creates a box with minimal data', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);

    $dto = new CreateBoxDTO(
        boxSetId: $boxSet->id,
        title: 'Minimal Box',
    );

    $repo = new EloquentBoxRepository;
    $result = $repo->create($dto);

    expect($result)->toBeInstanceOf(Box::class);
    expect($result->getTitle())->toBe('Minimal Box');
    expect($result->getNumber())->toBeNull();
    expect($result->getIsbn())->toBeNull();
    expect($result->getApiId())->toBeNull();
    expect($result->isEmpty())->toBeFalse();
});

test('attachVolumes attaches volumes to a box', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
    $box = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Test Box', 'is_empty' => false]);

    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume1 = EloquentVolume::create(['edition_id' => $edition->id, 'title' => 'Vol 1', 'number' => 1]);
    $volume2 = EloquentVolume::create(['edition_id' => $edition->id, 'title' => 'Vol 2', 'number' => 2]);

    $repo = new EloquentBoxRepository;
    $repo->attachVolumes($box->id, [$volume1->id, $volume2->id]);

    $box->refresh();
    expect($box->volumes)->toHaveCount(2);
    expect($box->volumes->contains($volume1))->toBeTrue();
    expect($box->volumes->contains($volume2))->toBeTrue();
});

test('attachVolumes does not create duplicates', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    $boxSet = EloquentBoxSet::create(['series_id' => $series->id, 'title' => 'Test BoxSet']);
    $box = EloquentBox::create(['box_set_id' => $boxSet->id, 'title' => 'Test Box', 'is_empty' => false]);

    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $volume = EloquentVolume::create(['edition_id' => $edition->id, 'title' => 'Vol 1', 'number' => 1]);

    $repo = new EloquentBoxRepository;
    $repo->attachVolumes($box->id, [$volume->id]);
    $repo->attachVolumes($box->id, [$volume->id]);

    $box->refresh();
    expect($box->volumes)->toHaveCount(1);
});

test('attachVolumes does nothing when box does not exist', function () {
    $repo = new EloquentBoxRepository;
    // Should not throw an exception
    $repo->attachVolumes(99999, [1, 2]);

    expect(true)->toBeTrue();
});
