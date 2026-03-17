<?php

namespace Tests\Unit\Manga\Infrastructure\Mappers;

use App\Manga\Domain\Models\Box;
use App\Manga\Infrastructure\EloquentModels\Box as EloquentBox;
use App\Manga\Infrastructure\Mappers\BoxMapper;

test('BoxMapper toDomain maps all fields', function () {
    $eloquent = new EloquentBox;
    $eloquent->id = 1;
    $eloquent->box_set_id = 2;
    $eloquent->title = 'Naruto Box 1';
    $eloquent->number = '1';
    $eloquent->isbn = '9784088728407';
    $eloquent->api_id = 'api-uuid-box-1';
    $eloquent->release_date = '2024-01-15';
    $eloquent->cover_url = 'https://example.com/box-cover.jpg';
    $eloquent->is_empty = false;

    $domain = BoxMapper::toDomain($eloquent);

    expect($domain)->toBeInstanceOf(Box::class);
    expect($domain->getId())->toBe(1);
    expect($domain->getBoxSetId())->toBe(2);
    expect($domain->getTitle())->toBe('Naruto Box 1');
    expect($domain->getNumber())->toBe('1');
    expect($domain->getIsbn())->toBe('9784088728407');
    expect($domain->getApiId())->toBe('api-uuid-box-1');
    expect($domain->getReleaseDate())->toBe('2024-01-15');
    expect($domain->getCoverUrl())->toBe('https://example.com/box-cover.jpg');
    expect($domain->isEmpty())->toBeFalse();
});

test('BoxMapper toDomain maps nullable fields as null', function () {
    $eloquent = new EloquentBox;
    $eloquent->id = 5;
    $eloquent->box_set_id = 3;
    $eloquent->title = 'Empty Box';
    $eloquent->number = null;
    $eloquent->isbn = null;
    $eloquent->api_id = null;
    $eloquent->release_date = null;
    $eloquent->cover_url = null;
    $eloquent->is_empty = true;

    $domain = BoxMapper::toDomain($eloquent);

    expect($domain)->toBeInstanceOf(Box::class);
    expect($domain->getId())->toBe(5);
    expect($domain->getBoxSetId())->toBe(3);
    expect($domain->getTitle())->toBe('Empty Box');
    expect($domain->getNumber())->toBeNull();
    expect($domain->getIsbn())->toBeNull();
    expect($domain->getApiId())->toBeNull();
    expect($domain->getReleaseDate())->toBeNull();
    expect($domain->getCoverUrl())->toBeNull();
    expect($domain->isEmpty())->toBeTrue();
});
