<?php

use App\Borrowing\Domain\Exceptions\AlreadyLoanedException;

test('AlreadyLoanedException is a DomainException', function (): void {
    $exception = new AlreadyLoanedException('Volume 1 is already loaned to Alice.');

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe('Volume 1 is already loaned to Alice.');
});
