<?php

use App\ReadingProgress\Domain\Models\ReadingProgress;

test('exposes correct getters', function () {
    $readAt = new DateTimeImmutable('2024-01-15 10:00:00');
    $progress = new ReadingProgress(id: 1, userId: 3, volumeId: 7, readAt: $readAt);

    expect($progress->getId())->toBe(1)
        ->and($progress->getUserId())->toBe(3)
        ->and($progress->getVolumeId())->toBe(7)
        ->and($progress->getReadAt())->toBe($readAt);
});

test('allows null id for unsaved instances', function () {
    $progress = new ReadingProgress(id: null, userId: 1, volumeId: 2, readAt: new DateTimeImmutable);

    expect($progress->getId())->toBeNull();
});
