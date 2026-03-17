<?php

namespace Tests\Unit\Manga\Application\DTOs;

use App\Manga\Application\DTOs\CreateBoxSetDTO;

test('CreateBoxSetDTO stores required fields', function () {
    $dto = new CreateBoxSetDTO(
        seriesId: 1,
        title: 'BoxSet Title',
    );

    expect($dto->seriesId)->toBe(1);
    expect($dto->title)->toBe('BoxSet Title');
    expect($dto->publisher)->toBeNull();
    expect($dto->apiId)->toBeNull();
});

test('CreateBoxSetDTO stores all fields', function () {
    $dto = new CreateBoxSetDTO(
        seriesId: 10,
        title: 'Complete BoxSet',
        publisher: 'Kana',
        apiId: 'boxset-api-uuid-456',
    );

    expect($dto->seriesId)->toBe(10);
    expect($dto->title)->toBe('Complete BoxSet');
    expect($dto->publisher)->toBe('Kana');
    expect($dto->apiId)->toBe('boxset-api-uuid-456');
});

test('CreateBoxSetDTO publisher and apiId default to null', function () {
    $dto = new CreateBoxSetDTO(seriesId: 2, title: 'Test BoxSet');

    expect($dto->publisher)->toBeNull();
    expect($dto->apiId)->toBeNull();
});
