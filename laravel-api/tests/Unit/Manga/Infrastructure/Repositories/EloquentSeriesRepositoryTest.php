<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Application\DTOs\CreateSeriesDTO;
use App\Manga\Domain\Models\Series;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Repositories\EloquentSeriesRepository;

test('findById returns series', function () {
    $eloquent = EloquentSeries::create(['title' => 'Test Series', 'authors' => 'Test']);

    $repo = new EloquentSeriesRepository;
    $result = $repo->findById($eloquent->id);

    expect($result)->toBeInstanceOf(Series::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('findByApiId returns series', function () {
    $eloquent = EloquentSeries::create(['title' => 'Test Series', 'api_id' => 'api123', 'authors' => 'Test']);

    $repo = new EloquentSeriesRepository;
    $result = $repo->findByApiId('api123');

    expect($result)->toBeInstanceOf(Series::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('creates a series', function () {
    $repo = new EloquentSeriesRepository;
    $result = $repo->create(new CreateSeriesDTO('Test Series', 'Test'));

    expect($result)->toBeInstanceOf(Series::class);
    expect($result->getTitle())->toBe('Test Series');
    expect(EloquentSeries::find($result->getId()))->not->toBeNull();
});
