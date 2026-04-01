<?php

declare(strict_types=1);

namespace App\User\Application\Actions;

use App\User\Application\DTOs\UpdateUserSettingsDTO;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use InvalidArgumentException;

final class UpdateUserSettingsAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    public function execute(UpdateUserSettingsDTO $dto): User
    {
        $user = $this->userRepository->findById($dto->userId);

        if (! $user) {
            throw new InvalidArgumentException('User not found.');
        }

        $updatedUser = new User(
            name: $user->getName(),
            email: $user->getEmail(),
            password: $user->getPassword(),
            id: $user->getId(),
            username: $dto->username,
            isPublic: $dto->isPublic,
            theme: $dto->theme,
            palette: $dto->palette,
            emailVerifiedAt: $user->getEmailVerifiedAt(),
            notifyPlanningReleases: $dto->notifyPlanningReleases,
            viewModeMobile: $dto->viewModeMobile,
            viewModeDesktop: $dto->viewModeDesktop,
        );

        return $this->userRepository->update($updatedUser);
    }
}
