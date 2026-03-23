<?php

declare(strict_types=1);

namespace App\User\Application\Actions;

use App\User\Domain\Repositories\UserRepositoryInterface;

final class LogoutAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    public function execute(int $userId): void
    {
        $user = $this->userRepository->findById($userId);

        if ($user) {
            $this->userRepository->revokeTokens($user);
        }
    }
}
