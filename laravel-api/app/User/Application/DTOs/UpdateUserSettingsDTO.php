<?php

namespace App\User\Application\DTOs;

class UpdateUserSettingsDTO
{
    public function __construct(
        public readonly int $userId,
        public readonly ?string $username,
        public readonly bool $isPublic,
    ) {}
}
