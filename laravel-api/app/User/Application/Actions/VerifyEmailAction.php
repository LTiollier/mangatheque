<?php

declare(strict_types=1);

namespace App\User\Application\Actions;

use App\User\Domain\Events\UserVerified;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;

final class VerifyEmailAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    public function execute(int $userId): User
    {
        $user = $this->userRepository->findById($userId);

        if (! $user) {
            throw new \Exception('User not found');
        }

        if (! $user->isEmailVerified()) {
            $user = $this->userRepository->markAsVerified($user);
            event(new UserVerified($user));
        }

        return $user;
    }
}
