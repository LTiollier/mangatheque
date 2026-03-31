<?php

declare(strict_types=1);

use App\Manga\Infrastructure\EloquentModels\Edition;
use App\Manga\Infrastructure\EloquentModels\Series;
use App\Manga\Infrastructure\EloquentModels\Volume;
use App\ReadingProgress\Domain\Models\ReadingProgress;
use App\ReadingProgress\Infrastructure\EloquentModels\UserVolume as EloquentReadingProgress;
use App\ReadingProgress\Infrastructure\Repositories\EloquentReadingProgressRepository;
use App\User\Infrastructure\EloquentModels\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('saves reading progress and returns domain model', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id]);

    $readAt = new DateTimeImmutable('2024-01-15 10:00:00');
    $domain = new ReadingProgress(id: null, userId: $user->id, volumeId: $volume->id, readAt: $readAt);

    $repository = new EloquentReadingProgressRepository;
    $result = $repository->save($domain);

    expect($result->getId())->toBeNull()
        ->and($result->getUserId())->toBe($user->id)
        ->and($result->getVolumeId())->toBe($volume->id);
});

test('finds reading progress by user and volume', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id]);

    EloquentReadingProgress::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'read_at' => now(),
    ]);

    $repository = new EloquentReadingProgressRepository;
    $result = $repository->findByUserIdAndVolumeId($user->id, $volume->id);

    expect($result)->not->toBeNull()
        ->and($result->getUserId())->toBe($user->id);
});

test('returns null when no reading progress found', function () {
    $repository = new EloquentReadingProgressRepository;
    $result = $repository->findByUserIdAndVolumeId(999, 999);

    expect($result)->toBeNull();
});

test('deletes reading progress by user and volume', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume = Volume::factory()->create(['edition_id' => $edition->id]);

    EloquentReadingProgress::create([
        'user_id' => $user->id,
        'volume_id' => $volume->id,
        'read_at' => now(),
    ]);

    $repository = new EloquentReadingProgressRepository;
    $repository->deleteByUserIdAndVolumeId($user->id, $volume->id);

    expect($repository->findByUserIdAndVolumeId($user->id, $volume->id))->toBeNull();
});

test('finds all reading progress for user', function () {
    $user = User::factory()->create();
    $series = Series::factory()->create();
    $edition = Edition::factory()->create(['series_id' => $series->id]);
    $volume1 = Volume::factory()->create(['edition_id' => $edition->id]);
    $volume2 = Volume::factory()->create(['edition_id' => $edition->id]);

    EloquentReadingProgress::create(['user_id' => $user->id, 'volume_id' => $volume1->id, 'read_at' => now()]);
    EloquentReadingProgress::create(['user_id' => $user->id, 'volume_id' => $volume2->id, 'read_at' => now()]);

    $repository = new EloquentReadingProgressRepository;
    $result = $repository->findAllByUserId($user->id);

    expect($result)->toHaveCount(2);
});
