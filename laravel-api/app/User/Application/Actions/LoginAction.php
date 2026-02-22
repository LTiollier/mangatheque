<?php

namespace App\User\Application\Actions;

use App\User\Application\DTOs\LoginDTO;
use App\User\Domain\Exceptions\InvalidCredentialsException;
use App\User\Domain\Models\User;
use App\User\Domain\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;

class LoginAction
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    /**
     * @return array{user: User, token: string}
     * @throws InvalidCredentialsException
     */
    public function execute(LoginDTO $dto): array
    {
        $user = $this->userRepository->findByEmail($dto->email);

        if (!$user || !Hash::check($dto->password, $user->getPassword())) {
            throw new InvalidCredentialsException();
        }

        $token = $this->userRepository->createToken($user, 'login_token');

        return [
            'user' => $user,
            'token' => $token,
        ];
    }
}
