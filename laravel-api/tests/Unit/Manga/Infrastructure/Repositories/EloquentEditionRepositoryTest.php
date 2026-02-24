<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Edition;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\Repositories\EloquentEditionRepository;

test('findById returns edition', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $eloquent = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $repo = new EloquentEditionRepository;
    $result = $repo->findById($eloquent->id);

    expect($result)->toBeInstanceOf(Edition::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('findByNameAndSeries returns edition', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $eloquent = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $repo = new EloquentEditionRepository;
    $result = $repo->findByNameAndSeries('Standard', $series->id);

    expect($result)->toBeInstanceOf(Edition::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('findBySeriesId returns editions', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $eloquent = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $repo = new EloquentEditionRepository;
    $result = $repo->findBySeriesId($series->id);

    expect($result)->toHaveCount(1);
    expect($result[0])->toBeInstanceOf(Edition::class);
    expect($result[0]->getId())->toBe($eloquent->id);
});

test('creates an edition', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);

    $repo = new EloquentEditionRepository;
    $result = $repo->create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    expect($result)->toBeInstanceOf(Edition::class);
    expect($result->getName())->toBe('Standard');
    expect(EloquentEdition::find($result->getId()))->not->toBeNull();
});
