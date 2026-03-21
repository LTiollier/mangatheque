<?php

use App\Manga\Domain\Exceptions\MangaCollecProfilePrivateException;

test('MangaCollecProfilePrivateException is an Exception', function (): void {
    $exception = new MangaCollecProfilePrivateException('Profile Private');

    expect($exception)->toBeInstanceOf(DomainException::class)
        ->and($exception->getMessage())->toBe('Profile Private');
});
