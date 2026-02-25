<?php

use App\Borrowing\Domain\Exceptions\VolumeNotInCollectionException;

test('VolumeNotInCollectionException is a DomainException', function (): void {
    $exception = new VolumeNotInCollectionException("Volume 5 is not in the user's collection.");

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe("Volume 5 is not in the user's collection.");
});
