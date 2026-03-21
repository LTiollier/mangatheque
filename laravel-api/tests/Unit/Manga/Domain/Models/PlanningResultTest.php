<?php

use App\Manga\Domain\Models\PlanningItem;
use App\Manga\Domain\Models\PlanningResult;

test('planning result returns correct values', function () {
    $item = new PlanningItem(
        id: 1,
        type: 'volume',
        title: 'Test',
        number: '1',
        coverUrl: null,
        releaseDate: '2026-04-01',
        seriesId: 1,
        seriesTitle: 'Test Series',
        editionId: 1,
        editionTitle: 'Standard',
        isOwned: false,
        isWishlisted: false,
    );

    $result = new PlanningResult(
        items: [$item],
        total: 87,
        perPage: 24,
        nextCursor: 'eyJpZCI6NDJ9',
        hasMore: true,
    );

    expect($result->getItems())->toBe([$item])
        ->and($result->getTotal())->toBe(87)
        ->and($result->getPerPage())->toBe(24)
        ->and($result->getNextCursor())->toBe('eyJpZCI6NDJ9')
        ->and($result->hasMore())->toBeTrue();
});

test('planning result with no more pages', function () {
    $result = new PlanningResult(
        items: [],
        total: 0,
        perPage: 24,
        nextCursor: null,
        hasMore: false,
    );

    expect($result->getItems())->toBe([])
        ->and($result->getTotal())->toBe(0)
        ->and($result->getNextCursor())->toBeNull()
        ->and($result->hasMore())->toBeFalse();
});
