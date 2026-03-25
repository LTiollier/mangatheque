<?php

declare(strict_types=1);

namespace Tests\Unit\Manga\Infrastructure\Mappers;

use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Mappers\VolumeMapper;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('is_last_volume is true when number matches lastVolumeNumber passed explicitly', function () {
    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => '10', 'title' => 'Vol 10']);
    $eloquent->id = 1;

    $domain = VolumeMapper::toDomain($eloquent, lastVolumeNumber: 10);

    expect($domain->isLastVolume())->toBeTrue();
});

test('is_last_volume is false when number does not match lastVolumeNumber', function () {
    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => '9', 'title' => 'Vol 9']);
    $eloquent->id = 1;

    $domain = VolumeMapper::toDomain($eloquent, lastVolumeNumber: 10);

    expect($domain->isLastVolume())->toBeFalse();
});

test('is_last_volume is false when lastVolumeNumber is null', function () {
    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => '10', 'title' => 'Vol 10']);
    $eloquent->id = 1;

    $domain = VolumeMapper::toDomain($eloquent, lastVolumeNumber: null);

    expect($domain->isLastVolume())->toBeFalse();
});

test('is_last_volume is false when number is null', function () {
    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => null, 'title' => 'Vol sans numéro']);
    $eloquent->id = 1;

    $domain = VolumeMapper::toDomain($eloquent, lastVolumeNumber: 10);

    expect($domain->isLastVolume())->toBeFalse();
});

test('is_last_volume is false for non-numeric volume numbers', function () {
    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => 'HS1', 'title' => 'Hors-Série']);
    $eloquent->id = 1;

    $domain = VolumeMapper::toDomain($eloquent, lastVolumeNumber: 0);

    expect($domain->isLastVolume())->toBeFalse();
});

test('is_last_volume resolves from loaded edition relation when no explicit lastVolumeNumber', function () {
    $edition = new EloquentEdition(['series_id' => 1, 'name' => 'Standard', 'last_volume_number' => 5]);
    $edition->id = 1;

    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => '5', 'title' => 'Vol 5']);
    $eloquent->id = 1;
    $eloquent->setRelation('edition', $edition);

    $domain = VolumeMapper::toDomain($eloquent);

    expect($domain->isLastVolume())->toBeTrue();
});

test('is_last_volume is false when loaded edition has null last_volume_number', function () {
    $edition = new EloquentEdition(['series_id' => 1, 'name' => 'Standard', 'last_volume_number' => null]);
    $edition->id = 1;

    $eloquent = new EloquentVolume(['edition_id' => 1, 'number' => '5', 'title' => 'Vol 5']);
    $eloquent->id = 1;
    $eloquent->setRelation('edition', $edition);

    $domain = VolumeMapper::toDomain($eloquent);

    expect($domain->isLastVolume())->toBeFalse();
});
