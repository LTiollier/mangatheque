<?php

use App\Borrowing\Domain\Exceptions\LoanNotFoundException;

test('LoanNotFoundException is a DomainException', function (): void {
    $exception = new LoanNotFoundException('No active loan found for volume 3.');

    expect($exception)->toBeInstanceOf(\DomainException::class)
        ->and($exception->getMessage())->toBe('No active loan found for volume 3.');
});
