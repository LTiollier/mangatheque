<?php

namespace App\User\Domain\Repositories;

use App\User\Domain\Models\User;

interface UserRepositoryInterface
{
    public function create(User $user): User;

    public function findByEmail(string $email): ?User;
}
