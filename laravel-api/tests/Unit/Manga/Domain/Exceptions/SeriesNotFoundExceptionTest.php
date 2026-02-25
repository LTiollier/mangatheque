<?php

use App\Manga\Domain\Exceptions\SeriesNotFoundException;

test('SeriesNotFoundException is a DomainException', function (): void {
    $exception = new SeriesNotFoundException('Series not found with ID: 7');

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe('Series not found with ID: 7');
});
