<?php

namespace Tests\Unit\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\BoxSet;
use App\Manga\Infrastructure\EloquentModels\BoxSet as EloquentBoxSet;
use App\Manga\Infrastructure\Mappers\BoxSetMapper;

test('BoxSetMapper toDomain maps all fields', function () {
    $eloquent = new EloquentBoxSet;
    $eloquent->id = 1;
    $eloquent->series_id = 2;
    $eloquent->title = 'Naruto Box Set 1';
    $eloquent->publisher = 'Kana';
    $eloquent->api_id = 'api-uuid-boxset-1';

    $domain = BoxSetMapper::toDomain($eloquent);

    expect($domain)->toBeInstanceOf(BoxSet::class);
    expect($domain->getId())->toBe(1);
    expect($domain->getSeriesId())->toBe(2);
    expect($domain->getTitle())->toBe('Naruto Box Set 1');
    expect($domain->getPublisher())->toBe('Kana');
    expect($domain->getApiId())->toBe('api-uuid-boxset-1');
});

test('BoxSetMapper toDomain maps nullable fields as null', function () {
    $eloquent = new EloquentBoxSet;
    $eloquent->id = 3;
    $eloquent->series_id = 4;
    $eloquent->title = 'Minimal BoxSet';
    $eloquent->publisher = null;
    $eloquent->api_id = null;

    $domain = BoxSetMapper::toDomain($eloquent);

    expect($domain)->toBeInstanceOf(BoxSet::class);
    expect($domain->getId())->toBe(3);
    expect($domain->getSeriesId())->toBe(4);
    expect($domain->getTitle())->toBe('Minimal BoxSet');
    expect($domain->getPublisher())->toBeNull();
    expect($domain->getApiId())->toBeNull();
});
