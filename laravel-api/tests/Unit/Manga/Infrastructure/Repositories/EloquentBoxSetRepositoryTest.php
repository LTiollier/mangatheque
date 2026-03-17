<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateBoxSetDTO;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Repositories\EloquentBoxSetRepository;

test('findByApiId returns box set when found', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);
    EloquentBoxSet::create([
        'series_id' => $series->id,
        'title' => 'Naruto Box Set 1',
        'api_id' => 'boxset-api-uuid-001',
        'publisher' => 'Kana',
    ]);

    $repo = new EloquentBoxSetRepository;
    $result = $repo->findByApiId('boxset-api-uuid-001');

    expect($result)->toBeInstanceOf(BoxSet::class);
    expect($result->getApiId())->toBe('boxset-api-uuid-001');
    expect($result->getTitle())->toBe('Naruto Box Set 1');
});

test('findByApiId returns null when not found', function () {
    $repo = new EloquentBoxSetRepository;
    $result = $repo->findByApiId('nonexistent-uuid');

    expect($result)->toBeNull();
});

test('create creates a box set in the database', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);

    $dto = new CreateBoxSetDTO(
        seriesId: $series->id,
        title: 'Dragon Ball Box Set',
        publisher: 'Glenat',
        apiId: 'boxset-api-uuid-002',
    );

    $repo = new EloquentBoxSetRepository;
    $result = $repo->create($dto);

    expect($result)->toBeInstanceOf(BoxSet::class);
    expect($result->getTitle())->toBe('Dragon Ball Box Set');
    expect($result->getPublisher())->toBe('Glenat');
    expect($result->getApiId())->toBe('boxset-api-uuid-002');
    expect($result->getSeriesId())->toBe($series->id);
    expect(EloquentBoxSet::find($result->getId()))->not->toBeNull();
});

test('create creates a box set with minimal data', function () {
    $series = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Author']);

    $dto = new CreateBoxSetDTO(
        seriesId: $series->id,
        title: 'Minimal Box Set',
    );

    $repo = new EloquentBoxSetRepository;
    $result = $repo->create($dto);

    expect($result)->toBeInstanceOf(BoxSet::class);
    expect($result->getTitle())->toBe('Minimal Box Set');
    expect($result->getPublisher())->toBeNull();
    expect($result->getApiId())->toBeNull();
});
