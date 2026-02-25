<?php

use App\Manga\Domain\Exceptions\MangaNotFoundException;

test('MangaNotFoundException is a DomainException', function (): void {
    $exception = new MangaNotFoundException('Manga not found for barcode: 9782723456789');

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe('Manga not found for barcode: 9782723456789');
});
