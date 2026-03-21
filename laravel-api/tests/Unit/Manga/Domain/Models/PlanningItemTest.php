<?php

use App\Manga\Domain\Models\PlanningItem;

test('planning item returns correct values', function () {
    $item = new PlanningItem(
        id: 42,
        type: 'volume',
        title: 'Berserk T42',
        number: '42',
        coverUrl: 'https://example.com/cover.jpg',
        releaseDate: '2026-04-02',
        seriesId: 7,
        seriesTitle: 'Berserk',
        editionId: 3,
        editionTitle: 'Edition Originale',
        isOwned: false,
        isWishlisted: true,
    );

    expect($item->getId())->toBe(42)
        ->and($item->getType())->toBe('volume')
        ->and($item->getTitle())->toBe('Berserk T42')
        ->and($item->getNumber())->toBe('42')
        ->and($item->getCoverUrl())->toBe('https://example.com/cover.jpg')
        ->and($item->getReleaseDate())->toBe('2026-04-02')
        ->and($item->getSeriesId())->toBe(7)
        ->and($item->getSeriesTitle())->toBe('Berserk')
        ->and($item->getEditionId())->toBe(3)
        ->and($item->getEditionTitle())->toBe('Edition Originale')
        ->and($item->isOwned())->toBeFalse()
        ->and($item->isWishlisted())->toBeTrue();
});

test('planning item box type has null edition', function () {
    $item = new PlanningItem(
        id: 18,
        type: 'box',
        title: 'One Piece Box 4',
        number: '4',
        coverUrl: null,
        releaseDate: '2026-03-25',
        seriesId: 2,
        seriesTitle: 'One Piece',
        editionId: null,
        editionTitle: null,
        isOwned: false,
        isWishlisted: false,
    );

    expect($item->getType())->toBe('box')
        ->and($item->getEditionId())->toBeNull()
        ->and($item->getEditionTitle())->toBeNull()
        ->and($item->getCoverUrl())->toBeNull();
});
