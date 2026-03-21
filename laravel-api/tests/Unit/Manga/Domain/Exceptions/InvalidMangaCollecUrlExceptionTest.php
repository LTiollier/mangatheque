<?php

use App\Manga\Domain\Exceptions\InvalidMangaCollecUrlException;

test('InvalidMangaCollecUrlException is an Exception', function (): void {
    $exception = new InvalidMangaCollecUrlException('Invalid URL');

    expect($exception)->toBeInstanceOf(DomainException::class)
        ->and($exception->getMessage())->toBe('Invalid URL');
});
