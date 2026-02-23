<?php

namespace Tests\Unit\Manga\Infrastructure\Repositories;

use App\Manga\Domain\Models\Volume;
use App\Manga\Infrastructure\EloquentModels\Edition as EloquentEdition;
use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;
use App\Manga\Infrastructure\Repositories\EloquentVolumeRepository;
use App\User\Infrastructure\EloquentModels\User as EloquentUser;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

test('findByApiId returns volume', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'api_id' => 'api123', 'number' => '1', 'title' => 'Test 1']);

    $repo = new EloquentVolumeRepository;
    $result = $repo->findByApiId('api123');

    expect($result)->toBeInstanceOf(Volume::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('findByEditionAndNumber returns volume', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'number' => '2', 'title' => 'Test 2']);

    $repo = new EloquentVolumeRepository;
    $result = $repo->findByEditionAndNumber($edition->id, '2');

    expect($result)->toBeInstanceOf(Volume::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('findByEditionId returns volumes', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'number' => '3', 'title' => 'Test 3']);

    $repo = new EloquentVolumeRepository;
    $result = $repo->findByEditionId($edition->id);

    expect($result)->toHaveCount(1);
    expect($result[0])->toBeInstanceOf(Volume::class);
    expect($result[0]->getId())->toBe($eloquent->id);
});

test('findByIsbn returns volume', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'isbn' => '123456', 'number' => '4', 'title' => 'Test 4']);

    $repo = new EloquentVolumeRepository;
    $result = $repo->findByIsbn('123456');

    expect($result)->toBeInstanceOf(Volume::class);
    expect($result->getId())->toBe($eloquent->id);
});

test('attachToUser and detachFromUser works', function () {
    $user = EloquentUser::factory()->create();
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'isbn' => '123456', 'number' => '4', 'title' => 'Test 4']);

    $repo = new EloquentVolumeRepository;
    $repo->attachToUser($eloquent->id, $user->id);

    expect($user->volumes()->count())->toBe(1);

    $repo->detachFromUser($eloquent->id, $user->id);
    expect($user->volumes()->count())->toBe(0);
});

test('detachSeriesFromUser works', function () {
    $user = EloquentUser::factory()->create();
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'isbn' => '123456', 'number' => '4', 'title' => 'Test 4']);

    $repo = new EloquentVolumeRepository;
    $repo->attachToUser($eloquent->id, $user->id);

    expect($user->volumes()->count())->toBe(1);

    $repo->detachSeriesFromUser($series->id, $user->id);
    expect($user->volumes()->count())->toBe(0);
});

test('create works', function () {
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);

    $repo = new EloquentVolumeRepository;
    $result = $repo->create([
        'edition_id' => $edition->id,
        'number' => '5',
        'title' => 'Test 5',
    ]);

    expect($result)->toBeInstanceOf(Volume::class);
    expect($result->getNumber())->toBe('5');
});

test('findByUserId works', function () {
    $user = EloquentUser::factory()->create();
    $series = EloquentSeries::create(['title' => 'Test', 'authors' => ['Test']]);
    $edition = EloquentEdition::create(['series_id' => $series->id, 'name' => 'Standard', 'language' => 'fr']);
    $eloquent = EloquentVolume::create(['edition_id' => $edition->id, 'number' => '4', 'title' => 'Test 4']);

    $repo = new EloquentVolumeRepository;
    $repo->attachToUser($eloquent->id, $user->id);

    $result = $repo->findByUserId($user->id);

    expect($result)->toHaveCount(1);
    expect($result[0]->getId())->toBe($eloquent->id);
});
