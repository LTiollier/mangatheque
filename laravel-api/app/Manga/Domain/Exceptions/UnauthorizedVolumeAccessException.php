<?php

declare(strict_types=1);

namespace App\Manga\Domain\Exceptions;

use Exception;

final class UnauthorizedVolumeAccessException extends Exception
{
    public static function forUser(int $userId): self
    {
        return new self("User {$userId} does not own all the volumes requested for removal.");
    }
}
