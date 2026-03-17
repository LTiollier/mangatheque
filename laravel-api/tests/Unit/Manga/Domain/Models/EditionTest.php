<?php

use App\Manga\Domain\Models\Edition;

test('edition model can be instantiated and returns correct values', function () {
    $edition = new Edition(
        id: 1,
        series_id: 10,
        name: 'Standard',
        publisher: 'Kana',
        language: 'fr',
        total_volumes: 20
    );

    expect($edition->getId())->toBe(1)
        ->and($edition->getSeriesId())->toBe(10)
        ->and($edition->getName())->toBe('Standard')
        ->and($edition->getPublisher())->toBe('Kana')
        ->and($edition->getLanguage())->toBe('fr')
        ->and($edition->getTotalVolumes())->toBe(20)
        ->and($edition->isFinished())->toBeFalse();
});

test('edition model isFinished returns true when finished', function () {
    $edition = new Edition(
        id: 2,
        series_id: 10,
        name: 'Perfect',
        publisher: null,
        language: null,
        total_volumes: null,
        is_finished: true,
    );

    expect($edition->isFinished())->toBeTrue();
});
