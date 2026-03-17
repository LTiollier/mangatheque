<?php

namespace Tests\Unit\Manga\Application\DTOs;

use App\Manga\Application\DTOs\CreateBoxDTO;

test('CreateBoxDTO stores required fields', function () {
    $dto = new CreateBoxDTO(
        boxSetId: 1,
        title: 'Box Title',
    );

    expect($dto->boxSetId)->toBe(1);
    expect($dto->title)->toBe('Box Title');
    expect($dto->number)->toBeNull();
    expect($dto->isbn)->toBeNull();
    expect($dto->apiId)->toBeNull();
    expect($dto->releaseDate)->toBeNull();
    expect($dto->coverUrl)->toBeNull();
    expect($dto->isEmpty)->toBeFalse();
});

test('CreateBoxDTO stores all fields', function () {
    $dto = new CreateBoxDTO(
        boxSetId: 5,
        title: 'Full Box',
        number: '1',
        isbn: '9784088728407',
        apiId: 'api-uuid-123',
        releaseDate: '2024-01-15',
        coverUrl: 'https://example.com/cover.jpg',
        isEmpty: true,
    );

    expect($dto->boxSetId)->toBe(5);
    expect($dto->title)->toBe('Full Box');
    expect($dto->number)->toBe('1');
    expect($dto->isbn)->toBe('9784088728407');
    expect($dto->apiId)->toBe('api-uuid-123');
    expect($dto->releaseDate)->toBe('2024-01-15');
    expect($dto->coverUrl)->toBe('https://example.com/cover.jpg');
    expect($dto->isEmpty)->toBeTrue();
});

test('CreateBoxDTO isEmpty defaults to false', function () {
    $dto = new CreateBoxDTO(boxSetId: 1, title: 'Test');

    expect($dto->isEmpty)->toBeFalse();
});
