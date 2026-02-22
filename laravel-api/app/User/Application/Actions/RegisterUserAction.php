<?php

namespace App\User\Application\Actions;

use App\User\Application\DTOs\RegisterUserDTO;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class RegisterUserAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {}

    public function execute(RegisterUserDTO $dto): User
    {
        $user = new User(
            name: $dto->name,
            email: $dto->email,
            password: Hash::make($dto->password)
        );

        return $this->userRepository->create($user);
    }
}
