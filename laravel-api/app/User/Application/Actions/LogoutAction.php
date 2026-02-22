<?php

namespace App\User\Application\Actions;

use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;

class LogoutAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    public function execute(User $user): void
    {
        $this->userRepository->revokeTokens($user);
    }
}
