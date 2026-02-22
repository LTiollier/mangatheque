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

    /**
     * @return array{user: User, token: string}
     */
    public function execute(RegisterUserDTO $dto): array
    {
        $user = new User(
            name: $dto->name,
            email: $dto->email,
            password: Hash::make($dto->password)
        );

        $createdUser = $this->userRepository->create($user);
        $token = $this->userRepository->createToken($createdUser, 'auth_token');

        return [
            'user' => $createdUser,
            'token' => $token,
        ];
    }
}
