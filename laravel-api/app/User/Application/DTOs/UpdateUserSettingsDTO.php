<?php

declare(strict_types=1);

namespace App\User\Application\DTOs;

final readonly class UpdateUserSettingsDTO
{
    public function __construct(
        public int $userId,
        public ?string $username,
        public bool $isPublic,
        public string $theme,
        public string $palette,
        public bool $notifyPlanningReleases,
        public string $viewModeMobile,
        public string $viewModeDesktop,
    ) {}
}
